"""Package ONLY the exact R2 WebGL-tested Viewer. Research photos stay private."""
import base64, hashlib, html, json, os, subprocess, urllib.request, zipfile
from pathlib import Path
from datetime import datetime, timezone
R=Path(__file__).resolve().parents[2];A=R/'artifacts/m11b-b03';Q=R/'qa/m11b-b03';P='Yali_M1_1_B_B03_'
p=json.loads((R/'data/m11b/batch03/input.json').read_text());r=json.loads((Q/'browser-report.json').read_text());g=json.loads((Q/'geometry-report.json').read_text());v=A/(P+'Viewer.html')
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();esc=lambda s:html.escape(str(s),quote=True)
assert r['complete'] and r['passed'] and g['passed'] and r['version']==p['version']==g['version']
assert sha(v)==r['viewer_sha256'], 'Viewer changed after screenshot verification'
shots={x['file']:x for x in r['screenshots']}
e=json.loads((R/'data/m11b/batch03/evidence.json').read_text());ref=Path(os.getenv('REFERENCE_DIR','/tmp/b03-private-photos'));ref.mkdir(parents=True,exist_ok=True);photos={}
for item in e['referencePhotos']:
 if item['id'] not in ['S03-049','S03-050','S03-031','S03-032']:continue
 f=ref/(item['id']+'.jpg')
 if not f.exists():
  request=urllib.request.Request(item['url'],headers={'User-Agent':'Mozilla/5.0','Referer':e['page_url']})
  f.write_bytes(urllib.request.urlopen(request,timeout=60).read())
 assert sha(f)==item['sha256'], 'Reference photo hash mismatch'
 photos[item['id']]=f

def picture(f,label):
 assert f.is_file()
 mime='image/jpeg' if f.suffix=='.jpg' else 'image/png'
 return '<figure><img alt="'+esc(label)+'" src="data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode()+'"><figcaption>'+esc(label)+'</figcaption></figure>'
def shot(name,label):
 assert name in shots, 'Refusing to reuse an older screenshot: '+name
 return picture(Q/name,label)
def pair(ref_id,name,label):
 return '<div class="pair">'+picture(photos[ref_id],ref_id+' · 历史参考原照，拍摄年月未核实')+shot(name,label+' · 同版本实际WebGL截图')+'</div>'

