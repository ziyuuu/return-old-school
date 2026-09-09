"""R3 actual WebGL mesh, route, portal, UI and standalone regression evidence."""
from pathlib import Path
import os,json,subprocess,time,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'qa/m10-r3';OUT.mkdir(parents=True,exist_ok=True)
embedded=os.getenv('M10_EMBEDDED_QA')=='1'
report={'source_commit':os.getenv('GITHUB_SHA','local-r3'),'version':'M1.0.2-R3','mode':'embedded about:blank' if embedded else 'HTTP production + standalone file','hardware_fps_certified':False,'checks':[],'errors':[],'screenshots':[]}
server=None
if not embedded:
 server=subprocess.Popen(['python','-m','http.server','8875','--directory',str(ROOT/'apps/campus/dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
def check(name,condition,detail=None):
 report['checks'].append({'name':name,'passed':bool(condition),'detail':detail})
 if not condition:raise AssertionError(name+': '+str(detail))
try:
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1,accept_downloads=True)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('console',lambda m:report['errors'].append(m.text) if m.type=='error' else None)
  page.route('**/favicon.ico',lambda r:r.fulfill(status=204))
  html=(ROOT/'artifacts/m10/Yali_M1_0_Viewer.html').read_text()
  if embedded:page.set_content(html,wait_until='load')
  else:page.goto('http://127.0.0.1:8875',wait_until='networkidle')
  page.wait_for_function('window.__YALI_M10__?.ready',timeout=30000)
  check('R3 boot and layout checks',page.evaluate('window.__YALI_M10__.version==="M1.0.2-R3" && window.__YALI_M10__.report.passed'))
  probes=page.evaluate('''()=>{const v=window.__YALI_M10__,n=v.layout.navigation,fail=[];let tested=0;
   for(const [a,b] of n.edges){const A=n.nodes[a],B=n.nodes[b],dx=B[0]-A[0],dz=B[2]-A[2],len=Math.hypot(dx,dz);
    for(const h of [.35,1.7,2.2])for(const o of [-.6,0,.6]){const p=[A[0]+dz/len*o,h,A[2]-dx/len*o],q=[B[0]+dz/len*o,h,B[2]-dx/len*o];const hits=v.probeSegment(p,q);tested++;if(hits.length)fail.push({a,b,h,o,hits:hits.slice(0,2)});}}
   return {tested,fail};}''')
  (OUT/'route-mesh-probes.json').write_text(json.dumps(probes,ensure_ascii=False,indent=2))
  check('actual mesh route clearance',not probes['fail'],probes)
  portal=page.evaluate('''()=>{const v=window.__YALI_M10__,fail=[];let count=0;
   for(const c of v.layout.connections){const hits=v.probeSegment([c.xStart-1,c.y+1.5,c.z],[c.xEnd+1,c.y+1.5,c.z]);count++;if(hits.length)fail.push({id:c.id,hits});}
   for(const [id,a,b] of [['main-rear',[69,1.5,234],[69,1.5,230]],['library',[75,1.5,243],[75,1.5,247]],['shared-wall',[-60,1.5,64],[-60,1.5,68]],['music-courts',[-68,1.5,80],[-68,1.5,76]],['longya-front',[129,1.5,247],[129,1.5,251]]]){const hits=v.probeSegment(a,b);count++;if(hits.length)fail.push({id,hits});}return{count,fail};}''')
  (OUT/'portal-probes.json').write_text(json.dumps(portal,ensure_ascii=False,indent=2))
  check('actual midpoint / rear / shared wall / front-door openings',not portal['fail'],portal)
  geometry=page.evaluate('window.__YALI_M10__.geometrySnapshot()');(OUT/'geometry-snapshot.json').write_text(json.dumps(geometry,ensure_ascii=False,indent=2))
  check('real canopy roof present','05-roof' in geometry and geometry['05-roof']['max'][1]>4)
  check('actual stone on map left',geometry['F27']['max'][0]<geometry['F01']['min'][0],geometry['F27'])
  check('actual side gate on entrance right',geometry['F02']['min'][0]>geometry['F01']['max'][0] and geometry['F02']['max'][2]<3,geometry['F02'])
  check('actual direct music gym contact',abs(geometry['F03']['max'][2]-geometry['F24']['min'][2])<.0001 and geometry['F24']['max'][0]>geometry['F03']['min'][0]+1)
  check('external connection meshes absent',not any('03-24-LINK' in k for k in geometry))
  child=[v for k,v in geometry.items() if k.startswith('20-B')]
  check('actual family masses close to canteen',len(child)==6 and 0<geometry['F11']['min'][2]-max(v['max'][2] for v in child)<=8)
  check('actual longya left shifted',abs((geometry['F17']['min'][0]+geometry['F17']['max'][0])/2-129)<.01)
  gaps=page.evaluate('''()=>{const v=window.__YALI_M10__;return [8,10,12].map(x=>v.probeSurface(x,22));}''')
  check('removed shortcut has no paving',all(not hits for hits in gaps),gaps)
  for view in ['overview','top','sports','teaching','courts-to-gym','canopy','rear-field','library-route','underpass','side-path','entrances','longya','family-canteen','gym-contact']:
   page.locator('[data-view="'+view+'"]').click();page.wait_for_timeout(350)
   state=page.evaluate('window.__YALI_M10__.getState()');check('camera '+view,state['view']==view and state['renderer']['triangles']>0)
   page.screenshot(path=str(OUT/(view+'.png')));report['screenshots'].append(view+'.png')
  page.locator('#inspect-btn').click();page.select_option('#facility','05');page.wait_for_timeout(150)
  before=page.evaluate('JSON.stringify(window.__YALI_M10__.layout.facilities)')
  page.locator('#roofs-check').uncheck();check('roof toggle hides geometry',not page.evaluate('window.__YALI_M10__.geometrySnapshot()["R2-toggleable-roofs"].visible'))
  check('roof toggle preserves transforms',before==page.evaluate('JSON.stringify(window.__YALI_M10__.layout.facilities)'))
  page.locator('#roofs-check').check();page.locator('#footprints-check').check()
  check('footprint mode',page.evaluate('window.__YALI_M10__.getState().planOnly'));page.locator('#footprints-check').uncheck()
  page.select_option('#facility','22');check('unknown remains unlocated','无坐标' in page.locator('#details').inner_text())
  with page.expect_download() as dl:page.locator('#download-layout').click()
  dl.value.save_as(str(OUT/'exported-layout.json'));check('export is current R3',json.loads((OUT/'exported-layout.json').read_text())['version']=='M1.0.2-R3')
  page.locator('#close-inspector').click();page.locator('[data-view="teaching"]').click()
  before=page.evaluate('window.__YALI_M10__.getState().camera');page.mouse.move(700,400);page.mouse.down();page.mouse.move(820,440,steps=8);page.mouse.up();page.wait_for_timeout(200)
  check('orbit works',before!=page.evaluate('window.__YALI_M10__.getState().camera'))
  page.locator('#tour-btn').click();page.wait_for_timeout(150);check('ground tour eye height',abs(page.evaluate('window.__YALI_M10__.getState().camera[1]')-1.7)<.01)
  page.keyboard.press('Escape');check('tour exits',not page.evaluate('window.__YALI_M10__.getState().tour'))
  page.locator('#fly-btn').click();before=page.evaluate('window.__YALI_M10__.getState().camera');page.keyboard.down('KeyW');page.wait_for_timeout(200);page.keyboard.up('KeyW')
  check('free inspection works',before!=page.evaluate('window.__YALI_M10__.getState().camera'));page.keyboard.press('Escape')
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-view="top"]').click();page.wait_for_timeout(200)
  check('mobile canvas resize',page.evaluate('window.__YALI_M10__.getState().canvas[0]')==390)
  page.screenshot(path=str(OUT/'mobile.png'));report['screenshots'].append('mobile.png')
  check('no JS or shader errors',not report['errors'],report['errors'])
  if not embedded:
   off=browser.new_page();off.goto((ROOT/'artifacts/m10/Yali_M1_0_Viewer.html').as_uri());off.wait_for_function('window.__YALI_M10__?.ready');check('standalone file boots',off.evaluate('window.__YALI_M10__.report.passed'));off.close()
  report['browser']=browser.version;report['standalone_sha256']=hashlib.sha256(html.encode()).hexdigest();report['success']=True;browser.close()
except Exception as e:
 report['success']=False;report['failure']=str(e);raise
finally:
 if server:server.terminate()
 (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
