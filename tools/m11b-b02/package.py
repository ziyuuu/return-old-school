"""Package only a hash-matched, actually tested Viewer. Research photos never enter git."""
import os,json,hashlib,base64,zipfile,html,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];Q=R/'qa/m11b-b02';A=R/'artifacts/m11b-b02';D=R/'docs/m11b/batch02'
br=json.loads((Q/'browser-report.json').read_text());V=A/'Yali_M1_1_B_B02_Viewer.html'
assert br['passed'] and br['complete'],'Never package an unverified model as passed'
assert hashlib.sha256(V.read_bytes()).hexdigest()==br['viewer_sha256'],'Export differs from the browser-tested bytes'
e=json.loads((R/'data/m11b/batch02/evidence.json').read_text());references={r['id']:r for r in e['referencePhotos']}
refdir=Path(os.environ.get('B02_REFERENCE_DIR','/not-mounted'))
esc=html.escape
image=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
def screenshot(name,caption):
 return '<figure><img loading="lazy" src="'+image(Q/name)+'" alt="'+esc(caption)+'"><figcaption>'+esc(caption)+'</figcaption></figure>'
def ref_photo(id):
 r=references[id];f=refdir/r['local_file']
 src='data:image/jpeg;base64,'+base64.b64encode(f.read_bytes()).decode() if f.exists() else r['image_url'].replace('http://','https://')
 return '<figure class="ref"><img loading="lazy" src="'+src+'" alt="参考照片 '+id+'"><figcaption>'+id+' · 公开原照研究参考，非生成图。<a href="'+r['page_url']+'">来源文章</a> / <a href="'+r['image_url'].replace('http://','https://')+'">原图</a><br>2018-03-13发布；拍摄时间未核实。版权归原摄影者/来源方，未取得再发行授权。</figcaption></figure>'