c='<header><small>RETURN OLD SCHOOL / 复原雅礼</small><h1>B03 R2 · 食堂正面与对称双梯</h1><p class="lead">左打印 · 中楼梯 · 右小卖部<br>双侧弧梯 → 中央圆平台（H） → 上层入口</p><p><b>IMPLEMENTED / REVIEW_PENDING</b> · 工程检查通过；等候校友审阅。B01、B02认可保持。</p><nav><a href="'+P+'Viewer.html">打开同版本Viewer</a><a href="#access">入口检查</a><a href="#photos">照片对照</a></nav></header><main>'
c+='<section><h2>本轮改了什么</h2><p>食堂正面按用户明确的顺序重排，入口对应的楼板、柱列、门厅、打印与小卖部门洞一起调整，不能靠标签交换代替。观察者从−X看向+X，左为−Z，右为+Z。</p><p>图书馆两翼采用同源镜像弧形梯段。中央圆台上方留空，护栏只在外围未通行的弧段，两翼抵达口和上梯口开放。<b>圆台及中央回梯仍是按“似乎”的记忆作H补全，不是已经由照片确认的测绘结果。</b></p><p>继承main R1.1的前台阶接缝、后门向内开启、蓝色区域左右与手机相机修复；没有覆盖已认可B01/B02或改动校园道路。</p></section>'
c+='<section id="photos"><h2>01 / 食堂正面：左打印｜中楼梯｜右小卖部</h2>'+pair('S03-031','b03-canteen.png','食堂正面三段关系')+'<p>原照提供宽梯、入口进退和柱列线索；三个区域的顺序以此次用户确认为A。尺寸、整体三层包络与店面细部是H。照片虚焦，不从中虚构打印店招牌、商品或商号。</p><div class="pair">'+shot('b03-print.png','左侧打印：真实开口及最低限度室内落脚')+shot('b03-shop.png','右侧小卖部：保持食堂下层，实际门洞')+'</div><p class="note">打印和小卖部没有可独立核实的店面原照；以上两图是实际模型，不是历史照片。位置关系A，门框、门扇和分间H。</p></section>'
c+='<section><h2>02 / 后花园：对称弧梯、圆平台和中央上行段</h2>'+pair('S03-050','b03-spiral.png','双侧弧梯正面')+'<p>原图是三个局部的拼版，可见弧形混凝土踏步、栏杆和花园曲边，但不能证明完整对称平面。对称关系来自用户确认；圆平台、起步位置、每侧14级和中央12级均为可替换H。</p><div class="pair">'+shot('b03-garden-plan.png','从上方检查两翼镜像、圆平台及接入')+shot('b03-spiral-top.png','中央上梯到二层平台和真门洞')+'</div><p>旧预修版填满圆平台的实心体已移除；新平台下方有支撑。左右路线分别检查，不以右边通过推断左边也通过。</p></section>'
c+='<section><h2>03 / 保留图书馆入口与主楼后方爬升</h2>'+pair('S03-049','b03-photo-library.png','图书馆原位入口')+'<div class="pair">'+shot('b03-uphill.png','主楼后方到图书馆的上坡')+shot('b03-garden.png','完整后花园与图书馆背侧')+'</div><p>图书馆前坪升高1.20m的工作参数及主楼后坪原标高不改。照片不证明整栋楼层数、隐藏立面、圆池用途或花园完整平面。</p></section>'
c+='<section><h2>04 / 餐厅门厅范围</h2><div class="pair">'+picture(photos['S03-032'],'S03-032 · 食堂大厅历史参考，不能冒充小卖部原照')+shot('b03-canteen-lobby.png','模型仅完成最小门厅，未复原完整餐厅内装')+'</div></section>'
c+='<section id="access"><h2>05 / 本轮实际入口与通路检查</h2><p>以下是完整校园场景的三角网格支撑、身体与头部净空检查，不是飞行相机穿墙测试，也不是最终人物控制器或法规认证。</p><div class="table-scroll"><table><thead><tr><th>路径</th><th>结果</th><th>支撑／净空采样</th></tr></thead><tbody>'
for row in r['access']['routes']:
 c+='<tr><td>'+esc(row['label'])+'</td><td>'+('通过' if row['failures']==0 else '未通过')+'</td><td>'+str(row['supports'])+' / '+str(row['clearances'])+'</td></tr>'
