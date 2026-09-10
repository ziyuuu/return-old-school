"""Generate same-data diagrams, screenshot Review and a reproducible workspace."""
from pathlib import Path
import base64,json,zipfile,html,hashlib,subprocess
R=Path(__file__).resolve().parents[2];O=R/'artifacts/m11b-b01';Q=R/'qa/m11b-b01';O.mkdir(parents=True,exist_ok=True)
report=json.loads((Q/'browser-report.json').read_text());data=json.loads((R/'data/m11b/batch01/resolved-buildings.json').read_text());p=data['input']
passed=report['passed'] and report['complete']; unit=(Q/'unit-tests.txt').read_text();testline=next((x for x in unit.splitlines() if x.startswith('# tests ')),'')
# Orthographic elevation and a second-floor plan use the exact parts used by the Viewer.
def svg_start(title,subtitle):return f'<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="940" viewBox="0 0 1440 940"><rect width="1440" height="940" fill="#f6f5ef"/><g font-family="sans-serif" fill="#263f3b"><text x="60" y="60" font-size="30">{title}</text><text x="60" y="96" font-size="16">{subtitle}</text></g>'
def rect(x,y,w,h,fill,stroke='#758983'):return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}" stroke="{stroke}" stroke-width=".5"/>'
def text(x,y,s,size=17):return f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{size}" fill="#314740">{html.escape(s)}</text>'
s=svg_start('复原雅礼｜第一批立面与连接剖面','M1.1-B Batch01 · 同源几何 · 旧主楼 / 连桥 / 连续厕所 · 工作尺寸H')
s+=text(60,155,'A｜主教学楼正面：浅色窗墙与四层节奏；不是现代橘红色大拱门')
for q in data['parts']:
 if q['owner']!='15' or q['shape']!='box' or q['center'][2]>-6.5:continue
 x,y,z=q['center'];w,h,d=q['size'];s+=rect(110+(x-w/2+49)*12,410-(y+h/2)*12,w*12,h*12, '#63847e' if q['role']=='glazing' else '#dce2d7')
s+=text(100,442,'旧主楼98m工作包络；四层原基准不变。屋顶小圆顶轮廓见Viewer，立面图仅投影前沿构件。',15)
s+=text(60,505,'B｜主楼—四层连接桥—连续厕所：完整楼板 / 桥口 / 两端门前廊')
for q in data['worldParts']:
 if q['shape']!='box' or q['owner'] not in ['25','bridge']:continue
 x,y,z=q['center'];w,h,d=q['size'];
 if q['role'] in ['slab','bridge-floor','bridge-rail','wall','partition','roof']:s+=rect(140+(x-w/2+13)*26,845-(y+h/2-3.45)*18,w*26,h*18,'#b7c7b7' if q['role'] in ['slab','bridge-floor'] else '#dde3d8')
s+=text(70,910,'四层桥的端点、宽度与高程继承R4。首层横向通路保持开放；图示不代表完整室内。',15)+'</svg>'
(O/'Yali_M1_1_B_Batch01_Elevations.svg').write_text(s)
s=svg_start('复原雅礼｜第一批二层空间校核','工作平面 · 15 / 25占地与桥端点不变 · 下方为朝操场的主立面')
scale=10; X=lambda x:170+(x+13)*scale; Z=lambda z:320+(z-215)*scale
for q in data['worldParts']:
 if q['level']!=2 or q['shape']!='box' or q['role'] not in ['slab','bridge-floor','wall','partition','central-wall']:continue
 x,y,z=q['center'];w,h,d=q['size'];s+=rect(X(x-w/2),Z(z-d/2),w*scale,d*scale,'#e6eadd' if q['role'] in ['slab','bridge-floor'] else '#7c9388')
for route in data['routes']:
 if route['level']!=2:continue
 s+=f'<polyline points="'+ ' '.join(f'{X(x):.2f},{Z(z):.2f}' for x,y,z in route['points'])+'" fill="none" stroke="#b57238" stroke-width="3"/>'
