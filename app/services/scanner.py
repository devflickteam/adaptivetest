# services/scanner.py
import logging
from typing import Dict, Any, List
import json
import os
import requests
from openai import OpenAI
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

class AIAccessibilityScanner:
    """AI-enhanced accessibility scanner with automatic fallback - HEROKU MEMORY OPTIMIZED"""
    
    def __init__(self):
        self.openai_key = os.getenv('OPENAI_API_KEY')
        if self.openai_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_key)
                self.ai_enabled = True
                logger.info("✅ AI recommendations enabled")
            except Exception as e:
                logger.error(f"❌ OpenAI client failed: {e}")
                self.ai_enabled = False
        else:
            self.ai_enabled = False
            logger.info("ℹ️ AI disabled - no OPENAI_API_KEY")
        
        # Check if we're on Heroku - force fallback to save memory
        self.on_heroku = os.getenv('DYNO') is not None
        self.playwright_available = False
        
        # Only use Playwright if NOT on Heroku (to avoid memory issues)
        if not self.on_heroku:
            try:
                from playwright.sync_api import sync_playwright
                self.playwright_available = True
                logger.info("✅ Playwright is available")
            except ImportError:
                logger.warning("⚠️ Playwright not available, using fallback scanner")
        else:
            logger.info("🚫 Playwright disabled on Heroku to conserve memory")
    
    def scan_website(self, url: str) -> Dict[str, Any]:
        """Main scan method with automatic fallback - HEROKU OPTIMIZED"""
        logger.info(f"🔍 Starting accessibility scan for: {url}")
        
        try:
            # On Heroku, always use fallback to avoid memory issues
            if self.on_heroku:
                logger.info("🌐 Heroku environment detected - using memory-efficient fallback scanner")
                scan_results = self._run_fallback_scan(url)
            elif self.playwright_available:
                logger.info("🚀 Attempting comprehensive Playwright scan...")
                try:
                    scan_results = self._run_playwright_scan(url)
                    if scan_results and scan_results.get('issues') is not None:
                        logger.info("✅ Playwright scan successful")
                    else:
                        raise Exception("Playwright scan returned no results")
                except Exception as playwright_error:
                    logger.warning(f"⚠️ Playwright scan failed, using fallback: {playwright_error}")
                    scan_results = self._run_fallback_scan(url)
            else:
                logger.info("🔄 Using fallback scanner (no Playwright)")
                scan_results = self._run_fallback_scan(url)
            
            # Step 2: Add AI recommendations if enabled and issues found
            if self.ai_enabled and scan_results.get('issues'):
                logger.info(f"🤖 Enhancing {len(scan_results['issues'])} issues with AI")
                return self._enhance_with_ai(scan_results, url)
            
            return scan_results
            
        except Exception as e:
            logger.error(f"❌ Scan failed: {e}")
            return {
                'issues': [],
                'issue_count': 0,
                'scan_type': 'fallback',
                'metadata': {'url': url},
                'error': str(e)
            }
    
    def _run_playwright_scan(self, url: str) -> Dict[str, Any]:
        """Run accessibility scan using Playwright + axe-core - MEMORY OPTIMIZED"""
        try:
            from playwright.sync_api import sync_playwright
            
            with sync_playwright() as p:
                logger.info("🚀 Launching memory-optimized Chromium...")
                
                # EXTREME memory optimization for Heroku-like environments
                browser = p.chromium.launch(
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--single-process',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--headless=new',
                        '--memory-pressure-off',  # Disable memory pressure
                        '--max_old_space_size=256',  # Limit memory
                        '--javascript-harmony',  # Optimize JS
                        '--no-first-run',
                        '--no-zygote',
                        '--no-default-browser-check'
                    ],
                    headless=True,
                    timeout=30000  # Shorter timeout
                )
                
                # Create context with memory limits
                context = browser.new_context(
                    viewport={"width": 1280, "height": 720},
                    java_script_enabled=True,
                    ignore_https_errors=True
                )
                
                page = context.new_page()
                
                # Set aggressive timeouts
                page.set_default_timeout(30000)
                page.set_default_navigation_timeout(30000)
                
                # Navigate to URL
                logger.info(f"🌐 Navigating to: {url}")
                try:
                    response = page.goto(url, wait_until='domcontentloaded', timeout=30000)  # Faster than 'networkidle'
                    if not response or response.status >= 400:
                        logger.error(f"❌ Failed to load URL: {url}, Status: {getattr(response, 'status', 'Unknown')}")
                        context.close()
                        browser.close()
                        return self._create_error_result(url, f"Failed to load URL - Status: {getattr(response, 'status', 'Unknown')}")
                except Exception as nav_error:
                    logger.error(f"❌ Navigation failed: {nav_error}")
                    context.close()
                    browser.close()
                    return self._create_error_result(url, f"Navigation failed: {str(nav_error)}")
                
                # Wait minimally for page to stabilize
                page.wait_for_timeout(1000)
                
                # Inject axe-core
                logger.info("📥 Injecting axe-core for comprehensive WCAG testing...")
                try:
                    page.add_script_tag({
                        'url': 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.5/axe.min.js'
                    })
                    
                    # Wait for axe-core to load
                    page.wait_for_function('typeof axe !== "undefined"', timeout=5000)
                    logger.info("✅ axe-core loaded successfully")
                except Exception as axe_error:
                    logger.error(f"❌ axe-core failed to load: {axe_error}")
                    context.close()
                    browser.close()
                    return self._create_error_result(url, f"axe-core failed to load: {str(axe_error)}")
                
                # Run accessibility analysis with timeout
                logger.info("🔧 Running WCAG 2.1 AA compliance tests...")
                try:
                    results = page.evaluate("""
                    async () => {
                        try {
                            return await axe.run({
                                runOnly: {
                                    type: 'tag',
                                    values: ['wcag2a', 'wcag2aa', 'wcag21aa']
                                },
                                timeout: 15000,  // Shorter timeout
                                resultTypes: ['violations', 'incomplete']
                            });
                        } catch (error) {
                            return { error: error.message };
                        }
                    }
                    """)
                except Exception as eval_error:
                    logger.error(f"❌ axe-core evaluation failed: {eval_error}")
                    context.close()
                    browser.close()
                    return self._create_error_result(url, f"Accessibility test failed: {str(eval_error)}")
                
                # Clean up resources immediately
                context.close()
                browser.close()
                
                if 'error' in results:
                    logger.error(f"❌ axe-core error: {results['error']}")
                    return self._create_error_result(url, results['error'])
                
                # Log results
                violation_count = len(results.get('violations', []))
                incomplete_count = len(results.get('incomplete', []))
                
                logger.info(f"✅ WCAG scan completed: {violation_count} violations, {incomplete_count} incomplete")
                return self._parse_axe_results(results, url)
                    
        except Exception as e:
            logger.error(f"❌ Playwright scan execution failed: {e}")
            return self._run_fallback_scan(url)
    
    def _run_fallback_scan(self, url: str) -> Dict[str, Any]:
        """Fallback scanner using requests + HTML analysis - MEMORY EFFICIENT"""
        try:
            logger.info("🔄 Running memory-efficient HTML accessibility scan...")
            
            # Fetch webpage with timeout and retry strategy
            session = requests.Session()
            retry_strategy = Retry(
                total=2,
                backoff_factor=0.5,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            session.mount('http://', HTTPAdapter(max_retries=retry_strategy))
            session.mount('https://', HTTPAdapter(max_retries=retry_strategy))
            
            response = session.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; AdaptiveTest/1.0)'
            })
            response.raise_for_status()
            html_content = response.text
            
            logger.info(f"✅ Successfully fetched {url}, analyzing HTML...")
            
            # Analyze HTML for accessibility issues
            return self._analyze_html_accessibility(html_content, url)
                
        except Exception as e:
            logger.error(f"❌ Fallback scan failed: {e}")
            return self._create_error_result(url, f"Fallback scan failed: {str(e)}")
    
    def _analyze_html_accessibility(self, html_content: str, url: str) -> Dict[str, Any]:
        """Enhanced HTML content analysis for comprehensive accessibility issues"""
        issues = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 1. Document structure checks
            if not soup.find('title'):
                issues.append({
                    'type': 'violation',
                    'code': 'document-title',
                    'message': 'Document does not have a title',
                    'description': 'Page must have a title that describes topic or purpose',
                    'context': 'Missing <title> tag in <head>',
                    'selector': 'head',
                    'impact': 'serious'
                })
            else:
                title = soup.find('title')
                if not title.get_text().strip():
                    issues.append({
                        'type': 'violation',
                        'code': 'empty-title',
                        'message': 'Document title is empty',
                        'description': 'Page title should contain descriptive text',
                        'context': '<title></title>',
                        'selector': 'head > title',
                        'impact': 'serious'
                    })

            # 2. Language attribute
            html_tag = soup.find('html')
            if not html_tag or not html_tag.get('lang'):
                issues.append({
                    'type': 'violation',
                    'code': 'html-has-lang',
                    'message': 'HTML element missing lang attribute',
                    'description': 'The html element must have a lang attribute',
                    'context': '<html> element',
                    'selector': 'html',
                    'impact': 'serious'
                })

            # 3. Viewport for mobile
            if not soup.find('meta', attrs={'name': 'viewport'}):
                issues.append({
                    'type': 'violation',
                    'code': 'meta-viewport',
                    'message': 'Viewport meta tag is missing',
                    'description': 'Viewport tag should be present for mobile responsiveness',
                    'context': '<head> section',
                    'selector': 'head',
                    'impact': 'moderate'
                })

            # 4. Image analysis
            images = soup.find_all('img')
            for img in images:
                alt = img.get('alt')
                if alt is None:  # Missing alt entirely
                    issues.append({
                        'type': 'violation',
                        'code': 'image-alt',
                        'message': 'Image missing alt text',
                        'description': 'Images must have alt text or be marked as decorative',
                        'context': str(img)[:100],
                        'selector': self._get_css_selector(img),
                        'impact': 'critical'
                    })
                elif alt == '' and not img.get('role') == 'presentation' and not img.get('aria-hidden') == 'true':
                    # Empty alt but not marked as decorative
                    issues.append({
                        'type': 'violation',
                        'code': 'image-alt-decorative',
                        'message': 'Image with empty alt should be marked as decorative',
                        'description': 'Images with empty alt text should have role="presentation" or aria-hidden="true"',
                        'context': str(img)[:100],
                        'selector': self._get_css_selector(img),
                        'impact': 'moderate'
                    })

            # 5. Heading structure
            headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            if not any(h.name == 'h1' for h in headings):
                issues.append({
                    'type': 'violation',
                    'code': 'page-has-heading-one',
                    'message': 'Page missing H1 heading',
                    'description': 'Page should have a level-one heading',
                    'context': 'Page content',
                    'selector': 'body',
                    'impact': 'moderate'
                })
            
            # Check heading hierarchy
            heading_levels = [int(h.name[1]) for h in headings if h.name and h.name.startswith('h')]
            if heading_levels:
                current_level = heading_levels[0]
                for level in heading_levels[1:]:
                    if level > current_level + 1:
                        issues.append({
                            'type': 'violation',
                            'code': 'heading-order',
                            'message': 'Heading levels should not be skipped',
                            'description': 'Headings should be in sequential order (e.g., h1 then h2, not h1 then h3)',
                            'context': f'Heading level jump from {current_level} to {level}',
                            'selector': 'h1, h2, h3, h4, h5, h6',
                            'impact': 'moderate'
                        })
                    current_level = level

            # 6. Form controls
            inputs = soup.find_all('input')
            for input_elem in inputs:
                input_type = input_elem.get('type', 'text')
                if input_type in ['text', 'password', 'email', 'search', 'tel', 'url', 'number']:
                    input_id = input_elem.get('id')
                    if input_id:
                        label = soup.find('label', attrs={'for': input_id})
                        if not label:
                            # Check if input is inside label
                            parent_label = input_elem.find_parent('label')
                            if not parent_label:
                                issues.append({
                                    'type': 'violation',
                                    'code': 'label',
                                    'message': 'Form input missing associated label',
                                    'description': 'Form inputs must have associated labels',
                                    'context': str(input_elem)[:100],
                                    'selector': self._get_css_selector(input_elem),
                                    'impact': 'critical'
                                })
                    else:
                        # No id, check for aria-label or aria-labelledby
                        if not (input_elem.get('aria-label') or input_elem.get('aria-labelledby')):
                            issues.append({
                                'type': 'violation',
                                'code': 'input-label',
                                'message': 'Form input missing accessible name',
                                'description': 'Form inputs must have an accessible name via label, aria-label, or aria-labelledby',
                                'context': str(input_elem)[:100],
                                'selector': self._get_css_selector(input_elem),
                                'impact': 'critical'
                            })

            # 7. Buttons
            buttons = soup.find_all('button')
            for button in buttons:
                if not button.get_text().strip() and not (button.get('aria-label') or button.get('aria-labelledby')):
                    issues.append({
                        'type': 'violation',
                        'code': 'button-name',
                        'message': 'Button missing accessible name',
                        'description': 'Buttons must have an accessible name',
                        'context': str(button)[:100],
                        'selector': self._get_css_selector(button),
                        'impact': 'critical'
                    })

            # 8. Links
            links = soup.find_all('a', href=True)
            for link in links:
                link_text = link.get_text().strip()
                if not link_text and not (link.get('aria-label') or link.get('aria-labelledby')):
                    # Check for image alt text if link contains only image
                    img_in_link = link.find('img')
                    if not img_in_link or not img_in_link.get('alt'):
                        issues.append({
                            'type': 'violation',
                            'code': 'link-name',
                            'message': 'Link missing accessible name',
                            'description': 'Links must have discernible text',
                            'context': str(link)[:100],
                            'selector': self._get_css_selector(link),
                            'impact': 'serious'
                        })
                
                # Check for generic link text
                generic_texts = ['click here', 'read more', 'here', 'link', 'more info']
                if link_text.lower() in generic_texts:
                    issues.append({
                        'type': 'violation', 
                        'code': 'link-purpose',
                        'message': 'Link text is not descriptive',
                        'description': 'Link text should describe the purpose of the link',
                        'context': f'Link text: "{link_text}"',
                        'selector': self._get_css_selector(link),
                        'impact': 'moderate'
                    })

            # 9. Color contrast (basic check)
            elements_with_color = soup.find_all(style=True)
            for elem in elements_with_color[:20]:  # Limit to first 20 for performance
                style = elem.get('style', '').lower()
                if 'color:' in style and 'background' not in style:
                    issues.append({
                        'type': 'violation',
                        'code': 'color-contrast-potential',
                        'message': 'Potential color contrast issue',
                        'description': 'Text color defined without background color may have contrast issues',
                        'context': str(elem)[:100],
                        'selector': self._get_css_selector(elem),
                        'impact': 'moderate'
                    })

            # 10. ARIA attributes
            aria_elements = soup.find_all(attrs={"aria-label": True})
            for elem in aria_elements:
                aria_label = elem.get('aria-label', '').strip()
                if not aria_label:
                    issues.append({
                        'type': 'violation',
                        'code': 'aria-label-empty',
                        'message': 'ARIA label is empty',
                        'description': 'aria-label should not be empty',
                        'context': str(elem)[:100],
                        'selector': self._get_css_selector(elem),
                        'impact': 'moderate'
                    })

            # 11. Tables
            tables = soup.find_all('table')
            for table in tables:
                if not table.find('th') and not table.get('role') == 'presentation':
                    issues.append({
                        'type': 'violation',
                        'code': 'table-headers',
                        'message': 'Data table missing headers',
                        'description': 'Data tables should have header cells',
                        'context': str(table)[:100],
                        'selector': self._get_css_selector(table),
                        'impact': 'serious'
                    })

            # 12. Landmarks and structure
            landmarks = soup.find_all(['header', 'main', 'nav', 'footer'])
            aria_landmarks = soup.find_all(attrs={
                'role': ['banner', 'main', 'navigation', 'contentinfo']
            })
            if not landmarks and not aria_landmarks:
                issues.append({
                    'type': 'violation',
                    'code': 'landmarks',
                    'message': 'Page missing semantic landmarks',
                    'description': 'Use semantic HTML5 elements or ARIA landmarks for page structure',
                    'context': 'Page structure',
                    'selector': 'body',
                    'impact': 'moderate'
                })

            # 13. Focus indicators
            elements_with_outline = soup.find_all(style=True)
            for elem in elements_with_outline[:10]:
                style = elem.get('style', '').lower()
                if 'outline: none' in style or 'outline: 0' in style:
                    issues.append({
                        'type': 'violation',
                        'code': 'focus-visible',
                        'message': 'Focus indicator removed',
                        'description': 'Focus indicators should not be removed without providing custom focus styles',
                        'context': str(elem)[:100],
                        'selector': self._get_css_selector(elem),
                        'impact': 'serious'
                    })

            # 14. Skip links
            skip_links = soup.find_all('a', href=lambda x: x and '#main' in x or '#content' in x)
            if not skip_links:
                issues.append({
                    'type': 'violation',
                    'code': 'skip-link',
                    'message': 'Skip to main content link missing',
                    'description': 'Provide a skip link to bypass repetitive content',
                    'context': 'Page navigation',
                    'selector': 'body',
                    'impact': 'moderate'
                })

        except Exception as e:
            logger.error(f"❌ HTML analysis failed: {e}")
            # Fall back to basic analysis if BeautifulSoup fails
            return self._analyze_html_accessibility_basic(html_content, url)
        
        violation_count = len([i for i in issues if i['type'] == 'violation'])
        
        return {
            'issues': issues,
            'issue_count': len(issues),
            'violation_count': violation_count,
            'incomplete_count': 0,
            'scan_type': 'enhanced-html-analysis',
            'metadata': {
                'url': url,
                'timestamp': 'enhanced-scan',
                'page_title': soup.title.string if soup.title else url.split('/')[-1] or 'Unknown'
            },
            'ai_enhanced': False,
            'fallback_used': True,
            'memory_optimized': True
        }
    
    def _analyze_html_accessibility_basic(self, html_content: str, url: str) -> Dict[str, Any]:
        """Basic HTML analysis fallback if BeautifulSoup fails"""
        issues = []
        html_lower = html_content.lower()
        
        # Basic checks without BeautifulSoup
        if '<title>' not in html_lower:
            issues.append({
                'type': 'violation',
                'code': 'document-title',
                'message': 'Document does not have a title',
                'description': 'The page should have a title that describes its content',
                'context': '<head> section',
                'selector': 'head',
                'impact': 'serious'
            })
        
        if 'lang=' not in html_lower and 'xml:lang=' not in html_lower:
            issues.append({
                'type': 'violation',
                'code': 'html-has-lang',
                'message': 'HTML element should have a lang attribute',
                'description': 'The html element should have a lang attribute',
                'context': '<html>',
                'selector': 'html',
                'impact': 'serious'
            })
        
        if 'viewport' not in html_lower:
            issues.append({
                'type': 'violation', 
                'code': 'meta-viewport',
                'message': 'Viewport meta tag is missing',
                'description': 'Viewport meta tag should be present for mobile responsiveness',
                'context': '<head>',
                'selector': 'head',
                'impact': 'moderate'
            })
        
        # Basic image check
        if '<img' in html_lower:
            img_tags = html_lower.count('<img')
            alt_attrs = html_lower.count('alt=')
            if alt_attrs < img_tags:
                issues.append({
                    'type': 'violation',
                    'code': 'image-alt',
                    'message': 'Images must have alternate text',
                    'description': f'Found {img_tags} images but only {alt_attrs} alt attributes',
                    'context': 'Image elements',
                    'selector': 'img',
                    'impact': 'critical'
                })
        
        violation_count = len([i for i in issues if i['type'] == 'violation'])
        
        return {
            'issues': issues,
            'issue_count': len(issues),
            'violation_count': violation_count,
            'incomplete_count': 0,
            'scan_type': 'html-analysis',
            'metadata': {
                'url': url,
                'timestamp': 'fallback-scan',
                'page_title': url.split('/')[-1] or 'Unknown'
            },
            'ai_enhanced': False,
            'fallback_used': True,
            'memory_optimized': True
        }
    
    def _get_css_selector(self, element):
        """Generate a simple CSS selector for an element"""
        try:
            if element.get('id'):
                return f"#{element['id']}"
            elif element.get('class'):
                classes = ' '.join(element['class'])
                return f".{classes}"
            else:
                return element.name
        except:
            return "element"

    def _parse_axe_results(self, results: Dict, url: str) -> Dict[str, Any]:
        """Parse axe-core results"""
        issues = []
        
        # Process violations
        for violation in results.get('violations', []):
            for node in violation.get('nodes', []):
                issues.append({
                    'type': 'violation',
                    'code': violation.get('id', ''),
                    'message': violation.get('help', ''),
                    'description': violation.get('description', ''),
                    'context': node.get('html', '')[:200],
                    'selector': ', '.join(node.get('target', [])),
                    'impact': violation.get('impact', 'moderate')
                })
        
        # Process incomplete results
        for incomplete in results.get('incomplete', []):
            for node in incomplete.get('nodes', []):
                issues.append({
                    'type': 'incomplete',
                    'code': incomplete.get('id', ''),
                    'message': f"Needs review: {incomplete.get('help', '')}",
                    'description': incomplete.get('description', ''),
                    'context': node.get('html', '')[:200],
                    'selector': ', '.join(node.get('target', [])),
                    'impact': 'low'
                })
        
        violation_count = len([i for i in issues if i['type'] == 'violation'])
        incomplete_count = len([i for i in issues if i['type'] == 'incomplete'])
        
        return {
            'issues': issues,
            'issue_count': len(issues),
            'violation_count': violation_count,
            'incomplete_count': incomplete_count,
            'scan_type': 'axe-core',
            'metadata': {
                'url': url,
                'timestamp': results.get('timestamp', ''),
                'page_title': results.get('url', '').split('/')[-1] or 'Unknown'
            },
            'ai_enhanced': False,
            'fallback_used': False
        }
    
    def _enhance_with_ai(self, scan_results: Dict[str, Any], url: str) -> Dict[str, Any]:
        """Enhance results with AI recommendations"""
        try:
            # Get only violations for AI analysis
            violations = [issue for issue in scan_results['issues'] if issue.get('type') == 'violation']
            
            if not violations:
                return scan_results
            
            logger.info(f"🧠 Generating AI recommendations for {len(violations)} violations...")
            ai_recommendations = self._get_ai_recommendations(violations, url)
            
            # Add AI recommendations to issues
            enhanced_issues = []
            for issue in scan_results['issues']:
                enhanced_issue = issue.copy()
                if issue.get('type') == 'violation':
                    ai_rec = ai_recommendations.get(issue['code'])
                    if ai_rec:
                        enhanced_issue['ai_recommendation'] = ai_rec
                        enhanced_issue['ai_enhanced'] = True
                    else:
                        enhanced_issue['ai_recommendation'] = self._get_basic_recommendation(issue['code'])
                        enhanced_issue['ai_enhanced'] = False
                enhanced_issues.append(enhanced_issue)
            
            scan_results['issues'] = enhanced_issues
            scan_results['ai_enhanced'] = True
            scan_results['ai_analyzed_issues'] = len(ai_recommendations)
            
            logger.info("✅ AI enhancement completed")
            return scan_results
            
        except Exception as e:
            logger.error(f"❌ AI enhancement failed: {e}")
            # Return original results without AI enhancement
            scan_results['ai_enhanced'] = False
            scan_results['ai_error'] = str(e)
            return scan_results
    
    def _get_ai_recommendations(self, violations: List[Dict], url: str) -> Dict[str, str]:
        """Get AI recommendations from OpenAI"""
        try:
            # Build prompt
            prompt = self._build_ai_prompt(violations, url)
            
            logger.info("📡 Calling OpenAI API...")
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a web accessibility expert. Provide brief, actionable fix recommendations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=600,
                temperature=0.3,
                timeout=30
            )
            
            ai_response = response.choices[0].message.content
            logger.info("✅ Received AI response")
            
            return self._parse_ai_response(ai_response)
            
        except Exception as e:
            logger.error(f"❌ OpenAI API call failed: {e}")
            return {}
    
    def _build_ai_prompt(self, violations: List[Dict], url: str) -> str:
        """Build AI prompt"""
        prompt = f"Website: {url}\n\nAccessibility issues to fix:\n\n"
        
        for i, violation in enumerate(violations[:6], 1):
            prompt += f"{i}. {violation['code']}: {violation['message']}\n"
            if violation.get('context'):
                prompt += f"   Example: {violation['context'][:100]}...\n"
            prompt += "\n"
        
        prompt += """Provide specific fix recommendations as JSON where keys are issue codes and values are brief recommendations."""
        
        return prompt
    
    def _parse_ai_response(self, ai_response: str) -> Dict[str, str]:
        """Parse AI response"""
        try:
            # Try to extract JSON
            if '{' in ai_response and '}' in ai_response:
                start = ai_response.find('{')
                end = ai_response.rfind('}') + 1
                json_str = ai_response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.error(f"❌ Failed to parse AI response as JSON: {e}")
        
        return {}
    
    def _get_basic_recommendation(self, rule_id: str) -> str:
        """Basic recommendations when AI is not available"""
        recommendations = {
            'color-contrast': 'Ensure text has sufficient color contrast (4.5:1 ratio for normal text).',
            'image-alt': 'Add descriptive alt text to images. Use alt="" for decorative images.',
            'label': 'Associate labels with form controls using for/id attributes.',
            'link-name': 'Use descriptive link text that indicates the link purpose.',
            'button-name': 'Provide accessible names for buttons.',
            'html-has-lang': 'Add lang attribute to html tag (e.g., <html lang="en">).',
            'page-has-heading-one': 'Use a single H1 heading for the main content.',
            'document-title': 'Add a descriptive page title using <title> tag.',
            'meta-viewport': 'Add viewport meta tag for mobile responsiveness.',
            'empty-title': 'Add meaningful content to the page title.',
            'empty-aria-label': 'Provide meaningful text for aria-label attribute.',
            'invalid-aria-labelledby': 'Ensure aria-labelledby references existing elements.',
            'image-alt-decorative': 'Add role="presentation" or aria-hidden="true" to decorative images.',
            'heading-order': 'Ensure heading levels are sequential (h1, h2, h3, etc.).',
            'input-label': 'Add label, aria-label, or aria-labelledby to form inputs.',
            'link-purpose': 'Use descriptive link text that indicates the link destination.',
            'aria-label-empty': 'Provide meaningful text for aria-label attribute.',
            'table-headers': 'Add <th> elements to data tables for proper headers.',
            'landmarks': 'Use semantic HTML5 elements (header, main, nav, footer) or ARIA landmarks.',
            'focus-visible': 'Ensure focus indicators are visible and not removed.',
            'skip-link': 'Add a skip to main content link for keyboard users.',
            'color-contrast-potential': 'Check color contrast ratios between text and background.'
        }
        return recommendations.get(rule_id, 'Review and fix this accessibility issue.')
    
    def _create_error_result(self, url: str, error: str) -> Dict[str, Any]:
        """Create error result"""
        return {
            'issues': [],
            'issue_count': 0,
            'scan_type': 'error',
            'metadata': {'url': url},
            'error': error,
            'ai_enhanced': False
        }

