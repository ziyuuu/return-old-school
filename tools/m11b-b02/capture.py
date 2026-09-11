"""Actual Chromium/WebGL acceptance evidence for B02 only. No synthetic screenshots."""
import os,json,hashlib,subprocess,traceback
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];Q=R/'qa/m11b-b02';Q.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/m11b-b02/Yali_M1_1_B_B02_Viewer.html'
checks=[];errors=[];shots=[];complete=False;access=None;state=None;exception=None

def check(name,passed,detail=None):
 checks.append({'name':name,'passed':bool(passed),'detail':detail});print(('PASS ' if passed else 'FAIL ')+name,flush=True)
server=subprocess.Popen(['python','-m','http.server','8778','--bind','127.0.0.1','--directory',str(A.parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as pw:
  opts={'headless':True,'args':['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']}
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts)
  page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
  page.goto('http://127.0.0.1:8778/'+A.name+'?clean=1',timeout=120000)
  page.wait_for_function('window.__YALI_B02__?.ready',timeout=120000)
  state=page.evaluate('window.__YALI_B02__.getState()')
  check('B02 actual WebGL2 startup',state['glError']==0 and not state['contextLost'] and state['triangles']>10000,state)
  access=page.evaluate('window.__YALI_B02__.checkAccess()')
  for route in access['routes']:check(route['id']+' actual support and body/head clearance',route['failures']==0,route)
  check('four real full-width door apertures',all(not d['bad'] for d in access['doors']),access['doors'])
  check('shared wall closed and old gym removed',access['sharedWallBlocked'] and access['legacyGymCount']==0,{'sharedWallBlocked':access['sharedWallBlocked'],'oldMeshes':access['legacyGymCount'],'retainedSite':access['retainedSiteNames']})
  legacy=page.evaluate('''()=>{const a=window.__YALI_R3__,r=window.__YALI_M11A__.getRoots();return {flags:a.countFlags(),axis:[r['08'][0],r['15'][0],r['18'][0]],musicGymFloor:[r['03'][1],r['24'][1]],shutterClear:a.model.access.every((d,i)=>{const s=i?1:-1,[x,y,z]=d.door;return a.probe([x+s*.5,y+1.5,z],[x-s*.5,y+1.5,z]).length===0;}),courts:window.__YALI_B02__.layout.facilities.find(f=>f.id==='06').position};}''')
  check('approved B01 shutters, axis, flags and current datums retained',legacy['shutterClear'] and legacy['flags']==3 and legacy['axis']==[73,73,73] and legacy['musicGymFloor']==[3.6,3.6],legacy)
  page.evaluate('window.__YALI_B02__.setLabels(false)')
  def shot(view,width=1440,height=960,clean=True,name=None):
   page.set_viewport_size({'width':width,'height':height})
   page.evaluate('(on)=>document.body.classList.toggle("clean",on)',clean)
   page.evaluate('(v)=>window.__YALI_B02__.setView(v)',view)
   page.wait_for_timeout(650);page.evaluate('window.__YALI_B02__.renderNow()')
   filename=name or view+'.png';page.screenshot(path=str(Q/filename),timeout=120000)
   shots.append({'file':filename,'view':view,'width':width,'height':height,'state':page.evaluate('window.__YALI_B02__.getState()')});print('SCREENSHOT '+filename,flush=True)
  shot('b02-photo-front',1440,960)
  shot('b02-photo-side',900,996)
  for view in ['b02-front','b02-entry','b02-lobby','b02-stair','b02-stair-top','b02-gallery','b02-music','b02-music-entry','b02-music-lobby','b02-loop','b02-field','b02-overview','r3-overview']:shot(view)
  shot('b02-front',390,844,False,'mobile.png')
  check('mobile viewport and controls visible',page.evaluate('document.documentElement.scrollWidth<=390&&document.querySelector("#viewport canvas").clientWidth===390&&getComputedStyle(document.querySelector(".views")).display!=="none"'))
  # Run the delivered SINGLE FILE offline as well; any external scene request is a failure.
  requests=[]
  page.on('request',lambda r:requests.append(r.url) if r.url.startswith(('http://','https://')) else None)
  page.goto(A.as_uri(),timeout=120000);page.wait_for_function('window.__YALI_B02__?.ready',timeout=120000);page.wait_for_timeout(450)
  offline=page.evaluate('window.__YALI_B02__.getState()')
  check('downloaded file:// viewer works without network',not requests and not errors and offline['glError']==0 and not offline['contextLost'],{'externalRequests':requests,'state':offline})
  complete=True;browser.close()
except Exception as e:
 exception=str(e);traceback.print_exc()
finally:
 server.terminate();server.wait(timeout=10)
 report={'version':'M1.1-B.B02.R1','status':'IMPLEMENTED / REVIEW_PENDING','complete':complete,'passed':complete and all(c['passed'] for c in checks),'checks':checks,'access':access,'screenshots':shots,'errors':errors,'exception':exception,'source_sha':os.getenv('SOURCE_SHA'),'viewer_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'generatedAt':datetime.now(timezone.utc).isoformat(),'environment':'GitHub Actions Ubuntu / Playwright Chromium / SwiftShader WebGL2; desktop + portrait 390x844 viewport (not physical phone). Local container WebGL context was unavailable.'}
 (Q/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if not report['passed']:raise AssertionError('B02 focused browser checks failed; inspect actual screenshots before repairing.')
