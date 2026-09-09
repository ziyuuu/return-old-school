from pathlib import Path
import json, hashlib, csv
r=Path(__file__).resolve().parents[2]; p=r/'data/m10/layout-input.json';d=json.loads(p.read_text());old=json.loads(p.read_text())
if d.get('version')=='M1.0.1-R2':
 print('R2 data already applied');raise SystemExit(0)
b=p.read_bytes();assert hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()=='d979a1d88150b7364c2abda9576ccbdc8ef3e784','Refuse to overwrite an unreviewed layout version'
rows={v[0]:dict(zip(d['facilityColumns'],v)) for v in d['facilityRows']}
def upd(id,**kv):rows[id].update(kv)
d['version']='M1.0.1-R2'
d['revision']={'id':'M10-R2','sourceCommit':'99b6155f89b476e10ba302df3d93da08f7c493bd','scope':'7 user-reported spatial fixes; not final modeling or survey','issues':list(range(1,8)),'evidenceIds':['U-R2-01','U-R2-02','U-R2-03','U-R2-04'],'centerInterpretation':'15左端与25相向立面中线接入；不是移动25到主楼后侧','reviewStatus':'implementation-review-not-alumni-signoff'}
upd('02',position=[129,0,184],size=[4,3,1.2],kind='side-gate',note='校友标注：入口侧支路沿操场图面右侧到侧门。当前端点129/184、门宽高与地理边界注册均H；取代旧入口旁未核标记，不延伸到住宅内部。')
upd('03',position=[-45,0,45],size=[42,15,42],note='R2校友要求放大旧体育馆并连接四层音乐楼。工作包络由30×36调为42×42米，高暂不改；尺寸H-R2-GYM，不是从照片测量。通过西后侧可见连接段接24；保留折面壳体。')
upd('05',note='05风雨直跑道，7×64米仍为H。A：有顶棚、与06共边、在28与06之间。棚底4.1米、柱距8米为H；顶棚可隐藏，不改地面位置。')
upd('23',position=[108,0,183.5],note='R2按IMG_5497批注移到08靠教学楼的后缘橡胶直段右端。旧128/198位置废弃；5.5×3米与精确落点均H，唯一23实例。')
upd('24',note='四层独立体块A，不等于物理隔离。R2校友确认连接体育馆03；西后接驳的形式、尺寸、连接楼层H。楼本身的16×12工作占地和3.8层高不改。')
upd('25',position=[-10,0,224],note='A：主楼左侧独栋厕所，每层连接、门朝主楼，连接位于相向立面中部。z中心与15统一为224。尺寸6×14.4、连廊长宽、下穿结构H。首层平接、上层桥下可穿行；不复制到26。')
upd('26',position=[-61,0,80],size=[4.2,3,3],note='R2圈注为旧厕位置，不是照片中玻璃体块的历史外观。26置于馆/音乐楼组团面向球场的一端，仍在泳池左侧；4.2×3米小型占地由原6×4.5缩小。精确落点、3米高、门向H。')
d['facilityRows']=[[v[k] for k in d['facilityColumns']] for v in rows.values()]
for c in d['connections']:
 c.update(z=224,alignment='facing-wall-midpoint',evidence='A每层相连/门向/中部；H尺寸与首层平接、上层桥下通行构造')
d['entrances']=[
 {'id':'15-front','facilityId':'15','facing':[0,0,-1],'position':[69,0,217],'status':'H'},
 {'id':'15-link','facilityId':'15','facing':[-1,0,0],'position':[20,0,224],'status':'A中部接入/H坐标'},
 {'id':'15-rear','facilityId':'15','facing':[0,0,1],'position':[69,0,231],'status':'A后门通18/H洞口'},
 {'id':'25-link','facilityId':'25','facing':[1,0,0],'position':[-7,0,224],'status':'A朝15与中部/H坐标'},
 {'id':'03-front','facilityId':'03','facing':[0,0,-1],'position':[-45,0,24],'status':'H'},
 {'id':'03-music','facilityId':'03','facing':[-1,0,0],'position':[-66,0,62],'status':'A连接/H位置'},
 {'id':'24-gym','facilityId':'24','facing':[1,0,0],'position':[-73,0,76],'status':'A连接/H位置'},
 {'id':'18-front','facilityId':'18','facing':[0,0,-1],'position':[75,0,245.5],'status':'A与主楼后门联通/H门位'}]
