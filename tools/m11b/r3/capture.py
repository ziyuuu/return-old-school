"""Execute the actual offline bundle in Chromium. Always preserve diagnostic screenshots."""
import os,json,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[3];Q=R/'qa/m11b-b01-r3';Q.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/m11b-b01-r3/Yali_M1_1_B_B01_R3_Viewer.html';checks=[];errors=[];shots=[];complete=False
save=lambda n,x:(Q/n).write_text(json.dumps(x,ensure_ascii=False,indent=2))
def check(n,v,d=None):
 checks.append({'name':n,'passed':bool(v),'detail':d});print(n,bool(v),str(d)[:180]if not v else '',flush=True)
S=subprocess.Popen(['python','-m','http.server','8774','--directory',str(A.parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:errors.append(e.text)if e.type=='error'else None)
  page.goto('http://127.0.0.1:8774/'+A.name+'?clean=1',timeout=120000);page.wait_for_function('window.__YALI_R3__?.ready',timeout=120000);page.wait_for_timeout(500)
  check('R3 actual WebGL model startup',page.evaluate('window.__YALI_R3__.report.passed && !window.__YALI_R3__.getState().contextLost'))
  roots=page.evaluate('window.__YALI_M11A__.getRoots()');save('root-anchors.json',roots)
  check('R2 axis and building anchors retained',roots['15'][0]==roots['18'][0]==roots['08'][0]==73 and roots['15'][1]==roots['25'][1]==3.45)
  check('P3/P4 sports gym/music anchors retained',roots['08'][1]==1.8 and roots['06'][1]==3.3 and roots['03'][1]==roots['24'][1]==3.6)
  doors=page.evaluate('''()=>{const a=window.__YALI_R3__,bad=[];let probes=0;for(const A of a.model.access){for(const q of A.stepProbes)for(const d of [-1.4,0,1.4]){probes++;if(!a.support(q[0]+d,q[1],q[2]).some(h=>Math.abs(h.y-q[1])<.015&&h.role==='entrance-step'))bad.push({id:A.id,kind:'step',q,d});}for(let i=1;i<A.clearRoute.length;i++){const u=A.clearRoute[i-1],v=A.clearRoute[i],n=Math.ceil(Math.hypot(v[0]-u[0],v[2]-u[2])/.3);for(let j=0;j<=n;j++)for(const d of [-.55,0,.55]){probes++;const x=u[0]+(v[0]-u[0])*j/n+d,z=u[2]+(v[2]-u[2])*j/n;if(!a.support(x,u[1],z).some(h=>Math.abs(h.y-u[1])<.015))bad.push({id:A.id,kind:'floor',x,z});}for(const h of [.45,1.1,1.8])for(const d of [-.55,0,.55]){probes++;const hits=a.probe([u[0]+d,u[1]+h,u[2]],[v[0]+d,v[1]+h,v[2]]);if(hits.length)bad.push({id:A.id,kind:'clearance',hits});}}for(let j=0;j<=12;j++){const [u,v]=A.apron,x=u[0],z=u[1]+(v[1]-u[1])*j/12,y=a.terrain.groundHeight(x,z)+.041;probes++;if(!a.support(x,y,z).some(h=>Math.abs(h.y-y)<.035))bad.push({id:A.id,kind:'apron',x,z,y});}}return{probes,bad};}''')
  save('front-door-support-clearance.json',doors);check('both front entrances steps/landing/corridor full-width support and clearance',not doors['bad'],doors)
  walls=page.evaluate('''()=>{const a=window.__YALI_R3__,bad=[];for(let l=1;l<=5;l++)for(const s of [-1,1]){const x=73+s*44.5,y=a.model.mainFloor+(l-1)*3.8+1.7,hits=a.probe([x-.6,y,215.6],[x+.6,y,215.6]);if(!hits.some(h=>h.name.includes('continuing-body-wall')))bad.push({l,s,hits});}return{probes:10,bad};}''')
  save('forward-five-storey-walls.json',walls);check('five-storey walls actually extend beyond both canopies',not walls['bad'],walls)
  bases=page.evaluate('''()=>{const a=window.__YALI_R3__,bad=[];for(const s of [-1,1]){const x=73+s*44.5,hits=a.probe([x-.6,3.15,215.6],[x+.6,3.15,215.6]);if(!hits.some(h=>h.name.includes('foundation')))bad.push({s,hits});}return{probes:2,bad};}''')
  save('wall-foundation-probes.json',bases);check('wall feet have real foundations below lowered entrance aprons',not bases['bad'],bases)
  curve=page.evaluate('''()=>{const a=window.__YALI_R3__,p=a.r3.central,R=(p.halfWidth**2+p.sagitta**2)/(2*p.sagitta),rows=[],bad=[];for(const x of [-4,-3,0,3,4]){const z=224+p.apexZ+R-Math.sqrt(R*R-x*x),y=a.model.mainFloor+7.6+.35,hits=a.probe([73+x,y,213],[73+x,y,217]),hit=hits.find(h=>h.name.includes('central-curved-wall')),actual=hit?213+hit.distance:null;rows.push({x,expected:z,actual});if(actual===null||Math.abs(actual-z)>.004)bad.push(x);}return{rows,bad};}''')
  save('actual-arc-surface.json',curve);check('actual curved facade follows shallow arc, not flat metadata',not curve['bad'],curve)
  route=page.evaluate('''()=>{const a=window.__YALI_R3__,bad=[];let probes=0;for(const r of a.model.routes)for(let i=1;i<r.points.length;i++){const u=r.points[i-1],v=r.points[i],n=Math.ceil(Math.hypot(v[0]-u[0],v[2]-u[2]));for(let j=0;j<=n;j++){const x=u[0]+(v[0]-u[0])*j/n,z=u[2]+(v[2]-u[2])*j/n;probes++;if(!a.support(x,u[1],z).some(h=>Math.abs(h.y-u[1])<.012))bad.push({id:r.id,kind:'support',x,z});}for(const h of [.4,1.1,1.8]){probes++;const hits=a.probe([u[0],u[1]+h,u[2]],[v[0],v[1]+h,v[2]]);if(hits.length)bad.push({id:r.id,kind:'clear',hits});}}return{routes:a.model.routes.length,probes,bad};}''')
  save('five-floor-bridge-probes.json',route);check('R2 five floors and ten toilet routes still supported and open',route['routes']==10 and not route['bad'],route)
  space=page.evaluate('''()=>{const a=window.__YALI_R3__,y=a.model.mainFloor+.04,y4=y+11.4;return{front:a.probe([73,y+1.7,213],[73,y+1.7,224]),rear:a.probe([73,y+1.7,224],[73,y+1.7,235]),retiredEast:a.probe([123,y+1.7,224],[121,y+1.7,224]),underpass:a.probe([6.5,y+1.7,216],[6.5,y+1.7,239]),library:a.probe([73,5.5,239],[73,5.5,246.5]),sky:a.probe([91,y4+.6,228],[91,y4+15,228]),cover:a.probe([91,y4+1,224],[91,y4+4,224]),terrace:a.support(91,y4,228)};}''')
  save('inherited-spatial-probes.json',space)
  for key in ['front','rear','underpass','library','sky']:check('inherited clear '+key,not space[key],space[key])
  check('old mountain-wall exit is now solid',bool(space['retiredEast']));check('fourth terrace supported, fifth covers corridor only',bool(space['terrace'])and bool(space['cover']))
  road=page.evaluate('''()=>{const a=window.__YALI_M11A__,bad=[];let probes=0;for(const r of a.model.profiles){const f=r.samples[0],e=r.samples.at(-1),len=Math.hypot(e.x-f.x,e.z-f.z),dx=(e.x-f.x)/len,dz=(e.z-f.z)/len;for(let j=0;j<r.samples.length;j+=8){const q=r.samples[j],eps=j===0?.005:j===r.samples.length-1?-.005:0;for(const d of [0,-r.width/2+.12,r.width/2-.12]){const x=q.x+dx*eps+dz*d,z=q.z+dz*eps-dx*d;probes++;if(!a.probeGround(x,z).some(h=>h.name.startsWith('M11A-road-')))bad.push({from:r.from,to:r.to,x,z});}}}return{probes,bad};}''')
  save('road-width-probes.json',road);check('all inherited road widths supported',not road['bad'],road)
  grade=page.evaluate('''()=>{const a=window.__YALI_M11A__,v=z=>a.probeGround(0,z).find(h=>h.name.startsWith('M11A-road-'))?.y;return[v(2),v(44)];}''');check('P3 entrance42m still rises3m',None not in grade and abs(grade[1]-grade[0]-3)<.01,grade)
  gym=page.evaluate('''()=>{const a=window.__YALI_P02__,bad=[],r=a.galleryRoute();for(const q of r)if(!a.support(...q).some(h=>Math.abs(h.y-q[1])<.015))bad.push(q);return{points:r.length,bad};}''');save('gym-stair-probes.json',gym);check('gym spectator stair retained',not gym['bad'],gym)
  page.evaluate('window.__YALI_R3__.setLabels(false)')
  views=['r3-front','r3-overview','r3-west','r3-east','r3-west-front','r3-east-front','r3-wall','r3-porch-plan','r3-arc','r3-arc-plan','r3-axis','r3-section','r2-terrace','r2-fifth','r2-bridge5','p04-courts','p03-gate-out']
  for view in views:
   page.evaluate('(v)=>window.__YALI_R3__.setView(v)',view);page.wait_for_timeout(650);page.screenshot(path=str(Q/(view+'.png')),timeout=120000);shots.append(view+'.png');print('screenshot',view,flush=True)
  check('captured17 fixed model views',len(shots)==17)
  page.evaluate("window.__YALI_R3__.setView('r3-porch-plan')");check('first-floor notch view hides upper floors',page.evaluate('window.__YALI_R3__.detailState().level')==1)
  page.evaluate("window.__YALI_R3__.setView('r3-overview');document.body.classList.remove('clean')");page.wait_for_timeout(500);page.screenshot(path=str(Q/'desktop-ui.png'),timeout=120000);shots.append('desktop-ui.png')
  page.locator('#inspect-btn').click();check('inspector accessible',page.locator('#inspector').is_visible());page.locator('#toilet-level').select_option('5');check('five floors remain selectable',page.evaluate('window.__YALI_R3__.detailState().level')==5);page.locator('#close-inspector').click()
  page.locator('[data-view="r3-west"]').click();check('actual new camera button',page.evaluate('window.__YALI_R3__.getState().view')=='r3-west')
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-view="r3-overview"]').click();page.wait_for_timeout(700);page.screenshot(path=str(Q/'mobile.png'),timeout=120000);shots.append('mobile.png')
  check('mobile viewport and no horizontal overflow',page.evaluate('document.querySelector("#viewport canvas").clientWidth===390&&document.documentElement.scrollWidth<=innerWidth'))
  page.goto(A.as_uri(),timeout=120000);page.wait_for_function('window.__YALI_R3__?.ready',timeout=120000);state=page.evaluate('window.__YALI_R3__.getState()');save('renderer-state.json',state)
  check('offline HTML default P4 and R3',state['verticalScheme']=='patch04'and state['view']=='r3-overview');check('no WebGL error',state['glError']==0 and not state['contextLost'],state);check('no JS or shader error',not errors,errors)
  complete=True;b.close()
finally:
 S.terminate();S.wait(timeout=10)
 save('browser-report.json',{'version':'M1.1-B.Batch01.R3','complete':complete,'passed':complete and all(c['passed']for c in checks),'checks':checks,'screenshots':shots,'errors':errors,'source_sha':os.getenv('SOURCE_SHA',os.getenv('GITHUB_SHA')),'viewer_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'environment':'Playwright Chromium / SwiftShader WebGL2;1440x1000 and390x844 viewport','alumniReview':'REVIEW_PENDING'})
if not complete or not all(c['passed']for c in checks):raise AssertionError('Browser failures: '+', '.join(c['name']for c in checks if not c['passed']))
