"""Package real browser captures and same-data construction diagrams; never generate review images."""
from pathlib import Path
import json,base64,html,zipfile,hashlib,re
R=Path(__file__).resolve().parents[3];O=R/'artifacts/m11b-b01-r3';Q=R/'qa/m11b-b01-r3';O.mkdir(parents=True,exist_ok=True)
m=json.loads((R/'data/m11b/batch01-r3/resolved-buildings.json').read_text());p=m['input'];e=p['entrances'];report=json.loads((Q/'browser-report.json').read_text());ok=report['passed']and report['complete'];unit=(Q/'unit-tests.txt').read_text();count=re.search(r'# tests (\d+)',unit).group(1);n=sum(c['passed']for c in report['checks']);total=len(report['checks'])
def start(title,sub):return f'<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960"><rect width="1440" height="960" fill="#f4f4ee"/><style>text{{font-family:Arial,"Noto Sans CJK SC",sans-serif;fill:#203e38}}.line{{fill:none;stroke:#38594d;stroke-width:2}}</style><text x="50" y="56" font-size="30">{title}</text><text x="50" y="91" font-size="17">{sub}</text>'
def text(x,y,s,size=18):return f'<text x="{x}" y="{y}" font-size="{size}">{html.escape(s)}</text>'
def rect(x,y,w,h,fill='#d7dfd4'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="#61786c" stroke-width="1"/>'
def line(points,stroke='#b36c43',width=3):return '<polyline points="'+' '.join(f'{x:.2f},{y:.2f}'for x,y in points)+f'" fill="none" stroke="{stroke}" stroke-width="{width}"/>'
# Use the rendered level-1 wall and canopy projections, not an unrelated illustrative facade.
s=start('复原雅礼｜B01 R3 正面入口与浅弧平面','同源构件投影 · 上方为楼内／下方为操场 · 主轴位置不变 · 局部工作尺寸 H')
X=lambda x:720+x*12;Z=lambda z:250+(z+9)*16
s+=text(50,140,'A｜整栋首层平面：两端退让入口、前伸主体墙、中部轻弧')
for q in m['parts']:
 if q['owner']!='15'or q['level']!=1:continue
 if q['role']not in ['slab','continuing-body-wall','stair-front-blank','recess-front','central-curved-wall','central-return','body-return-inner','porch-post']:continue
 x,y,z=q['center'];w,h,d=q['size'];fill='#e2e6dd'if q['role']=='slab'else'#61796c'
 if q['shape']=='prism':
  pts=[(X(x+u),Z(z+v))for u,v in q['polygon']];s+='<polygon points="'+' '.join(f'{u:.2f},{v:.2f}'for u,v in pts)+f'" fill="{fill}" stroke="#61786c" stroke-width=".5"/>'
 else:s+=rect(X(x-w/2),Z(z-d/2),w*12,d*16,fill)
s+=line([(720,165),(720,500)])+text(735,195,'主轴 X=73（继承R2）',15)
s+=text(65,475,'左端正面入口',16)+text(1130,475,'右端正面入口',16)
s+=text(50,535,'B｜左端放大：局部不是对称U形短墙门斗')
X=lambda x:110+(x+49)*42;Z=lambda z:620+(-z-5)*38
for q in m['parts']:
 if q['owner']!='15'or q['level']!=1 or q['shape']!='box' or not -49.2<q['center'][0]<-42.8:continue
 if q['role']not in ['continuing-body-wall','stair-front-blank','recess-front','body-return-inner','porch-post','entrance-step','porch-landing']:continue
 x,y,z=q['center'];w,h,d=q['size'];s+=rect(X(x-w/2),Z(z+d/2),w*42,d*38,'#ccd7c7'if q['role']in['entrance-step','porch-landing']else'#627e71')
s+=line([(X(-46.4),Z(-10)),(X(-46.4),Z(-5))])+text(465,635,'门在退入的正面墙上，朝操场',18)+text(465,680,'门罩为一层；相邻主体墙连续五层',18)+text(465,725,'主体墙向前超过门罩 1.70m（H）',18)+text(465,770,'三级台阶总升高0.45m；局部前坪顺接',18)+text(465,815,'中央浅弧矢高0.35m（H），不是半圆塔',18)
s+=text(50,930,'图为工程校核，不把生成式解读图当作照片。完整五层、四楼后坪与校园共轴关系继续保留。',16)+'</svg>'
(O/'Yali_M1_1_B_B01_R3_Plan.svg').write_text(s)
s=start('复原雅礼｜B01 R3 入口与楼层剖面','侧门局部修复 · 五层主体保留 · 所有示意尺寸为H工作参数')
s+=text(50,150,'A｜门罩与前伸高墙：墙不是只有一层高的短侧板')
X=lambda z:100+(z+14)*26;Y=lambda y:735-y*25
for q in m['parts']:
 if q['owner']!='15'or q['shape']!='box' or not -49<=q['center'][0]<-43:continue
 if q['role']not in ['continuing-body-wall','porch-roof','porch-post','porch-trim','entrance-step','porch-landing','recess-front']:continue
 x,y,z=q['center'];w,h,d=q['size'];s+=rect(X(z-d/2),Y(y+h/2),d*26,h*25,'#cad7c8'if q['role']=='continuing-body-wall'else'#94a899')
s+=text(100,790,'操场方向 ←    门廊退后／主体墙前伸',17)
s+=text(680,150,'B｜保留已确认的教学楼剖面')
for l in range(1,6):
 y=220+(5-l)*94
 s+=rect(770,y,205,68)+text(810,y+42,f'{l}F 教室',20)+rect(975,y,108,68,'#e1dccb')+text(992,y+42,'走廊',20)
 if l<=3:s+=rect(1083,y,205,68)+text(1130,y+42,'教室',20)
 elif l==4:s+=rect(1083,y+59,205,9,'#abb9a1')+text(1110,y+42,'露天大坪',20)
 s+=text(705,y+44,f'{l}层',17)
s+=text(685,760,'第五层只遮第四层教室和走廊；大坪上方敞开。',17)
s+=text(685,800,'图书馆、三旗和田径场仍与主楼居中共轴。',17)
s+=text(50,910,'侧门前坪只在两处有限范围内衔接三级台阶；未改变运动区、主路、旗台整体标高。',17)+'</svg>'
(O/'Yali_M1_1_B_B01_R3_Profiles.svg').write_text(s)
captions={'r3-front.png':'整栋正面｜两端退入入口与中央轻弧','r3-overview.png':'整体斜前｜五层主体和一层门廊','r3-west.png':'左端入口｜门在正面，右侧高墙继续前伸','r3-east.png':'右端入口｜对应的内退门廊','r3-wall.png':'五层前伸墙｜不是门罩旁的一段短墙','r3-porch-plan.png':'首层剖看｜两端轮廓的凹凸关系','r3-arc.png':'中央功能区｜浅弧墙面与连续檐口','r3-arc-plan.png':'曲线俯看｜最前点与轴线保持','r3-axis.png':'校园四节点共轴','r3-section.png':'五层剖面回归','r2-terrace.png':'四楼大坪｜走廊有顶，大坪露天','r2-fifth.png':'五楼走廊','r2-bridge5.png':'第五层厕所连接','p04-courts.png':'P4篮球场抬高保留','p03-gate-out.png':'P3入口长坡保留','desktop-ui.png':'桌面操作界面','mobile.png':'手机尺寸显示'}
h='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>复原雅礼 B01 R3 实际截图审阅</title><style>body{margin:0;background:#f3f4ee;color:#244238;font:16px/1.8 system-ui}main{max-width:1280px;margin:auto;padding:40px 24px}h1{font-size:36px;margin:0}small{color:#688071}figure{margin:30px 0}img{display:block;width:100%;height:auto}figcaption{padding:12px 0;font-weight:600}code{word-break:break-all}.status{background:#e2e9dc;padding:20px;border-left:4px solid #6d896b}</style><main><small>RETURN OLD SCHOOL / M1.1-B B01 R3</small><h1>两端正面入口、前伸墙与中央轻弧</h1>'
h+=f'<p class="status">工程验证：{"通过"if ok else "未完成"} · 校友画面审阅：待确认。单元回归{count}项；浏览器{n}/{total}项；实际截图{len(report["screenshots"])}张。</p><p>这是Three.js实际模型截图，不是生成式示意。保留R2五层剖面、四楼后坪、厕所连接与共轴关系。本次重点重做两个正面端部入口及相邻五层墙体，中央功能区采用浅弧平面。</p><p>入口退进、局部地坪和曲率采用可替换工作尺寸；不含完整内部楼梯、家具或人物控制器。两侧镜像仅用于整体对应，单个门廊旁的前伸主体不做成对称短墙U形。</p><p>测试源码：<code>{report.get("source_sha")}</code><br>Viewer SHA256：<code>{report["viewer_sha256"]}</code></p>'
for name in report['screenshots']:
 f=Q/name
 if not f.is_file():raise FileNotFoundError(f)
 h+=f'<figure><img loading="lazy" src="data:image/png;base64,{base64.b64encode(f.read_bytes()).decode()}" alt="{html.escape(captions.get(name,name))}"><figcaption>{html.escape(captions.get(name,name))}</figcaption></figure>'
h+='</main></html>';(O/'Yali_M1_1_B_B01_R3_Review.html').write_text(h)
checklist=f'# B01 R3 回归清单\n\n工程 {"PASS"if ok else "INCOMPLETE"}；校友 REVIEW_PENDING。原583项全部保留，本轮105项（含35个故障注入）；总数{count}。\n\n'+''.join(f'- [{"x"if c["passed"]else " "}] {c["name"]}\n'for c in report['checks'])
(O/'Yali_M1_1_B_B01_R3_Regression_Checklist.md').write_text(checklist)
delivery=f'''# B01 R3 交付\n\n状态：IMPLEMENTED / REVIEW_PENDING。工程：{'PASS'if ok else 'INCOMPLETE'}。\n\n源码：`{report.get('source_sha')}`；Viewer SHA256：`{report['viewer_sha256']}`。\n\n单元回归{count}；浏览器{n}/{total}；实际截图{len(report['screenshots'])}。\n\n#29：两端正面入口取代东山墙门廊；相邻五层主体墙超过一层门罩；中央采用水平浅弧，墙面、楼板、檐口一致。R2五层剖面、四楼后坪、厕所逐层连接与四节点共轴保留。新增两处H局部前坪衔接三级台阶，P3/P4数据不改。\n\n细部工作值：入口墙相对原正面后退2m；主体局部前伸2m；主体墙比门罩前伸1.7m；3级台阶共0.45m；中央8.8m宽浅弧矢高0.35m，中央最前点不变。\n\n范围：建筑外壳和入口几何，不含完整内部楼梯、内装或物理人物。图书馆只继承R2定位，不提前完成图书馆精模。原照片/校友文字是证据，生成图不作为证据。\n\n复现：npm ci --prefix apps/campus；node --test tests/m10/*.test.mjs tests/m11a/*.test.mjs tests/m11a/patch02/*.test.mjs tests/m11b/*.test.mjs tests/m11b/r2/*.test.mjs tests/m11b/r3/*.test.mjs；npm run build --prefix apps/campus；node tools/m11b/r3/export.mjs；python tools/m11b/r3/capture.py；python tools/m11b/r3/package.py。\n'''
(R/'docs/m11b/batch01-r3/delivery.md').write_text(delivery)
manifest={'source_sha':report.get('source_sha'),'viewer_sha256':report['viewer_sha256'],'files':{}}
for base in ['apps/campus/src','data/m11b/batch01-r3','tools/m11b/r3','tests/m11b/r3']:
 for f in (R/base).rglob('*'):
  if f.is_file()and'__pycache__'not in f.parts:manifest['files'][str(f.relative_to(R))]=hashlib.sha256(f.read_bytes()).hexdigest()
(O/'source-manifest.json').write_text(json.dumps(manifest,indent=2))
for name in ['browser-report.json','unit-tests.txt']:(O/name).write_bytes((Q/name).read_bytes())
with zipfile.ZipFile(O/'Yali_M1_1_B_B01_R3_Workspace.zip','w',zipfile.ZIP_DEFLATED)as z:
 for base in ['apps','data','docs','tools','tests','qa','.github']:
  for f in (R/base).rglob('*'):
   if not f.is_file()or any(v in f.parts for v in ['node_modules','dist','__pycache__','.git'])or f.suffix.lower()in['.ttf','.otf','.woff','.woff2']:continue
   z.write(f,str(f.relative_to(R)))
 for name in ['README.md','.gitignore']:z.write(R/name,name)
 for f in O.iterdir():
  if f.is_file()and f.suffix!='.zip':z.write(f,'delivery/'+f.name)
print('Packaged R3',ok,'screenshots',len(report['screenshots']))
