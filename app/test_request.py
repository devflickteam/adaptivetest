import requests, json
url = 'http://localhost:8000/scan'
payload = {
    'url': 'https://example.com',
    'max_pages': 5,
    'max_depth': 1,
    'timeout': 10,
    'include_contrast': True,
    'gpt_analysis': False
}
r = requests.post(url, json=payload)
print('status', r.status_code)
try:
    print(json.dumps(r.json(), indent=2)[:2000])
except Exception as e:
    print('could not parse json', e)
