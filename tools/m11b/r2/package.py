"""Same-data section/masterplan, actual screenshot review and complete offline workspace."""
from pathlib import Path
import json,html,base64,zipfile,hashlib,csv
R=Path(__file__).resolve().parents[3];D=R/'data/m11b/batch01-r2';Q=R/'qa/m11b-b01-r2';O=R/'artifacts/m11b-b01-r2';O.mkdir(parents=True,exist_ok=True)
m=json.loads((D/'resolved-buildings.json').read_text());l=json.loads((D/'resolved-layout.json').read_text());p=m['input'];br=json.loads((Q/'browser-report.json').read_text());ok=br['passed']and br['complete']
unit=(Q/'unit-tests.txt').read_text();total=next((v.split()[-1]for v in unit.splitlines()if v.startswith('# tests ')),'unknown');passed=sum(c['passed']for c in br['checks'])
def text(x,y,t,size=17,fill='#304742',anchor='start'):
 return f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-family="Noto Sans CJK SC, Microsoft YaHei, sans-serif">{html.escape(str(t))}</text>'
def rect(x,y,w,h,fill,stroke='#86998f'):
 return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="1"/>'
def base(w,h,title,sub):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="#f5f4ed"/>'+text(54,57,title,29)+text(54,91,sub,15)
s=base(1440,1160,'复原雅礼｜B01 R2 主轴与有效总平面','同源有效布局 · 新A关系覆盖旧工作定位 · 原R4文件及P3/P4地形保留')
sc=2.75;X=lambda x:65+(x+110)*sc;Z=lambda z:170+(z+15)*sc
for a,b in l['navigation']['edges']:
 u,v=l['navigation']['nodes'][a],l['navigation']['nodes'][b]
 s+=f'<line x1="{X(u[0])}" y1="{Z(u[2])}" x2="{X(v[0])}" y2="{Z(v[2])}" stroke="#d6dbd2" stroke-width="7"/>'
for f in l['facilities']:
 if not f.get('position')or not f.get('size')or f['kind']=='route':continue
 x,_,z=f['position'];w,h,d=f['size'];fill='#dce5d4'if f['id']in ['08','06','19'] else '#d0ddd6'if f['id']in ['15','18','25']else '#e8e6dd'
 s+=rect(X(x-w/2),Z(z-d/2),w*sc,d*sc,fill)
 s+=text(X(x),Z(z)+5,f['id'],13,anchor='middle')
mx=73;s+=rect(X(mx-p['main']['centralWidth']/2),Z(217-p['main']['centralProjection']),p['main']['centralWidth']*sc,p['main']['centralProjection']*sc,'#b3c8bc')
fx,fz=p['axis']['flagCenterAfter'];s+=rect(X(fx-5.4),Z(fz-1.6),10.8*sc,3.2*sc,'#b89b7c')
s+=f'<line x1="{X(73)}" y1="{Z(40)}" x2="{X(73)}" y2="{Z(264)}" stroke="#a75c3d" stroke-width="2" stroke-dasharray="8 5"/>'
for a in m['axis']:s+=f'<circle cx="{X(a["x"])}" cy="{Z(a["z"])}" r="5" fill="#a75c3d"/>'
s+=text(1000,203,'四节点 · 同一中线',23)
for i,t in enumerate(['08 田径场／足球场','14 中央国旗／升旗台','15 主教学楼正门／功能区','18 旧图书馆中心／正门']):s+=text(1000,250+i*40,t,16)
s+=text(1000,447,'局部横向调整',23)
for i,t in enumerate(['田径场：不移动','主教学楼：X69 → X73','中央旗杆：X64 → X73','旧图书馆：X75 → X73','厕所：X/Z不移动','桥主楼端：20 → 24']):s+=text(1000,490+i*35,t,16)
s+=text(1000,748,'冻结保护',23)
for i,t in enumerate(['01—28编号保持','道路边集合／宽度保持','仅相关入口节点随楼适配','操场、沙坑、篮球场不移动','五层厕所延伸单独标H','完整改动清单：changes.json']):s+=text(1000,790+i*32,t,15)
s+=text(54,1096,'A：共轴与楼层关系。H：米制坐标、局部进深和第五层厕所延伸。图示为本次工作模型，不是另造一套校园。',15)+'</svg>'
(O/'Yali_M1_1_B_B01_R2_Masterplan.svg').write_text(s)
s=base(1440,1050,'复原雅礼｜B01 R2 侧剖与楼层构成','按校友明确剖面组织 · 中廊不是前侧外廊 · 5层楼板只遮4层走廊，不盖满大坪')
xx=lambda z:120+(z+7)*45;yy=lambda y:710-y*24
for j in range(5):
 floor=j*3.8;lim=1.4 if j==4 else 7
 s+=rect(xx(-7),yy(floor+.04),45*(lim+7),4.32,'#899e94')
 s+=rect(xx(-7),yy(floor+3.55),45*5.6,24*3.51,'#d9e2d5')
 s+=rect(xx(-1.4),yy(floor+3.55),45*2.8,24*3.51,'#f4eedb')
 if j<3:s+=rect(xx(1.4),yy(floor+3.55),45*5.6,24*3.51,'#d9e2d5')
 s+=text(73,yy(floor+1.8),'L'+str(j+1),18,anchor='middle')
 for z,t0 in [(-4.2,'教室'),(0,'走廊')]+([(4.2,'教室')]if j<3 else [(4.2,'露天大坪')]if j==3 else []):s+=text(xx(z),yy(floor+1.5),t0,20,anchor='middle')
