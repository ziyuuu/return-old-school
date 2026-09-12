"""Package the exact verified Viewer and privately attributed research Review."""
import base64, hashlib, html, json, os, subprocess, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path
R=Path(__file__).resolve().parents[2];Q=R/'qa/m11b-b03';A=R/'artifacts/m11b-b03';P='Yali_M1_1_B_B03_';V=A/(P+'Viewer.html')
r=json.loads((Q/'browser-report.json').read_text());digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if not r.get('complete') or not r.get('passed'):raise RuntimeError('Actual browser verification has not passed.')
if r['viewer_sha256']!=digest(V):raise RuntimeError('Viewer changed after actual screenshot verification.')
p=json.loads((R/'data/m11b/batch03/input.json').read_text());e=json.loads((R/'data/m11b/batch03/evidence.json').read_text())
refs=Path(os.environ.get('REFERENCE_DIR','/tmp/yali-b03-reference-only'));refs.mkdir(parents=True,exist_ok=True);photos={}
for item in e['referencePhotos']:
 if item['id'] not in ['S03-049','S03-050','S03-031','S03-032']:continue
 f=refs/(item['id']+'.jpg')
 if not f.exists():
  req=urllib.request.Request(item['url'],headers={'User-Agent':'Mozilla/5.0','Referer':e['page_url']});f.write_bytes(urllib.request.urlopen(req,timeout=60).read())
 if digest(f)!=item['sha256']:raise RuntimeError('Reference hash mismatch: '+item['id'])
 photos[item['id']]=f
esc=lambda s:html.escape(str(s),quote=True)
def image(f,caption,cls=''):
 mime='image/jpeg' if f.suffix=='.jpg' else 'image/png';data=base64.b64encode(f.read_bytes()).decode()
 return f'<figure class="{cls}"><img src="data:{mime};base64,{data}" alt="{esc(caption)}"><figcaption>{esc(caption)}</figcaption></figure>'
def pair(title,ref,shot,matched,pending):
 return '<section><h2>'+title+'</h2><div class="pair">'+image(photos[ref],ref+' · 原照片（拍摄日期未核实）')+image(Q/shot,shot+' · 实际 Chromium/WebGL 截图')+'</div><p><b>已对应：</b>'+matched+'</p><p class="note"><b>仍为H／差异：</b>'+pending+'</p></section>'
