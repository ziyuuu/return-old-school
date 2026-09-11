"""Package the tested viewer and its real screenshots. Never label an untested bundle as passed."""
import json,hashlib,base64,zipfile,re,html
from pathlib import Path
R=Path(__file__).resolve().parents[3];Q=R/'qa/m11b-shutter-fix';A=R/'artifacts/m11b-shutter-fix'
br=json.loads((Q/'browser-report.json').read_text());V=A/'Yali_M1_1_B_B01_R3_1_Viewer.html'
assert br['passed'] and br['complete']
assert hashlib.sha256(V.read_bytes()).hexdigest()==br['viewer_sha256']
titles={'r3-west.png':'左端：门洞在侧墙，后墙封回','r3-east.png':'右端：侧墙开启卷帘门','r31-west-door.png':'左端卷帘门近看','r31-east-door.png':'右端卷帘门近看','r3-porch-plan.png':'首层俯看：门内转入中走廊','r3-overview.png':'教学楼整体：主体与门廊关系保留','r3-front.png':'正面：五层、轻弧与中轴保持','mobile.png':'手机尺寸显示检查'}
figures=''.join('<figure><img src="data:image/png;base64,'+base64.b64encode((Q/s).read_bytes()).decode()+'"><figcaption>'+titles.get(s,s)+'</figcaption></figure>' for s in br['screenshots'])
review='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>雅礼 · R3.1 侧门修复审阅</title><style>body{margin:0;background:#edf0e8;color:#25332e;font:16px/1.7 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:32px 18px}h1{font-size:30px}header,p,figure{margin:0 0 28px}figure{background:#fff;border:1px solid #d9ddd4;border-radius:10px;overflow:hidden}img{display:block;width:100%}figcaption{padding:14px 20px;font-weight:600}code{overflow-wrap:anywhere;font-size:13px}</style><main><header><h1>主教学楼侧门修复 · R3.1</h1><p>侧墙开口加大，卷帘门默认收起；原后墙门洞封回。雨棚放大，两根柱子随之前移、外展。以下均为本次真实浏览器截图；仍待校友审阅。</p><p>10项定向测试；'+str(len(br['checks']))+'组浏览器检查通过。没有重开校园基线或全校园故障测试。</p><p>受测源码：<code>'+html.escape(br.get('source_sha') or 'local working tree')+'</code><br>Viewer SHA256：<code>'+br['viewer_sha256']+'</code></p></header>'+figures+'</main></html>'
(A/'Yali_M1_1_B_B01_R3_1_Review.html').write_text(review)
for n in ['browser-report.json','tests.txt','build.txt']:(A/n).write_bytes((Q/n).read_bytes())
D=R/'docs/m11b/shutter-fix';D.mkdir(parents=True,exist_ok=True)
(D/'delivery.md').write_text('# R3.1 侧墙卷帘门修复\n\nIMPLEMENTED / REVIEW_PENDING；工程验证PASS。\n\n实际开口移到两处凹口内侧返墙，后墙原门洞封回；卷帘收起，保留卷盒、导轨和收拢叶片，不装关闭门板。门洞H工作值2.65×2.80m；雨棚4.50×3.15m，柱列向前0.62m并外展；三级台阶与局部门前平台适配。主楼五层、中央轻弧、后坪、桥与主轴不变。\n\n10项定向测试；'+str(len(br['checks']))+'组实际WebGL检查；'+str(len(br['screenshots']))+'张截图。手机为viewport检查，不是物理手机实机。内部楼梯/完整内装不在本轮。\n\n源码 `'+(br.get('source_sha') or 'local')+'`；Viewer SHA256 `'+br['viewer_sha256']+'`。\n\n复现：npm ci --prefix apps/campus；node --test tests/m11b/r3/shutter-fix.test.mjs；npm run build --prefix apps/campus；node tools/m11b/shutter-fix/export.mjs；python tools/m11b/shutter-fix/capture.py；python tools/m11b/shutter-fix/package.py。\n')
with zipfile.ZipFile(A/'Yali_M1_1_B_B01_R3_1_Workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
 for top in ['apps','data','tests','tools','docs','.github']:
  for p in sorted((R/top).rglob('*')):
   if not p.is_file() or any(v in p.parts for v in ['node_modules','dist','__pycache__']):continue
   if p.suffix.lower() in ['.ttf','.otf','.woff','.woff2']:continue
   z.write(p,p.relative_to(R))
 for n in ['README.md','.gitignore']:
  if (R/n).exists():z.write(R/n,n)
 for p in Q.glob('*'):
  if p.is_file():z.write(p,p.relative_to(R))
 for p in A.glob('*'):
  if p.is_file() and p.suffix!='.zip':z.write(p,'delivery/'+p.name)
print('Packaged actual screenshot Review and complete source workspace',flush=True)
