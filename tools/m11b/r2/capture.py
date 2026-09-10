"""Actual Chromium/WebGL checks and screenshots of the shipped single-file Viewer."""
from pathlib import Path
import json,os,hashlib,subprocess
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[3];Q=R/'qa/m11b-b01-r2';Q.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/m11b-b01-r2/Yali_M1_1_B_B01_R2_Viewer.html'
checks=[];errors=[];shots=[];complete=False
save=lambda name,obj:(Q/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def check(name,ok,detail=None):
 checks.append({'name':name,'passed':bool(ok),'detail':detail});print(name,bool(ok),str(detail)[:180] if not ok else '',flush=True)
S=subprocess.Popen(['python','-m','http.server','8876','--directory',str(A.parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as p:
  options={'headless':True,'args':['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']}
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**options);page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:errors.append(e.text)if e.type=='error' else None)
  page.goto('http://127.0.0.1:8876/'+A.name+'?clean=1',timeout=120000);page.wait_for_function('window.__YALI_R2__?.ready',timeout=120000)
  check('WebGL2 startup',page.evaluate('!window.__YALI_R2__.getState().contextLost'))
  check('R2 effective model checks',page.evaluate('window.__YALI_R2__.report.passed'))
  check('P3 accepted vertical checks',page.evaluate('window.__YALI_P03__.report.passed'))
  roots=page.evaluate('window.__YALI_M11A__.getRoots()');save('root-anchors.json',roots)
  snap=page.evaluate('window.__YALI_R2__.snapshot()');pole=snap['P04-flagpole-1'];flag_x=(pole['min'][0]+pole['max'][0])/2
  check('four physical axis nodes share X73',all(abs(x-73)<1e-6 for x in [roots['08'][0],flag_x,roots['15'][0],roots['18'][0]]),{'08':roots['08'][0],'flag':flag_x,'15':roots['15'][0],'18':roots['18'][0]})
  check('three actual flagpoles',page.evaluate('window.__YALI_R2__.countFlags()')==3)
  check('central national flag is distinct from neutral side flags','R2-national-flag' in snap and not snap['P04-flag-cloth-placeholder-1']['visible'])
  check('main and toilet floor datum retained',roots['15'][1]==roots['25'][1] and abs(roots['15'][1]-3.45)<1e-7)
  check('sports and gym datums retained',abs(roots['08'][1]-1.8)<1e-7 and abs(roots['06'][1]-3.3)<1e-7 and roots['03'][1]==roots['24'][1]==3.6)
  route=page.evaluate('''()=>{const a=window.__YALI_R2__,bad=[];let probes=0;for(const r of a.model.routes)for(let i=1;i<r.points.length;i++){const u=r.points[i-1],v=r.points[i],n=Math.ceil(Math.hypot(v[0]-u[0],v[2]-u[2]));for(let j=0;j<=n;j++){const x=u[0]+(v[0]-u[0])*j/n,z=u[2]+(v[2]-u[2])*j/n,hits=a.support(x,u[1],z);probes++;if(!hits.some(h=>Math.abs(h.y-u[1])<.012))bad.push({route:r.id,kind:'support',x,z,hits});}for(const h of [.4,1.1,1.8]){const hits=a.probe([u[0],u[1]+h,u[2]],[v[0],v[1]+h,v[2]]);probes++;if(hits.length)bad.push({route:r.id,kind:'clearance',hits:hits.slice(0,3)});}}return{routes:a.model.routes.length,probes,bad};}''')
  save('five-floor-route-probes.json',route);check('five floors / ten supported clear toilet routes',route['routes']==10 and not route['bad'],route)
  spatial=page.evaluate('''()=>{const a=window.__YALI_R2__,y=a.model.mainFloor+.04,y4=y+11.4,y5=y+15.2;return {front:a.probe([73,y+1.7,213],[73,y+1.7,224]),rear:a.probe([73,y+1.7,224],[73,y+1.7,235]),side:a.probe([126,y+1.7,224],[119,y+1.7,224]),underpass:a.probe([6.5,y+1.7,216],[6.5,y+1.7,239]),library:a.probe([73,5.5,239],[73,5.5,246.5]),terraceSky:a.probe([91,y4+.6,228],[91,y4+15,228]),corridorCover:a.probe([91,y4+1,224],[91,y4+4,224]),terraceFloor:a.support(91,y4,228),upperFloor:a.support(91,y5,224),porchFloor:a.support(122.8,y,224)};}''')
  save('section-and-door-probes.json',spatial)
  for key in ['front','rear','side','underpass','library','terraceSky']:check('actual clear '+key,not spatial[key],spatial[key])
  check('fifth floor covers fourth corridor',bool(spatial['corridorCover']))
  for key in ['terraceFloor','upperFloor','porchFloor']:check('actual floor '+key,bool(spatial[key]),spatial[key])
  road=page.evaluate('''()=>{const a=window.__YALI_M11A__,bad=[];let probes=0;for(const r of a.model.profiles){const f=r.samples[0],e=r.samples.at(-1),len=Math.hypot(e.x-f.x,e.z-f.z),dx=(e.x-f.x)/len,dz=(e.z-f.z)/len;for(let j=0;j<r.samples.length;j+=8){const q=r.samples[j],eps=j===0?.005:j===r.samples.length-1?-.005:0;for(const d of [0,-r.width/2+.12,r.width/2-.12]){const x=q.x+dx*eps+dz*d,z=q.z+dz*eps-dx*d,hits=a.probeGround(x,z);probes++;if(!hits.some(h=>h.name.startsWith('M11A-road-')))bad.push({from:r.from,to:r.to,x,z});}}}return{probes,bad};}''')
  save('road-support.json',road);check('all road widths supported including moved door spurs',not road['bad'],road)
  grade=page.evaluate('''()=>{const a=window.__YALI_M11A__,v=z=>a.probeGround(0,z).find(h=>h.name.startsWith('M11A-road-'))?.y;return[v(2),v(44)];}''');check('P3 42m entrance still rises3m',None not in grade and abs(grade[1]-grade[0]-3)<.01,grade)
  stair=page.evaluate('''()=>{const a=window.__YALI_M11A__,bad=[];let count=0;for(const s of a.model.stairs)for(let i=0;i<s.steps;i++){const t=(i+.5)/s.steps,x=s.start[0]+(s.end[0]-s.start[0])*t,z=s.start[1]+(s.end[1]-s.start[1])*t,y=s.base+.04+(i+1)*s.rise/s.steps;count++;if(!a.probeGround(x,z).some(h=>h.name===s.id+'-step-'+(i+1)&&Math.abs(h.y-y)<.012))bad.push({id:s.id,i});}return{count,bad};}''');save('site-step-probes.json',stair);check('site stairs and shifted library stairs supported',not stair['bad'],stair)
  gym=page.evaluate('''()=>{const a=window.__YALI_P02__,bad=[],r=a.galleryRoute();for(const q of r)if(!a.support(...q).some(h=>Math.abs(h.y-q[1])<.015))bad.push(q);return{points:r.length,bad};}''');save('gym-stair-probes.json',gym);check('gym gallery stair retained',not gym['bad'],gym)
  ends=page.evaluate('''()=>{const a=window.__YALI_R2__;return [2,3,4,5].map(l=>({l,hits:a.probe([123,a.model.mainFloor+(l-1)*3.8+1.7,224],[121,a.model.mainFloor+(l-1)*3.8+1.7,224])}));}''')
  save('east-upper-ends.json',ends);check('upper east ends do not open onto void',all(q['hits']for q in ends),ends)
  glazing=page.evaluate('''()=>{const a=window.__YALI_R2__,q=a.model.parts.find(q=>q.owner==='15'&&q.level===4&&q.role==='glazing'&&Math.abs(q.center[2]+1.4)<.01),x=73+q.center[0]+.3,y=a.model.mainFloor+q.center[1];return a.probe([x,y,225],[x,y,222.2]);}''')
  check('fourth corridor has actual glazing without solid wall behind',any('glazing' in h['name']for h in glazing)and not any('corridor-wall' in h['name']for h in glazing),glazing)
  views=['r2-front','r2-overview','r2-entry','r2-rear','r2-terrace','r2-fifth','r2-section','r2-floor2','r2-side','r2-bridge5','r2-library','r2-axis','b01-underpass','p04-courts','p04-shop','p03-gate-out','p03-edge']
  for view in views:
   page.evaluate('(v)=>window.__YALI_R2__.setView(v)',view);page.wait_for_timeout(700);page.screenshot(path=str(Q/(view+'.png')),timeout=120000);shots.append(view+'.png')
  check('captured all17 requested views',len(shots)==17)
  page.evaluate("window.__YALI_R2__.setView('r2-floor2')");snap=page.evaluate('window.__YALI_R2__.snapshot()')
  check('upper levels hidden in floor2 view',not snap['R2-15-level-3']['visible'] and not snap['R2-25-level-5']['visible'])
  page.evaluate("window.__YALI_R2__.setView('r2-section')");check('section clipping active',page.evaluate('window.__YALI_R2__.detailState().section'))
  page.evaluate("window.__YALI_R2__.setView('r2-overview');document.body.classList.remove('clean')")
  check('section restores full model',not page.evaluate('window.__YALI_R2__.detailState().section'))
  page.wait_for_timeout(500);page.screenshot(path=str(Q/'desktop-ui.png'),timeout=120000);shots.append('desktop-ui.png')
  page.locator('#inspect-btn').click();check('inspector opens',page.locator('#inspector').is_visible());page.locator('#toilet-level').select_option('5');check('fifth level selectable',page.evaluate('window.__YALI_R2__.detailState().level')==5);page.locator('#close-inspector').click()
  page.locator('[data-view="r2-terrace"]').click();check('real terrace camera button',page.evaluate('window.__YALI_R2__.getState().view')=='r2-terrace')
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-view="r2-overview"]').click();page.wait_for_timeout(900);page.screenshot(path=str(Q/'mobile.png'),timeout=120000);shots.append('mobile.png')
  check('mobile canvas matches viewport',page.evaluate('document.querySelector("#viewport canvas").clientWidth')==390);check('no mobile horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  page.goto(A.as_uri(),timeout=120000);page.wait_for_function('window.__YALI_R2__?.ready',timeout=120000);page.wait_for_timeout(300)
  check('offline standalone opens on P4',page.evaluate('window.__YALI_R2__.getState().verticalScheme')=='patch04')
  state=page.evaluate('window.__YALI_R2__.getState()');save('renderer-state.json',state);check('final WebGL healthy',state['glError']==0 and not state['contextLost'],state);check('no JavaScript or shader errors',not errors,errors)
  complete=True;browser.close()
finally:
 S.terminate();S.wait(timeout=10)
 save('browser-report.json',{'version':'M1.1-B.Batch01.R2','complete':complete,'passed':complete and all(c['passed']for c in checks),'checks':checks,'screenshots':shots,'errors':errors,'source_sha':os.getenv('SOURCE_SHA',os.getenv('GITHUB_SHA')),'viewer_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'environment':'Playwright Chromium / SwiftShader WebGL2;1440x1000 and390x844 viewport','alumniReview':'REVIEW_PENDING'})
if not complete or not all(c['passed']for c in checks):raise AssertionError('Actual browser QA failed: '+', '.join(c['name']for c in checks if not c['passed']))
