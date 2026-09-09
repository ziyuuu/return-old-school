"""Acquire public architectural evidence for the non-modeling v0.7 review.
Downloaded images are temporary research copies, not redistributable game assets.
"""
from pathlib import Path
from urllib.parse import urlparse, urljoin
from datetime import datetime, timezone
import concurrent.futures, hashlib, io, json
import requests
from bs4 import BeautifulSoup
from PIL import Image

OUT = Path('m0-followup-research')
OUT.mkdir(exist_ok=True)
SOURCES = [
 ('R01','https://www.cmie.cn/news2/1882.html'),
 ('R02','https://jkw.mof.gov.cn/zhengcefabu/200807/t20080725_58867.htm'),
 ('R03','https://edu.sh.gov.cn/mbjy_fgwx_qt/20160726/0015-37D29A47-7B6A-46AF-AF9C-E421E79D132E.html'),
 ('R04','https://xxgk.jcgov.gov.cn/szfgzbm/jcsjyj/fdzdgknr_31128/jyggxxgk_jyj/xxgk_ggxxgk/202212/t20221215_1718590.shtml'),
]
ALLOWED = {urlparse(url).hostname for _,url in SOURCES}

def get(url, referer=None):
    if urlparse(url).hostname not in ALLOWED:
        raise ValueError('Host outside explicit source list')
    r = requests.get(url, headers={'User-Agent':'ReturnOldSchool-ReferenceAudit/0.7','Referer':referer or url}, timeout=(10,30))
    r.raise_for_status()
    if urlparse(r.url).hostname not in ALLOWED or len(r.content)>18000000:
        raise ValueError('Unexpected redirect or oversized response')
    return r

manifest = {'created_at':datetime.now(timezone.utc).isoformat(),'purpose':'source verification only; no building models','sources':[],'images':[]}
jobs=[]
for sid,url in SOURCES:
    record={'id':sid,'url':url,'status':'failed'}
    try:
        r=get(url)
        r.encoding=r.apparent_encoding
        soup=BeautifulSoup(r.text,'html.parser')
        (OUT/(sid+'.html')).write_text(r.text,encoding='utf-8')
        (OUT/(sid+'.txt')).write_text(soup.get_text('\n',strip=True),encoding='utf-8')
        record.update(status='retrieved',title=soup.title.get_text(' ',strip=True) if soup.title else '',sha256=hashlib.sha256(r.content).hexdigest())
        candidates=[]
        for im in soup.find_all('img'):
            src=im.get('data-src') or im.get('data-original') or im.get('src')
            if src:
                u=urljoin(url,src)
                if urlparse(u).hostname in ALLOWED and u not in candidates:
                    candidates.append(u)
        record['image_urls']=candidates
        if sid in ('R01','R04'):
            for i,u in enumerate(candidates[:28],1):
                jobs.append({'id':f'{sid}-{i:03d}','source':sid,'page_url':url,'image_url':u,'rights':'not cleared for publication or game use'})
    except Exception as e:
        record['error']=str(e)
    manifest['sources'].append(record)

def image_job(row):
    try:
        r=get(row['image_url'],row['page_url'])
        im=Image.open(io.BytesIO(r.content));im.load()
        row.update(original_size=list(im.size),original_sha256=hashlib.sha256(r.content).hexdigest())
        if im.width<400 or im.height<200:
            row['status']='excluded_small';return row
        im=im.convert('RGB');im.thumbnail((2000,2000))
        name=row['id']+'.jpg';im.save(OUT/name,quality=94)
        row.update(status='research_copy',file=name,copy_size=list(im.size),sha256=hashlib.sha256((OUT/name).read_bytes()).hexdigest())
    except Exception as e:
        row.update(status='failed',error=str(e))
    return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    manifest['images']=list(pool.map(image_job,jobs))
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'RIGHTS.txt').write_text('Research references only. Retain source credits. Modern design renders are not historical photographs. Source permissions are not implied by successful download.\n')
print(json.dumps({'pages':len(manifest['sources']),'retrieved':sum(r['status']=='retrieved' for r in manifest['sources']),'images':sum(r['status']=='research_copy' for r in manifest['images'])}))
