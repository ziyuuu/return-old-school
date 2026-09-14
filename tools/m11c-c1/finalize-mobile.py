"""Verify archived exact-Viewer evidence; this is not a new browser test."""
from pathlib import Path
import hashlib,json,shutil,os,html
ROOT=Path.cwd(); IN=Path(os.environ.get('MOBILE_INCOMING','incoming')); QA=ROOT/'qa/m11c-c1/mobile-r12'
SHA='def040892c538ef00ddb006f8de1dcabfbead3658822800ec14c6723f09d2477'
OLD='b2cd412be14a8ab3589c75c7e573312f3d0f5a24061766e15de0284a591847d6'
V='artifacts/m11c-c1/Yali_C1_R1_2_Viewer.html'
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(p):return json.loads(Path(p).read_text())
def put(p,d):
 p=ROOT/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(d if isinstance(d,str) else json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def copy(src,dest):
 dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():assert digest(src)==digest(dest),str(dest)
 else:shutil.copy2(src,dest)
assert digest(ROOT/V)==SHA
manifest=load(ROOT/'artifacts/m11c-c1/viewer-manifest-r12.json');assert manifest['sha256']==SHA
for f,h in manifest['sources'].items():assert digest(ROOT/f)==h,f
assert '# pass 30' in (QA/'build/tests.tap').read_text()
reports={};shots=[];provenance={}
for group in ['mobile','input','lane','terrain','review','fallback','fix']:
 directory=IN/group;r=load(directory/'report.json');assert r['passed'] and r['viewerSHA256']==SHA and r['sourceCommit']==manifest['gitHead'],group
 assert not r['errors'] and not r['externalRequests'],group
 for s in r['screenshots']:
  assert digest(directory/s['file'])==s['sha256'];assert s['error']==0 and not s['lost']
  copy(directory/s['file'],QA/group/s['file']);shots.append({'group':group,**s})
 for name in ['report.json','capture.log']:
  if (directory/name).exists():copy(directory/name,QA/group/name)
 reports[group]=r;provenance[group]=digest(directory/'report.json')
b=load(IN/'benchmark/report.json');assert b['passed'] and len(b['sessions'])==2
before,after=b['sessions'];assert before['viewerSHA256']==OLD and after['viewerSHA256']==SHA
for session in b['sessions']:
 assert len(session['valuesMs'])==60 and session['route']['reason']=='complete'
 assert not session['errors'] and not session['externalRequests'] and session['final']['glError']==0
 assert digest(IN/'benchmark'/session['screenshot'])==session['screenshotSHA256']
for f in (IN/'benchmark').iterdir():
 if f.is_file():copy(f,QA/'benchmark'/f.name)
for f in (IN/'history-compositor-failure').iterdir():
 if f.is_file():copy(f,QA/'history/compositor-failure'/f.name)
init=reports['mobile']['initialization'];packed=init['lighting']['vertexPacking'];assert packed['trianglesBefore']==packed['trianglesAfter']
checks=sum(len(r['checks']) for r in reports.values())
summary={'stage':'C1','version':'R1.2','status':'IMPLEMENTED / REVIEW_PENDING','functionalFeedback':'R1.1 basic controls acceptable to user; mobile stutter separately outstanding','viewer':V,'viewerSHA256':SHA,'viewerBytes':(ROOT/V).stat().st_size,'runtimeSourceCommit':manifest['gitHead'],'buildTests':30,'browserRun':'34793277031','comparisonRun':os.environ['COMPARISON_RUN'],'browserGroups':list(reports),'checks':checks,'screenshots':len(shots),'modelTriangles':init['modelTriangles'],'geometryBytesIncludingAvatar':init['geometryBytes'],'vertexPacking':packed,'graphics':init['lighting']['graphics'],'performance':b,'reportDigests':provenance,'historicalFailure':'history/compositor-failure: first comparison stopped at compositor screenshot; not a valid before/after result','standard':'1.0 + mobile-r12','campusDecimation':False,'realPhonePerformanceAccepted':False,'acceptanceCreated':False,'C2':'Authorized to begin; separate branch and not represented as completed'}
put(Path('qa/m11c-c1/mobile-r12/summary.json'),summary)
put(Path('qa/m11c-c1/mobile-r12/screenshots-manifest.json'),{'viewerSHA256':SHA,'screenshots':shots})
reduction=(1-packed['bytesAfter']/packed['bytesBefore'])*100
rows='\n'.join(f"| {s['version']} | {len(s['valuesMs'])} | {s['medianMs']:.2f} | {s['p95Ms']:.2f} | {s['route']['milliseconds']:.2f} |" for s in b['sessions'])
qa=f'''# C1 R1.2 · 手机优化实际QA

**IMPLEMENTED / REVIEW_PENDING**。不是实体手机性能验收，不登记完整acceptance。用户R1.1控制功能确认单独保留。

受测Viewer `{V}`，SHA256 `{SHA}`，运行源码 `{manifest['gitHead']}`。构建/30项定向测试通过；7组真实Chromium、{checks}项检查、{len(shots)}张截图。旧R1/R1.1结果不是本轮测试。相同软件GPU/browser的完整新旧对比另有2张WebGL原始画布图；它们的尺寸等于各自绘图缓冲，不能误称为CSS尺寸截图。

## 几何与画质

完整可见模型仍为{init['modelTriangles']:,}三角面。校园唯一几何缓冲在同一初始化过程中 `{packed['bytesBefore']:,}` → `{packed['bytesAfter']:,}`字节（减少{reduction:.2f}%）；含比例人形总计 `{init['geometryBytes']:,}`字节。统计不包含纹理、浏览器或WASM总内存。全属性逐位相等索引复用，不减面，不重排已认可建筑/植被/门洞。

390×844、DPR3重新加载默认绘图缓冲390×844、阴影1024；帮助中切“完整清晰”验证恢复1.5像素比/2048阴影，再切流畅通过。文字DOM不降分辨率。慢帧时可逐档降至0.75。静态校园世界矩阵/6m阴影焦点迟滞、精确碰撞体复用；手柄、坡速、滑墙、台阶、桥下/入口相机行为不放宽。

## 同机成本比较（不是手机FPS）

同一runner、同一Chromium进程、相同390×844/DPR3，两份精确离线HTML分别8帧预热+60次普通renderFrame与gl.finish同步完成；完整样本在[报告](benchmark/report.json)。新旧默认栅格预算不同，测量包含这一差异。脚本路线CPU时间是相同Rapier胶囊的固定模拟任务，不是玩家实际走完所需时间。

| 版本 | 样本 | 同步绘制中位ms | P95 ms | 同一路线脚本CPU ms |
|---|---:|---:|---:|---:|
{rows}

不能把这些数值倒数换算为用户手机帧率，也不能保证所有手机无卡顿；仍需实体设备复测。首次比较被软件合成器截图超时中断，原始失败文件保留于history；重做完整新旧两会话后才生成比较，不跨runner拼接样本。最终Viewer不因改截图工具而改变。

## 复现

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/*.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c1/export-r12.mjs
# Playwright置于应用外，不改应用锁文件；Linux使用系统CJK字体，不分发字体
npm install --prefix /tmp/c1-browser --save-exact playwright@1.62.0
/tmp/c1-browser/node_modules/.bin/playwright install --with-deps chromium
export PLAYWRIGHT_MODULE=/tmp/c1-browser/node_modules/playwright
C1_GROUP=mobile C1_PHASE=reproduction-r12 node tools/m11c-c1/capture-r12.mjs
# input/lane/terrain/review/fallback/fix按同样命令分组
# benchmark-mobile当前输出到mobile-r12/benchmark；先在临时Git worktree运行，避免覆盖归档
node tools/m11c-c1/benchmark-mobile.mjs
```

[实际截图](review.html) · [机器摘要](summary.json) · [实现/标准偏离](../../../docs/m11c/c1/mobile-performance.md)。历史报告保留原貌。
'''
put(Path('qa/m11c-c1/mobile-r12/README.md'),qa)
cards='\n'.join(f'<figure><a href="{s["group"]}/{s["file"]}"><img loading="lazy" src="{s["group"]}/{s["file"]}" alt="{html.escape(s["file"])}"></a><figcaption>{s["group"]} · {s["file"]}</figcaption></figure>' for s in shots)
put(Path('qa/m11c-c1/mobile-r12/review.html'),f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C1 R1.2 · 手机优化</title><style>body{{font:16px/1.6 system-ui;background:#f1f3ed;color:#263e35;margin:24px}}main{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px}}figure{{margin:0;background:white;padding:12px}}img{{width:100%;height:340px;object-fit:contain}}code{{overflow-wrap:anywhere}}</style><h1>C1 R1.2 · 实际浏览器截图</h1><p>{len(shots)}图，全部绑定 <code>{SHA}</code>。<a href="../../../artifacts/m11c-c1/Yali_C1_R1_2_Viewer.html">打开Viewer</a> · <a href="README.md">QA</a></p><main>{cards}</main></html>')
note='> 当前修订：**C1 R1.2 / IMPLEMENTED / REVIEW_PENDING**。手机默认流畅档、无损顶点索引、碰撞体复用与静态缓存；[实现与边界](mobile-performance.md) · [本轮实际QA](../../../qa/m11c-c1/mobile-r12/README.md)。以下R1/R1.1为历史交付。\n\n'
delivery=ROOT/'docs/m11c/c1/delivery.md';delivery.write_text(note+delivery.read_text())
doc=ROOT/'docs/m11c/c1/mobile-performance.md';doc.write_text(doc.read_text()+f'\n## 本轮已归档结果\n\n30项节点测试、7组浏览器、{checks}项检查、{len(shots)}张截图通过。可见三角面不变；校园几何缓冲减少{reduction:.2f}%。完整同机新旧样本与限制见 [QA](../../../qa/m11c-c1/mobile-r12/README.md)。Viewer SHA256 `{SHA}`。实体手机的流畅度不因这些测试自动获认可。\n')
readme=ROOT/'README.md';t=readme.read_text().replace('**C1 R1：IMPLEMENTED / REVIEW_PENDING**','**C1 R1.2：IMPLEMENTED / REVIEW_PENDING**').replace('artifacts/m11c-c1/Yali_C1_R1_Viewer.html',V).replace('96d2404bd56a9cf766a452f586bb4b6141957605c8266a710af9e9513e0737dc',SHA).replace('qa/m11c-c1/review.html','qa/m11c-c1/mobile-r12/review.html').replace('(qa/m11c-c1/README.md)','(qa/m11c-c1/mobile-r12/README.md)');t=t.replace('## 操作','## 手机端性能修订\n\n手机默认“流畅”档，可在暂停/帮助切回“完整清晰”。保持全部校园三角面、共享美术与碰撞；无损索引减少重复顶点，缓存静态矩阵/阴影和碰撞体。R1.1功能反馈已单独记录，但手机实际帧率仍待设备复核。 [实现](docs/m11c/c1/mobile-performance.md)。用户已授权随后进入C2，C2不在此Viewer中冒充完成。\n\n## 操作').replace('node tools/m11c-c1/export.mjs','node tools/m11c-c1/export-r12.mjs');readme.write_text(t)
plan=ROOT/'docs/development-plan.md';t=plan.read_text().replace('C1 R1已实现待审','C1 R1.2手机优化 / C2接续').replace('| M1.1-C / C1 R1 |','| M1.1-C / C1 R1.2 |').replace('| M1.1-C / C2 | PLANNED / NOT STARTED |','| M1.1-C / C2 | AUTHORIZED / NEXT |');t=t.replace('## C1：当前交付',f'## C1：当前交付\n\nR1.2手机优化已实施：30项定向测试、7组浏览器、{checks}项检查、{len(shots)}图，同机成本比较完成但不是实体手机性能验收。[本轮QA](../qa/m11c-c1/mobile-r12/README.md)。R1.1方向/坡速用户反馈基本无问题；手机流畅度仍需复核，功能反馈与完整acceptance分开。以下R1描述保留为历史。');plan.write_text(t)
landing=ROOT/'qa/m11c-c1/README.md';landing.write_text('> 最新： [C1 R1.2手机优化QA](mobile-r12/README.md) / [截图](mobile-r12/review.html)。下文为R1历史数据，不代表R1.2性能。\n\n'+landing.read_text())
print(json.dumps({k:summary[k] for k in ['viewerSHA256','checks','screenshots','geometryBytesIncludingAvatar']},ensure_ascii=False))