labels={'gym-main':'体育馆：主路—前坪—低台阶—门洞—门厅','spectator':'观赛层：左外梯—顶平台—上层侧门—短廊','front-platform':'观赛短廊—内凹前窗带门洞—前平台','music':'音乐楼：绕馆路—原门前台阶—门洞—门厅','loop':'绕馆：外缘转角连续，共享墙不穿通'}
rows=''.join('<tr><td>'+labels[r['id']]+'</td><td>'+('通过' if not r['failures'] else '未通过')+'</td><td>实体支撑 / 人体净空 / 顶部净空</td></tr>' for r in br['access']['routes'])
source=br.get('source_sha') or 'working-tree';delivery=os.getenv('DELIVERY_SHA','见随包delivery-receipt.json')
style='''*{box-sizing:border-box}body{margin:0;background:#eff1e9;color:#273e36;font:16px/1.75 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1240px;margin:auto;padding:46px 28px 80px}header{border-bottom:2px solid #365b4d;padding-bottom:25px;margin-bottom:32px}.kicker{font-size:12px;letter-spacing:2px;color:#6a7769}h1{font-size:36px;line-height:1.35;margin:12px 0}h2{font-size:24px;line-height:1.5;margin:42px 0 18px}h3{font-size:17px;margin:0 0 8px}p{margin:10px 0 18px}.status{display:inline-block;padding:4px 12px;background:#e5d9ba;color:#665124;font-size:12px;border-radius:20px}figure{margin:0;background:#fff;border:1px solid #cfd7cc;border-radius:9px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{font-size:13px;line-height:1.7;padding:13px 18px}.pair,.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;margin:15px 0}.note{padding:20px;background:#f8f8f0;border-left:3px solid #9b8554;font-size:14px}.small{font-size:13px;color:#647167}a{color:#2d6b64}code{font-size:12px;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:11px 15px;border-bottom:1px solid #d0d8cd;text-align:left}th{background:#e0e7dc}details{border-top:1px solid #bccbbb;padding:14px 0;margin-top:22px}summary{cursor:pointer;font-weight:650}.missing{min-height:280px;padding:30px;background:#e5e9df;border:1px dashed #99a694;border-radius:9px}svg{max-width:100%;height:auto}.mobile{max-width:390px;margin:20px auto}.meta{padding:16px;background:#e4eade;font-size:13px}@media(max-width:760px){main{padding:25px 15px 50px}h1{font-size:27px}.pair,.grid{grid-template-columns:1fr}td,th{padding:8px;font-size:12px}}'''
body=f'''<header><div class="kicker">RETURN OLD SCHOOL / M1.1-B B02</div><h1>体育馆与音乐楼<br>照片、入口和实际模型</h1><span class="status">IMPLEMENTED / REVIEW_PENDING · 待校友审阅</span><p>在已认可校园基底上替换03/24建筑，未重排校园。B01 R3.1、入口长坡、下沉运动面、抬高篮球场与三旗主轴继续继承。</p><div class="meta">受测源码 <code>{source}</code><br>Viewer SHA256 <code>{br['viewer_sha256']}</code><br>真实 Chromium / SwiftShader WebGL2；桌面及390×844手机viewport。不是物理手机实机测试。</div></header>'''
body+=screenshot('b02-overview.png','B02实际Viewer：体育馆、贴体四层音乐楼与既有运动区。全部图片中的模型均为本轮真实浏览器截图。')
body+='<h2>01 / 主路侧立面 · 先看照片再改模型</h2><div class="pair">'+ref_photo('S03-020')+screenshot('b02-photo-front.png','实际模型 / S03-020近似视角；使用低机位向上看，不是生成式效果图。')+'</div>'
body+='<div class="note"><b>已对应：</b>低层门厅、内退正墙真门洞、左侧外梯、双带前平台、窗带后退、五环面板及高折尖。<br><b>仍有差异 / H：</b>42m包络内的具体比例、面板/侧板在平面中的展开、门窗细分、阴影和表面老化。照片拍摄年未知，不把较晚的金属门、翻新标牌或植物当成2006—2010年定论。模型颜色保持项目LUT，未贴原照片。</div>'
body+='<h2>02 / 右前侧 · 折面与窗带</h2><div class="pair">'+ref_photo('S03-017')+screenshot('b02-photo-side.png','实际模型 / S03-017近似右前斜看；与参考图相近的竖幅比例。')+'</div>'
body+='<div class="note"><b>已对应：</b>长侧折板、前窗带和侧窗退进、平台侧返、柱—窗—墙分段。<br><b>仍有差异 / H：</b>相机尚非摄影测量解算，屋面背部和折板精确倾斜量缺图，后侧无完整原立面；不复制照片的现代环境遮挡来掩盖几何。</div>'
body+='<h2>03 / 门不是图案 · 三条进入路径</h2><table><tr><th>实际路线</th><th>结果</th><th>检查对象</th></tr>'+rows+'</table>'
body+='<p class="small">净空检查针对整幅可见模型中的真实网格，包括柱、栏杆、玻璃、楼板及原场地；不是飞行相机穿墙检查。检查用0.76m宽、1.90m高的采样通道；非最终人物碰撞控制器或法规认证。</p>'
body+='<div class="grid">'+screenshot('b02-entry.png','体育馆正门：主路→前坪→原4级低台阶→内退正墙上的开口。')+screenshot('b02-lobby.png','站在体育馆最小门厅内回望：门后有实体落脚空间，双门叶默认敞开不挡路。')+screenshot('b02-stair.png','面对正门左侧的实体外梯；28级、每级0.15m、踏面0.33m属于H工作值。')+screenshot('b02-stair-top.png','梯顶落脚平台与左侧斜返墙真入口。此近景无对应原照，门位和构造保留H。')+'</div>'
body+=screenshot('b02-gallery.png','观赛层内部短廊回望前平台真开口；必要交通空间已做，不铺开完整看台和场馆内装。')
body+='<h2>04 / 四层音乐楼 · 明确缺图，不伪造照片</h2><div class="pair"><div class="missing"><h3>没有独立核实的对应原图</h3><p>已查看登记系列及针对性公开检索，仍未得到可以单独确认的旧音乐楼入口/完整立面照片。</p><p><b>A：</b>四层、独立楼体特征、直接贴馆。<br><b>H：</b>窗距、门扇、饰面、雨棚、最小门厅及贴馆屋面收口；入口沿用原登记的球场侧偏西位置。</p><p>不拿生成图、2014年后艺术楼或新建方案充当旧楼参考。</p></div>'+screenshot('b02-music.png','实际模型：音乐楼四层墙体、窗洞与平屋顶，直接贴在体育馆后侧组团边界，无连桥或新增连接体。')+'</div>'
body+='<div class="grid">'+screenshot('b02-music-entry.png','原绕馆道路/运动区通路→音乐楼4级台阶→球场侧偏西真门洞。')+screenshot('b02-music-lobby.png','音乐楼最小门厅内回望：后方落脚深度约4m，未用实心上层封死入口。')+'</div>'
body+='<h2>05 / 通路与标高 · 同源导出</h2>'+(A/'Yali_M1_1_B_B02_Access.svg').read_text()+'<p class="small">+3.00m为馆前场景地坪；门厅实际面+3.64m，观赛层+7.84m，馆顶+22.80m。相对首层观赛层约4.20m、馆顶约19.20m；不能把两种基准混算。所有数值为H，不是测绘海拔。</p>'
body+='<div class="grid">'+screenshot('b02-loop.png','绕馆道路关键外角：绕体育馆—音乐楼整体，不穿共享墙。旧H首层内部通门已关闭。')+screenshot('b02-field.png','从下沉运动区看馆：前坪继续位于既有高程，没有随运动面降低。')+'</div>'
body+='<details><summary>第一批保留成果与手机viewport</summary>'+screenshot('r3-overview.png','B01 R3.1仍为COMPLETE / ALUMNI_APPROVED；本次未改五层主楼、侧返墙开启卷帘门、后坪与厕所逐层连接。')+'<div class="mobile">'+screenshot('mobile.png','390×844手机viewport基本显示；预设按钮保留；非物理手机性能或触控全流程认证。')+'</div></details>'
body+='<h2>交付与继续制作</h2><p>打开同包 <b>Yali_M1_1_B_B02_Viewer.html</b> 即为接受上述截图验证的同一单文件，不需要服务器、CDN、外部建筑贴图或旧对话目录。默认校园完整保留；上方“入口与建筑视角”及设施面板可进入细部机位。</p><p>本批未制作完整场馆内装、全部看台座椅、音乐教室家具和最终人物控制器。照片不明处已列H；校友审阅后才改认可状态。</p><p class="small">源码提交 '+esc(source)+'；交付归档 '+esc(delivery)+'。Workspace含完整可继续制作的源码、包锁、原证据登记、认可记录与本次QA。研究照片仅供本次对照，版权不因随私下Review显示而转移；公开源码不包含参考照片二进制。</p>'
review='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>复原雅礼 B02 · 照片与实际模型审阅</title><style>'+style+'</style></head><body><main>'+body+'</main></body></html>'
(A/'Yali_M1_1_B_B02_Review.html').write_text(review)
for n in ['browser-report.json','geometry-report.json','build.txt']:
 if (Q/n).exists():(A/n).write_bytes((Q/n).read_bytes())
