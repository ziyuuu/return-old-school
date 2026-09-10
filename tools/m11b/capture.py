"""Real Playwright/Chromium WebGL QA. Captures the exact bundled HTML, not a mock."""
import json, os, subprocess, time, hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2]; Q=R/'qa/m11b-b01'; Q.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/m11b-b01/Yali_M1_1_B_Batch01_Viewer.html'
checks=[];errors=[];shots=[];done=False

def check(name,ok,detail=None):
    checks.append({'name':name,'passed':bool(ok),'detail':detail})
    print(name,bool(ok),str(detail)[:150] if not ok else '',flush=True)
    # Retain every probe failure, but collect real diagnostic screenshots before failing.

def save(name,obj): (Q/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2))

server=subprocess.Popen(['python','-m','http.server','8772','--directory',str(R/'artifacts/m11b-b01')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
  page.goto('http://127.0.0.1:8772/'+A.name+'?clean=1',wait_until='load',timeout=120000)
  page.wait_for_function('window.__YALI_B01__?.ready',timeout=120000);page.wait_for_timeout(800)
  check('WebGL2 startup',page.evaluate('!window.__YALI_B01__.getState().contextLost'))
  check('B01 model report',page.evaluate('window.__YALI_B01__.report.passed'))
  check('P3 vertical report',page.evaluate('window.__YALI_P03__.report.passed'))
  check('default P4 accepted base',page.evaluate('window.__YALI_B01__.getState().verticalScheme')=='patch04')
  check('three actual flagpoles',page.evaluate('window.__YALI_B01__.countFlags()')==3)
  roots=page.evaluate('window.__YALI_M11A__.getRoots()');save('root-anchors.json',roots)
  check('main-toilet datum equal',roots['15'][1]==roots['25'][1])
  check('gym-music datum equal',roots['03'][1]==roots['24'][1])
  check('courts raised over canopy',abs(roots['06'][1]-roots['05'][1]-.3)<1e-7)
  check('field below apron',abs(roots['08'][1]-1.8)<1e-7 and abs(roots['03'][1]-3.6)<1e-7)
  # Actual Three.js raycasts against all visible meshes, including InstancedMesh details.
  route=page.evaluate('''()=>{const a=window.__YALI_B01__,bad=[],rows=[];let probes=0;for(const r of a.model.routes){for(let i=1;i<r.points.length;i++){const u=r.points[i-1],v=r.points[i],n=Math.ceil(Math.hypot(v[0]-u[0],v[2]-u[2])/1.5);for(let j=0;j<=n;j++){const x=u[0]+(v[0]-u[0])*j/n,z=u[2]+(v[2]-u[2])*j/n;const hits=a.support(x,u[1],z);probes++;if(!hits.some(h=>Math.abs(h.y-u[1])<.012))bad.push({route:r.id,kind:'support',x,z,hits});}for(const h of [.35,1.05,1.75]){const hits=a.probe([u[0],u[1]+h,u[2]],[v[0],v[1]+h,v[2]]);probes++;if(hits.length)bad.push({route:r.id,kind:'clearance',i,h,hits:hits.slice(0,3)});}}rows.push(r.id);}return{routes:rows,probes,bad};}''')
  save('bridge-door-probes.json',route);check('4 floors / 8 supported clear door routes',not route['bad'],route)
  probes=page.evaluate('''()=>{const a=window.__YALI_B01__,y=a.model.mainFloor,ty=y+11.44;return{underpass:a.probe([6.5,y+1.7,216],[6.5,y+1.7,239]),front:a.probe([69,y+1.7,214],[69,y+1.7,222]),rear:a.probe([69,y+1.7,224],[69,y+1.7,235]),terraceDoor:a.probe([69,ty+1.7,224],[69,ty+1.7,230]),terraceSky:a.probe([95,ty+1,229],[95,ty+12,229]),terraceFloor:a.support(95,ty,229)};}''')
  save('main-portals-terrace.json',probes)
  for key in ['underpass','front','rear','terraceDoor','terraceSky']:check('actual clear '+key,not probes[key],probes[key])
  check('terrace actual supported floor',any(abs(h['y']-(roots['15'][1]+11.44))<.012 for h in probes['terraceFloor']))
  # Probe road interiors at centre and both width edges. Inset terminal samples 5mm
  # because Float32 mesh endpoints can round ~1e-5m outside double-precision rays.
  # This is a sampling tolerance, not a geometry/topology change.
  road=page.evaluate('''()=>{const a=window.__YALI_M11A__,bad=[];let probes=0;for(const r of a.model.profiles){const f=r.samples[0],e=r.samples.at(-1),len=Math.hypot(e.x-f.x,e.z-f.z),dx=(e.x-f.x)/len,dz=(e.z-f.z)/len;for(let j=0;j<r.samples.length;j+=8){const q=r.samples[j],eps=j===0?.005:j===r.samples.length-1?-.005:0;for(const d of [0,-r.width/2+.12,r.width/2-.12]){const x=q.x+dx*eps+dz*d,z=q.z+dz*eps-dx*d,hits=a.probeGround(x,z);probes++;if(!hits.some(h=>h.name.startsWith('M11A-road-')))bad.push({from:r.from,to:r.to,x,z});}}}return{probes,bad};}''')
  road['terminal_sample_inset_m']=.005;save('road-support.json',road);check('all inherited road widths supported',not road['bad'],road)
  grade=page.evaluate('''()=>{const a=window.__YALI_M11A__,v=z=>a.probeGround(0,z).find(h=>h.name.startsWith('M11A-road-'))?.y;return[v(2),v(44)];}''');check('entrance42m rises3m in actual mesh',all(v is not None for v in grade) and abs(grade[1]-grade[0]-3)<.01,grade)
  stairs=page.evaluate('''()=>{const a=window.__YALI_M11A__,bad=[];let count=0;for(const s of a.model.stairs){for(let i=0;i<s.steps;i++){const t=(i+.5)/s.steps,x=s.start[0]+(s.end[0]-s.start[0])*t,z=s.start[1]+(s.end[1]-s.start[1])*t,y=s.base+.04+(i+1)*s.rise/s.steps;count++;const hits=a.probeGround(x,z);if(!hits.some(h=>h.name===s.id+'-step-'+(i+1)&&Math.abs(h.y-y)<.01))bad.push({id:s.id,i,x,z,y,hits});}}return{count,bad};}''');save('site-step-support.json',stairs);check('all field and site stairs supported',not stairs['bad'],stairs)
  gym=page.evaluate('''()=>{const a=window.__YALI_P02__,bad=[],r=a.galleryRoute();for(const q of r)if(!a.support(...q).some(h=>Math.abs(h.y-q[1])<.015))bad.push(q);return{points:r.length,bad};}''');save('gym-stair-support.json',gym);check('gym spectator stair retained',not gym['bad'],gym)
  views=['b01-front','b01-oblique','b01-entry','b01-rear','b01-terrace','b01-toilet','b01-bridge','b01-floor2','b01-underpass','b01-overview','p04-courts','p04-flags','p04-shop','p03-gate-out','p03-edge','gym-p02-stair','top']
  page.evaluate('window.__YALI_B01__.setLabels(false)')
  for view in views:
   page.evaluate('(v)=>window.__YALI_B01__.setView(v)',view);page.wait_for_timeout(650)
   page.screenshot(path=str(Q/(view+'.png')),timeout=120000);shots.append(view+'.png')
   check('captured '+view,True)
  page.evaluate("window.__YALI_B01__.setView('b01-floor2')")
  snap=page.evaluate('window.__YALI_B01__.snapshot()');save('section-snapshot.json',snap)
  check('upper floors hidden by section',not snap['B01-15-level-3']['visible'] and not snap['B01-25-level-3']['visible'])
  page.evaluate("window.__YALI_B01__.setSection(0);window.__YALI_B01__.setView('b01-oblique');document.body.classList.remove('clean')")
  page.wait_for_timeout(400);page.screenshot(path=str(Q/'desktop-ui.png'),timeout=120000);shots.append('desktop-ui.png')
  page.locator('#inspect-btn').click();check('inspector opens',page.locator('#inspector').is_visible());page.locator('#close-inspector').click()
  page.set_viewport_size({'width':390,'height':844});page.evaluate("window.__YALI_B01__.setView('b01-oblique')");page.wait_for_timeout(800)
  page.screenshot(path=str(Q/'mobile.png'),timeout=120000);shots.append('mobile.png')
  check('mobile canvas viewport',page.evaluate('document.querySelector("#viewport canvas").clientWidth')==390)
  check('mobile has no horizontal document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  page.goto(A.as_uri(),wait_until='load',timeout=120000);page.wait_for_function('window.__YALI_B01__?.ready');page.wait_for_timeout(400)
  check('offline file startup',page.evaluate('window.__YALI_B01__.getState().verticalScheme')=='patch04')
  state=page.evaluate('window.__YALI_B01__.getState()');save('renderer-state.json',state)
  check('WebGL no final error',state['glError']==0 and not state['contextLost'],state)
  check('no JS/shader console errors',not errors,errors)
  done=True;browser.close()
finally:
 server.terminate();server.wait(timeout=10)
 save('browser-report.json',{'version':'M1.1-B.Batch01','complete':done,'passed':done and all(c['passed'] for c in checks),'checks':checks,'errors':errors,'screenshots':shots,'source_sha':os.getenv('SOURCE_SHA',os.getenv('GITHUB_SHA')),'viewer_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'environment':'Playwright Chromium / SwiftShader software WebGL2; desktop1440x1000 and mobile viewport390x844','note':'Geometry/visual QA, not a physical phone performance claim. Alumni review for B01 remains pending.'})

if not done or not all(c['passed'] for c in checks):
 raise AssertionError('Browser QA failures: '+', '.join(c['name'] for c in checks if not c['passed']))
