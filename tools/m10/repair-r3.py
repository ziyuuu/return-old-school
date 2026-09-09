"""Apply the owner's R3 corrections once. Chosen metres are hypotheses, not survey data."""
from pathlib import Path
import json,csv
ROOT=Path(__file__).resolve().parents[2]
VERSION='M1.0.2-R3'
def read(p):return (ROOT/p).read_text(encoding='utf-8')
def write(p,s):
 q=ROOT/p;q.parent.mkdir(parents=True,exist_ok=True);q.write_text(s,encoding='utf-8')
def dump(p,d):write(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def replace(p,a,b):
 s=read(p)
 if b in s:return
 if a not in s:raise RuntimeError('Baseline mismatch in '+p+': '+a[:80])
 write(p,s.replace(a,b,1))
def main():
 l=json.loads(read('data/m10/layout-input.json'))
 if l['version']==VERSION:
  print('R3 already applied; no repeated movement.');return
 assert l['version']=='M1.0.1-R2',l['version']
 old=json.loads(json.dumps(l));cols=l['facilityColumns'];rows={r[0]:dict(zip(cols,r)) for r in l['facilityRows']}
 rows['27']['position']=[-17,0,1];rows['27']['note']='R3：总图主门左侧校名石；外拍左右不直接当成总图左右。位置数值H。'
 rows['02']['position']=[17,0,1];rows['02']['note']='R3：原石位附近是侧门，独立侧路不在入口处接主门主路；端点数值H。'
 rows['17']['position']=[129,0,258];rows['17']['note']='R3：向图面左移，纵向道路直达北侧正门；门向/位移H，校友确认道路对门。'
 rows['20']['position']=[166,0,82];rows['20']['size']=[60,23,104];rows['20']['note']='R3：扩大外部建筑群至食堂前方，六个子体量为H不是六栋历史楼数；不制作住宅内部。'
 rows['24']['position']=[-62,0,72];rows['24']['note']='R3：四层独立体块与03本体贴合，不再以外加有棚连廊连接。共享墙边和门位H。'
 l['facilityRows']=[[r[k] for k in cols] for r in rows.values()];l['version']=VERSION
 l['revision']='R3: issues #8-#11; datum and 23 unaffected facility transforms retained'
 l['buildingLinks']=[]
 l['buildingContacts']=[{'id':'03-24-CONTACT','from':'03','to':'24','kind':'shared-wall','axis':'z','coordinate':66,'span':[-66,-54],'portalCenter':[-60,0,66],'portalWidth':2.4,'portalHeight':3.1,'evidence':'A本体紧贴；H后侧贴合面/首层门洞；不推断所有楼层互通'}]
 l['contextBlocks']=[{'id':f'20-B{i+1}','owner':'20','localPosition':[x,0,z],'size':[w,h,d],'evidence':'H外部轮廓，不是实测住宅楼栋'} for i,(x,z,w,d,h) in enumerate([(-17,-37,20,26,18),(15,-35,24,30,23),(-17,-2,22,30,19),(16,0,22,32,22),(-16,37,24,30,17),(16,38,24,28,21)])]
 entrances={e['id']:e for e in l['entrances']}
 entrances['03-music'].update(position=[-60,0,66],facing=[0,0,1],status='A贴体/H共享面首层开口')
 entrances['24-gym'].update(position=[-60,0,66],facing=[0,0,-1],status='A贴体/H共享面首层开口')
 entrances['24-front']={'id':'24-front','facilityId':'24','position':[-68,0,78],'facing':[0,0,1],'status':'H球场侧入口，避开26'}
 entrances['17-front']={'id':'17-front','facilityId':'17','position':[129,0,249],'facing':[0,0,-1],'status':'A道路直达正门/H正门面与尺寸'}
 l['entrances']=list(entrances.values());n=l['navigation'];nodes=n['nodes']
 nodes.update({'side-gate':[17,0,1],'side-entry':[17,0,16],'side-lower':[129,0,184],'east-front':[129,0,208],'east-bottom':[129,0,239],'longya-entry':[129,0,246.8],'garden-turn':[156,0,239],'garden-east':[156,0,276],'garden-entry':[110,0,276],'music-approach':[-68,0,84],'music-entry':[-68,0,80.2]})
 edges=[]
 for a,b in n['edges']:
  if (a,b) in [('junction-gym','side-branch'),('east-bottom','garden-entry'),('sports-front','music-entry')]:continue
  if a=='side-gate':a='side-lower'
  if b=='side-gate':b='side-lower'
  edges.append([a,b])
 edges.extend([['side-gate','side-entry'],['side-entry','side-branch'],['east-bottom','garden-turn'],['garden-turn','garden-east'],['garden-east','garden-entry'],['sports-front','music-approach'],['music-approach','music-entry']]);n['edges']=edges
 widths={}
 for key,val in n['edgeWidths'].items():
  if key=='junction-gym|side-branch':continue
  widths[key.replace('side-gate','side-lower')]=val
 for a,b in [['side-gate','side-entry'],['side-entry','side-branch'],['music-approach','music-entry'],['east-bottom','longya-entry']]:widths[f'{a}|{b}']=2.4
 n['edgeWidths']=widths
 n['requiredChains'][0]=['side-gate','side-entry','side-branch','side-front-turn','side-upper','side-mid','side-lower','east-front','east-bottom','longya-entry']
 n['forbiddenEdges']=[['junction-gym','side-branch'],['gate','side-gate'],['gate','side-entry']]
 n['entranceIsolation']={'regionMaxZ':40,'mainNodes':['gate','junction-gym'],'sideChain':n['requiredChains'][0][:5],'note':'只禁止入口处主侧路直接接边；允许校内深处经既有道路间接到达。'}
 n['removedEdges'].extend([['junction-gym','side-branch'],['east-bottom','garden-entry']])
 n['tourPath']=['gate','junction-gym','gym-entry','junction-gym','junction-sports','junction-office','forecourt','main-front','east-front','side-lower','side-mid','side-upper','side-front-turn','side-branch','side-entry','side-gate','side-entry','side-branch','side-front-turn','side-upper','side-mid','side-lower','east-front','east-bottom','longya-entry','east-bottom','east-front','main-front','forecourt','gap-entry','gap-north','gap-cross','gap-south','rear-west','rear-junction','main-rear','rear-junction','library-entry','rear-junction','rear-west','gap-south','gap-cross','gap-north','gap-entry','forecourt']
 l['thresholds']=[{'id':i,'start':a,'end':b,'width':w,'evidence':'H门前短接，不穿越实心内部'} for i,a,b,w in [('15-rear-threshold',[69,0,232.8],[69,0,231],2.8),('18-front-threshold',[75,0,243.6],[75,0,245.5],2.8),('17-front-threshold',[129,0,246.8],[129,0,249],3.0),('24-front-threshold',[-68,0,80.2],[-68,0,78],2.4)]]
 l['cameraPresets'].update({'entrances':{'label':'石头 / 主门 / 独立侧门路','position':[36,52,-41],'target':[5,0,14]},'longya':{'label':'长雅楼正门直达','position':[129,8,238],'target':[129,5,258]},'family-canteen':{'label':'家属区 / 食堂间距','position':[246,123,187],'target':[166,0,100]},'gym-contact':{'label':'音乐楼与体育馆贴体','position':[-113,53,106],'target':[-54,6,61]},'side-path':{'label':'独立侧门路至长雅楼','position':[82,190,290],'target':[93,0,119]},'courts-to-gym':{'label':'球场看馆 / 贴体音乐楼','position':[-30,7,132],'target':[-57,7,59]}})
 dump('data/m10/layout-input.json',l);dump('data/m10/baseline-r2-input.json',old)
 oldrows={r[0]:dict(zip(cols,r)) for r in old['facilityRows']}
 diff=[{'id':i,'before':{k:oldrows[i][k] for k in ['position','size']},'after':{k:rows[i][k] for k in ['position','size']}} for i in rows if any(rows[i][k]!=oldrows[i][k] for k in ['position','size'])]
 dump('data/m10/revision-r3.json',{'version':VERSION,'baseCommit':'80a3613413bbfbe443bbc63a2150736e48982862','issues':[8,9,10,11],'sourceFiles':[{'name':'IMG_5497.jpeg','sha256':'de34800deb8fb242c32c2cf1def2f8f9f6ac30ed4841f62b85e230936b3764d2'},{'name':'359.jpeg','sha256':'a81cee4fd9976d23abcd497ec04c43f7970a5ebe34fd83033703e2298da15982'}],'changedFacilities':diff,'unchangedFacilityTransforms':[i for i in rows if i not in [d['id'] for d in diff]],'surveyVerified':False,'supersedes':['R2入口junction-gym到侧路接边和侧门后端落位','R2音乐楼外加03-24-LINK接驳','旧参考照片左右直接用于总图']})
 p='data/restoration/facility-register.csv'
 with (ROOT/p).open(encoding='utf-8-sig',newline='') as f:reader=csv.DictReader(f);fields=reader.fieldnames;records=list(reader)
 changes={'02':('侧门／独立侧路入口','主门图面右侧原石位附近，侧路入口不接主路；工作坐标H'),'27':('校门图面左侧校名石','左右按总图-X；照片观察者左右不当成总图坐标'),'17':('长雅楼','R3向图面左移且道路正对入口；门向及尺寸H'),'20':('居住／家属区建筑群','R3群体扩大靠近食堂；楼数/高度H，只有外部轮廓'),'24':('音乐楼／四层贴体独立体块','R3本体紧贴体育馆，不是外加楼梯连廊；具体贴合边及门洞H')}
 for r in records:
  if r['id'] in changes:r['name'],r['gaps']=changes[r['id']];r['evidence']+='；U-R3校友确认'
 with (ROOT/p).open('w',encoding='utf-8',newline='') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(records)
 p='data/spatial-constraints.json';s=json.loads(read(p));s['version']=VERSION;s['updated']='2026-09-10';c={v['id']:v for v in s['constraints']}
 c['SP-GATE-STONE-08'].update(status='alumni_confirmed',statement='27 is on map-left (-X) of01;02 is at the former map-right stone location. Street-photo observer-right is not a plan direction.')
 c['SP-SIDE-PATH-R2'].update(statement='Superseded by R3:02 at entrance-right; independent path follows white line along08 right, with NO entry-area link to09 main road. Deep-campus connections are allowed.',superseded_by='R3 #8')
 c['SP-MUSIC-04'].update(statement='24 is a four-storey distinct volume directly abutting03. No freestanding stair/portico link. Not merged with28.',contact_type='direct-abutment')
 s['constraints'].extend([{'id':'SP-LONGYA-R3','status':'alumni_confirmed','statement':'17 more map-left, road directly faces front entrance. Exact coordinates and doorway dimensionsH.'},{'id':'SP-CONTEXT-CANTEEN-R3','status':'alumni_confirmed','statement':'20 external building group is larger/denser and nearer11, without collision. Sub-block count and dimensionsH.'}]);dump(p,s)
 dump('data/restoration/assumption-register-r3.json',{'version':VERSION,'surveyVerified':False,'items':[{'id':'R3-H01','objectIds':['02','27'],'value':{'stone':[-17,0,1],'sideGate':[17,0,1]},'basis':'A左右及原石位是侧门；H具体中心'},{'id':'R3-H02','objectIds':['17'],'value':{'position':[129,0,258],'frontDoor':[129,0,249]},'basis':'A左移/路对正门；H位移36m与北面门'},{'id':'R3-H03','objectIds':['20'],'value':{'position':[166,0,82],'envelope':[60,23,104],'canteenGap':7,'subBlocks':6},'basis':'A更大近食堂；H六块及距离，不是实际住户楼栋数'},{'id':'R3-H04','objectIds':['03','24'],'value':l['buildingContacts'][0],'basis':'A本体贴合；H共享面12m与首层门，不暗示逐层互通'}]})
 replace('apps/campus/src/layout-core.mjs','m.minZ>gym.maxZ','m.minZ>=gym.maxZ-EPSILON')
 replace('apps/campus/src/layout-core.mjs','Alumnus: detached four-storey music building','Alumnus: distinct four-storey music volume, directly abutting03')
 replace('apps/campus/src/layout-core.mjs',"import { revisionChecks, edgeWidth, segmentHitsRect } from './revision-core.mjs';","import { revisionChecks, edgeWidth, segmentHitsRect } from './revision-core.mjs';\nimport { r3Checks } from './revision-r3-core.mjs';")
 replace('apps/campus/src/layout-core.mjs','results.push(...revisionChecks(layout,{bounds,overlap}));','results.push(...revisionChecks(layout,{bounds,overlap}),...r3Checks(layout,{bounds,overlap}));')
 p='apps/campus/src/revision-core.mjs';s=read(p);start=s.index(' const link=layout.buildingLinks?.find');end=s.index(" put('R2_POOL_TOILET_SMALLER'",start);s=s[:start]+' // R3 replaces the R2 portico test with actual common-wall contact tests.\n'+s[end:];write(p,s)
 p='tests/m10/layout.test.mjs';write(p,'\n'.join(line for line in read(p).split('\n') if not line.startswith("test('regression R2: gym-link gap fails'")))
 p='apps/campus/src/main.ts'
 replace(p,"import { edgeWidth } from './revision-core.mjs';","import { edgeWidth } from './revision-core.mjs';\nimport { r3Facility, buildR3Thresholds } from './revision-r3-scene';")
 replace(p,'if(revisedFacility(f,g,{box,mesh,line,rect,mats,layout}))','if(r3Facility(f,g,{box,mesh,line,rect,mats,layout}) || revisedFacility(f,g,{box,mesh,line,rect,mats,layout}))')
 replace(p,"const keyLabels=new Set(['01','02','03','06','08','11','13','15','17','18','23','24','25','26']);","const keyLabels=new Set(['01','02','03','06','08','11','13','15','17','18','20','23','24','25','26','27']);")
 replace(p,'for(const object of [structures,...structures.children,roofs,...roofs.children,...structures.children.filter(v=>v!==roofs)])',"for(const object of [...roots.values(),...roots.get('20')!.children,structures,...structures.children,roofs,...roofs.children,...structures.children.filter(v=>v!==roofs)])")
 replace(p,'const params=new URLSearchParams(location.search);','buildR3Thresholds(layout,{surfaces,box});\nconst params=new URLSearchParams(location.search);')
 replace(p,'version:layout.version,layout,report,setView,selectFacility,probeSegment,geometrySnapshot,','version:layout.version,layout,report,setView,selectFacility,probeSegment,geometrySnapshot,\n probeSurface:(x:number,z:number)=>{scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,3,z),new THREE.Vector3(0,-1,0),0,3.1);return ray.intersectObjects(surfaces.children,true).filter(h=>h.point.y>0).map(h=>({name:h.object.name,y:h.point.y}));},')
 p='apps/campus/index.html';s=read(p).replace('M1.0.1-R2',VERSION).replace('M1.0 R2','M1.0 R3').replace('顶棚 / 接驳屋盖','风雨跑道顶棚')
 pos=s.index('</nav>');s=s[:pos]+''.join(f'<button data-view="{k}">{v}</button>' for k,v in [('entrances','校门/侧门'),('longya','长雅正门'),('family-canteen','家属区/食堂'),('gym-contact','两楼贴体')])+s[pos:];write(p,s)
 p='tools/m10/export-footprints.mjs';s=read(p).replace("'qa/m10/'","'qa/m10-r3/'").replace("'qa/m10/layout-report.json'","'qa/m10-r3/layout-report.json'");s=s.replace('buildingLinks:l.buildingLinks,','buildingLinks:l.buildingLinks,buildingContacts:l.buildingContacts,contextBlocks:l.contextBlocks,thresholds:l.thresholds,');write(p,s)
 replace('apps/campus/src/revision-scene.ts','  const musicDoor=layout.buildingLinks[0].path[0][2]-f.position[2],doorW=2.4;\n  for(const sign of [-1,1]){\n   const x=sign*(w/2-wall/2);\n   if(sign<0){\n    box(g,wall,3.1,musicDoor-doorW/2-front,x,0,(front+musicDoor-doorW/2)/2,0);\n    box(g,wall,3.1,back-musicDoor-doorW/2,x,0,(back+musicDoor+doorW/2)/2,0);\n    box(g,wall,eave-3.1,back-front,x,3.1,(back+front)/2,0);\n   }else box(g,wall,eave,back-front,x,0,(back+front)/2,0);','  // R3 removes the west-wall portico opening;24 meets the rear wall directly.\n  for(const sign of [-1,1]){\n   const x=sign*(w/2-wall/2);\n   box(g,wall,eave,back-front,x,0,(back+front)/2,0);')
 replace('apps/campus/src/revision-scene.ts','  box(g,w,eave,.5,0,0,back-.25,0);','  const contact=layout.buildingContacts[0],cx=contact.portalCenter[0]-f.position[0],pw=contact.portalWidth,ph=contact.portalHeight;\n  const leftEnd=cx-pw/2,rightStart=cx+pw/2;\n  box(g,leftEnd+w/2,ph,.5,(-w/2+leftEnd)/2,0,back-.25,0);\n  box(g,w/2-rightStart,ph,.5,(w/2+rightStart)/2,0,back-.25,0);\n  box(g,w,eave-ph,.5,0,ph,back-.25,0);')
 replace('apps/campus/src/revision-scene.ts',' for(const [cx,a,b,width] of [[69,231,232.8,2.8],[75,243.6,245.5,2.8]])box(surfaces,width,.045,b-a,cx,.02,(a+b)/2,2);',' // R3 threshold geometry is emitted from layout.thresholds by buildR3Thresholds.')
 banner='# M1.0.2-R3 当前修订\n\n校名石在总图左侧，侧门在主门右侧原石位；侧路入口不直接连接主路。长雅楼左移且纵向路直达正门；家属区扩大靠近食堂；音乐楼与体育馆本体贴合，取消外加接驳。\n\n[本轮修复与工作值](docs/m10/revision-r3.md) · [回归校验清单](docs/m10/regression-r3.md) · [实际网页截图与测试](qa/m10-r3/)\n\nM0按授权推定基线关闭；本轮仅M1.0体量和拓扑订正，不是精模或测绘认证。以下历史记录遇到冲突，以R3和当前数据为准。\n\n---\n\n'
 if (ROOT/'README.md').exists():write('README.md',banner+read('README.md'))
 if (ROOT/'docs/development-plan.md').exists():
  pre='# M1.0.2-R3执行更新\n\n当前为M1.0校友反馈修复；#8—#11覆盖入口左右/独立侧门路、长雅正门对路、家属区体量、音乐楼贴体。验收见[m10/revision-r3.md](m10/revision-r3.md)与[m10/regression-r3.md](m10/regression-r3.md)。M0关闭不等于测绘完成，M1.1和精模尚未因此通过；M2夜景与玩法不在本轮。以下旧版定位冲突以当前R3数据优先。\n\n'
  write('docs/development-plan.md',pre+read('docs/development-plan.md'))
 print('R3 migrated:02,17,20,24,27 only;23 other facility transforms unchanged.')
if __name__=='__main__':main()
