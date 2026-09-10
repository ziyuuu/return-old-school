"""Export a same-data plan and verified browser evidence, then readable source package."""
from pathlib import Path
import json,shutil,zipfile,base64,html,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/m10';QA=ROOT/'qa/m10-r4'
r=json.loads((QA/'browser-report.json').read_text());assert r.get('success'),r.get('failure')
l=json.loads((ROOT/'data/m10/campus-layout.json').read_text());assert l['version']=='M1.0.3-R4'
shutil.copy2(OUT/'Yali_M1_0_Viewer.html',OUT/'Yali_M1_0_R4_Viewer.html');esc=html.escape
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1300" viewBox="0 0 350 325">','<rect width="350" height="325" fill="#edf0e8"/>','<text x="12" y="12" font-size="7" fill="#294f47">复原雅礼 / M1.0.3-R4 工作总平面</text>','<text x="12" y="20" font-size="3.5">基于R3局部修订 / 图左=-X、图上=-Z / H工作米制，非测绘图</text>','<g transform="translate(119 28) scale(.68)">']
for f in l['facilities']:
 if not f['position'] or f['parent'] or f['id']=='09':continue
 x,_,z=f['position'];w,h,d=f['size'];colour='#d8daca' if h>1 else '#adbda1'
 if f['id']=='08':colour='#c8ad90'
 if f['id']=='27':colour='#ad885e'
 parts.append(f'<rect x="{x-w/2}" y="{z-d/2}" width="{w}" height="{d}" fill="{colour}" stroke="#52796e" stroke-width=".4"><title>{esc(f["name"])}</title></rect>')
for a,b in l['navigation']['edges']:
 A,B=l['navigation']['nodes'][a],l['navigation']['nodes'][b];width=l['navigation']['edgeWidths'].get(a+'|'+b,l['navigation']['edgeWidths'].get(b+'|'+a,7 if a=='gate' or a.startswith('junction') and b.startswith('junction') else 3))
 parts.append(f'<path d="M{A[0]} {A[2]} L{B[0]} {B[2]}" stroke="#bec8b8" stroke-width="{width}" fill="none"><title>{esc(a+" → "+b)}</title></path>')
for p in l['thresholds']:
 a,b=p['start'],p['end'];parts.append(f'<path d="M{a[0]} {a[2]} L{b[0]} {b[2]}" stroke="#bec8b8" stroke-width="{p["width"]}"/>')
for c in l['connections'][:1]:parts.append(f'<path d="M{c["xStart"]} {c["z"]} H{c["xEnd"]}" stroke="#719184" stroke-width="{c["width"]}"/>')
for f in l['facilities']:
 if f['position'] and not f['parent']:parts.append(f'<text x="{f["position"][0]}" y="{f["position"][2]+1}" text-anchor="middle" font-size="4.3" fill="#233f38">{f["id"]}</text>')
parts.append('</g>')
for i,f in enumerate(l['facilities']):parts.append(f'<text x="{12+(i//14)*167}" y="{251+(i%14)*4.5}" font-size="3.1" fill="#355c52">{f["id"]} {esc(f["name"])}</text>')
parts.append('</svg>');plan=ROOT/'docs/plates/masterplan-m10-r4.svg';plan.write_text('\n'.join(parts));shutil.copy2(plan,OUT/'Yali_M1_0_R4_Masterplan.svg')
def image(p):return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
shots=['rostrum','family-canteen','black-routes','longya','toilet-front','toilet-level-1','toilet-level-2','toilet-level-3','toilet-level-4']
plates=''.join(f'<h2>{esc(name)}</h2><img src="{image(QA/(name+".png"))}">' for name in shots)
old=ROOT/'qa/m10-r3/top.png';before=f'<figure><figcaption>R3修复前</figcaption><img src="{image(old)}"></figure>' if old.exists() else ''
checks=''.join(f'<tr><td>{esc(c["name"])}</td><td>{"通过" if c["passed"] else "失败"}</td></tr>' for c in r['checks'])
review=f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R4实机校核</title><style>body{{background:#edf0e8;color:#264d42;font-family:system-ui,sans-serif}}main{{max-width:1280px;margin:auto;padding:25px}}img{{width:100%}}.pair{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}figure{{margin:0}}p{{line-height:1.8}}td{{padding:8px;border-bottom:1px solid #ccd4c5}}@media(max-width:700px){{.pair{{grid-template-columns:1fr}}}}</style><main><h1>复原雅礼 / M1.0.3-R4</h1><p>真实Three.js浏览器截图，不是生成式效果图。只有10和20位置变更，其余26项设施位置尺寸保留；厕所重构在原占地内完成。每层整幅楼板、两端门、前廊栏杆与桥侧缺口均可剖看。</p><p><a href="Yali_M1_0_R4_Viewer.html">打开三维查看器</a> · <a href="https://github.com/ziyuuu/return-old-school/issues?q=R4">Issues</a></p><h2>同机位总图</h2><div class="pair">{before}<figure><figcaption>R4当前</figcaption><img src="{image(QA/'top.png')}"></figure></div>{plates}<h2>{len(r['checks'])}项浏览器校核</h2><table>{checks}</table><p>尺寸H；未认证整机帧率、测绘精度或完整人物碰撞。男女两端方向未知，以A/B表示。</p></main></html>'''
(OUT/'Yali_M1_0_R4_Review.html').write_text(review)
unit=(QA/'unit-tests.txt').read_text();passed=unit.split('# pass ')[-1].split('\n')[0]
checklist=f'# R4回归清单与结果\n\n单元/回归：{passed}项通过；浏览器：{len(r["checks"])}项通过。原始记录在qa/m10-r4。\n\n'
for c in r['checks']:checklist+=f'- [x] {c["name"]}\n'
checklist+='\n## 反例\n\n已覆盖主席台复位、家属区不移动/越界、绿色路复活、主路变3m、三条黑线任一缺失、厕所重新劈开、任一层缺板、门移中间、护栏封闭桥口、入口背向主楼。\n\n工程通过不替代校友最终验收。\n'
(ROOT/'docs/m10/regression-r4.md').write_text(checklist);(OUT/'Yali_M1_0_R4_Regression_Checklist.md').write_text(checklist)
folders=['apps/campus','data','docs/m10','docs/plates','tests/m10','tools/m10','qa/m10-r4'];files=[p for name in folders for p in (ROOT/name).rglob('*') if p.is_file()]
files += [ROOT/'README.md',ROOT/'docs/development-plan.md',ROOT/'tools/check_restoration_v07.py',ROOT/'.github/workflows/m10-build.yml',ROOT/'.github/m10-r4.patch']
files=sorted(set(p for p in files if p.exists() and not any(t in p.parts for t in ['node_modules','__pycache__','.git']) and p.suffix.lower() not in ['.ttf','.otf','.woff','.woff2','.pyc'] and not p.name.startswith('.env')))
with zipfile.ZipFile(OUT/'Yali_M1_0_R4_Workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,p.relative_to(ROOT).as_posix())
 for name in ['Yali_M1_0_R4_Viewer.html','Yali_M1_0_R4_Review.html','Yali_M1_0_R4_Masterplan.svg','Yali_M1_0_R4_Regression_Checklist.md','THIRD_PARTY_NOTICES.txt']:z.write(OUT/name,name)
(OUT/'r4-checksums.json').write_text(json.dumps({str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2))
print('R4 packaged',len(files),'source/evidence files,',len(r['checks']),'browser checks')
