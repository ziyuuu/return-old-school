"""Idempotent R3 -> R4 data migration. Owner topology, separately authored H dimensions."""
from pathlib import Path
import json, csv
ROOT=Path(__file__).resolve().parents[2]
def read(p): return json.loads((ROOT/p).read_text())
def save(p,d): (ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
p='data/m10/layout-input.json';d=read(p)
if d['version']=='M1.0.3-R4':
 print('R4 data already applied; no duplicate changes.');raise SystemExit
assert d['version']=='M1.0.2-R3',d['version']
save('data/m10/baseline-r3-input.json',d)
cols=d['facilityColumns'];rows={r[0]:dict(zip(cols,r)) for r in d['facilityRows']}
old={k:{t:rows[k][t] for t in ['position','size']} for k in rows}
rows['10']['position']=[19,0,110]
rows['10']['note']='R4：按校友箭头向总图上方移动，Z132→110；仍在操场左侧。位置及6×24m工作尺寸H。'
rows['20']['position']=[172,0,74]
rows['20']['note']='R4：整个家属区沿+X6/-Z8平移，保留R3扩大后的60×104m和六个H子体量。与食堂工作间距变为15m，不恢复旧45m空白。子楼数和位置均非实测。'
rows['03']['note']='R3/R4：42×42m H体育馆包络；四层音乐楼与后侧本体共边，无外加楼梯或连廊。折面屋盖及隐藏面属工作体量。'
rows['25']['note']='R4：男女厕同一连续楼体；桥接每层前廊中部，两端入口均朝15；桥侧护栏缺口通前廊；每层整幅楼板覆盖室内与前廊，非只在首层铺地。男女哪一端、楼层数随15及全部尺寸H。'
d['facilityRows']=[[rows[r[0]][c] for c in cols] for r in d['facilityRows']]
d['version']='M1.0.3-R4';d['revision']='R4 owner annotation: issues12-17; only10 and20 transforms changed; continuous25 rebuilt within original footprint.'
d['toilet25']={'version':'R4-continuous-with-front-gallery','facilityId':'25','galleryWidth':2.2,'slabThickness':.18,'slabTopOffset':.04,'wallThickness':.24,'doorWidth':1.4,'doorHeight':2.4,'doorEndInset':2.1,'railHeight':1.05,'railPostSpacing':.8,'bridgeOpeningWidth':2.4,'continuousBody':True,'floors':[
 {'level':i+1,'elevation':round(i*3.8,2),'hasFullSlab':True,'doorOffsetsZ':[-5.1,5.1]} for i in range(4)],
 'evidence':'A整栋连续/每层楼板/两端门朝15/桥侧护栏缺口；H尺寸、男女端分配、材质与分隔墙；未确认卫生器具数量',
 'genderEndAssignment':'unknown: door A and B mark two ends, not a historical male/female orientation'}
for e in d['entrances']:
 if e['id']=='25-link': e.update(kind='gallery-arrival',status='A桥接前廊中部/H坐标；不是男女厕门')
for b in d['connections']:b['evidence']='A逐层连接/中部接前廊；H尺寸与首层平接、上层净空'
for fl in d['toilet25']['floors']:
 for end,z in zip(['A','B'],fl['doorOffsetsZ']):
  d['entrances'].append({'id':f'25-{end}-L{fl["level"]:02d}','facilityId':'25','level':fl['level'],'kind':'toilet-door','position':[-9.2,fl['elevation'],round(224+z,3)],'facing':[1,0,0],'width':1.4,'height':2.4,'status':'A两端门朝教学楼/H精确坐标；A/B不是男女方位鉴定'})
n=d['navigation'];nodes=n['nodes'];edges=n['edges'];ew=n['edgeWidths']
def edge(a,b,w=3):
 if [a,b] not in edges and [b,a] not in edges: edges.append([a,b])
 ew[a+'|'+b]=w
removed={'garden-entry','garden-turn','garden-east'}
gone=[e for e in edges if any(x in removed for x in e)]
n['removedEdges'].extend(gone);n['removedNodes'].extend(sorted(removed));n['forbiddenEdges'].extend(gone)
edges[:]=[e for e in edges if not any(x in removed for x in e)]
for key in removed:nodes.pop(key,None)
for key in list(ew):
 if any(x in removed for x in key.split('|')):del ew[key]
n['unresolvedAccess']=[{'facilityId':'19','reason':'R4删除误画的17东南绕行；保留花园不凭空补新入口'}]
edges.remove(['junction-office','forecourt']);nodes['junction-museum']=[0,0,202]
edge('junction-office','junction-museum',7);edge('junction-museum','forecourt',7)
for a,b in [('gate','junction-gym'),('junction-gym','junction-sports'),('junction-sports','junction-office')]:ew[a+'|'+b]=7
n['mainRoadChain']=['gate','junction-gym','junction-sports','junction-office','junction-museum','forecourt'];n['mainRoadWidth']=7
edges.remove(['forecourt','museum-entry']);ew.pop('forecourt|museum-entry',None)
nodes['museum-entry']=[-27.2,0,202];edge('junction-museum','museum-entry',3)
nodes['forecourt-15']=[69,0,204];nodes['teaching-entry']=[69,0,215.2]
edge('forecourt-15','main-front',3);edge('main-front','teaching-entry',3)
nodes['east-cross']=[129,0,224];nodes['main-east']=[119.8,0,224];nodes['info-west']=[143.2,0,224]
edges.remove(['east-front','east-bottom']);edge('east-front','east-cross',3);edge('east-cross','east-bottom',3)
edge('main-east','east-cross',3);edge('east-cross','info-west',3)
for e in [
 {'id':'16-east','facilityId':'16','position':[-29,0,202],'facing':[1,0,0]},
 {'id':'15-east','facilityId':'15','position':[118,0,224],'facing':[1,0,0]},
 {'id':'21-west','facilityId':'21','position':[145,0,224],'facing':[-1,0,0]}]:
 e.update(width=2.4,height=2.7,status='A黑线接路/H洞口与未确认楼用途');d['entrances'].append(e)
for id,node in [('16-east','museum-entry'),('15-front','teaching-entry'),('15-east','main-east'),('21-west','info-west')]:
 e=next(e for e in d['entrances'] if e['id']==id)
 d['thresholds'].append({'id':id+'-threshold','start':nodes[node],'end':e['position'],'width':2.4,'evidence':'A黑线短路/H门前尺寸'})
def insert_intermediate(chain,a,b,m):
 result=[]
 for i,v in enumerate(chain):
  if i and {chain[i-1],v}=={a,b}:result.append(m)
  result.append(v)
 return result
for a,b,m in [('junction-office','forecourt','junction-museum'),('east-front','east-bottom','east-cross')]:
 n['tourPath']=insert_intermediate(n['tourPath'],a,b,m)
 n['requiredChains']=[insert_intermediate(c,a,b,m) for c in n['requiredChains']]
n['requiredChains'] += [['junction-museum','museum-entry'],['forecourt-15','main-front','teaching-entry'],['main-east','east-cross','info-west']]
idx=n['tourPath'].index('junction-museum')+1;n['tourPath'][idx:idx]=['museum-entry','junction-museum']
idx=n['tourPath'].index('main-front')+1;n['tourPath'][idx:idx]=['teaching-entry','main-front','forecourt-15','main-front']
idx=n['tourPath'].index('east-cross')+1;n['tourPath'][idx:idx]=['main-east','east-cross','info-west','east-cross']
d['cameraPresets'].update({
 'rostrum':{'label':'主席台上移','position':[5,48,155],'target':[19,1,110]},
 'black-routes':{'label':'黑线支路','position':[142,108,310],'target':[59,0,211]},
 'toilet-front':{'label':'厕所前廊','position':[13,19,240],'target':[-10,7,224]},
 'toilet-floor':{'label':'厕所逐层','position':[7,20,245],'target':[-10,6,224]}
})
d['implementationLimits'].append('25完整楼板与前廊按当前4层H主楼实现；A/B端性别未定；不是施工结构设计')
save(p,d)
changes={i:{'old':old[i],'new':{k:rows[i][k] for k in ['position','size']}} for i in rows if any(old[i][k]!=rows[i][k] for k in ['position','size'])}
save('data/m10/revision-r4.json',{'version':d['version'],'baseCommit':'ccecc301ee30404ad5047ab08a9cb25b39458dc1','issues':[12,13,14,15,16,17],'transformChanges':changes,'preservedTransforms':[i for i in rows if i not in changes], 'userEvidence':['98821bfa-9401-4fb7-9aa2-f1d224bf99e6.png','dd9c3405-337d-48ec-a6a6-f289e8a9eca5.png','10590f42-edd6-4a86-9294-8220204e272e.png'],'evidenceNote':'用户批注确认方向和拓扑；位移/栏杆/楼板尺寸为H，男女端别未知','removedGreenEdges':gone})
save('data/restoration/assumption-register-r4.json',{'surveyVerified':False,'items':[
 {'id':'H-R4-ROSTRUM','value':'Z110，较R3上移22工作米','evidence':'A上移/H数值'},
 {'id':'H-R4-FAMILY','value':'X172/Z74，整体右6上8；食堂包络间距15m','supersedes':'R3 7m间距工作值','evidence':'A右上移/H位移；R3扩大尺寸不变'},
 {'id':'H-R4-ROAD','value':'主干7m连续；支路3m；门前2.4m','evidence':'A等宽与黑线通路/H宽度'},
 {'id':'H-R4-TOILET','value':d['toilet25'],'evidence':'A拓扑/H全部尺寸；楼层数随15'}]})
p2=ROOT/'data/restoration/facility-register.csv'
with p2.open(encoding='utf-8-sig',newline='') as f:r=list(csv.DictReader(f));fields=list(r[0])
for v in r:
 if v['id']=='25':v['gaps']='R4已确认连续楼体、逐层完整楼板、两端门和桥侧开口护栏；未知尺寸、男女两端对应、器具与隐藏面。'
 if v['id']=='20':v['gaps']='R4整体右上移动已确认；精确位移、楼栋数、尺寸和年代仍H。'
with p2.open('w',encoding='utf-8',newline='') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(r)
sc=read('data/spatial-constraints.json');sc.setdefault('revisions',[]).append({'version':'R4','issues':[12,13,14,15,16,17],'confirmed':['主席台图面上移','家属区右上移','删除17东南绿线路','主路红框不收窄','黑线16侧路/14到15/15到21','25连续楼体/每层楼板/两端门朝15/桥侧护栏缺口'],'assumptionRegister':'data/restoration/assumption-register-r4.json'});save('data/spatial-constraints.json',sc)
print('R4 data migrated; changed transforms:',','.join(changes),'unchanged:',28-len(changes))
