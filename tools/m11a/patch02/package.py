"""Ship exactly the successful runtime, audit records, and editable source; no fonts/photos."""
from pathlib import Path
import json,zipfile,base64,hashlib,html,re,shutil
R=Path(__file__).resolve().parents[3];Q=R/'qa/m11a-p02';O=R/'artifacts/m11a-p02';O.mkdir(exist_ok=True,parents=True)
report=json.loads((Q/'browser-report.json').read_text());assert report['passed'] and report['complete']
unit=(Q/'unit-tests.txt').read_text();match=re.search(r'# pass (\d+)',unit);num=int(match[1])
viewer=R/'artifacts/m11a/Yali_M1_1_A_Viewer.html';shutil.copyfile(viewer,O/'Yali_M1_1_A_Patch02_Viewer.html')
for src,dst in [('docs/m11a/patch02/masterplan.svg','Yali_M1_1_A_Patch02_Masterplan.svg'),('docs/m11a/patch02/height-study.svg','Yali_M1_1_A_Patch02_Height_Study.svg'),('docs/m11a/patch02/plan.md','Yali_M1_1_A_Patch02_Plan.md')]:shutil.copyfile(R/src,O/dst)
summary=f'''# M1.1-A Patch02 回归记录\n\n状态：工程实现通过；校友审阅待确认，非测绘级。\n\n单元/反例回归：{num}项通过。浏览器：{len(report['checks'])}项通过。\n\n新旧布局分离，R4冻结文件不覆写；有效视图只应用#19授权的体育馆入口与环路例外。\n\n'''
for c in report['checks']:summary+=f"- [x] {c['name']}\n"
summary+='\n测试为软件WebGL；射线与实体表面检查不代表完整人物控制或目标设备帧率。高程、坡度、门洞、楼梯级数仍为H工作值。\n'
(O/'Yali_M1_1_A_Patch02_Regression_Checklist.md').write_text(summary);(R/'docs/m11a/patch02/regression.md').write_text(summary)
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>雅礼 Patch02 实机审阅</title><style>body{margin:32px auto;padding:0 20px;max-width:1160px;background:#f8f7f0;color:#243f3a;font:17px/1.7 system-ui,sans-serif}img{width:100%;height:auto}figure{margin:32px 0}figcaption{padding:10px 0}small{color:#5e7770}code{overflow-wrap:anywhere}</style><h1>复原雅礼 · M1.1-A Patch02</h1><p>以下均为同一个Three.js模型的实际浏览器截图，不是生成式图像。全部尺寸为H工作方案；原R4冻结归档保留。</p><p>重点：5%入校坡道、朝主路的馆门、前坪、闭合绕馆路、正门左侧外楼梯和观赛层。</p>'''
for name in report['screenshots']:
 p=Q/name
 if not p.is_file():continue
 page+=f'<figure><img src="data:image/png;base64,{base64.b64encode(p.read_bytes()).decode()}"/><figcaption>{html.escape(name)}</figcaption></figure>'
page+=f'<h2>回归校验</h2><p>{num}项单元/反例测试，{len(report["checks"])}项浏览器检查。本轮仅空间修订，不是精模、测绘、人物物理或性能认证。</p></html>'
(O/'Yali_M1_1_A_Patch02_Review.html').write_text(page)
with zipfile.ZipFile(O/'Yali_M1_1_A_Patch02_Workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
 for folder in ['apps/campus','data/m10','data/m11a','data/restoration','tests/m10','tests/m11a','tools/m10','tools/m11a','docs/m10','docs/m11a','qa/m11a-p02']:
  for p in (R/folder).rglob('*'):
   if p.is_file() and not any(s in ['node_modules','dist','__pycache__'] for s in p.parts) and p.suffix not in ['.ttf','.otf','.woff','.woff2','.pyc'] and not p.name.endswith('.b64'):z.write(p,p.relative_to(R))
 for name in ['README.md','docs/development-plan.md','data/spatial-constraints.json','.github/workflows/m11a-build.yml']:
  if (R/name).is_file():z.write(R/name,name)
 z.write(O/'Yali_M1_1_A_Patch02_Viewer.html','Yali_M1_1_A_Patch02_Viewer.html')
 license=R/'apps/campus/node_modules/three/LICENSE'
 if license.is_file():z.writestr('THIRD_PARTY_NOTICES.txt',license.read_text())
manifest={'version':'M1.1-A.Patch02','source_input':report.get('source_input'),'passed':True,'unit_tests':num,'browser_checks':len(report['checks']),'files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in O.iterdir() if p.is_file()}}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2));(Q/'delivery-manifest.json').write_text(json.dumps(manifest,indent=2))
print('Packaged Patch02',num,'unit tests',len(report['checks']),'browser checks')