d['sports']['canopy']={'enabled':True,'clearHeight':4.1,'roofThickness':0.24,'postWidth':0.22,'bayLength':8,'evidence':'A有棚；H棚型高度柱距；不推为上方整栋训练楼'}
d['sports']['rearTrack']={'id':'08-REAR','parentId':'08','kind':'rubber-straight','position':[73,0,183.5],'size':[92,0.10,7],'lanes':4,'evidence':'A操场后侧橡胶跑道/23位置；H精确尺寸'}
d['buildingLinks']=[{'id':'03-24-LINK','from':'03','to':'24','path':[[-66,0,62],[-69.5,0,62],[-69.5,0,76],[-73,0,76]],'width':2.4,'clearHeight':3.4,'roofThickness':0.22,'evidence':'A有连接；H单层开敞有棚接驳，非确认层数与构造'}]
n=d['navigation'];nodes=n['nodes'];edges=n['edges']
# Keep the gate, field and unrelated blocks fixed. Replace only incorrect local links.
for name in ['west-bottom','west-main','library-entry']:nodes.pop(name,None)
edges[:]=[e for e in edges if all(v in nodes for v in e)]
nodes['gym-entry']=[-45,0,21.8]
nodes.update({'side-branch':[23,0,22],'side-front-turn':[125,0,32],'side-upper':[129,0,40],'side-mid':[129,0,120],'side-gate':[129,0,184],
 'gap-entry':[6.5,0,211.5],'gap-north':[6.5,0,216],'gap-cross':[6.5,0,224],'gap-south':[6.5,0,238],
 'rear-west':[30,0,239],'rear-junction':[69,0,239],'main-rear':[69,0,232.8],'library-entry':[75,0,243.6]})
edges.extend([['junction-gym','side-branch'],['side-branch','side-front-turn'],['side-front-turn','side-upper'],['side-upper','side-mid'],['side-mid','side-gate'],['side-gate','east-front'],
 ['forecourt','gap-entry'],['gap-entry','gap-north'],['gap-north','gap-cross'],['gap-cross','gap-south'],['gap-south','rear-west'],['rear-west','rear-junction'],['rear-junction','library-entry'],['rear-junction','main-rear'],['forecourt','museum-entry']])
n.update(kind='User-corrected physical paving + explicit H endpoints; not survey',defaultWidth=3.0,reviewHeight=1.7,headClearance=2.2,
    edgeWidths={'junction-gym|side-branch':2.4,'side-branch|side-front-turn':2.4,'side-front-turn|side-upper':2.4,'side-upper|side-mid':2.4,'side-mid|side-gate':2.4,'side-gate|east-front':2.4,'rear-junction|library-entry':2.4,'rear-junction|main-rear':2.4,'forecourt|museum-entry':2.4},
    removedNodes=['west-bottom','west-main'],removedEdges=[['garden-entry','library-entry'],['garden-entry','west-bottom'],['west-bottom','west-main'],['west-main','museum-entry'],['west-main','forecourt']],
    requiredChains=[['junction-gym','side-branch','side-front-turn','side-upper','side-mid','side-gate'],['forecourt','gap-entry','gap-north','gap-cross','gap-south','rear-west','rear-junction','library-entry'],['main-rear','rear-junction','library-entry']])
