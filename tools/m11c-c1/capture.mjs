/** Real Chromium test of the exported offline C1 Viewer. Controller tests drive the
 * same Rapier capsule at fixed ticks; keyboard/touch tests exercise DOM input first.
 * Timing of scripted traversal is simulated time, not a hardware FPS measurement. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../../',import.meta.url)),group=process.env.C1_GROUP||'input',phase=process.env.C1_PHASE||'iteration-01';
const out=path.join(root,'qa/m11c-c1',phase,group);fs.mkdirSync(out,{recursive:true});
const viewer=path.join(root,'artifacts/m11c-c1/Yali_C1_R1_Viewer.html'),manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/m11c-c1/viewer-manifest.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(sha(fs.readFileSync(viewer)),manifest.sha256);
const mobile=group==='mobile',fallback=group==='fallback',review=group==='review',viewport=mobile?{width:390,height:844}:{width:1280,height:840};
const report={stage:'C1',version:'R1',status:'IMPLEMENTED / REVIEW_PENDING',phase,group,viewer:path.relative(root,viewer),viewerSHA256:manifest.sha256,sourceCommit:manifest.gitHead,viewport,startedAt:new Date().toISOString(),errors:[],warnings:[],externalRequests:[],screenshots:[],checks:[],passed:false};
const put=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const check=(name,ok,details)=>{report.checks.push({name,passed:Boolean(ok),details});put();assert.ok(ok,name+' '+JSON.stringify(details));};
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:mobile,isMobile:mobile}),page=await context.newPage();page.setDefaultTimeout(180000);
report.environment={browser:browser.version(),node:process.version,runner:process.env.GITHUB_ACTIONS?'GitHub Actions Linux':'local',rendering:'SwiftShader software GPU; not user hardware'};
page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
if(fallback)await page.addInitScript(()=>{const old=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(n){return n==='EXT_clip_control'?null:old.call(this,n);};});
const state=()=>page.evaluate(()=>window.__YALI_C1__.state());
const tick=n=>page.evaluate(n=>{let s;for(let i=0;i<n;i++)s=window.__YALI_C1__.tick(1/60);return s;},n);
const zero=()=>page.evaluate(()=>window.__YALI_C1__.drive({x:0,z:0,run:false},25).end);
async function capture(name){
 console.log(new Date().toISOString(),'capture',name);
 await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__;r.pause();r.renderFrame();r.renderer.getContext().finish();});
 const file=name+'.png';let method='Playwright viewport';
 try{await page.screenshot({path:path.join(out,file),timeout:20000});}
 catch(e){report.warnings.push({name,message:String(e),fallback:'CDP viewport'});const c=await context.newCDPSession(page);const data=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(path.join(out,file),Buffer.from(data.data,'base64'));await c.detach();method='CDP viewport';}
 const gl=await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__,g=r.renderer.getContext();return {error:g.getError(),lost:g.isContextLost(),calls:r.renderer.info.render.calls,triangles:r.renderer.info.render.triangles,lighting:window.__YALI_RENDER__.state()};});
 report.screenshots.push({file,sha256:sha(fs.readFileSync(path.join(out,file))),method,...gl});put();check(name+' WebGL',!gl.error&&!gl.lost&&gl.triangles>0);
}
try{
 const q='?diagnostics=1'+(review?'&view=overview&mode=review&clean=1':'');console.log('open',group,manifest.sha256);
 await page.goto(pathToFileURL(viewer).href+q,{waitUntil:'load',timeout:600000});
 await page.waitForFunction(()=>window.__YALI_C1_READY__===true,null,{timeout:600000});
 await page.evaluate(()=>window.__YALI_RENDER_RAW__.pause());
 report.initial=await state();report.initialization=await page.evaluate(()=>{const {renderer,scene}=window.__YALI_RENDER_RAW__,gl=renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');let tri=0,meshes=0,bytes=0;const gs=new Set();scene.traverseVisible(o=>{if(o.isMesh){meshes++;const g=o.geometry;tri+=(g.index?.count??g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(!gs.has(g)){gs.add(g);bytes+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0);}}});return {modelTriangles:tri,meshes,geometryBytes:bytes,gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),lighting:window.__YALI_RENDER__.state()};});put();
 check('Runtime ready and correct default mode',report.initial.ready&&report.initial.enabled===!review);
 if(group==='input'){
  await zero();await capture('01-third-person-start');
  const before=(await state()).motor.feet;
  await page.locator('#viewport canvas').focus();await page.keyboard.down('w');await tick(120);await page.keyboard.up('w');await zero();
  let s=await state();check('Actual W input moves visible capsule through the gate',s.motor.feet[2]>before[2]+2.9&&s.avatar.visible&&s.motor.grounded,{before,after:s.motor.feet});
  await page.keyboard.down('w');await page.keyboard.down('Shift');await tick(60);await page.keyboard.up('Shift');await page.keyboard.up('w');s=await state();check('Shift run reaches configured speed',s.motor.actualSpeed>2.9,s.motor);
  const route=await page.evaluate(()=>window.__YALI_C1__.walkTo([[0,12],[0,30],[0,44]],true));report.mainRoute=route;check('Main approach and rise by actual motor',route.reason==='complete'&&route.end.motor.feet[1]>2.7&&route.end.motor.grounded,route.end.motor);await capture('02-main-slope-crest');
  await page.keyboard.press('Escape');const paused=(await state()).motor.feet;await tick(120);s=await state();check('Escape pauses physics without drift',s.motor.paused&&Math.hypot(...s.motor.feet.map((v,i)=>v-paused[i]))<1e-8);
  await capture('03-pause-help');await page.locator('#c1-resume').click();await page.keyboard.press('v');await tick(1);s=await state();check('First person hides mannequin',s.camera.firstPerson&&!s.avatar.visible);await capture('04-first-person');
  await page.keyboard.press('v');await page.keyboard.press('r');await zero();s=await state();check('R resets to selected checkpoint',Math.abs(s.motor.feet[2]+3.5)<.15&&s.avatar.visible,s.motor.feet);
  await page.keyboard.down('w');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));s=await state();check('Focus loss clears input and pauses',s.motor.paused&&Math.hypot(s.input.x,s.input.z)===0);
 }
 if(group==='lane'){
  await page.evaluate(()=>window.__YALI_C1__.spawn('lane'));await zero();await capture('01-lane-start');
  const blocked=await page.evaluate(()=>window.__YALI_C1__.drive({x:1,z:0,run:true},120));report.wallTest=blocked;check('Continuous side-wall stops a moving capsule',blocked.end.motor.feet[0]<18.36&&blocked.end.motor.blocked,blocked.end.motor);
  await page.evaluate(()=>{const a=window.__YALI_C1__;a.spawn('lane');a.orbit(-Math.PI/2/.004,0);a.tick(0);});let s=await state();check('Camera sphere retracts at lane wall',s.camera.obstructed&&s.camera.distance<1.6,s.camera);await capture('02-camera-wall-retraction');
  await page.evaluate(()=>window.__YALI_C1__.spawn('lane'));
  const path=await page.evaluate(()=>window.__YALI_C1__.walkTo([[17,15.5],[23,22],[65,26.11765],[105,30.0392],[125,32],[129,32]],true));report.laneRoute=path;
  check('Walled lane to residential fork with region transitions',path.reason==='complete'&&path.end.motor.feet[0]>128.5&&path.end.collision.regionRevisions>=5,path.end.motor);await capture('03-residential-fork');
 }
 if(group==='terrain'){
  await page.evaluate(()=>window.__YALI_C1__.spawn('stone'));await zero();
  const slope=await page.evaluate(()=>window.__YALI_C1__.walkTo([[-8.1,-7],[-8.1,-6.4],[-10.4,-6.4]],false));report.stoneRamp=slope;check('Stone ramp joins raised platform',slope.reason==='complete'&&slope.end.motor.feet[1]>.62&&slope.end.motor.feet[1]<.73,slope.end.motor);await capture('01-stone-ramp-platform');
  await page.evaluate(()=>window.__YALI_C1__.relocateForTest([-12.8,.10,-9.5]));await zero();
  const steps=await page.evaluate(()=>window.__YALI_C1__.walkTo([[-12.8,-6.4]],false));report.stoneSteps=steps;check('Four real steps climbed with same capsule',steps.reason==='complete'&&steps.end.motor.feet[1]>.62,steps.end.motor);await capture('02-stone-stairs');
  await page.evaluate(()=>window.__YALI_C1__.spawn('courts'));await zero();const court=await page.evaluate(()=>window.__YALI_C1__.walkTo([[-8,120],[-12,120],[-17,120]],false));report.courtRoute=court;check('Basketball fence opening and original slope',court.reason==='complete'&&court.end.motor.feet[0]<-16.8&&court.end.motor.grounded,court.end.motor);await capture('03-court-entry');
  await page.evaluate(()=>window.__YALI_C1__.spawn('gym'));await zero();const gym=await page.evaluate(()=>window.__YALI_C1__.walkTo([[-24,45],[-28,45]],false));report.gymEntry=gym;check('Gym threshold and real portal',gym.reason==='complete'&&gym.end.motor.feet[0]<-27.8,gym.end.motor);await capture('04-gym-entry');
 }
 if(mobile){
  await zero();await capture('01-mobile-initial');const b=await page.locator('#c1-stick').boundingBox(),before=(await state()).motor.feet,cdp=await context.newCDPSession(page);
  const touch=(x,y)=>({id:1,x,y,radiusX:5,radiusY:5,force:1});const x=b.x+b.width/2,y=b.y+b.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(x,y)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(x,y-36)]});await tick(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await zero();let s=await state();check('Actual touch joystick moves and releases',s.motor.feet[2]>before[2]+1.7&&Math.hypot(s.input.x,s.input.z)===0,{before,after:s.motor.feet,input:s.input});
  await page.locator('#c1-run').click();s=await state();check('Touch run toggle',s.input.run);
  await page.locator('#c1-menu').click();await capture('02-mobile-help');await page.locator('#c1-spawn').selectOption('lane');await page.locator('#c1-reset').click();await zero();await capture('03-mobile-lane');
  await page.dispatchEvent('#c1-stick','pointerdown',{pointerId:15,clientX:x,clientY:y-35,pointerType:'touch'}).catch(()=>{});await page.dispatchEvent('#c1-stick','pointercancel',{pointerId:15,pointerType:'touch'});s=await state();check('Pointer cancellation cannot leave motion stuck',Math.hypot(s.input.x,s.input.z)===0);
  report.mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,shadow:window.__YALI_RENDER__.state().shadowResolution}));check('Fresh 390x844 branch and no overflow',report.mobile.width===390&&report.mobile.scrollWidth===390&&report.mobile.shadow===2048,report.mobile);await cdp.detach();
 }
 if(group==='performance'){
  await zero();await page.evaluate(()=>{window.__YALI_C1__.clearSamples();window.__YALI_RENDER_RAW__.resume();});
  console.log(new Date().toISOString(),'sampling 8 warmup + 60 ordinary rendered frame intervals');
  await page.waitForFunction(()=>window.__YALI_C1__.frameSamples().intervalMs.length>=68,null,{polling:1000,timeout:1200000});
  await page.evaluate(()=>window.__YALI_RENDER_RAW__.pause());
  report.performance=await page.evaluate(()=>{const s=window.__YALI_C1__.frameSamples(),values=s.intervalMs.slice(8,68),cpu=s.physicsCpuMs.slice(8,68),sorted=[...values].sort((a,b)=>a-b);return {view:'third-person gate idle',samples:values.length,warmup:8,valuesMs:values,physicsCpuMs:cpu,medianMs:(sorted[29]+sorted[30])/2,p95Ms:sorted[56],minimumMs:sorted[0],maximumMs:sorted.at(-1),method:'Ordinary renderer animation loop and C1 update; idle third-person gate; frame intervals include software GPU and scheduling. No per-frame readPixels/gl.finish. Not user hardware FPS.',motor:window.__YALI_C1__.state().motor};});
  check('Sixty finite actual frame intervals after warmup',report.performance.samples===60&&report.performance.valuesMs.every(x=>Number.isFinite(x)&&x>0));
  await capture('01-performance-third-person');
 }
 if(review){
  for(const name of['overview','r3-overview','b02-photo-front','b03-photo-library','b03-garden','b03-canteen','top','r3-axis']){await page.evaluate(name=>window.__YALI_B05__.setView(name),name);await capture(name);}
  check('Review mode remains separate with no player',!(await state()).enabled);
 }
 if(fallback){
  await zero();await capture('01-log-depth-player');check('Actual log-depth fallback active',report.initialization.lighting.logarithmicDepthBuffer&&!report.initialization.lighting.reversedDepthBuffer);
  await page.evaluate(()=>window.__YALI_C1__.deactivate(true));for(const name of['top','r3-axis']){await page.evaluate(name=>window.__YALI_B05__.setView(name),name);await capture(name);}
 }
 report.final=await state();check('No JavaScript or GL console errors',report.errors.length===0,report.errors);check('Single offline Viewer, no network assets',report.externalRequests.length===0,report.externalRequests);report.passed=true;
}catch(e){report.errors.push({message:String(e),stack:e.stack});console.error(e);}finally{report.completedAt=new Date().toISOString();put();await browser.close();}
console.log('C1 RESULT',group,report.passed,report.checks.map(c=>[c.name,c.passed]));if(!report.passed)process.exitCode=1;
