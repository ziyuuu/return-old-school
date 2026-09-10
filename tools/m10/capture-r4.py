"""R4 actual Chromium WebGL checks. Geometry probes are not a physics controller or survey."""
from pathlib import Path
import os,json,subprocess,time,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'qa/m10-r4';OUT.mkdir(parents=True,exist_ok=True)
report={'source_commit':os.getenv('GITHUB_SHA','local-r4'),'version':'M1.0.3-R4','mode':'HTTP production + standalone file','hardware_fps_certified':False,'checks':[],'errors':[],'screenshots':[]}
server=subprocess.Popen(['python','-m','http.server','8875','--directory',str(ROOT/'apps/campus/dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
def check(name,condition,detail=None):
 report['checks'].append({'name':name,'passed':bool(condition),'detail':detail});print(name,bool(condition),flush=True)
 if not condition:raise AssertionError(name+': '+str(detail))
def save(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
try:
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1,accept_downloads=True)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('console',lambda m:report['errors'].append(m.text) if m.type=='error' else None)
  page.route('**/favicon.ico',lambda r:r.fulfill(status=204));page.goto('http://127.0.0.1:8875',wait_until='networkidle')
  page.wait_for_function('window.__YALI_M10__?.ready',timeout=30000)
  check('R4 boot and layout checks',page.evaluate('window.__YALI_M10__.version==="M1.0.3-R4" && window.__YALI_M10__.report.passed'))
  probes=page.evaluate('''()=>{const v=window.__YALI_M10__,n=v.layout.navigation,fail=[];let tested=0;
   for(const [a,b] of n.edges){const A=n.nodes[a],B=n.nodes[b],dx=B[0]-A[0],dz=B[2]-A[2],len=Math.hypot(dx,dz);
    for(const h of [.35,1.7,2.2])for(const o of [-.6,0,.6]){const p=[A[0]+dz/len*o,h,A[2]-dx/len*o],q=[B[0]+dz/len*o,h,B[2]-dx/len*o];const hits=v.probeSegment(p,q);tested++;if(hits.length)fail.push({a,b,h,o,hits:hits.slice(0,2)});}}
   return{tested,fail};}''');save('route-mesh-probes.json',probes);check('actual mesh ground route clearance',not probes['fail'],probes)
  portal=page.evaluate('''()=>{const v=window.__YALI_M10__,fail=[];let count=0;
   for(const c of v.layout.connections){const hits=v.probeSegment([c.xStart-1,c.y+1.5,c.z],[c.xEnd+1,c.y+1.5,c.z]);count++;if(hits.length)fail.push({id:c.id,hits});}
   for(const [id,a,b] of [['main-rear',[69,1.5,234],[69,1.5,230]],['library',[75,1.5,243],[75,1.5,247]],['shared-wall',[-60,1.5,64],[-60,1.5,68]],['music-courts',[-68,1.5,80],[-68,1.5,76]],['longya-front',[129,1.5,247],[129,1.5,251]],['16-east',[-27,1.5,202],[-30.4,1.5,202]],['15-east',[120,1.5,224],[116.5,1.5,224]],['21-west',[143,1.5,224],[146.4,1.5,224]],['15-front',[69,1.5,216],[69,1.5,220.5]]]){const hits=v.probeSegment(a,b);count++;if(hits.length)fail.push({id,hits});}return{count,fail};}''')
  save('portal-probes.json',portal);check('actual bridge and black-line door openings',not portal['fail'],portal)
  geometry=page.evaluate('window.__YALI_M10__.geometrySnapshot()');save('geometry-snapshot.json',geometry)
  check('rostrum actual mesh moved up',geometry['F10']['max'][2]<132)
  check('family actual meshes shifted right and up',geometry['F20']['min'][0]>136 and geometry['F20']['max'][2]<134)
  child=[v for k,v in geometry.items() if k.startswith('20-B')]
  check('family enlarged mass remains near canteen',len(child)==6 and 0<geometry['F11']['min'][2]-max(v['max'][2] for v in child)<=18)
  road=geometry.get('road-junction-office--junction-museum');check('red-box road actual7m width',road and abs(road['max'][0]-road['min'][0]-7)<.0001,road)
  green=page.evaluate('[window.__YALI_M10__.probeSurface(156,253),window.__YALI_M10__.probeSurface(134,276),window.__YALI_M10__.probeSurface(148,239)]');check('green road has no remaining paving',all(not x for x in green),green)
  check('R3 stone and side gate retained',geometry['F27']['max'][0]<geometry['F01']['min'][0] and geometry['F02']['min'][0]>geometry['F01']['max'][0])
  check('R3 gym music actual contact retained',abs(geometry['F03']['max'][2]-geometry['F24']['min'][2])<.0001 and not any('03-24-LINK' in k for k in geometry))
  check('R2 canopy retained','05-roof' in geometry and geometry['05-roof']['max'][1]>4)
  floors=page.evaluate('''()=>{const v=window.__YALI_M10__,l=v.layout,t=l.toilet25,f=l.facilities.find(f=>f.id==='25');let routes=0,supports=0;const fail=[];
   const front=f.position[0]+f.size[0]/2-t.galleryWidth,gx=front+t.galleryWidth/2,z=f.position[2];
   for(const fl of t.floors){const y=fl.elevation;
    for(const oz of fl.doorOffsetsZ){const pts=[[f.position[0]+f.size[0]/2+1,y,z],[gx,y,z],[gx,y,z+oz],[front-.8,y,z+oz]];
     for(let i=1;i<pts.length;i++)for(const h of [.4,1.5,2.2]){const a=[pts[i-1][0],y+h,pts[i-1][2]],b=[pts[i][0],y+h,pts[i][2]],hits=v.probeSegment(a,b);routes++;if(hits.length)fail.push({level:fl.level,a,b,hits});}}
    for(const x of [f.position[0]-1.8,f.position[0],gx,f.position[0]+f.size[0]/2+.5])for(const oz of [-5.1,0,5.1]){
     if(x>f.position[0]+f.size[0]/2&&oz!==0)continue;
     const hits=v.probeFloor(x,y,z+oz);supports++;if(!hits.some(h=>Math.abs(h.y-y-.04)<.02&&(h.name.endsWith('full-floor')||h.name.startsWith('15-25-'))))fail.push({type:'missing-floor',level:fl.level,x,oz,hits});}}
   return{routes,supports,fail};}''');save('toilet-floor-probes.json',floors)
  check('every floor bridge to both end doors unobstructed',not [x for x in floors['fail'] if x.get('type')!='missing-floor'],floors)
  check('every floor has actual slab support',not [x for x in floors['fail'] if x.get('type')=='missing-floor'],floors)
  check('four complete slab meshes',len([k for k in geometry if k.endswith('-full-floor')])==4)
  for view in ['overview','top','rostrum','family-canteen','black-routes','longya','teaching','toilet-front','toilet-floor','underpass','sports','gym-contact','entrances']:
   page.locator('[data-view="'+view+'"]').click();page.wait_for_timeout(250);state=page.evaluate('window.__YALI_M10__.getState()');check('camera '+view,state['view']==view and state['renderer']['triangles']>0)
   page.screenshot(path=str(OUT/(view+'.png')));report['screenshots'].append(view+'.png')
  page.locator('#inspect-btn').click()
  for level in [1,2,3,4]:
   page.select_option('#toilet-level',str(level));page.wait_for_timeout(180)
   check('toilet cutaway level'+str(level),page.evaluate('window.__YALI_M10__.getState().toiletLevel')==level)
   geo=page.evaluate('window.__YALI_M10__.geometrySnapshot()');check('upper levels hidden'+str(level),all(geo['25-floor-group-'+str(j)]['visible']==(j<=level) for j in range(1,5)))
   page.locator('#close-inspector').click();page.screenshot(path=str(OUT/('toilet-level-'+str(level)+'.png')));report['screenshots'].append('toilet-level-'+str(level)+'.png');page.locator('#inspect-btn').click()
  page.select_option('#toilet-level','0');page.select_option('#facility','05')
  before=page.evaluate('JSON.stringify(window.__YALI_M10__.layout.facilities)');page.locator('#roofs-check').uncheck();check('roof switch hides geometry',not page.evaluate('window.__YALI_M10__.getState().roofsVisible'))
  check('cutaway and roof switches do not move facilities',before==page.evaluate('JSON.stringify(window.__YALI_M10__.layout.facilities)'))
  page.locator('#roofs-check').check();page.locator('#footprints-check').check();check('footprint mode',page.evaluate('window.__YALI_M10__.getState().planOnly'));page.locator('#footprints-check').uncheck()
  page.select_option('#facility','22');check('unknown remains unlocated','无坐标' in page.locator('#details').inner_text())
  with page.expect_download() as dl:page.locator('#download-layout').click()
  dl.value.save_as(str(OUT/'exported-layout.json'));check('export current R4',json.loads((OUT/'exported-layout.json').read_text())['version']=='M1.0.3-R4')
  page.locator('#close-inspector').click();page.locator('[data-view="teaching"]').click();before=page.evaluate('window.__YALI_M10__.getState().camera');page.mouse.move(700,400);page.mouse.down();page.mouse.move(820,440,steps=8);page.mouse.up();page.wait_for_timeout(200);check('orbit works',before!=page.evaluate('window.__YALI_M10__.getState().camera'))
  page.locator('#tour-btn').click();page.wait_for_function('window.__YALI_M10__.getState().tour&&Math.abs(window.__YALI_M10__.getState().camera[1]-1.7)<.01');check('tour ground eye1.7m',True);page.keyboard.press('Escape');check('tour exits',not page.evaluate('window.__YALI_M10__.getState().tour'))
  page.locator('#fly-btn').click();before=page.evaluate('window.__YALI_M10__.getState().camera');page.keyboard.down('KeyW');page.wait_for_function('p=>JSON.stringify(window.__YALI_M10__.getState().camera)!==JSON.stringify(p)',arg=before);page.keyboard.up('KeyW');check('free camera works',True);page.keyboard.press('Escape')
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-view="top"]').click();page.wait_for_timeout(200);check('mobile-size canvas',page.evaluate('window.__YALI_M10__.getState().canvas[0]')==390);page.screenshot(path=str(OUT/'mobile.png'));report['screenshots'].append('mobile.png')
  check('no JS or shader errors',not report['errors'],report['errors'])
  off=browser.new_page();off.goto((ROOT/'artifacts/m10/Yali_M1_0_Viewer.html').as_uri());off.wait_for_function('window.__YALI_M10__?.ready');check('standalone file boots',off.evaluate('window.__YALI_M10__.report.passed'));off.close()
  report['browser']=browser.version;report['standalone_sha256']=hashlib.sha256((ROOT/'artifacts/m10/Yali_M1_0_Viewer.html').read_bytes()).hexdigest();report['success']=True;browser.close()
except Exception as e:report['success']=False;report['failure']=str(e);raise
finally:server.terminate();save('browser-report.json',report)
