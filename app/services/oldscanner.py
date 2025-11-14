import httpx, os
from urllib.parse import urljoin, urldefrag, urlparse
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import openai
from app.database import save_scan_results

class PageData:
    def __init__(self, url, html, status):
        self.url = url
        self.html = html
        self.status = status

class SiteScanner:
    def __init__(self, start_url, max_pages=30, max_depth=3, timeout=10, include_contrast=True, gpt_analysis=True):
        self.start_url = start_url.rstrip('/')
        self.parsed_root = urlparse(self.start_url)
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.timeout = timeout
        self.include_contrast = include_contrast
        self.gpt_analysis = gpt_analysis and (os.getenv('OPENAI_API_KEY') is not None)
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.visited = set()
        self.pages = []

    def same_origin(self, url):
        p = urlparse(url)
        return p.netloc == self.parsed_root.netloc

    async def fetch(self, client, url):
        try:
            r = await client.get(url, timeout=self.timeout, follow_redirects=True)
            return PageData(url=str(r.url), html=r.text, status=r.status_code)
        except Exception:
            return PageData(url=url, html='', status=0)

    def extract_links(self, base_url, html):
        soup = BeautifulSoup(html, 'lxml')
        hrefs = set()
        for a in soup.find_all('a', href=True):
            href = urldefrag(a['href'])[0]
            joined = urljoin(base_url, href)
            hrefs.add(joined.rstrip('/'))
        return hrefs

    def extract_metadata(self, page: PageData):
        soup = BeautifulSoup(page.html, 'lxml')
        data = {'url': page.url, 'status': page.status}
        imgs = []
        for img in soup.find_all('img'):
            src = img.get('src') or ''
            alt = img.get('alt') or ''
            imgs.append({'src': urljoin(page.url, src), 'alt': alt})
        data['images'] = imgs
        title = soup.find('title')
        data['title'] = title.get_text(strip=True) if title else ''
        headings = {f'h{i}':[h.get_text(strip=True) for h in soup.find_all(f'h{i}')] for i in range(1,4)}
        data['headings'] = headings
        links = [{'href': urljoin(page.url, a['href']), 'text': a.get_text(strip=True)} for a in soup.find_all('a', href=True)]
        data['links'] = links
        aria = [{'role': el.get('role'), 'tag': el.name} for el in soup.find_all(attrs={'role':True})]
        data['aria'] = aria
        return data

    def check_contrast(self, image_bytes):
        try:
            img = Image.open(BytesIO(image_bytes)).convert('RGB')
            w,h = img.size
            px = img.getpixel((max(0,min(w-1,w//2)), max(0,min(h-1,h//2))))
            r,g,b = [v/255.0 for v in px]
            lum = 0.2126*r + 0.7152*g + 0.0722*b
            def ratio(l1,l2): return (l1+0.05)/(l2+0.05) if l1>l2 else (l2+0.05)/(l1+0.05)
            to_white = ratio(1.0, lum)
            to_black = ratio(lum, 0.0)
            return {'center_luminance': lum, 'contrast_vs_white': to_white, 'contrast_vs_black': to_black}
        except Exception:
            return {'error':'could not evaluate'}

    async def analyze_page(self, client, page: PageData):
        data = self.extract_metadata(page)
        issues = []
        if not data.get('title'):
            issues.append({'type':'missing_title','severity':'high'})
        if not data['headings'].get('h1'):
            issues.append({'type':'missing_h1','severity':'high'})
        for img in data['images']:
            if not img['alt']:
                issues.append({'type':'missing_alt','severity':'low','src':img['src']})
            if self.include_contrast and img['src']:
                try:
                    r = await client.get(img['src'], timeout=self.timeout)
                    if r.status_code == 200:
                        contrast = self.check_contrast(r.content)
                        img['contrast'] = contrast
                except Exception:
                    img['contrast'] = {'error':'fetch_failed'}
        broken = []
        for l in data['links']:
            href = l['href']
            try:
                r = await client.head(href, timeout=self.timeout, follow_redirects=True)
                status = r.status_code
            except Exception:
                status = 0
            if status == 0 or (status >=400):
                broken.append({'href':href,'status':status})
        data['broken_links'] = broken
        gpt = None
        if self.gpt_analysis:
            try:
                prompt = f"""You are an accessibility expert. Given the page URL: {page.url} and extracted metadata: {data}\nProvide a concise summary, top 3 issues, and code-level fixes."""
                resp = openai.ChatCompletion.create(model='gpt-4o-mini', messages=[{'role':'system','content':'You are an accessibility expert.'},{'role':'user','content':prompt}], temperature=0.0, max_tokens=500)
                gpt = resp.choices[0].message.content
            except Exception as e:
                gpt = str(e)
        return {'url':page.url,'data':data,'issues':issues,'gpt':gpt}

    async def run_scan(self):
        queue = [(self.start_url,0)]
        async with httpx.AsyncClient(headers={'User-Agent':'AdaptivetestBot/1.0'}) as client:
            while queue and len(self.pages) < self.max_pages:
                url, depth = queue.pop(0)
                if url in self.visited or depth > self.max_depth:
                    continue
                self.visited.add(url)
                page = await self.fetch(client, url)
                self.pages.append(page)
                if page.html and depth < self.max_depth:
                    links = self.extract_links(page.url, page.html)
                    for link in sorted(links):
                        if self.same_origin(link) and link not in self.visited:
                            if len(self.pages) + len(queue) >= self.max_pages:
                                break
                            queue.append((link, depth+1))
        results = []
        async with httpx.AsyncClient(headers={'User-Agent':'AdaptivetestBot/1.0'}) as client:
            for p in self.pages:
                res = await self.analyze_page(client, p)
                results.append(res)
        save_scan_results(self.start_url, results)
        summary = {'total_pages':len(results),'issues':sum(len(r['issues']) for r in results)}
        return {'summary':summary,'pages':results}

import subprocess
import json
from sqlalchemy.orm import Session
from app.models.models import ScanResult

def run_pa11y_scan(url: str) -> list[dict]:
    """
    Run Pa11y on the given URL and return the issues list.
    Requires `pa11y` installed globally or locally via npm.
    """
    try:
        result = subprocess.run(
            ["pa11y", "--reporter", "json", url],
            capture_output=True,
            text=True,
            check=True
        )
        issues = json.loads(result.stdout)
        return issues
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Pa11y scan failed: {e.stderr or e.stdout}")

def save_scan_results(db: Session, url: str, document_title: str, page_url: str, issues: list[dict]) -> ScanResult:
    """
    Save scan results into the database.
    """
    scan_result = ScanResult(
        url=url,
        document_title=document_title,
        page_url=page_url,
        issues=issues
    )
    db.add(scan_result)
    db.commit()
    db.refresh(scan_result)
    return scan_result
