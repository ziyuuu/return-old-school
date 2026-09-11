"""Focused actual-WebGL QA for the open side-wall roller entrances, not a full-campus retest."""
import os,json,hashlib,shutil,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[3];Q=R/'qa/m11b-shutter-fix';Q.mkdir(parents=True,exist_ok=True)
A=R/'artifacts/m11b-shutter-fix/Yali_M1_1_B_B01_R3_1_Viewer.html'
checks=[];errors=[];shots=[];complete=False

def check(name,value,detail=None):
 checks.append({'name':name,'passed':bool(value),'detail':detail});print(name,bool(value),str(detail)[:160] if not value else '',flush=True)
S=subprocess.Popen(['python','-m','http.server','8776','--bind','127.0.0.1','--directory',str(A.parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as pw:
  options={'headless':True,'args':['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']}
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  b=pw.chromium.launch(**options)
  page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
  page.goto('http://127.0.0.1:8776/'+A.name+'?clean=1',timeout=120000)
  page.wait_for_function('window.__YALI_R3__?.ready',timeout=120000)
  check('correct repaired WebGL model',page.evaluate('window.__YALI_R3__.model.shutterFix && window.__YALI_R3__.report.passed'))
  result=page.evaluate('''()=>{
   const a=window.__YALI_R3__,e=a.r3.entrances,out=[];
   for(const [i,d] of a.model.access.entries()) {
    const sign=i?1:-1,[x,Y,z]=d.door,bad=[];let probes=0;
    const clear=(u,v,label)=>{probes++;const hits=a.probe(u,v);if(hits.length)bad.push({label,hits});};
    // Sample nearly the entire opening, not just its centre.
    for(const dz of [-1.15,0,1.15])for(const h of [.3,1.5,2.7])clear([x+sign*.5,Y+h,z+dz],[x-sign*.5,Y+h,z+dz],'side roller');
    const oldX=73+e.doorCentersX[i];probes++;
    if(!a.probe([oldX,Y+1.3,218.6],[oldX,Y+1.3,219.5]).length)bad.push({label:'back wall still open'});
    for(const q of d.stepProbes)for(const off of [-1.7,0,1.7]){probes++;if(!a.support(q[0]+off,q[1],q[2]).some(h=>Math.abs(h.y-q[1])<.02))bad.push({label:'step support',q,off});}
    for(let i=1;i<d.clearRoute.length;i++) {
     const u=d.clearRoute[i-1],v=d.clearRoute[i],dx=v[0]-u[0],dz=v[2]-u[2],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,N=Math.ceil(len/.5);
     for(const off of [-.4,0,.4]) {
      for(let j=0;j<=N;j++){const x=u[0]+dx*j/N+nx*off,z=u[2]+dz*j/N+nz*off;probes++;if(!a.support(x,u[1],z).some(h=>Math.abs(h.y-u[1])<.02))bad.push({label:'indoor floor',x,z});}
      for(const h of [.35,1.1,1.85])clear([u[0]+nx*off,u[1]+h,u[2]+nz*off],[v[0]+nx*off,v[1]+h,v[2]+nz*off],'indoor clearance');
     }
    }
    // Check rendered column locations and canopy coverage over its outer front corners.
    for(const off of [-e.postSpacing/2,e.postSpacing/2]) {
     const px=oldX+off,pz=224+e.postZ;probes++;
     if(!a.probe([px-.4,Y+1,pz],[px+.4,Y+1,pz]).length)bad.push({label:'post missing/out of position'});
    }
    for(const off of [-2.0,0,2.0]){probes++;if(!a.probe([oldX+off,Y+2.5,216.2],[oldX+off,Y+3.5,216.2]).length)bad.push({label:'canopy outer edge missing'});}
    out.push({id:d.id,probes,bad});
   }
   return out;
  }''')
  for r in result:check(r['id']+' open roller, solid back, enlarged canopy/posts and route into corridor',not r['bad'],r)
  roots=page.evaluate('window.__YALI_M11A__.getRoots()')
  check('five-storey datum and shared main axis retained',roots['15'][0]==roots['18'][0]==roots['08'][0]==73 and roots['15'][1]==roots['25'][1] and page.evaluate('window.__YALI_R3__.model.routes.length')==10)
  page.evaluate('window.__YALI_R3__.setLabels(false)')
  for view in ['r3-west','r3-east','r31-west-door','r31-east-door','r3-porch-plan','r3-overview','r3-front']:
   page.evaluate('(v)=>window.__YALI_R3__.setView(v)',view);page.wait_for_timeout(600)
   page.screenshot(path=str(Q/(view+'.png')),timeout=120000);shots.append(view+'.png');print('screenshot',view,flush=True)
  page.evaluate("window.__YALI_R3__.setView('r3-east');document.body.classList.remove('clean')")
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(650);page.screenshot(path=str(Q/'mobile.png'),timeout=120000);shots.append('mobile.png')
  check('mobile viewport',page.evaluate('document.querySelector("#viewport canvas").clientWidth===390&&document.documentElement.scrollWidth<=390'))
  page.goto(A.as_uri(),timeout=120000);page.wait_for_function('window.__YALI_R3__?.ready',timeout=120000)
  state=page.evaluate('window.__YALI_R3__.getState()')
  check('offline file renders without JS or WebGL errors',not errors and state['glError']==0 and not state['contextLost'],state)
  complete=True;b.close()
finally:
 S.terminate();S.wait(timeout=10)
 report={'version':'M1.1-B.Batch01.R3.1','passed':complete and all(c['passed'] for c in checks),'complete':complete,'checks':checks,'screenshots':shots,'errors':errors,'source_sha':os.getenv('SOURCE_SHA'),'viewer_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'alumniReview':'REVIEW_PENDING','environment':'Playwright Chromium / SwiftShader WebGL2, desktop1440x1000 / mobile390x844'}
 (Q/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if not report['passed']:raise AssertionError('Focused WebGL check failed')