s+=rect(xx(-7),yy(19.22),45*8.4,5.28,'#899e94')
s+=rect(xx(6.38),yy(12.49),45*.62,24*.8,'#a8baac')
s+=text(124,788,'朝操场／前侧',18)+text(575,788,'朝图书馆／后侧',18)
s+=text(864,213,'剖面要点',25)
notes=['L1—L3：教室—中走廊—教室','L4：教室—有顶走廊—露天大坪','L5：教室—走廊；后方不再加教室','第四层大坪位于三层后排教室上方','第五层走廊为第四层走廊提供遮蔽','大坪外沿采用花槽式围护','两端楼梯区预留；内部梯段不属本批']
for i,t0 in enumerate(notes):s+=text(864,260+i*42,t0,16)
s+=text(864,629,'中央凸出功能区',25)
for i,t0 in enumerate(['广播站等功能空间，不标作中央楼梯。','实际前凸1.8m工作值，与主门共轴。','各楼层具体用途不作无依据分配。','侧门恢复方柱、门罩和内退门洞；','门前台面沿用已认可的同层衔接。']):s+=text(864,674+i*35,t0,15)
s+=text(70,876,'下三层双排平面示意（空间分区，不表示最终教室间数）',20)
for z0,z1,t0,fill in [(-7,-1.4,'前排教室','#d9e2d5'),(-1.4,1.4,'中走廊','#f4eedb'),(1.4,7,'后排教室','#d9e2d5')]:
 s+=rect(70,903+(z0+7)*6,660,(z1-z0)*6,fill);s+=text(400,903+((z0+z1)/2+7)*6+5,t0,14,anchor='middle')
s+=text(864,964,'工作参数独立保留；图形由同一份R2数据生成。',14)+'</svg>'
(O/'Yali_M1_1_B_B01_R2_Profiles.svg').write_text(s)
with (O/'Yali_M1_1_B_B01_R2_Axis_Changes.csv').open('w',newline='')as f:
 w=csv.writer(f);w.writerow(['object','before_x','after_x','z','relationship_evidence','numeric_evidence']);w.writerows([['08',73,73,114,'A','H'],['14-central-flag',64,73,192.5,'A','H'],['15',69,73,224,'A','H'],['18',75,73,253,'A','H']])
checklist=f'# B01 R2 回归清单\n\n工程：{"PASS"if ok else"INCOMPLETE"}；新画面 REVIEW_PENDING。\n\n单元/回归：{total}；浏览器记录：{passed}/{len(br["checks"])}。\n\n'+''.join(f'- [{"x"if c["passed"]else" "}] {c["name"]}\n'for c in br['checks'])+'\n旧版488项仍保留执行；新增R2模块不重写冻结R4及旧P3/P4输入。\n'
(O/'Yali_M1_1_B_B01_R2_Regression_Checklist.md').write_text(checklist)
captions={'r2-front':'五层主教学楼正面｜中央功能体量前凸、两端楼梯间实墙','r2-overview':'本轮总体｜主楼、连续厕所、后方图书馆','r2-entry':'中央国旗与主教学楼正门｜左右旗帜身份仍未知','r2-rear':'背面｜三层后排教室、四楼大坪与上方第五层','r2-terrace':'四楼后坪｜有顶中廊与露天坪、花槽围护','r2-fifth':'第五层走廊｜后方无第二排教室','r2-section':'实际模型裁切｜下三层双排、四楼坪、五楼廊','r2-floor2':'二层剖看｜教室—中走廊—教室','r2-side':'教学楼侧门｜方柱、门罩、内退门洞；门前台面平接','r2-bridge5':'第五层厕所连接｜按逐层连接原则作H延续','r2-library':'主教学楼后门看图书馆｜同轴入口','r2-axis':'四节点共轴俯视｜调试轴线不是实际地面标线','b01-underpass':'桥下既有道路保留','p04-courts':'已认可篮球场高程保留','p04-shop':'已认可食堂下层小卖部保留','p03-gate-out':'已认可入校坡保留','p03-edge':'已认可下沉运动场边界保留','desktop-ui':'桌面审阅界面','mobile':'390×844手机尺寸界面'}
h='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>复原雅礼 B01 R2 实际截图审阅</title><style>body{margin:0;background:#f4f3eb;color:#2c443f;font:16px/1.75 system-ui,sans-serif}main{max-width:1280px;margin:auto;padding:44px 24px}h1{font-size:36px;margin:.2em 0}h2{font-size:24px;margin:28px 0 12px}p{max-width:1000px}figure{margin:36px 0}img{display:block;width:100%;height:auto;border:1px solid #ced5c9}figcaption{font-weight:600;margin:12px 0}.kicker{font-size:12px;letter-spacing:2px;color:#637c70}.status{padding:20px;background:#e1e9dd;border-left:4px solid #607e6f}code{word-break:break-all;font-size:12px}nav{display:flex;flex-wrap:wrap;gap:14px}a{color:#526f62}.mobile{max-width:390px}</style><main><div class="kicker">RETURN OLD SCHOOL / M1.1-B BATCH01 R2</div><h1>五层旧主楼与校园中轴</h1>'''
h+=f'<p class="status">工程验证：{"通过"if ok else"未通过"} · 校友审阅：待确认。{total}项单元/回归；{passed}/{len(br["checks"])}项浏览器记录；{len(br["screenshots"])}张实际截图。</p><p>五楼：教室—走廊；四楼：教室—走廊—大坪；下三层：教室—走廊—教室。田径场、中央国旗、主教学楼和旧图书馆共轴。主楼中部前凸为广播站等功能区。这里不是完整室内、内部楼梯段或人物控制器。</p><nav><a href="#r2-front">正面</a><a href="#r2-terrace">四楼大坪</a><a href="#r2-section">侧剖</a><a href="#r2-axis">校园主轴</a><a href="#r2-side">侧门</a></nav>'
for name in br['screenshots']:
 f=Q/name
 if not f.exists():raise FileNotFoundError(f)
 k=f.stem;h+=f'<figure id="{k}"><img class="{"mobile"if k=="mobile"else""}" loading="lazy" src="data:image/png;base64,{base64.b64encode(f.read_bytes()).decode()}" alt="{html.escape(captions.get(k,k))}"><figcaption>{html.escape(captions.get(k,k))}</figcaption></figure>'