n['tourPath']=['gate','junction-gym','gym-entry','junction-gym','side-branch','side-front-turn','side-upper','side-mid','side-gate','east-front','main-front','forecourt','gap-entry','gap-north','gap-cross','gap-south','rear-west','rear-junction','main-rear','rear-junction','library-entry','rear-junction','rear-west','gap-south','gap-cross','gap-north','gap-entry','forecourt']
d['cameraPresets'].update({'courts-to-gym':{'label':'球场看馆 / 连接 / 旧厕','position':[-28,9,134],'target':[-64,6,61]},'canopy':{'label':'风雨跑道棚下','position':[-68.5,2,149],'target':[-68.5,2.6,88]},'rear-field':{'label':'操场后缘与沙坑','position':[140,63,248],'target':[81,0,177]},'library-route':{'label':'主楼后门至图书馆','position':[15,47,276],'target':[48,2,232]},'underpass':{'label':'两楼间首层穿行','position':[6.5,1.7,233],'target':[6.5,1.7,209]},'side-path':{'label':'侧门小路','position':[195,70,160],'target':[120,0,85]}})
d['cameraPresets']['teaching'].update(label='主楼 / 中部逐层连接',position=[-44,55,264],target=[15,6,224])
d['cameraPresets']['gym'].update(position=[-123,56,8],target=[-52,6,54])
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
f=r/'data/restoration/facility-register.csv'
with f.open(encoding='utf-8-sig',newline='') as s:reader=csv.DictReader(s);fields=reader.fieldnames;reg=list(reader)
notes={'02':('侧门／入口侧小路','U-R2-03批注','批注锁定右侧支路/H侧门位置','门尺寸和精确边界H，不沿用旧入口旁未核点'),
 '03':('旧体育馆','U-R2-04；S03-017/020','正斜向＋篮球场视角/校友定位','A更大且接音乐楼；42×42包络H，隐藏面仍H'),
 '05':('风雨跑道／有顶棚直跑道','U-R2-02；S03-022','照片＋校友有棚说明','棚构造、高度、柱距H；不能仍写露天'),
 '23':('沙坑／操场后缘右端','U-R2-03批注','校友落位批注','准确长宽H；原前坪右侧坐标已废弃'),
 '24':('音乐楼／四层独立体块','U-R2-04；校友草图','四层A＋连接体育馆A','独立体块并非完全不连通；接驳形式层数H'),
 '25':('主楼左侧相连独栋厕所','U-R2-01；校友草图','每层相连、门向及中部接入A','主楼侧墙中线/各层连桥确认；尺寸与构造H'),
 '26':('池畔旧厕所／小体量','U-R2-04圈注','旧位置校友定位','4.2×3工作占地H；不是圈内整栋玻璃建筑')}
for row in reg:
 if row['id'] in notes:row.update(zip(['name','evidence','available_views','gaps'],notes[row['id']]))
with f.open('w',encoding='utf8',newline='') as s:w=csv.DictWriter(s,fieldnames=fields);w.writeheader();w.writerows(reg)
changes=[]
for oldrow in old['facilityRows']:
 new=rows[oldrow[0]];before=dict(zip(old['facilityColumns'],oldrow))
 if before['position']!=new['position'] or before['size']!=new['size']:changes.append({'id':new['id'],'before':{k:before[k] for k in ('position','size')},'after':{k:new[k] for k in ('position','size')},'evidence':new['note']})
(r/'data/m10/revision-r2.json').write_text(json.dumps({'version':'M1.0.1-R2','baseCommit':d['revision']['sourceCommit'],'changedFacilities':changes,'protectedIds':[id for id in rows if id not in [c['id'] for c in changes]],'sources':[{'id':'U-R2-01','filename':'IMG_5494.png','sha256':'c64e0ff508f6d840637dcf4be3d66599ac9063455413088d6122f5acdabf0c0a','publicImageCommitted':False},{'id':'U-R2-02','filename':'356.jpeg','sha256':'e4b4969a971f98830f947387a526fd5516d4c9210147544f628bd46d451028b1','publicImageCommitted':False},{'id':'U-R2-03','filename':'IMG_5497.jpeg','sha256':'de34800deb8fb242c32c2cf1def2f8f9f6ac30ed4841f62b85e230936b3764d2','publicImageCommitted':False},{'id':'U-R2-04','filename':'IMG_5499.jpeg','sha256':'5faab118757bee364b4d86469766ec65f36b1a386bf50663816910cede0914b5','publicImageCommitted':False}]},ensure_ascii=False,indent=2)+'\n')
# Current authoritative constraints supersede old wording, without rewriting archived PDFs.
p=r/'data/spatial-constraints.json'; c=json.loads(p.read_text());c['version']='M1.0.1-R2'
by={v['id']:v for v in c['constraints']}
by['SP-TOILET-MAIN-01'].update(connection_alignment='facing-wall-midpoint',statement='25 is image-left of15; every floor connects at facing-wall midpoints, doors face15. A ground path passes between the two blocks to library18.',source='U-R2-01 / U-R2-03 and earlier sketches')
by['SP-BASKETBALL-TRACK-02'].update(covered=True,statement='05 is a roofed straight track, parallel to and directly abutting06; between28 and06.')
by['SP-MUSIC-04'].update(detached=False,independent_volume=True,connected_to=['03'],statement='24 is a distinct four-storey volume behind03 beside05, connected to03. Independent volume does not mean physically disconnected; not merged with28.')
by['SP-POOL-TOILET-05'].update(statement='26 small old toilet left of04 at the court-facing end of03/24, revised from U-R2-04 location testimony. Do not copy the circled later glass building or25 interior.')
by['SP-SANDBOX-07'].update(statement='23 at the image-right end of the rear rubber straight08-REAR, on the field end toward15. U-R2-03 supersedes the former exact forecourt-right position.')
c['constraints'].extend([{'id':'SP-REAR-RUNWAY-R2','status':'alumni_confirmed','statement':'Rubber straight at08 rear edge toward15; exact dimensionsH.'},{'id':'SP-SIDE-PATH-R2','status':'alumni_confirmed','statement':'Entrance side branch runs along image-right side of08 to02; exact gate registrationH.'},{'id':'SP-LIBRARY-PATH-R2','status':'alumni_confirmed','statement':'Path between15/25 leads to18;15 rear door also joins18. Supersedes old south detour.'},{'id':'SP-GYM-MASS-R2','status':'alumni_confirmed','statement':'03 must be larger than old30x36 hypothesis and connect24;42x42 is selectedH, not measured.'}])
p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
p=r/'tools/check_restoration_v07.py'
if p.exists():
 s=p.read_text().replace("assert c['SP-MUSIC-04']['detached'] is True", "assert c['SP-MUSIC-04']['independent_volume'] is True\n    assert c['SP-MUSIC-04']['connected_to'] == ['03']")
 p.write_text(s)
