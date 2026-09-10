"""Recover the interrupted, checksummed source transfer exactly once.
The seed contains 15 complete JSON entries; its incomplete final entry is discarded.
The supplemental archive supplies missing entries and current validation/delivery code.
"""
from pathlib import Path
import json,lzma,base64,hashlib
R=Path(__file__).resolve().parents[2]
marker=R/'docs/m11b/batch01/materialized.json'
if marker.exists():
 print('Already materialized; using readable repository source.');raise SystemExit(0)
s=''.join((R/f'.github/b01-seed/payload.{i}').read_text().strip() for i in range(5))
txt=lzma.LZMADecompressor().decompress(base64.b64decode(s)).decode('utf-8',errors='ignore')
dec=json.JSONDecoder();i=1;files={}
while True:
 try:
  while txt[i] in ' \r\n\t,':i+=1
  key,i=dec.raw_decode(txt,i)
  while txt[i] in ' \r\n\t:':i+=1
  value,i=dec.raw_decode(txt,i)
  files[key]=value
 except (ValueError,IndexError):break
raw=json.dumps(files,ensure_ascii=False,separators=(',',':')).encode()
assert len(files)==15
assert hashlib.sha256(raw).hexdigest()=='d78bc4dc8c59d5db1a045285320f475e5f67065c67692d5084cb180cbc452dcd'
s=''.join((R/f'.github/b01-resume/supplement.{i}').read_text().strip() for i in range(3))
raw=lzma.decompress(base64.b64decode(s))
assert hashlib.sha256(raw).hexdigest()=='669d2ad8a55970afb1a4d32d070388b74f130cfc4ed5809f6086d274b9450692'
files.update(json.loads(raw))
for name,text in files.items():
 p=Path(name)
 assert not p.is_absolute() and '..' not in p.parts and not name.startswith('data/m10')
 assert isinstance(text,str)
 (R/p).parent.mkdir(parents=True,exist_ok=True);(R/p).write_text(text)
marker.parent.mkdir(parents=True,exist_ok=True)
marker.write_text(json.dumps({'method':'15 complete interrupted seed entries plus SHA256-verified supplement','files':sorted(files),'frozen_m10_modified':False},ensure_ascii=False,indent=2)+'\n')
print('Materialized',len(files),'readable source files.')
