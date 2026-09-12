"""Targeted B03 full-scene WebGL evidence; screenshots are captured even on route failure."""
import os,json,hashlib,subprocess,traceback
from datetime import datetime,timezone
from pathlib import Path
from PIL import Image,ImageStat
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];Q=R/'qa/m11b-b03';Q.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/m11b-b03/Yali_M1_1_B_B03_Viewer.html'
checks=[];errors=[];shots=[];complete=False;access=None;exception=None

def check(name,passed,detail=None):
 checks.append({'name':name,'passed':bool(passed),'detail':detail});print(('PASS ' if passed else 'FAIL ')+name,flush=True)
server=subprocess.Popen(['python','-m','http.server','8779','--bind','127.0.0.1','--directory',str(A.parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as pw:
  opts={'headless':True,'args':['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']}
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
  page.goto('http://127.0.0.1:8779/'+A.name+'?clean=1',timeout=120000)
  page.wait_for_function('window.__YALI_B03__?.ready',timeout=120000);page.wait_for_timeout(500)
  state=page.evaluate('window.__YALI_B03__.getState()')
  check('actual WebGL2 startup',state['glError']==0 and not state['contextLost'] and state['triangles']>10000,state)
  access=page.evaluate('window.__YALI_B03__.checkAccess()')
  for r in access['routes']:check(r['id']+' support/body/head clearance',r['failures']==0,r)
  check('six complete actual door apertures',len(access['doors'])==6 and all(not d['bad'] for d in access['doors']),access['doors'])
  legacy=page.evaluate('''()=>{const a=window.__YALI_R3__,r=window.__YALI_M11A__.getRoots(),b=window.__YALI_B02__,g=b.checkAccess();return {flags:a.countFlags(),axis:[r['08'][0],r['15'][0],r['18'][0]],shutterClear:a.model.access.every((d,i)=>{const s=i?1:-1,[x,y,z]=d.door;return a.probe([x+s*.5,y+1.5,z],[x-s*.5,y+1.5,z]).length===0;}),b02Routes:g.routes.map(r=>({id:r.id,failures:r.failures})),sharedWall:g.sharedWallBlocked,oldGym:g.legacyGymCount,mainFloor:r['15'][1],libraryFloor:r['18'][1]};}''')
  check('approved B01/B02 and campus axis preserved',legacy['flags']==3 and legacy['axis']==[73,73,73] and legacy['shutterClear'] and legacy['mainFloor']==3.45 and legacy['sharedWall'] and legacy['oldGym']==0 and all(r['failures']==0 for r in legacy['b02Routes']),legacy)
  page.evaluate('window.__YALI_B03__.setLabels(false)')
  def shot(view,width=1280,height=840,clean=True,name=None):
   page.set_viewport_size({'width':width,'height':height});page.evaluate('(on)=>document.body.classList.toggle("clean",on)',clean);page.evaluate('(v)=>window.__YALI_B03__.setView(v)',view)
   page.wait_for_timeout(450);page.evaluate('window.__YALI_B03__.renderNow()');fn=name or view+'.png';page.screenshot(path=str(Q/fn),timeout=120000)
   shots.append({'file':fn,'view':view,'width':width,'height':height,'state':page.evaluate('window.__YALI_B03__.getState()')});print('SCREENSHOT '+fn,flush=True)
  for view in ['b03-photo-library','b03-uphill','b03-garden','b03-spiral','b03-spiral-top','b03-garden-plan','b03-canteen','b03-photo-canteen','b03-canteen-lobby','b03-print','b03-shop','b03-overview']:shot(view)
  shot('b03-library',390,844,False,'mobile.png')
  crop=Image.open(Q/'mobile.png').convert('RGB').crop((30,170,360,680))
  spread=max(ImageStat.Stat(crop).stddev)
  check('mobile rendered scene is not a flat wall',spread>12,{'central_image_stddev':spread})
  check('mobile viewport and controls',page.evaluate('document.documentElement.scrollWidth<=390&&document.querySelector("#viewport canvas").clientWidth===390&&getComputedStyle(document.querySelector(".views")).display!=="none"'))
  shot('b03-canteen',390,844,False,'mobile-canteen.png')
  crop2=Image.open(Q/'mobile-canteen.png').convert('RGB').crop((30,170,360,680))
  check('mobile canteen scene is rendered',max(ImageStat.Stat(crop2).stddev)>12,{'central_image_stddev':max(ImageStat.Stat(crop2).stddev)})
  requests=[];page.on('request',lambda r:requests.append(r.url) if r.url.startswith(('http://','https://')) else None)
  page.goto(A.as_uri(),timeout=120000);page.wait_for_function('window.__YALI_B03__?.ready',timeout=120000);page.wait_for_timeout(400);off=page.evaluate('window.__YALI_B03__.getState()')
  check('same single-file offline loading; no external assets',not requests and not errors and off['glError']==0 and not off['contextLost'],{'requests':requests,'errors':errors})
  diagram=browser.new_page(viewport={'width':1270,'height':820});diagram.set_content('<style>html,body{margin:0}</style>'+ (A.parent/'Yali_M1_1_B_B03_Access.svg').read_text());diagram.screenshot(path=str(Q/'access-diagram.png'))
  complete=True;browser.close()
except Exception as e:exception=str(e);traceback.print_exc()
finally:
 server.terminate();server.wait(timeout=10)
 report={'version':json.loads((R/'data/m11b/batch03/input.json').read_text())['version'],'status':'IMPLEMENTED / REVIEW_PENDING','complete':complete,'passed':complete and all(c['passed'] for c in checks),'checks':checks,'access':access,'screenshots':shots,'errors':errors,'exception':exception,'source_sha':os.getenv('SOURCE_SHA'),'viewer_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'generatedAt':datetime.now(timezone.utc).isoformat(),'environment':('GitHub Actions' if os.getenv('GITHUB_ACTIONS') else 'Local')+' / Chromium / SwiftShader WebGL2; desktop and 390x844 viewport, not a physical phone.'}
 (Q/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if not report['passed']:raise AssertionError('B03 targeted checks failed; inspect actual screenshots and repair affected geometry.')