s+=text(75,195,'沿主楼交通带 → 西端转入 → 连接桥 → 厕所前廊 → A/B两端门')
s+=text(75,590,'A/B仅区分两端入口，不指定未知的男女方位。楼层剖看按钮可在Viewer逐层检查。')
s+=text(75,638,'四楼后坪在原占地内退让形成，不移动旧图书馆或教学楼。')+'</svg>'
(O/'Yali_M1_1_B_Batch01_Plan.svg').write_text(s)
checklist=f'''# M1.1-B 第一批回归清单\n\n工程结果：{'PASS' if passed else 'INCOMPLETE'}；校友状态 REVIEW_PENDING。\n\n{testline}\n\n'''+''.join(f"- [{'x' if c['passed'] else ' '}] {c['name']}\n" for c in report['checks'])+'\n本清单来自执行结果，不用模型数据检查替代浏览器截图。\n'
(O/'Yali_M1_1_B_Batch01_Regression_Checklist.md').write_text(checklist)
# All review images must already exist as browser captures. No placeholder rendering.
captions={'b01-front.png':'旧主楼正面｜浅色窗墙与成组窗洞','b01-oblique.png':'主楼、连桥与厕所｜第一批整体','b01-entry.png':'主楼入口与已认可三旗前坪','b01-rear.png':'主楼后面｜后门通旧图书馆','b01-terrace.png':'四楼后坪｜露天地面、门洞及围护','b01-toilet.png':'连续厕所｜两端门与完整外廊','b01-bridge.png':'逐层连接桥｜四层楼板与实体栏杆','b01-floor2.png':'二层剖看｜隐藏上方楼层检查门口通路','b01-underpass.png':'桥下道路｜保留横向穿行','mobile.png':'手机尺寸显示｜390×844 viewport'}
h='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>复原雅礼｜第一批实景审阅</title><style>body{margin:0;background:#f3f2eb;color:#253f3a;font:16px/1.8 system-ui,sans-serif}main{max-width:1280px;margin:auto;padding:40px 24px}h1{font-size:34px;margin-bottom:8px}small{color:#5b756b}section{margin:32px 0}img{display:block;width:100%;height:auto;border-radius:5px;background:#dde4d7}figure{margin:24px 0}figcaption{padding:12px 4px;font-weight:600}a{color:#476f63}code{word-break:break-all}.status{padding:20px;background:#e1eadf;border-left:4px solid #638473}</style><main><small>RETURN OLD SCHOOL / M1.1-B BATCH01</small><h1>旧主楼、厕所与逐层连接桥</h1>'''
h+=f'<p class="status">工程验证：{"通过" if passed else "未完成"} · 校友审阅：待确认。以下全部为实际 Chromium WebGL 截图。</p><p>保留M1.1-A已认可地形与场地；本批是建筑外壳，不是完整室内或人物通行控制器。先看整体、正面、四楼后坪，再看厕所与二层剖面。</p><p>单元测试：{html.escape(testline)}；浏览器检查 {sum(c["passed"] for c in report["checks"])}/{len(report["checks"])}。</p><p>源代码 SHA：<code>{report.get("source_sha")}</code><br>Viewer SHA256：<code>{report["viewer_sha256"]}</code></p>'
for name in report['screenshots']:
 img=Q/name
 if not img.exists():raise FileNotFoundError(img)
 h+=f'<figure><img loading="lazy" src="data:image/png;base64,{base64.b64encode(img.read_bytes()).decode()}" alt="{html.escape(captions.get(name,name))}"><figcaption>{html.escape(captions.get(name,name))}</figcaption></figure>'
h+='<section><h2>审阅边界</h2><p>旧照片支持浅色立面、成组窗洞、小圆顶轮廓与四楼后坪；具体展开及隐藏面采用工作补全。厕所连续楼体、楼板、前廊和两端门遵循校友已确认关系。后续家具、室内楼梯和完整教室空间不在本批。</p></section></main></html>'
(O/'Yali_M1_1_B_Batch01_Review.html').write_text(h)
(R/'docs/m11b/batch01/delivery.md').write_text(f'''# M1.1-B 第一批交付\n\n状态：IMPLEMENTED / REVIEW_PENDING。M1.1-A已获用户认可；本批单独待审。\n\n工程结果：{'PASS' if passed else 'INCOMPLETE'}。{testline}；浏览器{sum(c['passed'] for c in report['checks'])}/{len(report['checks'])}；实际截图{len(report['screenshots'])}张。\n\n源码SHA：`{report.get('source_sha')}`。Viewer SHA256：`{report['viewer_sha256']}`。细项见`qa/m11b-b01/browser-report.json`及各射线记录。\n\n交付：`artifacts/m11b-b01/`中的Viewer HTML、截图Review、Workspace ZIP、立面/连接图、二层平面图、回归清单和第三方许可。\n\n复现：依次运行`npm ci`、全套node tests、`npm run build`、`node tools/m11b/export.mjs`、`python tools/m11b/capture.py`、`python tools/m11b/package.py`。\n\n通过真实Chromium/软件WebGL2，不以DOM存在当作模型正确。手机只做viewport基础显示验证；当前自由校核相机不是物理角色。未完成全室内或其余建筑精化。\n\n保留冻结占地、路网、楼层与P3/P4地坪。原照片不作为材质、不新增发布原图；审阅图均为本项目实际浏览器画面。\n''')
# Small source manifest lets downloads be matched to tested source, without circular hashes.
manifest={'source_sha':report.get('source_sha'),'viewer_sha256':report['viewer_sha256'],'files':{}}
for base in ['apps/campus','data/m11a','data/m11b','tests/m11b','tools/m11b']:
 for f in (R/base).rglob('*'):
  if not f.is_file() or 'node_modules' in f.parts or 'dist' in f.parts or '__pycache__' in f.parts:continue
  manifest['files'][str(f.relative_to(R))]=hashlib.sha256(f.read_bytes()).hexdigest()
(O/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(O/'Yali_M1_1_B_Batch01_Workspace.zip','w',zipfile.ZIP_DEFLATED)as z:
 for base in ['apps','data','docs','tests','tools','qa','.github']:
  for f in (R/base).rglob('*'):
   if f.is_file() and not any(x in f.parts for x in ['node_modules','dist','__pycache__','.git']):z.write(f,str(f.relative_to(R)))
 for f in ['README.md','.gitignore']:z.write(R/f,f)
 for f in O.iterdir():
  if f.is_file() and f.suffix!='.zip':z.write(f,'delivery/'+f.name)
print('Packaged',len(report['screenshots']),'actual screenshots; QA passed',passed)
