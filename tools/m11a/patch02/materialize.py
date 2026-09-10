"""One-time transport of a checksum-verified textual diff; final sources are committed by CI."""
from pathlib import Path
import base64, hashlib, json, lzma, subprocess
R = Path(__file__).resolve().parents[3]
EXPECTED = 'c4c2e2d0255755fcde69c3428c56e3ee7caef468a582e9bb57f0377846999adf'
ALLOWED = {'apps/campus/src/main.ts','apps/campus/src/terrain-core.mjs','apps/campus/src/terrain-scene.ts','apps/campus/index.html','apps/campus/src/patch02-core.mjs','apps/campus/src/patch02-gym.ts','data/m11a/patch02/input.json','docs/m11a/patch02/plan.md','tests/m11a/patch02/patch02.test.mjs','tools/m11a/patch02/capture.py','tools/m11a/patch02/export.mjs','tools/m11a/patch02/package.py'}
if not (R/'apps/campus/src/patch02-core.mjs').exists():
    text = ''.join((R/f'.github/patch02/source.part{i}').read_text().strip() for i in range(5))
    diff = lzma.decompress(base64.b64decode(text, validate=True))
    assert hashlib.sha256(diff).hexdigest() == EXPECTED, 'transport checksum mismatch'
    stats = subprocess.run(['git','apply','--numstat','-'], input=diff, cwd=R, check=True, capture_output=True).stdout.decode()
    paths = {line.split('\t',2)[2] for line in stats.splitlines()}
    assert paths == ALLOWED, f'unexpected patch paths: {paths ^ ALLOWED}'
    subprocess.run(['git','apply','--check','-'], input=diff, cwd=R, check=True)
    subprocess.run(['git','apply','-'], input=diff, cwd=R, check=True)
    print('Materialized 12 readable files from verified textual patch.')
else:
    print('Readable Patch02 sources already present; do not replay historical patch.')
lock = json.loads((R/'data/m11a/baseline-lock.json').read_text())
for path, expected in lock['file_sha256'].items():
    assert hashlib.sha256((R/path).read_bytes()).hexdigest() == expected, f'frozen baseline altered: {path}'
print('All four frozen baseline hashes unchanged; topology exception is an independent overlay.')