h+=f'<h2>本轮边界与溯源</h2><p>所有画面来自Playwright Chromium／SwiftShader WebGL2，不是生成式效果图。第五层厕所与连接桥为沿既有逐层连接原则的H延伸。侧门端向、工作尺寸、教室分间、隐藏面保留H；侧门局部外台阶高差没有独立建立，门前台面沿用已认可标高。完整室内楼梯和家具不在本批。</p><p>源码SHA：<code>{br.get("source_sha")}</code><br>Viewer SHA256：<code>{br["viewer_sha256"]}</code></p></main></html>'
(O/'Yali_M1_1_B_B01_R2_Review.html').write_text(h)
delivery=f'''# B01 R2交付\n\n状态：IMPLEMENTED / REVIEW_PENDING；工程结果：{'PASS'if ok else'INCOMPLETE'}。\n\n单元/回归{total}；浏览器{passed}/{len(br['checks'])}；实际截图{len(br['screenshots'])}。\n源码`{br.get('source_sha')}`；Viewer SHA256 `{br['viewer_sha256']}`。\n\n本次从21e907cb继承已验证P3/P4+B01，按#28独立覆盖布局。不更改冻结data/m10、P3/P4输入。\n\n完成：五层前排教室/中廊；三层后排；四楼大坪；第五层仅覆盖四楼教室和廊；中央广播等功能区前凸；两侧楼梯间实墙；侧门方柱与门罩；中央国旗；四节点共轴；五层连续厕所与桥。\n\n范围限制：内部楼梯段、家具、完整教室/厕所内装不在本批；侧门平台平接，照片中的局部外台阶高差尚未展开。第五层厕所为H一致性延伸。\n\n复现：`npm ci --prefix apps/campus`，全套node tests（含tests/m11b/r2），`npm run build --prefix apps/campus`，`node tools/m11b/r2/export.mjs`，`python tools/m11b/r2/capture.py`，`python tools/m11b/r2/package.py`。\n\n输出目录artifacts/m11b-b01-r2：Viewer、实际截图Review、Workspace、Masterplan、Profiles、Axis_Changes.csv、Regression_Checklist。\n'''
(R/'docs/m11b/batch01-r2/delivery.md').write_text(delivery)
manifest={'source_sha':br.get('source_sha'),'viewer_sha256':br['viewer_sha256'],'files':{}}
for base0 in ['apps/campus/src','data/m11b/batch01-r2','tests/m11b/r2','tools/m11b/r2']:
 for f in(R/base0).rglob('*'):
  if f.is_file()and'__pycache__'not in f.parts:manifest['files'][str(f.relative_to(R))]=hashlib.sha256(f.read_bytes()).hexdigest()
(O/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(O/'Yali_M1_1_B_B01_R2_Workspace.zip','w',zipfile.ZIP_DEFLATED)as z:
 for base0 in ['apps','data','docs','tests','tools','qa','.github/workflows']:
  for f in(R/base0).rglob('*'):
   if f.is_file()and not any(a in f.parts for a in ['node_modules','dist','__pycache__','.git'])and f.suffix.lower()not in ['.ttf','.otf','.woff','.woff2','.ttc']:
    z.write(f,str(f.relative_to(R)))
 for name in ['README.md','.gitignore']:
  if(R/name).exists():z.write(R/name,name)
 for f in O.iterdir():
  if f.is_file()and f.suffix!='.zip':z.write(f,'delivery/'+f.name)
print('Packaged real screenshots',len(br['screenshots']),'PASS',ok)
