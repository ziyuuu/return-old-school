"""Chromium WebGL QA on the actual standalone build; screenshots precede assertion exit."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, sys, time
ROOT=Path(__file__).resolve().parents[2]; QA=ROOT/'qa/m11b-b01'; QA.mkdir(parents=True,exist_ok=True)
FILE=ROOT/'artifacts/m11b-b01/Yali_M1_1_B_Batch01_Viewer.html'
checks=[]; errors=[]; shots=[]
def check(name,ok,detail=None): checks.append(dict(id=name,passed=bool(ok),detail=detail))
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 try:
  page.goto(FILE.as_uri(),wait_until='load',timeout=60000);page.wait_for_function('window.__YALI_B01__?.ready',timeout=60000)
  state=page.evaluate('window.__YALI_B01__.getState()');check('WEBGL2_BOOT',state['webgl'].startswith('WebGL 2') and not state['contextLost'],state)
  page.evaluate("document.body.classList.add('clean');window.__YALI_B01__.setLabels(false)")
  views=['b01-oblique','b01-front','b01-entry','b01-rear','b01-terrace','b01-toilet','b01-bridge','b01-floor2','b01-underpass','b01-overview','p04-courts','p04-flags','p04-shop','p03-gate-out','p03-edge','gym-p02-front']
  for name in views:
   page.evaluate('(v)=>window.__YALI_B01__.setView(v)',name);page.wait_for_timeout(900);page.evaluate('window.__YALI_B01__.renderNow()')
   file=name+'.png';page.screenshot(path=str(QA/file));shots.append(dict(view=name,file=file,viewport=[1440,900],source='Chromium WebGL'))
  page.evaluate("window.__YALI_B01__.setView('b01-oblique')")
  result=page.evaluate('''() => {
   const api=window.__YALI_B01__,results=[];
   for(const route of api.model.routes){let unsupported=[],blocked=[];
    for(let i=1;i<route.points.length;i++){
     const a=route.points[i-1],b=route.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.7);
     for(let j=0;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[2]+(b[2]-a[2])*j/n;
      for(const [dx,dz]of [[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]])if(!api.support(x+dx,a[1],z+dz).some(h=>Math.abs(h.y-a[1])<.02))unsupported.push([x+dx,a[1],z+dz]);}
     for(const h of [.4,1.1,1.8]){const hits=api.probe([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]]);if(hits.length)blocked.push(hits.slice(0,3));}
    }
    results.push({id:route.id+'-ACTUAL-MESH',passed:!unsupported.length&&!blocked.length,detail:{unsupported:unsupported.slice(0,6),blocked:blocked.slice(0,3)}});
   }
   const y=api.model.mainFloor;
   for(const [id,a,b]of [['UNDERPASS',[6.5,y+1.7,216],[6.5,y+1.7,239]],['REAR-DOOR',[69,y+1.7,224],[69,y+1.7,235]],['TERRACE-DOOR',[69,y+13.14,224],[69,y+13.14,230]]]){const hits=api.probe(a,b);results.push({id,passed:hits.length===0,detail:hits.slice(0,5)});}
   return results;
  }''');checks.extend(result)
  result=page.evaluate('''()=>{const a=window.__YALI_B01__,t=window.__YALI_M11A__,r=[];
   for(const [name,x,y,z]of [['court-a',-45,3.34,100],['court-b',-25,3.34,140],['sports-a',73,1.84,70],['sports-b',73,1.84,160],['terrace',95,a.model.mainFloor+11.44,229],['shop',152.5,t.model.anchors['12'].floor+.04,149]])r.push({id:'SUPPORT-'+name,passed:a.support(x,y,z).some(v=>Math.abs(v.y-y)<.025),detail:a.support(x,y,z)});
   for(const [name,x0,z0,x1,z1]of [['court-east',-5.5,120,-11,120],['court-canopy',-66,120,-64,120],['shop',148,149,153,149]]){let failed=[];for(let i=0;i<=22;i++){const x=x0+(x1-x0)*i/22,z=z0+(z1-z0)*i/22,y=name==='shop'?t.model.anchors['12'].floor+.04:t.model.walkHeight(x,z);if(!a.support(x,y,z).some(v=>Math.abs(v.y-y)<.06))failed.push([x,y,z]);}r.push({id:'ACCESS-'+name,passed:!failed.length,detail:failed});}
   r.push({id:'THREE-ACTUAL-FLAGPOLES',passed:a.countFlags()===3,detail:a.countFlags()});
   for(const z of [2,6,10,18,26,34,40,44,55,95,170])for(const x of [-3.4,0,3.4]){const y=t.model.groundHeight(x,z)+.04;r.push({id:'ROAD-SUPPORT-'+x+'-'+z,passed:a.support(x,y,z).some(v=>Math.abs(v.y-y)<.03)});}
   const route=window.__YALI_P02__.galleryRoute();let missed=route.filter(q=>!a.support(q[0],q[1]+.04,q[2]).length);r.push({id:'GYM-GALLERY-SUPPORT',passed:!missed.length,detail:missed.slice(0,4)});
   return r;}''');checks.extend(result)
  page.evaluate("window.__YALI_B01__.setView('b01-floor2')");check('CUTAWAY-ACTIVE',page.evaluate("window.__YALI_M10__.getState().toiletLevel===2"))
  page.evaluate("window.__YALI_B01__.setView('b01-oblique')");check('CUTAWAY-RESTORED',page.evaluate("window.__YALI_M10__.getState().toiletLevel===0"))
  check('NO-WEBGL-ERROR',page.evaluate('window.__YALI_B01__.getState().glError===0'))
  (QA/'geometry-snapshot.json').write_text(json.dumps(page.evaluate('window.__YALI_B01__.snapshot()'),ensure_ascii=False,indent=2))
  mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  mobile.on('pageerror',lambda e:errors.append(str(e)));mobile.goto(FILE.as_uri(),wait_until='load',timeout=60000);mobile.wait_for_function('window.__YALI_B01__?.ready',timeout=60000);mobile.wait_for_timeout(1600)
  mobile.screenshot(path=str(QA/'mobile.png'));shots.append(dict(view='mobile',file='mobile.png',viewport=[390,844],source='Chromium mobile viewport'))
  check('MOBILE-WEBGL',mobile.evaluate('!window.__YALI_B01__.getState().contextLost'))
  check('MOBILE-NO-OVERFLOW',mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  mobile.get_by_role('button',name='主楼正面',exact=True).click();mobile.wait_for_timeout(500);check('MOBILE-CAMERA-CONTROL',mobile.evaluate("window.__YALI_B01__.getState().view==='b01-front'"));mobile.close()
  check('NO-PAGE-ERRORS',not errors,errors)
 except Exception as e:
  errors.append(str(e));check('BROWSER-EXECUTION',False,str(e));page.screenshot(path=str(QA/'browser-error.png'))
 browser.close()
report=dict(complete=True,passed=all(c['passed'] for c in checks) and not errors,checks=checks,errors=errors,screenshots=shots,engine='Playwright Chromium / SwiftShader',deviceNote='Desktop and mobile viewport, not a physical phone GPU benchmark')
(QA/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':report['passed'],'checks':len(checks),'failed':[c for c in checks if not c['passed']],'screenshots':len(shots)},ensure_ascii=False))
sys.exit(0 if report['passed'] else 1)