# Create global scanner instance
_scanner_instance = AIAccessibilityScanner()

def scan_website_with_recommendations(db, url: str, scan_id: int):
    """
    Scan a website for accessibility issues with AI recommendations.
    This function matches what your routes/scan.py expects.
    HEROKU MEMORY OPTIMIZED VERSION
    """
    try:
        # Update scan status to scanning
        from models import ScanResult, ScanIssue
        scan = db.get(ScanResult, scan_id)
        if scan:
            scan.status = "scanning"
            db.commit()
        
        # Run the scan (will automatically use fallback on Heroku)
        logger.info(f"🎯 Starting memory-optimized scan for {url} with ID {scan_id}")
        results = _scanner_instance.scan_website(url)
        
        # Save results to database
        if scan and 'issues' in results:
            # Clear existing issues - FIXED: uses scan_result_id
            db.query(ScanIssue).filter(ScanIssue.scan_result_id == scan_id).delete()
            
            # Add new issues - FIXED: uses scan_result_id and includes type field
            for issue_data in results['issues']:
                issue = ScanIssue(
                    scan_result_id=scan_id,  # FIXED: correct column name
                    code=issue_data.get('code', ''),
                    type=issue_data.get('type', 'violation'),  # ADDED: type field
                    message=issue_data.get('message', ''),
                    context=issue_data.get('context', ''),
                    selector=issue_data.get('selector', ''),
                    recommendation_text=issue_data.get('ai_recommendation') or issue_data.get('description', '')
                )
                db.add(issue)
            
            # Update scan status
            scan.status = "completed"
            scan.scan_type = results.get('scan_type', 'unknown')
            db.commit()
            logger.info(f"✅ Scan {scan_id} completed successfully with {len(results['issues'])} issues")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Scan {scan_id} failed: {e}")
        # Update scan status to failed
        try:
            scan = db.get(ScanResult, scan_id)
            if scan:
                scan.status = "failed"
                db.commit()
        except Exception as db_error:
            logger.error(f"❌ Failed to update scan status: {db_error}")
        
        raise e

def get_scanner():
    return _scanner_instance