/** Real, exact offline Viewer capture. No geometry/lighting reduction for CI.
 * Pause only the ordinary animation loop during static screenshots; execute the
 * same render function and finish the actual GL queue. This avoids compositor
 * starvation on software GPUs. Performance values are CPU+GPU wall time, not FPS.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../../',import.meta.url));
const group=process.env.B05_GROUP||'gate',phase=process.env.B05_PHASE||'iteration-01';
const baseline=group==='baseline',mobile=group==='mobile',fallback=group==='fallback';
const viewer=path.join(root,baseline?'artifacts/m11b-b04/Yali_B04_R1_Viewer.html':'artifacts/m11b-b05/Yali_B05_R1_Viewer.html');
const out=path.join(root,'qa/m11b-b05',phase,group);await fs.mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),viewport=mobile?{width:390,height:844}:{width:1280,height:840};
const groups={gate:['b05-gate','b05-gate-close','b05-stone','b05-side-gate'],courts:['b05-courts','b05-hoop','b05-court-entry','b05-track','b05-auxiliary','b05-pool'],field:['b05-field','b05-goal','b05-rostrum','b05-flags','b05-planted-axis'],residential:['b05-residential','b05-residential-entry','b05-overview'],regression:['overview','r3-overview','b02-photo-front','b03-photo-library','b03-garden','b03-canteen','top','r3-axis'],baseline:['overview','r3-overview','b02-photo-front','b03-photo-library','b03-garden','b03-canteen','top','r3-axis'],checks:[],mobile:[null,'b05-court-entry','b05-flags'],fallback:['b05-hoop','top','r3-axis'],performance:['b05-gate-close','b05-hoop','b05-overview']};
if(!groups[group])throw Error('Unknown B05 group '+group);
const report={batch:'B05',phase,group,status:'IMPLEMENTED / REVIEW_PENDING',standard:'1.0',viewer:path.relative(root,viewer),viewerSHA256:sha(await fs.readFile(viewer)),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),viewport,deviceScaleFactor:1,baseline,fallback,errors:[],warnings:[],externalRequests:[],views:[],passed:false};
const checkpoint=async()=>fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
function stage(s){report.stage=s;console.log(new Date().toISOString(),s);}
const browser=await chromium.launch({headless:true,timeout:120000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
report.environment={browser:browser.version(),node:process.version,platform:process.platform,runner:process.env.GITHUB_ACTIONS?'GitHub Actions hosted Linux':'local',rendering:'ANGLE SwiftShader software GPU; not user hardware',capture:'Actual browser pixels: Playwright/CDP viewport or recorded same-frame canvas readback for clean views; full geometry/materials/shadow resolution; ordinary render function'};
const context=await browser.newContext({viewport,deviceScaleFactor:1}),page=await context.newPage();page.setDefaultTimeout(240000);
page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());else if(e.type()==='warning'&&report.warnings.length<30)report.warnings.push(e.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
if(fallback)await page.addInitScript(()=>{const original=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){return name==='EXT_clip_control'?null:original.call(this,name);};});
async function renderOnce(){return page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__;if(r.renderFrame)r.renderFrame();else r.renderer.render(r.scene,r.camera());r.renderer.getContext().finish();return r.renderer.info.render;});}
async function getState(){return page.evaluate(()=>({...((window.__YALI_B05__||window.__YALI_B04__).getState()),lighting:window.__YALI_RENDER__.state(),programs:window.__YALI_RENDER_RAW__.renderer.info.programs.length}));}
try{
 const started=Date.now(),initial=mobile?null:(groups[group][0]??'b05-gate-close');stage('open '+(initial??'fresh default'));
 await page.goto(pathToFileURL(viewer).href+'?diagnostics=1'+(!mobile?'&clean=1':'')+(initial?'&view='+initial:''),{waitUntil:'load',timeout:600000});
 await page.waitForFunction(()=>window.__YALI_RENDER_RAW__&&(window.__YALI_B05__?.ready||window.__YALI_B04__?.ready),null,{timeout:600000});
 await page.evaluate(()=>window.__YALI_RENDER_RAW__.renderer.setAnimationLoop(null));await renderOnce();await renderOnce();
 report.initializationMs=Date.now()-started;
 report.annotationState=await page.evaluate(()=>{const visible=[];window.__YALI_RENDER_RAW__.scene.traverseVisible(o=>{if(o.type==='AxesHelper'||o.type==='GridHelper')visible.push(o.type);});return {visibleGuides:visible,checkbox:document.getElementById('grid-check').checked};});
 report.scene=await page.evaluate(()=>{
  const {scene,renderer}=window.__YALI_RENDER_RAW__,gs=new Set(),ms=new Set(),owners={},probes={};let triangles=0,bytes=0,meshes=0;
  scene.traverseVisible(o=>{if(!o.isMesh)return;meshes++;const g=o.geometry,n=(g.index?.count??g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1),owner=o.userData.facility||o.userData.owner||'environment';triangles+=n;owners[owner]=(owners[owner]||0)+n;
   if(!gs.has(g.uuid)){gs.add(g.uuid);bytes+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0);}
   for(const m of Array.isArray(o.material)?o.material:[o.material]){ms.add(m.uuid);if(m.userData.reflectionProbe){probes[owner]??=[];if(!probes[owner].includes(m.userData.reflectionProbe))probes[owner].push(m.userData.reflectionProbe);}}
  });const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {triangles,geometryBytes:bytes,meshes,geometries:gs.size,materials:ms.size,trianglesByOwner:owners,reflectionOwnership:probes,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),webgl:gl.getParameter(gl.VERSION)};
 });stage('ready '+report.initializationMs+'ms; '+report.scene.triangles+' model triangles');await checkpoint();
 for(const name of groups[group]){
  stage('view '+(name??'mobile-initial'));
  if(name)await page.evaluate(v=>(window.__YALI_B05__||window.__YALI_B04__).setView(v),name);
  await renderOnce();await renderOnce();
  let performance=null;
  if(group==='performance'){
   stage('60 actual rendered and GL-finished frames '+name);
   performance=await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__,gl=r.renderer.getContext(),values=[];
    for(let i=0;i<60;i++){const t=performance.now();r.renderFrame();gl.finish();values.push(performance.now()-t);}const s=[...values].sort((a,b)=>a-b);return {samples:60,warmupFrames:2,medianMs:(s[29]+s[30])/2,p95Ms:s[56],minMs:s[0],maxMs:s[59],valuesMs:values,method:'Wall-clock CPU+GPU frame duration: same render function then gl.finish(); animation loop paused, no frame-rate claim'};});
  }
  const state=await getState(),file=(name??'mobile-initial')+'.png';
  // The pixels always come from the running browser, never a proxy scene.
  // Headless SwiftShader can stall the compositor despite a completed GL frame.
  // Keep UI captures strict; clean views can fall back to same-frame WebGL readback.
  let screenshotMethod='Playwright full-page viewport';
  try { await page.screenshot({path:path.join(out,file),timeout:45000}); }
  catch (e) {
   report.warnings.push({view:name,compositorAttempt:String(e),recoveredBy:mobile?'CDP viewport':'same-frame WebGL canvas'});
   if(mobile){
    const cdp=await context.newCDPSession(page);
    const image=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    await fs.writeFile(path.join(out,file),Buffer.from(image.data,'base64'));await cdp.detach();screenshotMethod='CDP full-page viewport';
   } else {
    const data=await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__;if(r.renderFrame)r.renderFrame();else r.renderer.render(r.scene,r.camera());r.renderer.getContext().finish();return r.renderer.domElement.toDataURL('image/png');});
    await fs.writeFile(path.join(out,file),Buffer.from(data.split(',')[1],'base64'));screenshotMethod='Actual same-frame WebGL canvas readback / clean viewport';
   }
  }
  report.views.push({file,sha256:sha(await fs.readFile(path.join(out,file))),screenshotMethod,requestedView:name??'fresh default',...state,performance});
  stage('saved '+file+'; GL '+state.glError);await checkpoint();
 }
 if(group==='checks'){
  stage('full visible B05 mesh/BVH route and portal test');report.access=await page.evaluate(()=>window.__YALI_B05__.checkAccess());await checkpoint();
  stage('full visible B02/B03/B04 inherited access');report.inherited=await page.evaluate(()=>({...window.__YALI_B05__.checkInherited(),b02:window.__YALI_B02__.checkAccess()}));
  report.invariants=await page.evaluate(()=>{const roots=window.__YALI_M11A__.getRoots(),a=window.__YALI_R3__;return {axis:[roots['08'][0],roots['15'][0],roots['18'][0]],mainFloor:roots['15'][1],flagCount:window.__YALI_B01__.countFlags(),stone:roots['27'],unlocated22:window.__YALI_B05__.model.invariants.unlocated22,shutters:a.model.access.every((d,i)=>{const s=i?1:-1,[x,y,z]=d.door;return a.probe([x+s*.5,y+1.5,z],[x-s*.5,y+1.5,z]).length===0;})};});
  await checkpoint();
 }
 if(mobile){report.mobile=await page.evaluate(()=>({noOverflow:document.documentElement.scrollWidth<=innerWidth,scrollWidth:document.documentElement.scrollWidth,innerWidth,title:document.title,shadowResolution:window.__YALI_RENDER__.state().shadowResolution}));}
 report.passed=report.errors.length===0&&report.externalRequests.length===0&&report.views.every(v=>!v.glError&&!v.contextLost&&v.triangles>0&&(v.requestedView==='fresh default'||v.view===v.requestedView));
 if(group==='checks')report.passed=report.passed&&report.access.passed&&report.inherited.b03.passed&&report.inherited.b04.passed&&report.inherited.b02.routes.every(r=>r.failures===0)&&report.inherited.b02.doors.every(d=>d.bad.length===0)&&report.inherited.b02.sharedWallBlocked&&report.invariants.axis.every(x=>x===73)&&report.invariants.mainFloor===3.45&&report.invariants.flagCount===3&&report.invariants.shutters&&report.invariants.unlocated22===null;
 if(!baseline)report.passed=report.passed&&report.annotationState.visibleGuides.length===0&&!report.annotationState.checkbox;
 if(mobile)report.passed=report.passed&&report.mobile.noOverflow&&report.mobile.shadowResolution===2048;
 if(fallback)report.passed=report.passed&&report.views.every(v=>v.lighting.logarithmicDepthBuffer&&!v.lighting.reversedDepthBuffer);
}catch(e){report.errors.push({message:String(e),stack:e.stack});console.error(e);}finally{
 report.completedAt=new Date().toISOString();report.stage=report.passed?'complete':'failed';await checkpoint();await browser.close();
}
console.log('RESULT',JSON.stringify({group,passed:report.passed,views:report.views.length,errors:report.errors,access:report.access?.routes.map(r=>({id:r.id,failures:r.failures})),doors:report.access?.doors.filter(d=>d.bad.length)}));
if(!report.passed)process.exitCode=1;