p=D/'delivery.md';text=p.read_text().split('\n## 实际工程记录')[0]
text+='\n## 实际工程记录\n\n8组定向几何检查通过；'+str(len(br['checks']))+'组真实Chromium检查通过。5条路线检查真实网格支撑及身体/头部净空，4个完整门洞抽查；共享墙阻断、旧馆体移除，B01入口/主轴/三旗及手机viewport抽查通过。\n\n实际截图'+str(len(br['screenshots']))+'张（含两幅原照片近似对照机位、门厅内回望及手机viewport）。file://单文件加载未请求外部网络资源，无JavaScript/WebGL错误。\n\n受测源码 `'+source+'`；Viewer SHA256 `'+br['viewer_sha256']+'`。工程PASS不等于校友认可，本批继续REVIEW_PENDING。\n'
p.write_text(text)
if '--prepare' not in sys.argv:
 with zipfile.ZipFile(A/'Yali_M1_1_B_B02_Workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
  for top in ['apps','data','tests','tools','docs','.github','qa']:
   for p in sorted((R/top).rglob('*')):
    if not p.is_file() or any(v in p.parts for v in ['node_modules','dist','__pycache__']):continue
    if p.suffix.lower() in ['.ttf','.otf','.woff','.woff2']:continue
    if p.name in ['change-set.patch.gz.b64','integrate.py'] and p.parent.name=='m11b-b02':continue
    z.write(p,p.relative_to(R))
  for name in ['README.md','.gitignore','LICENSE']:
   if (R/name).exists():z.write(R/name,name)
  for p in A.iterdir():
   if p.is_file() and p.suffix not in ['.zip','.gz']:z.write(p,'delivery/'+p.name)
 print('Packaged matched Viewer, photo comparison Review and full continuation workspace',flush=True)