source=r.get('source_sha') or 'see repository HEAD'
c=f'''<header><div class="eyebrow">RETURN OLD SCHOOL / 复原雅礼 · M1.1-B</div><h1>B03｜图书馆与后花园<br>食堂与下层小卖部</h1><p class="lead">R1.1 可审阅版 · <strong>IMPLEMENTED / REVIEW_PENDING</strong></p><p>在原校园中完成本批外壳与必要交通空间。B01、B02保持校友已认可状态。工程检查通过，不代表历史比例或本批已获校友认可。</p><nav><a href="{P}Viewer.html">打开同版本 Viewer</a><a href="{P}Access.svg">入口与标高校核图</a></nav><p class="meta">受测源码 <code>{esc(source)}</code><br>Viewer SHA256 <code>{r['viewer_sha256']}</code></p></header><main><section><h2>先看这四处</h2><p>主楼后方上坡与图书馆门口；图书馆内退入口与大窗；后花园宽弧梯的起步、平台和上层开口；食堂上层餐厅与下层小卖部的关系。</p><p>单文件Viewer的“B03 · 入口与建筑视角”可切换上述机位。飞行相机允许穿模；通行结论来自真实场景网格的支撑、身体与头部净空检查，不是最终人物控制器。</p></section>'''
c+=pair('01 / 图书馆入口','S03-049','b03-photo-library.png','入口内退、深红门框、上部玻璃气窗／百叶、面对正门左侧蓝色区域、外墙攀藤。左右以原照片观察方向核对。','原照只覆盖入口近景，不证明整栋三层或55×15m包络。当前门窗细分、立面比例与简化攀藤密度并非完全吻合；公告内容不编造。')
c+=pair('02 / 后花园与宽弧形旋梯','S03-050','b03-spiral.png','宽弧梯、开敞内井、实体内侧栏板、金属扶手和落脚空间。原图为三幅局部拼版，不是连贯全景。','半圈、26级、确切位置与二层落点均为H；不可从拼版推出完整花园平面。没有用细杆中心柱式螺旋梯代替。')
c+='<section><h2>03 / 后花园整体与梯顶入口</h2><div class="pair">'+image(Q/'b03-garden.png','后花园实际画面 · 铺地、曲线低边缘与植物')+image(Q/'b03-spiral-top.png','梯顶实际画面 · 平台后真实开口')+'</div><p>花园与旋梯的存在是A；可见曲线边缘、石铺地和局部结构是P。曲池尺寸、水面解释、树种与分布、上层门位仍为H。当前花园比照片更稀疏，植被精化尚未完成。</p></section>'
c+=pair('04 / 食堂入口与上下层','S03-031','b03-photo-canteen.png','宽楼梯、较高入口平台、柱列及内退门口的层次。小卖部保留在同一食堂下层。','原图虚焦且局部遮挡，不支持精确整体立面、楼层数或旧牌匾内容。上层数、窗距、20级宽梯和标高继续H。')
c+='<section><h2>05 / 食堂室内参考不等于完成内装</h2><div class="pair">'+image(photos['S03-032'],'S03-032 原照片 · 食堂大厅内部')+image(Q/'b03-canteen-lobby.png','实际模型 · 仅食堂入口门厅，不是完整餐厅复刻')+'</div><p>此照片只辅助柱网／窗带与空间理解。本批未制作完整餐厅、厨房、成套餐桌椅；这张照片也不是小卖部证据。</p></section>'
c+='<section><h2>06 / 下层小卖部：没有独立原图</h2><div class="pair">'+image(Q/'b03-shop.png','实际小卖部入口 · 位于食堂下层')+image(Q/'b03-shop-inside.png','实际店内回望 · 真实开口与最小进深')+'</div><p>依据既有下层关系和位置登记进行H级补全。没有独立历史原图与之配对；门扇、开口细部及内部分间不冒称照片复原。没有虚构商品、商号或卷帘门。</p></section>'
c+='<section><h2>07 / 八条实体路线与五处门洞</h2><div class="table-scroll"><table><thead><tr><th>路线</th><th>实际检查</th><th>支撑采样 / 净空检查</th></tr></thead><tbody>'
for route in r['access']['routes']:c+=f'<tr><td>{esc(route["label"])}</td><td class="ok">{"通过" if route["failures"]==0 else "未通过"}</td><td>{route["supports"]} / {route["clearances"]}</td></tr>'
c+='</tbody></table></div><p>五处门洞：图书馆正门、图书馆后门、旋梯上层门、食堂餐厅门、小卖部门。门洞后存在落脚空间。全场景三条横向身体采样与垂直支撑／头部净空检查，不是无障碍或建筑规范认证。</p>'
s=json.loads((A/'access-model.json').read_text())['summary']
c+=f'<p class="note">H工作标高：主楼后方地面 +{s["mainRearGround"]:.2f}m → 图书馆前场 +{s["gardenGround"]:.2f}m → 门厅 +{s["libraryFloor"]:.2f}m；旋梯上层 +{s["libraryUpper"]:.2f}m。食堂下层 +{s["canteenLower"]:.2f}m，上层入口 +{s["canteenDining"]:.2f}m。非测绘海拔；未抬高主楼后坪。</p>'
c+=(A/(P+'Access.svg')).read_text()+'</section><section><h2>08 / 真实场景补充视角</h2><div class="gallery">'
for name,caption in [('b03-uphill.png','主楼后门出发 · 爬升通路'),('b03-gap.png','15/25桥下方向 · 图书馆通路'),('b03-library.png','图书馆外壳 · 全层数仍H'),('b03-library-lobby.png','图书馆前后最小交通空间'),('b03-garden-plan.png','后花园俯看 · 平面仅为H补全'),('b03-canteen.png','食堂整体 · 上下层关系'),('b03-perimeter.png','食堂外围与家属区间隙'),('b03-overview.png','完整校园中的B03'),('mobile.png','390×844手机viewport · 非物理手机实测')]:c+=image(Q/name,caption,'mobile' if name=='mobile.png' else '')
c+='</div></section>'
brief={'version':r['version'],'source_sha':source,'viewer_sha256':r['viewer_sha256'],'passed':r['passed'],'checks':[{'name':q['name'],'passed':q['passed']} for q in r['checks']]}
c+=f'''<section><h2>09 / 检查依据与边界</h2><p>正常TypeScript/Vite构建、8组定向几何检查、{len(r['checks'])}组真实Chromium检查。截图共{len(r['screenshots'])}张。单HTML离线打开检查无外部场景资源请求，未发现JavaScript/WebGL错误。B01侧返墙卷帘门、B02五条路线／共享墙与三旗主轴做了关联抽查。桌面与390×844 viewport，不是物理手机实测。</p><p>首轮真实报告曾有台阶接缝、后门扇挡旋梯路线的问题，R1.1作局部修订后重新检查；没有修改净空阈值。手机拉远机位落入主楼的问题也已单独修正。</p><p>本批仍待校友审阅。没有完整阅览室、全楼内部交通、餐厅厨房、商品货架或最终人物控制器。三层包络、隐藏立面、精确坡度、后花园格局和小卖部细部保留H。</p><details><summary>原图来源与权利说明</summary><p>“100张旧照片”系列：<a href="{esc(e['page_url'])}">新浪版本</a>；<a href="{esc(e['alternate_page'])}">搜狐较早版本</a>。2018-03-13／2017-08-06为文章发表日期，不等于照片拍摄日期。</p><p>本私下审阅页内嵌已登记SHA256的研究参考副本。照片权利归原作者，未获公共仓库再发布授权；不提交这些照片或内嵌照片的Review到公开仓库，不用作场景贴图。不能从模型反推历史事实。</p></details><details><summary>实际检查摘要</summary><pre>{esc(json.dumps(brief,ensure_ascii=False,indent=2))}</pre></details></section></main><footer>复原雅礼 · B03 R1.1 · 工程PASS / 校友REVIEW_PENDING</footer>'''
css='''*{box-sizing:border-box}body{margin:0;background:#f3f2ec;color:#21392f;font:16px/1.75 system-ui,-apple-system,"Microsoft YaHei",sans-serif}header,main,footer{max-width:1200px;margin:auto}header{padding:48px 28px 28px}h1{font-size:38px;line-height:1.28;letter-spacing:-.02em}h2{font-size:23px;line-height:1.45;margin:0 0 20px}.eyebrow{font-size:12px;letter-spacing:.16em;color:#63766b}.lead{font-size:19px}section{padding:28px;background:#fffdf8;border-top:1px solid #d4dbcf;margin:0 0 18px;border-radius:10px}nav{display:flex;gap:12px;flex-wrap:wrap}nav a{padding:10px 16px;border:1px solid #728c7a;border-radius:5px;background:#e4ebe1}a{color:#205745;text-decoration:none}code,.meta{font-size:12px;overflow-wrap:anywhere}.meta{margin-top:22px;color:#5d6f62}.pair,.gallery{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;background:#edf0e9;border-radius:5px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:10px 12px;font-size:12px;line-height:1.55;color:#4f6357}.note{background:#f0eadc;padding:13px 16px;border-left:3px solid #a18745}svg{max-width:100%;height:auto}.gallery{row-gap:24px}.mobile img{max-width:260px;margin:auto}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid #d9dfd6}th{background:#eaf0e7}.ok{font-weight:700;color:#276247}pre{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}details{margin-top:20px}summary{cursor:pointer;font-weight:650}footer{padding:24px 28px 50px;font-size:12px;color:#6a796e}@media(max-width:700px){header{padding:28px 16px 20px}h1{font-size:29px}h2{font-size:20px}section{padding:18px 16px;margin-bottom:12px;border-radius:0}.pair,.gallery{grid-template-columns:1fr}table{font-size:12px}th,td{padding:8px}.meta{font-size:11px}nav a{font-size:14px}}'''
review=A/(P+'Review.html');review.write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B03 R1.1｜复原雅礼审阅</title><style>'+css+'</style>'+c+'</html>',encoding='utf8')
(A/(P+'QA.json')).write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8')
manifest={'version':p['version'],'status':p['status'],'source_sha':source,'archive_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'createdAt':datetime.now(timezone.utc).isoformat(),'files':{f.name:digest(f) for f in [V,review,A/(P+'Access.svg'),A/(P+'QA.json')]},'reference_photo_policy':'Private review research only; not public source or scene textures.'}
(A/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=R).decode().split('\0');workspace=A/(P+'Workspace.zip')
with zipfile.ZipFile(workspace,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in tracked:
  f=R/name
  if name and f.is_file() and not name.startswith(('artifacts/','node_modules/')) and f.suffix.lower() not in ('.ttf','.otf','.woff','.woff2'):z.write(f,'return-old-school/'+name)
 for f in [V,review,A/(P+'Access.svg'),A/(P+'QA.json'),A/'delivery-manifest.json',A/'THIRD_PARTY_NOTICES.txt',A/'access-model.json']:z.write(f,'return-old-school/delivery/'+f.name)
 z.writestr('return-old-school/START_HERE.txt','B03 R1.1 review delivery\nOpen delivery/'+P+'Viewer.html in a WebGL2 browser.\nReview includes privately attributed research photographs; do not republish as public source.\nContinue: npm ci --prefix apps/campus; npm run dev --prefix apps/campus.\nBuild: npm run build --prefix apps/campus.\nExport: node tools/m11b-b03/export.mjs\nQA: python tools/m11b-b03/capture.py (Playwright + Chromium).\nPackage: python tools/m11b-b03/package.py (network to registered photo URLs, or REFERENCE_DIR).\nB01/B02 COMPLETE / ALUMNI_APPROVED; B03 IMPLEMENTED / REVIEW_PENDING.\nSource: '+source+'\n')
print(json.dumps({'viewer':str(V),'review':str(review),'workspace':str(workspace),'workspace_bytes':workspace.stat().st_size,'viewer_sha256':digest(V)},indent=2))
