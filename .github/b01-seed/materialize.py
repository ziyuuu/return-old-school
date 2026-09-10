"""Unpack the reviewed source transport once; never change frozen M1.0 files."""
from pathlib import Path, PurePosixPath
import base64, hashlib, json, lzma
ROOT=Path(__file__).resolve().parents[2]
SEED=Path(__file__).resolve().parent
EXPECTED='fa801e0d5216fc3bb56fcdcce45b942515903c5ea7fc2484f0dac25851872a61'
marker=SEED/'applied.sha'
if marker.exists() and marker.read_text().strip()==EXPECTED:
    print('Source already materialized; preserving subsequent reviewed changes.')
    raise SystemExit(0)
encoded=''.join((SEED/f'payload.{i}').read_text().strip() for i in range(7))
raw=lzma.decompress(base64.b64decode(encoded,validate=True))
assert hashlib.sha256(raw).hexdigest()==EXPECTED, 'Source transport checksum mismatch'
files=json.loads(raw)
allowed=('apps/campus/','data/m11a/patch03/','data/m11a/patch04/','data/m11b/','docs/m11a/patch04/','docs/m11b/','tests/m11b/','tools/m11b/')
def frozen():
    return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'data/m10').rglob('*') if p.is_file()}
before=frozen()
for name,content in files.items():
    path=PurePosixPath(name)
    assert not path.is_absolute() and '..' not in path.parts, name
    assert name in ('README.md','docs/development-plan.md') or name.startswith(allowed),name
    assert isinstance(content,str),name
    target=ROOT/name
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(content,encoding='utf-8')
assert before==frozen(), 'Frozen M1.0 changed'
marker.write_text(EXPECTED+'\n')
print(f'Materialized {len(files)} readable files; frozen M1.0 unchanged.')