p=r/'README.md'
s=p.read_text().replace('## 当前：M1.0 校园空间骨架首版','## 当前：M1.0.1-R2 空间修订')
s=s.replace('### 使用入口','本轮按校友照片与批注修复7项：风雨跑道顶棚、中部逐层连接、后缘橡胶跑道与沙坑、侧门小路、主楼后方至图书馆通路、体育馆放大并连接音乐楼、26号旧厕重定位缩小。\n\n[本轮issue与验收说明](docs/m10/revision-r2.md) · [实际R2浏览器证据](qa/m10-r2/)\n\n### 使用入口')
s=s.replace('每层连接、门朝教学楼。草图','每层连接、相向立面中部接入、门朝教学楼；两楼间地面可穿行至图书馆。草图')
s=s.replace('与相邻直跑道平行且紧贴','与有顶棚的相邻直跑道平行且紧贴')
s=s.replace('音乐楼24：四层独栋，跑道旁、体育馆后方，不与28合并。','音乐楼24：四层独立体块，跑道旁、体育馆后方，与03有实际连接，不与28合并。')
s=s.replace('沙坑靠近旗台','沙坑位于操场靠主楼一端的后缘橡胶直段右端')
p.write_text(s)
p=r/'docs/development-plan.md'
s=p.read_text();s='# M1.0.1-R2执行更新\n\nM0按授权推定基线关闭；M1.0已开始三维空间骨架制作，现修复校友反馈的7项空间问题。当前依据见 [R2修订](m10/revision-r2.md)，下列v0.7段落保留为阶段规划，不代表当前仍未制作。修复完成不等于M1全场景精模验收。\n\n'+s
p.write_text(s)
(r/'data/restoration/assumption-register-r2.json').write_text(json.dumps({'version':'M1.0.1-R2','survey_verified':False,'supersedes_in_M1':{'H10':'H-R2-GYM','H12':'H-R2-WC'},'items':[{'id':'H-R2-GYM','facility':'03','old_footprint':[30,36],'working_footprint':[42,42],'height':15,'basis':'Alumnus larger-volume correction; selected package, not photogrammetry'},{'id':'H-R2-LINK','facilities':['03','24'],'working_model':'single-storey open roofed dogleg','basis':'A connected; form/width2.4/roof3.4 areH'},{'id':'H-R2-WC','facility':'26','working_footprint':[4.2,3],'height':3,'basis':'A smaller historical toilet at circled location; pixel-to-plan registrationH'},{'id':'H-R2-ROOF','facility':'05','clear_height':4.1,'bay_length':8,'basis':'A covered track; structural schemeH'},{'id':'H-R2-REAR','facilities':['08','23'],'runway':[92,7],'pit_center':[108,183.5],'basis':'A rear-right location; coordinates/dimensionsH'},{'id':'H-R2-PATHS','facilities':['02','15','18','25'],'basis':'A route topology; widths, bending coordinates, threshold and underpass structureH'}]},ensure_ascii=False,indent=2)+'\n')
print('Applied7 issue corrections to working data and current documentation; no surveyed claims.')
