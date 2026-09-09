"""Additional architectural views from the already indexed sources.
No reconstruction, face identification or license reassignment is performed.
"""
import hashlib, io, json, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urlunparse
import requests
from PIL import Image

out = Path('research-download')
p = out/'manifest.json'
m = json.loads(p.read_text(encoding='utf8'))
wanted = {f'S03-{n:03d}' for n in (14,15,16,19,22,23,26,27,29,30,35,37,39,40,42,43,44,45,46,48)}
allowed = {'k.sinaimg.cn','n.sinaimg.cn','upload.wikimedia.org'}
for row in m['images']:
    if row['id'] not in wanted and row['id'] != 'C02-001':
        continue
    url = row['image_url']
    parts = urlparse(url)
    if parts.hostname not in allowed:
        continue
    if row['id'].startswith('C02'):
        url = urlunparse(parts._replace(query=''))
    row['selected'] = True
    try:
        r = requests.get(url, headers={'User-Agent':'ReturnOldSchool-Research/0.6 (architectural reference audit)','Referer':row['page_url']}, timeout=(10,25))
        r.raise_for_status()
        if len(r.content)>18000000:
            raise ValueError('Response exceeds research size limit')
        im = Image.open(io.BytesIO(r.content))
        row.update(original_size=list(im.size),original_sha256=hashlib.sha256(r.content).hexdigest(),exif={str(k):str(v) for k,v in im.getexif().items() if k in (306,36867,36868,272,271)})
        frames = []
        for f in sorted(set([0,max(0,getattr(im,'n_frames',1)-1)])):
            im.seek(f)
            frame = im.convert('RGB')
            frame.thumbnail((1400,1400))
            suffix = '' if f==0 else f'-frame{f}'
            name=row['id']+suffix+'.jpg'
            frame.save(out/name,quality=92)
            frames.append({'index':f,'file':name,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest()})
        row.update(status='downloaded_research_copy',local_file=frames[0]['file'],sha256=frames[0]['sha256'],frames=frames,accessed_at=datetime.now(timezone.utc).isoformat())
        row.pop('error',None)
    except Exception as e:
        row.update(status='failed',error=str(e))
    time.sleep(0.3)
p.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'downloaded':sum(r['status']=='downloaded_research_copy' for r in m['images']),'failed':sum(r['status']=='failed' for r in m['images'])}))
