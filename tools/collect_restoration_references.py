"""Collect small research reference copies; do not commit third-party images.

Only public, allowlisted sources are fetched. Every result keeps its source URL,
checksum, HTTP status and acquisition time. A failed download stays failed.
This script creates a temporary research artifact, not a licensed game asset pack.
"""
from __future__ import annotations
import concurrent.futures
import hashlib
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from PIL import Image

OUT = Path('research-download')
OUT.mkdir(exist_ok=True)
ALLOWED = {'k.sina.cn','k.sinaimg.cn','n.sinaimg.cn','www.cmie.cn','commons.wikimedia.org','upload.wikimedia.org','www.yali.edu.cn'}
SOURCES = [
 ('S03','https://k.sina.cn/article_6430641585_17f4bcdb1001003x9v.html'),
 ('S05','https://www.cmie.cn/news2/1882.html'),
 ('C01','https://commons.wikimedia.org/wiki/File:Yali_High_School_sports_field_2006.jpg'),
 ('C02','https://commons.wikimedia.org/wiki/File:Yali_High_School_sports_ground_football_practice.jpg'),
 ('O01','https://www.yali.edu.cn/'),
]
# Architecture / vegetation references only; article portraits are not selected.
SINA_KEYS = ['8206556','8206800','8206835','8206948','8207013','8207202','8207247','8207486','8207556','8207617','8207669','8207731','8207787','8208039','8208584','8208695','8208782','8208846']

def get(url: str, referer: str | None = None):
    if urlparse(url).hostname not in ALLOWED:
        raise ValueError('Host not allowlisted: ' + url)
    headers = {'User-Agent':'ReturnOldSchool-Research/0.6 (educational architectural reference audit)'}
    if referer:
        headers['Referer'] = referer
    response = requests.get(url, headers=headers, timeout=(10,25))
    response.raise_for_status()
    if len(response.content) > 18_000_000:
        raise ValueError('Response exceeds research size limit')
    return response

rows, jobs, pages = [], [], []
for sid, page_url in SOURCES:
    page_record = {'source_id':sid,'url':page_url,'accessed_at':datetime.now(timezone.utc).isoformat()}
    try:
        response = get(page_url)
        response.encoding = response.apparent_encoding
        soup = BeautifulSoup(response.text, 'html.parser')
        page_record.update(status='retrieved',sha256=hashlib.sha256(response.content).hexdigest(),title=soup.title.get_text(' ',strip=True) if soup.title else '')
        candidates = []
        if sid.startswith('C'):
            for link in soup.select('.fullImageLink a'):
                candidates.append(urljoin(page_url,link.get('href','')))
        else:
            for image in soup.find_all('img'):
                for attr in ['data-original','data-src','src']:
                    value = image.get(attr)
                    if value and not value.startswith('data:'):
                        candidates.append(urljoin(page_url,value))
                        break
        candidates = list(dict.fromkeys(u for u in candidates if urlparse(u).hostname in ALLOWED))
        page_record['image_urls'] = candidates
        for number, url in enumerate(candidates,1):
            take = sid.startswith('C') or (sid=='S03' and any(k in url for k in SINA_KEYS)) or (sid=='S05' and '7289185175' in url) or (sid=='O01' and number<=8)
            row = {'id':f'{sid}-{number:03d}','source_id':sid,'page_url':page_url,'image_url':url,'selected':take,'status':'index_only','rights':'Refer to original source; not cleared for game distribution','photographed_at':None}
            rows.append(row)
            if take:
                jobs.append(row)
    except Exception as exc:
        page_record.update(status='failed',error=str(exc))
    pages.append(page_record)

def download(row):
    try:
        response = get(row['image_url'],row['page_url'])
        im = Image.open(io.BytesIO(response.content))
        if im.width < 240 or im.height < 120:
            raise ValueError('Image too small for architectural review')
        row.update(original_size=[im.width,im.height],original_sha256=hashlib.sha256(response.content).hexdigest())
        row['exif'] = {str(k):str(v) for k,v in im.getexif().items() if k in (306,36867,36868,272,271)}
        im = im.convert('RGB')
        im.thumbnail((1400,1400))
        name = row['id']+'.jpg'
        im.save(OUT/name,quality=92)
        row.update(status='downloaded_research_copy',local_file=name,copy_size=list(im.size),sha256=hashlib.sha256((OUT/name).read_bytes()).hexdigest(),accessed_at=datetime.now(timezone.utc).isoformat())
    except Exception as exc:
        row.update(status='failed',error=str(exc))
    return row

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(download,jobs))
manifest = {'purpose':'Non-modeling reference audit; no authorization to redistribute photographs is implied','pages':pages,'images':rows}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'RIGHTS.txt').write_text('Temporary research copies only. Retain watermarks and source credits. Publication and game-asset use require source-specific review. These images are not committed to the repository.\n',encoding='utf8')
print(json.dumps({'pages':len(pages),'indexed':len(rows),'downloaded':sum(r['status']=='downloaded_research_copy' for r in rows),'failed':sum(r['status']=='failed' for r in rows)},ensure_ascii=False))