c+='</tbody></table></div><p>六处真实门洞：图书馆正门、后门、双梯上层入口、中央食堂入口、左打印、右小卖部。两翼分别走到圆台，再经中央上梯穿过上层门洞。</p>'+(A/(P+'Access.svg')).read_text()+'</section>'
c+='<section><h2>06 / 手机与全校园位置</h2><div class="pair mobile">'+shot('mobile.png','390×844 · 图书馆手机viewport')+shot('mobile-canteen.png','390×844 · 食堂手机viewport')+'</div>'+shot('b03-overview.png','完整校园中的B03；B01/B02及运动区保持')+'<p>不是物理手机实机测试。Viewer默认电脑显示食堂正面；手机保留已修正的图书馆机位，可从按钮切换食堂、双梯和打印入口。</p></section>'
brief={k:r[k] for k in ['version','passed','source_sha','viewer_sha256','generatedAt','environment']};brief['checks']=[{'name':x['name'],'passed':x['passed']} for x in r['checks']]
c+='<section><h2>07 / 版本与证据边界</h2><p>本轮'+str(len(g['checks']))+'组定向几何、'+str(len(r['checks']))+'组真实Chromium检查通过；'+str(len(r['screenshots']))+'张实际模型截图。交付Viewer哈希与受测文件一致，没有将R1.1的成功报告复用于R2。</p><p>未制作完整阅览室、厨房、商品、打印设备或全楼内装。全部场景材料仍为程序化材质，不使用原照片贴图。</p><p>原图来自“100张旧照片”系列。文章来源日期不等于拍摄日期；两个转载版本不算两组独立拍摄证据。仅在这份私下Review内嵌研究参考，不能将此页或原照目录公开提交到仓库。</p><p><a href="'+esc(e['page_url'])+'">新浪来源</a> · <a href="'+esc(e['alternate_page'])+'">较早搜狐版本</a></p><details><summary>受测文件和实际QA摘要</summary><pre>'+esc(json.dumps(brief,ensure_ascii=False,indent=2))+'</pre></details></section></main><footer>B03 R2 · 工程通过 / 校友待审</footer>'
css='''*{box-sizing:border-box}body{margin:0;background:#f3f2ec;color:#243d32;font:16px/1.75 system-ui,-apple-system,"Microsoft YaHei",sans-serif}header,main,footer{max-width:1180px;margin:auto}header{padding:40px 28px}h1{font-size:36px;line-height:1.25}h2{font-size:23px;line-height:1.45}.lead{font-size:21px}small{letter-spacing:.16em;font-size:12px}section{padding:26px;background:#fffdf8;margin-bottom:20px;border:1px solid #dce2d6;border-radius:8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}figure{margin:0;background:#e9eee5;border-radius:6px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{font-size:12px;padding:10px 12px}.note{background:#f2ebdc;padding:15px;border-left:3px solid #9a8049}.mobile figure{max-width:275px;margin:auto}nav{display:flex;gap:10px;flex-wrap:wrap}a{color:#285c4a}nav a{padding:8px 16px;background:#e6eddf;border:1px solid #98a78d;border-radius:5px;text-decoration:none}svg{width:100%;height:auto}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;border-bottom:1px solid #d5dccf;padding:10px}th{background:#e8efdf}pre{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}footer{padding:25px;font-size:13px}summary{cursor:pointer}p{overflow-wrap:anywhere}@media(max-width:700px){header{padding:26px 16px}h1{font-size:27px}.lead{font-size:17px}section{padding:18px 14px;border-radius:0}.pair{grid-template-columns:1fr}h2{font-size:20px}.mobile figure{max-width:245px}table{font-size:12px}}'''
review=A/(P+'Review.html');review.write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B03 R2 审阅</title><style>'+css+'</style></head><body>'+c+'</body></html>')
(A/(P+'QA.json')).write_text(json.dumps(r,ensure_ascii=False,indent=2))
# Real HTML rendering verifies the delivery page, separately from WebGL model tests.
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);page=b.new_page(viewport={'width':1280,'height':900});page.set_content(review.read_text(),wait_until='load');page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)');count=page.locator('img').count();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#photos .pair').first.screenshot(path=str(A/'R2-canteen-compare.png'))
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');b.close()
 manifest={'version':p['version'],'status':p['status'],'source_sha':r['source_sha'],'archive_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'createdAt':datetime.now(timezone.utc).isoformat(),'viewer_matches_actual_capture':True,'review_rendered_images':count,'files':{f.name:sha(f) for f in [v,review,A/(P+'Access.svg'),A/(P+'QA.json')]}}
(A/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=R).decode().split('\0');workspace=A/(P+'Workspace.zip')
with zipfile.ZipFile(workspace,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in tracked:
  f=R/name
  if name and f.is_file() and not name.startswith(('artifacts/','node_modules/')) and f.suffix.lower() not in ('.ttf','.otf','.woff','.woff2'):z.write(f,'return-old-school/'+name)
 for f in [v,review,A/(P+'Access.svg'),A/(P+'QA.json'),A/'delivery-manifest.json',A/'THIRD_PARTY_NOTICES.txt',A/'access-model.json',A/'R2-canteen-compare.png']:z.write(f,'return-old-school/delivery/'+f.name)
 for f in photos.values():z.write(f,'return-old-school/research/b03-references/'+f.name)
 z.writestr('return-old-school/START_HERE.txt','B03 R2 / IMPLEMENTED / REVIEW_PENDING\nOpen delivery/'+P+'Viewer.html and '+P+'Review.html.\nSource '+r['source_sha']+'\nContinue: npm ci --prefix apps/campus; npm run dev --prefix apps/campus\nBuild/export/check: tools/m11b-b03/ and docs/m11b/batch03/delivery.md\nPrivate research images/Review must not be pushed to public GitHub. No font files.\nB01 and B02 remain ALUMNI_APPROVED.\n')
 z.writestr('return-old-school/research/.gitignore','*\n!.gitignore\n')
print(json.dumps({'version':p['version'],'workspace_bytes':workspace.stat().st_size,'viewer_sha256':sha(v),'review_images':count},indent=2))
