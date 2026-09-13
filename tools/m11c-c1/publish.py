"""Publish completed C1 evidence without regenerating the tested Viewer.
C1_INCOMING: gh run download artifacts, one folder per artifact name.
"""
from pathlib import Path
import hashlib, json, os, shutil, subprocess, html, statistics
R=Path(__file__).resolve().parents[2]
I=Path(os.environ['C1_INCOMING'])
Q=R/'qa/m11c-c1/r1'
V='artifacts/m11c-c1/Yali_C1_R1_Viewer.html'
H='96d2404bd56a9cf766a452f586bb4b6141957605c8266a710af9e9513e0737dc'
B='c6dcf6ed2bc7a976cd7994402305b80ef0fb6127'
RUN=34769723661
MOBILE_RUN=34770237456
COUNTS={'input':4,'lane':3,'terrain':4,'review':8,'fallback':3,'performance':1,'mobile':3}
IDS={'input':10321567368,'lane':10321333099,'terrain':10322250330,'review':10322250449,'fallback':10322285374,'performance':10321723764,'mobile':10322261386}
def hash(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def put(p,v):
 p=R/p;p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def cp(a,b):
 b.parent.mkdir(parents=True,exist_ok=True)
 if b.exists(): assert hash(a)==hash(b),str(b)
 else: shutil.copyfile(a,b)
def report(p):
 f=list(p.rglob('report.json'));assert len(f)==1,str(p)
 return f[0]
def git(*a): return subprocess.check_output(['git',*a],cwd=R)
m=read(R/'artifacts/m11c-c1/viewer-manifest.json')
assert hash(R/V)==m['sha256']==H
assert (R/V).stat().st_size==m['bytes']==3872519
for f,h in m['sources'].items(): assert hash(R/f)==h,'Runtime drift: '+f
assert not (R/'data/m11c/c1/acceptance.json').exists()
preserved=git('ls-tree','-r','--name-only',B,'apps/campus/src','data/m11b').decode().splitlines()
preserved=[f for f in preserved if f!='apps/campus/src/main.ts' and '/player/' not in f]
for f in preserved: assert (R/f).read_bytes()==git('show',B+':'+f),f
put('qa/m11c-c1/r1/preservation.json',{'base':B,'method':'Byte equality against approved Git objects','passed':True,'files':{f:hash(R/f) for f in preserved}})
for n in range(1,6):
 a=read(R/f'data/m11b/batch0{n}/acceptance.json');assert 'ALUMNI_APPROVED' in a['status']
 if n==5: assert a['version']=='R1.2'
ds={};shots=[];provenance=[]
for g,count in COUNTS.items():
 name='C1-mobile-recheck' if g=='mobile' else 'C1-iteration01-'+g
 p=report(I/name);d=read(p)
 assert d['group']==g and d['viewerSHA256']==H and d['sourceCommit']==m['gitHead']
 assert d['passed'] and not d['errors'] and not d['externalRequests'],g
 assert len(d['screenshots'])==count and all(c['passed'] for c in d['checks']),g
 for s in d['screenshots']:
  f=p.parent/s['file'];assert hash(f)==s['sha256']
  b=f.read_bytes();assert b[1:4]==b'PNG'
  assert int.from_bytes(b[16:20],'big')==d['viewport']['width']
  assert int.from_bytes(b[20:24],'big')==d['viewport']['height']
  assert not s['error'] and not s['lost'] and s['triangles']>0
  cp(f,Q/g/s['file']);shots.append({**s,'group':g,'file':str((Q/g/s['file']).relative_to(R))})
 for f in p.parent.iterdir():
  if f.is_file() and f.suffix in ('.json','.log'): cp(f,Q/g/f.name)
 ds[g]=d
 provenance.append({'group':g,'artifact':name,'artifactId':IDS[g],'run':MOBILE_RUN if g=='mobile' else RUN,'reportSHA256':hash(p),'path':'qa/m11c-c1/r1/'+g+'/report.json'})
p=report(I/'C1-iteration01-mobile');assert not read(p)['passed']
for f in p.parent.iterdir():
 if f.is_file(): cp(f,R/'qa/m11c-c1/history/initial-mobile'/f.name)
put('qa/m11c-c1/history/README.md','# C1 历史测试问题\n\n首次主运行因移动端测试脚本使用合成 pointerdown 并请求无效 pointer capture 而失败。原报告和图片保留在 initial-mobile，未改写为通过。只修复测试脚本后，以真实CDP touchStart/touchMove/touchCancel在独立运行34770237456复测通过；运行源码和Viewer字节没有改变。主运行的其他六组包括性能采样均完成。\n')
checks=sum(len(d['checks']) for d in ds.values());assert checks==69 and len(shots)==26
perf=ds['performance']['performance'];assert perf['samples']==60 and len(perf['valuesMs'])==60
assert all(x>0 for x in perf['valuesMs'])
assert ds['mobile']['mobile']=={'width':390,'scrollWidth':390,'shadow':2048}
routes=[]
for g,keys in {'input':['mainRoute'],'lane':['laneRoute'],'terrain':['stoneRamp','stoneSteps','courtRoute','gymEntry']}.items():
 for k in keys:
  d=ds[g][k];assert d['reason']=='complete'
  routes.append({'case':k,'group':g,'reason':d['reason'],'ticks':d['ticks'],'end':d['end']['motor'],'timing':'Fixed simulation ticks of the same motor, not a wall-clock device speed benchmark'})
scene=ds['input']['initialization'];static=ds['review']['initialization']
test=R/'qa/m11c-c1/iteration-01/build/tests.tap'
assert '# pass 23' in test.read_text() and '# fail 0' in test.read_text()
summary={'stage':'M1.1-C.C1','version':'R1','status':'IMPLEMENTED / REVIEW_PENDING','standard':'1.0','viewer':V,'viewerSHA256':H,'viewerBytes':m['bytes'],'runtimeSourceCommit':m['gitHead'],'qaHarnessCorrectionCommit':'946fd76c27d9157bfa1f6d68fcbdb46bcc0e1017','build':'PASS','directedTests':{'passed':23,'failed':0,'log':str(test.relative_to(R))},'browserChecks':checks,'browserGroups':list(ds),'screenshots':len(shots),'errors':[],'externalRequests':[],'routes':routes,'mobile':ds['mobile']['mobile'],'rendering':{'withMannequin':scene,'reviewWithoutMannequin':static,'addedVisibleTriangles':scene['modelTriangles']-static['modelTriangles'],'dynamicShadow':'Procedural contact-only avatar shadow, not full dynamic sun shadow'},'performance':perf,'performanceAcceptance':'NOT_VALIDATED_ON_USER_GPU_OR_PHYSICAL_PHONE','browserEnvironment':ds['performance']['environment'],'provenance':provenance,'preservation':'qa/m11c-c1/r1/preservation.json','visualReview':'docs/m11c/c1/visual-review.json','acceptanceCreated':False,'limits':['Provisional scale mannequin, not a historic uniform or C2 student.','Six representative traversals, not C3 whole-campus acceptance.','No jumping, swimming, NPCs, full interiors or narrative.','Actual hardware frame rate and walking region-rebuild cost remain to be measured.','Fixture tests and scripted campus simulation are distinguished from real-time device performance.']}
put('qa/m11c-c1/final-summary.json',summary)
put('qa/m11c-c1/screenshots-manifest.json',{'viewerSHA256':H,'screenshots':shots})
put('docs/m11c/c1/visual-review.json',{'viewerSHA256':H,'method':'Inspected all 26 actual captured frames using contact sheets and mobile detail','groups':{'input':'Visible articulated neutral mannequin, clear playfield, pause panel and first-person view.','lane':'Body stays within walls; camera retracts. Very close follow view intentionally crops body.','terrain':'Stone ramp/steps reach platform, court gap and gym portal remain open.','mobile':'Fresh390x844 controls and help fit, low-saturation palette retained.','review':'Six inherited views plus top/axis; campus silhouettes/materials unchanged. Enter-player UI is an overlay.','fallback':'Logarithmic fallback and orthographic views are visible.','performance':'Idle scene captured after60 intervals; software GPU very slow, no smoothness claim.'},'deviations':['Procedural contact-only avatar shadow; static campus sun shadow retained.'],'remaining':['C2 final character/rig/foot placement/uniforms','C3 whole-campus traversal','Physical GPU/phone performance acceptance']})
controls='''## 操作

打开离线HTML，加载后默认在主校门第三人称漫游。WASD／方向键移动，Shift跑步，拖动观察，滚轮调远近，V切换第一／第三人称，Esc暂停，R返回本次起点。触屏使用左摇杆、右侧拖动和跑步切换按钮。

“暂停／帮助”中可选主校门、侧门围墙小路、篮球场东入口、校名石坡脚、体育馆前坪五个起点，也可切回建筑审阅。失焦/页面隐藏暂停并清除输入。没有跳跃、游泳或任务玩法。
'''
commands='''```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/controller.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c1/export.mjs
npm install --prefix /tmp/c1-browser --save-exact playwright@1.62.0
/tmp/c1-browser/node_modules/.bin/playwright install --with-deps chromium
export PLAYWRIGHT_MODULE=/tmp/c1-browser/node_modules/playwright
for group in input lane terrain mobile review fallback performance; do
  C1_GROUP=$group C1_PHASE=reproduction node tools/m11c-c1/capture.mjs
done
```
'''
put('qa/m11c-c1/README.md',f'''# C1 R1｜真实浏览器与控制器QA

**IMPLEMENTED / REVIEW_PENDING**。受测源码`{m['gitHead']}`；Viewer `{V}`，{m['bytes']:,}字节，SHA256 `{H}`。本页是已完成证据归档，不是一次新浏览器测试；原报告/截图逐字节复制，摘要验证哈希。

构建通过；14项控制器/继承测试＋9项共享渲染测试＝23/23。7组Chromium会话、69项检查、26张真实图。六组来自运行{RUN}，移动端来自真实触摸复测{MOBILE_RUN}，全部绑定同一个Viewer。原主运行整体failure不改写；其移动端合成事件测试错误保留于[历史](history/README.md)。

[机器报告](final-summary.json) · [截图审阅](review.html) · [不变性校验](r1/preservation.json)

## 验证范围

真实W/Shift输入、触屏摇杆移动/释放/取消、暂停/失焦清键、视角切换与回到起点；侧墙阻挡及球体扫掠相机回缩。主门长坡、围墙侧路到家属区三叉路、石台坡道、石台四级台阶、篮球场门口和体育馆入口六条代表路线通过。同一个Rapier胶囊按固定模拟时间执行，不把脚本时间当设备实际速度，不代替C3全校园连续走测。

390×844重新加载，文档宽390，阴影2048。六个既有机位、顶视/主轴正交和模拟EXT_clip_control缺失后的实际对数回退均检查。有效组JS/WebGL错误0，外网请求0；完整受测Viewer，非另建低面数场景。

## 美术与性能边界

v1.0共享色板、材质、日光、反射、深度和校园几何不改；与已认可base`{B}`逐文件核对。无照片贴图、bloom、暗角、景深，不降可见校园精度。比例人形弧面48段，复用共享表面；接地影是程序化近似，不是真实动态太阳投影。

审阅模式{static['modelTriangles']:,}可见三角面；加人形后{scene['modelTriangles']:,}，增加{scene['modelTriangles']-static['modelTriangles']:,}。含人形几何缓冲{scene['geometryBytes']:,}字节，不含物理/WASM内存；这不是单帧提交面数。

**未作真实设备性能验收。** {ds['performance']['environment']['browser']} / SwiftShader软件GPU，1280×840，主门第三人称静止，8帧预热后60帧间隔：中位{perf['medianMs']:.2f}ms、P95 {perf['p95Ms']:.2f}ms。环境极慢，不可称为流畅或手机达标。同期idle控制器CPU中位{statistics.median(perf['physicsCpuMs']):.2f}ms，不可替代总帧耗时；移动/切换碰撞区域和实际硬件仍须另测。原60条数据保留。

{controls}
## 复现

{commands}
独立phase不覆盖归档。导出可重现Viewer字节，manifest的生成时间/HEAD会随导出改变；逐运行源文件哈希用于核对。Linux中文使用系统字体，不分发字体文件。
''')
cards=[]
for s in shots:
 u=Path(s['file']).relative_to('qa/m11c-c1').as_posix()
 cards.append(f'<figure><a href="{u}"><img loading="lazy" src="{u}" alt="{html.escape(s["file"])}"></a><figcaption>{s["group"]} / {Path(s["file"]).name}<small>{s["method"]}<br>{s["sha256"]}</small></figcaption></figure>')
put('qa/m11c-c1/review.html',f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C1 R1实际漫游审阅</title><style>body{{margin:0;background:#eef1e9;color:#29483c;font:16px/1.65 system-ui}}header{{padding:28px}}main{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,510px),1fr));gap:18px;padding:18px}}figure{{margin:0;background:white}}img{{width:100%;height:350px;object-fit:contain}}figcaption{{padding:14px}}small{{display:block;font-size:11px;overflow-wrap:anywhere}}code{{overflow-wrap:anywhere}}a{{color:#315f4c}}</style><header><h1>C1 R1 · 可控校园漫游</h1><p>比例人形 / IMPLEMENTED / REVIEW_PENDING</p><p><a href="../../{V}">打开离线Viewer</a> · <a href="README.md">QA与操作</a></p><p>26张实际浏览器截图；受测SHA256：<code>{H}</code></p><p>软件GPU数据不代表真实硬件达标。C2最终形象及C3全校园走测尚未完成。</p></header><main>{''.join(cards)}</main></html>''')
put('docs/m11c/c1/delivery.md',f'''# C1 R1｜可控校园漫游交付

**IMPLEMENTED / REVIEW_PENDING**。B01—B05已认可，B05为R1.2；不自动登记C1认可或合并main。

[离线Viewer](../../../{V}) · [26张真实截图](../../../qa/m11c-c1/review.html) · [QA及复现](../../../qa/m11c-c1/README.md) · [设计与边界](design.md)

Viewer {m['bytes']:,}字节，SHA256 `{H}`。受测运行源码`{m['gitHead']}`，触摸测试修正`946fd76c27d9157bfa1f6d68fcbdb46bcc0e1017`。最终归档不改变Viewer。

## 实现

Rapier胶囊控制器、重力、墙体阻挡/滑动、坡道/台阶、接地、统一身高/半径/固定步进；第三人称球体扫掠相机与第一人称；键鼠/触屏输入、暂停、失焦清键、安全起点和建筑审阅模式。可见关节比例人形提供尺度与位移驱动的摆臂/迈步，不是C2历史学生形象。真实校园实体三角面经BVH选择，不用隐藏平墙或简化盒子代替开口。

{controls}
## 美术与验证

标准v1.0，共享校园几何、材质、色板、日光、反射/深度不变；人形圆弧48段并复用共享表面。无外部照片贴图、bloom、暗角、景深或额外人物灯光。程序化接地影明确不是动态太阳影。

构建和23项定向测试通过；7组浏览器、69项检查、26图、六条代表路线、390×844及兼容回退通过。旧合成触摸测试失败保留，真实CDP复测同一Viewer通过。软件GPU60帧采样完成但极慢，真实硬件性能尚未认可。

C1审阅后进入C2学生形象/服装/正式动画，再做C3全校园通行。C1比例人形和代表路线不能冒充C2/C3完成。
''')
# Preserve exact previous status text as history, not the current continuation page.
for path,name in [('README.md','readme-before-c1.md'),('docs/development-plan.md','development-plan-before-c1.md')]:
 dst=R/'docs/m11c/c1/history'/name
 if not dst.exists(): cp(R/path,dst)
put('README.md',f'''# 复原雅礼 · Return Old School

长沙雅礼中学东塘校区，主要时代2006—2010年。独立校友非商业复原，不代表学校官方。

## 当前状态

**B01—B05：COMPLETE / ALUMNI_APPROVED。** B03为建筑R2，B05为R1.2。旧Viewer/QA的待审文字是历史状态，认可以各批acceptance为准。**C1 R1：IMPLEMENTED / REVIEW_PENDING**，可见比例人形已能操控漫游，等待审阅；不是C2最终学生形象，也不是C3全校园通行验收。

[C1离线漫游](artifacts/m11c-c1/Yali_C1_R1_Viewer.html) · [交付/操作](docs/m11c/c1/delivery.md) · [真实截图](qa/m11c-c1/review.html) · [QA](qa/m11c-c1/README.md) · [开发计划](docs/development-plan.md)

Viewer SHA256：`{H}`。

## 已认可校园

[B01 R3.1](docs/m11b/batch01/acceptance.md)：主楼/卷帘侧门/厕所连桥；[B02](docs/m11b/batch02/acceptance.md)：体育馆/贴体音乐楼；[B03 R2](docs/m11b/batch03/acceptance.md)：图书馆/后花园双弧梯/圆台/上坡及食堂左打印/中楼梯/右小卖部；[B04 R1](docs/m11b/batch04/acceptance.md)：科学馆/长雅楼及07/16/21；[B05 R1.2](docs/m11b/batch05/acceptance.md)：校门石前置坡台、侧路围墙、运动设施、生活外壳和主要植被。

H/U位置、尺寸、身份、树种和年代未因认可变成测绘事实。C1不重排上述建筑、路网、高差或植物。

{controls}
## 开发与规范

```sh
npm ci --prefix apps/campus
npm run dev --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/controller.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c1/export.mjs
```

[统一标准v1.0](docs/model-rendering-standard.md) · [AGENTS.md](AGENTS.md)。Three.js/TypeScript/Vite及共享色板/材质/天空/日光/反射/BVH继续沿用。Rapier兼容包/WASM嵌入离线文件。无照片贴图、bloom、暗角、景深，不擅自减面。

软件GPU数据不等于真实设备流畅性通过。C2制作学生形象，C3整合全校园通行，M1.1-D复核空间体验，M1.2完善必要室内/生活细部。不制作剧情、怪物或战斗。历史产物和认可记录均保留，不以旧待审页误判当前状态。
''')
put('docs/development-plan.md','''# 开发计划｜C1 R1已实现待审

## 当前接续点

B01—B05均已认可；B03为建筑R2，B05为R1.2。遵循[统一标准v1.0](model-rendering-standard.md)。历史Viewer/QA保留生成时状态，当前认可以各批acceptance为准。

| 阶段 | 状态 | 范围 |
|---|---|---|
| M0 | COMPLETE | 证据体系与H/U边界持续维护 |
| M1.0 R4 | COMPLETE / FROZEN | 原冻结版本保留 |
| M1.1-A P3/P4 | COMPLETE / ALUMNI_APPROVED | 累计布局、道路、高差 |
| M1.1-B B01—B05 | COMPLETE / ALUMNI_APPROVED | 建筑外壳、主要固定设施和植被 |
| M1.1-C / C1 R1 | IMPLEMENTED / REVIEW_PENDING | 可控比例人形、胶囊移动、跟随相机、键鼠/触屏 |
| M1.1-C / C2 | PLANNED / NOT STARTED | 有依据的学生形象、校服、正式动画 |
| M1.1-C / C3 | PLANNED / NOT STARTED | 全校园连续通行与必要接合修正 |
| M1.1-D | PLANNED | 连续视角、比例、遮挡与空间体验复核 |
| M1.2+ | PLANNED | 必要室内、生活物件、灯具和密集小型绿化 |
| M2 | LATER | 不改历史几何的可逆夜间覆盖层 |

## C1：当前交付

[交付/操作](m11c/c1/delivery.md) · [设计](m11c/c1/design.md) · [真实QA](../qa/m11c-c1/README.md)。可见比例人形、统一胶囊、固定60Hz步进、重力/坡道/台阶/阻挡、相机球体扫掠、暂停/失焦清键和五个起点已实施。23项定向测试、7组浏览器、26图和六条代表性路线完成。原合成触摸事件测试失败保留，真实触摸复测绑定同一Viewer。

C1尚未登记用户认可。比例人形不是历史校服；软件GPU采样不等于真实设备流畅。后续补实际GPU/手机帧率及物理区域切换成本测量，不擅自减面制造性能指标。

## C2：学生形象与动画

沿用C1控制器和相机，接入可替换人物模型；核对目标年代照片中的服装，缺失细节H，不虚构校徽。完成站立/步行/跑步、转向和速度匹配，处理比例、脚底、材质与动态阴影，延续共同低饱和美术。不得为人物改动已认可建筑。

## C3：全校园通行

统一人物参数走测主门/坡道、侧门围墙路/家属区三叉路、运动区/围栏缺口、体育馆/音乐楼、主楼卷帘侧门/厕所桥下/连桥、图书馆上坡/后花园双弧梯、食堂、科学馆/长雅楼及生活公共入口。检查接地、门槛、台阶、净空、相机和跌落恢复，必要接合修正单独登记。完整路线矩阵和真实输入记录齐备后才能说M1.1-C全部完成。

## 继承关系

主轴x=73、主楼首层y=3.45、三旗位；侧返墙卷帘开口；体育馆/四层音乐楼贴体；B03双弧梯/开放圆台/中央上行/局部上坡、食堂左打印/中楼梯/右小卖部；长雅楼正门直达、不恢复绿色绕路；B05 R1.2石台/侧路墙和树木修正均保持。07/16/21与其他H/U边界仍保留，22不凭空定位。

[第一批](m11b/batch01/acceptance.md) · [第二批](m11b/batch02/acceptance.md) · [第三批R2](m11b/batch03/acceptance.md) · [第四批](m11b/batch04/acceptance.md) · [第五批R1.2](m11b/batch05/acceptance.md)。只做必要定向验证，不增加无关冻结基线，不提前制作剧情玩法。
''')
put('data/m11c/c1/delivery.json',{'version':'R1','status':'IMPLEMENTED / REVIEW_PENDING','viewer':V,'viewerSHA256':H,'sourceCommit':m['gitHead'],'qa':'qa/m11c-c1/final-summary.json','next':'C2 after explicit C1 review','acceptanceCreated':False})
print(json.dumps({'status':summary['status'],'viewerSHA256':H,'screenshots':len(shots),'checks':checks,'routes':len(routes)}))
