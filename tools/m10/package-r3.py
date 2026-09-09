"""Package readable source and real browser evidence; exclude fonts and private photographs."""
from pathlib import Path
import base64,hashlib,json,zipfile,shutil,html
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/m10';QA=ROOT/'qa/m10-r3'
OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((QA/'browser-report.json').read_text());assert report.get('success'),report.get('failure')
l=json.loads((ROOT/'data/m10/campus-layout.json').read_text());assert l['version']=='M1.0.2-R3'
shutil.copy2(OUT/'Yali_M1_0_Viewer.html',OUT/'Yali_M1_0_R3_Viewer.html')
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1300" viewBox="0 0 350 325">','<rect width="350" height="325" fill="#edf0e8"/>','<text x="12" y="12" font-size="7" fill="#294f47">复原雅礼 / M1.0.2-R3 工作总平面</text>','<text x="12" y="20" font-size="3.6">局部增量 · 工作米制坐标（H） · 非测绘比例认证 · 图面左=-X</text>','<g transform="translate(119 28) scale(.68)">']
for a,b in l['navigation']['edges']:
 A,B=l['navigation']['nodes'][a],l['navigation']['nodes'][b];parts.append(f'<path d="M{A[0]} {A[2]} L{B[0]} {B[2]}" stroke="#bcc7b6" stroke-width="3" fill="none"/>')
for f in l['facilities']:
 if not f['position'] or f['parent']:continue
 x,_,z=f['position'];w,h,d=f['size'];colour='#d8daca' if h>1 else '#adbda1'
 if f['id']=='08':colour='#c8ad90'
 if f['id']=='27':colour='#ad885e'
 parts.append(f'<rect x="{x-w/2}" y="{z-d/2}" width="{w}" height="{d}" fill="{colour}" stroke="#52796e" stroke-width=".4"><title>{html.escape(f["name"])}</title></rect>')
 parts.append(f'<text x="{x}" y="{z+1}" text-anchor="middle" font-size="4.3" fill="#233f38">{f["id"]}</text>')
f=next(f for f in l['facilities'] if f['id']=='06');x,z=f['position'][0],f['position'][2];w,d=f['size'][0],f['size'][2]
for r in range(2):
 for c in range(3):parts.append(f'<rect x="{x-w/2+3+c*17}" y="{z-d/2+3+r*30}" width="15" height="28" fill="none" stroke="#f8f5e6" stroke-width=".5"/>')
c=l['buildingContacts'][0];parts.append(f'<path d="M{c["span"][0]} {c["coordinate"]} H{c["span"][1]}" stroke="#ad7440" stroke-width="1"/>');parts.append('</g>')
for i,f in enumerate(l['facilities']):parts.append(f'<text x="{12+(i//14)*167}" y="{251+(i%14)*4.5}" font-size="3.1" fill="#355c52">{f["id"]} {html.escape(f["name"])}</text>')
parts.append('</svg>');p=ROOT/'docs/plates/masterplan-m10-r3.svg';p.parent.mkdir(exist_ok=True,parents=True);p.write_text('\n'.join(parts));shutil.copy2(p,OUT/'Yali_M1_0_R3_Masterplan.svg')
def image(path):return 'data:image/png;base64,'+base64.b64encode((ROOT/path).read_bytes()).decode()
checks=''.join(f'<tr><td>{html.escape(c["name"])}</td><td>{"通过" if c["passed"] else "未通过"}</td></tr>' for c in report['checks'])
shots=[('entrances','校名石在图面左，侧门入口独立'),('longya','纵路直达长雅楼正门'),('family-canteen','家属区扩大并靠近食堂'),('gym-contact','音乐楼与体育馆本体贴合')]
plates=''.join(f'<h2>{title}</h2><img src="{image("qa/m10-r3/"+name+".png")}">' for name,title in shots)
old=ROOT/'qa/m10-r2/top.png';before=f'<figure><figcaption>R2（修订前）</figcaption><img src="{image("qa/m10-r2/top.png")}"></figure>' if old.exists() else ''
review=f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>M1.0 R3 实机修订校核</title><style>body{{margin:0;background:#edf0e8;color:#25453d;font-family:system-ui,sans-serif}}main{{max-width:1280px;margin:auto;padding:40px 22px}}h1{{font-size:36px}}p{{line-height:1.8}}img{{width:100%;border:1px solid #b4c3b5;border-radius:8px}}.pair{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}figure{{margin:0}}td{{padding:8px;border-bottom:1px solid #c7d0c5}}a{{color:#315e55}}@media(max-width:700px){{.pair{{grid-template-columns:1fr}}}}</style><main><h1>复原雅礼 · M1.0.2-R3</h1><p>此页使用实际运行的浏览器截图；不是生成式效果图。{len(report['checks'])}项浏览器检查通过；机位与原点继承R2，仅修改指定对象。尺寸均为H工作方案，不是测绘成果。</p><p><a href="Yali_M1_0_R3_Viewer.html">打开三维查看器</a> · <a href="https://github.com/ziyuuu/return-old-school/issues?q=R3">GitHub issues</a></p><h2>同机位总图对照</h2><div class="pair">{before}<figure><figcaption>R3（当前）</figcaption><img src="{image('qa/m10-r3/top.png')}"></figure></div>{plates}<h2>本轮实际检查</h2><table>{checks}</table><p>未进行精模、测绘、完整人物碰撞或整机帧率认证。住宅子楼体和共享面门洞仍为H工作方案。</p></main></html>'''
(OUT/'Yali_M1_0_R3_Review.html').write_text(review)
folders=['apps/campus','data','docs/m10','docs/plates','tests/m10','tools/m10','qa/m10-r3']
files=[p for name in folders for p in (ROOT/name).rglob('*') if p.is_file()]
files += [ROOT/'README.md',ROOT/'docs/development-plan.md',ROOT/'tools/check_restoration_v07.py',ROOT/'.github/workflows/m10-build.yml']
files=[p for p in files if p.exists() and not any(t in p.parts for t in ['node_modules','__pycache__','.git']) and p.suffix.lower() not in ['.ttf','.otf','.woff','.woff2','.pyc'] and not p.name.startswith('.env')]
with zipfile.ZipFile(OUT/'Yali_M1_0_R3_Workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(set(files)):z.write(p,p.relative_to(ROOT).as_posix())
 for name in ['Yali_M1_0_R3_Viewer.html','Yali_M1_0_R3_Review.html','Yali_M1_0_R3_Masterplan.svg','THIRD_PARTY_NOTICES.txt']:z.write(OUT/name,name)
(OUT/'r3-checksums.json').write_text(json.dumps({str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2))
print('R3 packaged with',len(report['checks']),'browser checks and',len(files),'source/evidence files.')
