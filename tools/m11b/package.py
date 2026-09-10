from pathlib import Path
import json,base64,html,zipfile
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/m11b-b01';QA=ROOT/'qa/m11b-b01'
r=json.loads((QA/'browser-report.json').read_text());b=json.loads((QA/'build-manifest.json').read_text())
captions={'b01-oblique':'01 / 主楼、连续厕所与四层连接桥','b01-front':'02 / 旧主楼浅色立面，不套用后建红色新楼','b01-entry':'03 / 原有三旗前坪与主门口','b01-rear':'04 / 后侧立面与图书馆方向','b01-terrace':'05 / 四楼后坪、退台和围护','b01-toilet':'06 / 两端入口朝主楼，连续外廊','b01-bridge':'07 / 四层实体连接桥栏杆','b01-floor2':'08 / 二层剖看：桥口与两端门','b01-underpass':'09 / 桥下穿行道路','b01-overview':'10 / 第一批全体量','p04-courts':'11 / 已认可的篮球场抬高','p04-flags':'12 / 已认可的三旗与开阔前坪','p04-shop':'13 / 食堂下层小卖部入口','p03-gate-out':'14 / 保留入校长坡','p03-edge':'15 / 保留下沉运动场','gym-p02-front':'16 / 保留体育馆正门前坪','mobile':'17 / 手机尺寸界面检查'}
s='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>复原雅礼 · 第一批实际场景审阅</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f2e9;color:#28473f;font:15px/1.7 system-ui,sans-serif}header,main{max-width:1180px;margin:auto;padding:28px}header{border-bottom:1px solid #bdcbbf}h1{font-size:30px;margin:8px 0}h2{font-size:18px}figure{margin:28px 0 42px;background:#fff;border:1px solid #ccd5c8}img{display:block;width:100%;height:auto}figcaption{padding:14px 18px}small{color:#617369}code{overflow-wrap:anywhere}.mobile img{max-width:390px;margin:auto}a{color:#295e52}</style><header><small>RETURN OLD SCHOOL / M1.1-B BATCH01</small><h1>旧主教学楼、厕所与逐层连接桥</h1><p>这里的图像全部来自实际 Chromium WebGL 截图，不是效果图。M1.1-A 基底已确认；本批外壳待校友审阅。</p>'''
s+=f'<p>浏览器检查：{sum(c["passed"] for c in r["checks"])}/{len(r["checks"])}。源指纹：<code>{b["sourceFingerprint"]}</code></p>'
s+='<p><a href="Yali_M1_1_B_Batch01_Viewer.html">打开离线 Viewer</a> · <a href="Yali_M1_1_B_Batch01_Elevations.svg">立面图</a> · <a href="Yali_M1_1_B_Batch01_Connections.svg">四层连接图</a></p></header><main>'
for shot in r['screenshots']:
 f=QA/shot['file'];data=base64.b64encode(f.read_bytes()).decode();cl=' class="mobile"' if shot['view']=='mobile' else ''
 s+=f'<figure{cl}><img loading="lazy" src="data:image/png;base64,{data}" alt="{html.escape(captions.get(shot["view"],shot["view"]))}"><figcaption><b>{html.escape(captions.get(shot["view"],shot["view"]))}</b><br><small>{shot["viewport"][0]} × {shot["viewport"][1]} · {shot["source"]}</small></figcaption></figure>'
s+='</main></html>';(OUT/'Yali_M1_1_B_Batch01_Review.html').write_text(s)
checklist='# M1.1-B Batch01 回归与审阅清单\n\nM1.1-A：校友已认可。Batch01：IMPLEMENTED / REVIEW_PENDING。\n\n'
for c in r['checks']:checklist+=f'- [{"x" if c["passed"] else " "}] {c["id"]}\n'
checklist+='\n## 待校友审阅\n\n旧主楼浅色外壳、窗洞节奏、屋顶小圆顶、四楼后坪范围；连续厕所与逐层连接。人物碰撞和完整室内不属于本批。\n'
(OUT/'Yali_M1_1_B_Batch01_Regression_Checklist.md').write_text(checklist)
archive=OUT/'Yali_M1_1_B_Batch01_Workspace.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for p in ROOT.rglob('*'):
  if not p.is_file() or p.is_symlink():continue
  rel=p.relative_to(ROOT)
  if any(x in rel.parts for x in ['node_modules','.git','dist','__pycache__']):continue
  if rel.parts[0]=='artifacts' and (len(rel.parts)<2 or rel.parts[1]!='m11b-b01'):continue
  if p.suffix=='.zip' or 'b01-seed' in rel.parts:continue
  z.write(p,'return-old-school/'+str(rel))
print(archive,archive.stat().st_size)
