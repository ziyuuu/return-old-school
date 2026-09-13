/** Actual offline Viewer QA. Run in a WebGL-capable Chromium, never a proxy scene.
 * --draft captures an iteration only: no performance/completion claim.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../../',import.meta.url));
const draft=process.argv.includes('--draft'),phase=process.env.B04_QA_PHASE||(draft?'iteration-01':'final');
const out=path.join(root,'qa/m11b-b04',phase),viewer=path.join(root,'artifacts/m11b-b04/Yali_B04_R1_Viewer.html');
await fs.mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),viewerSHA256=sha(await fs.readFile(viewer));
const report={batch:'B04',phase,mode:draft?'iteration-only / not final QA':'full',standard:'1.0',status:'IMPLEMENTED / REVIEW_PENDING',viewer:'artifacts/m11b-b04/Yali_B04_R1_Viewer.html',viewerSHA256,generatedAt:new Date().toISOString(),environment:{runner:process.env.GITHUB_ACTIONS?'GitHub Actions Linux':'local',node:process.version,launch:'headless Chromium / ANGLE SwiftShader; software rendering, not user hardware'},errors:[],externalRequests:[],warnings:[],views:[],passed:false};
const browser=await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),timeout:120000,
 args:['--no-sandbox','--no-first-run','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
report.environment.browser=browser.version();
const contexts=[];
async function openPage(viewport,view,clean=true,fallback=false){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});contexts.push(context);
 const page=await context.newPage();page.setDefaultTimeout(300000);
 page.on('pageerror',e=>report.errors.push({context:{viewport,fallback},message:String(e)}));
 page.on('console',e=>{if(e.type()==='error')report.errors.push({context:{viewport,fallback},message:e.text()});else if(e.type()==='warning'&&report.warnings.length<30)report.warnings.push(e.text());});
 page.on('request',req=>{if(/^https?:/.test(req.url()))report.externalRequests.push(req.url());});
 if(fallback)await page.addInitScript(()=>{const original=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){return name==='EXT_clip_control'?null:original.call(this,name);};});
 const began=Date.now();await page.goto(pathToFileURL(viewer).href+'?diagnostics=1'+(clean?'&clean=1':'')+(view?'&view='+view:''),{timeout:600000,waitUntil:'load'});
 await page.waitForFunction(()=>window.__YALI_B04__?.ready&&window.__YALI_RENDER_RAW__,null,{timeout:600000});
 const initializationMs=Date.now()-began;await settle(page,4);
 return {page,context,viewport,initializationMs,fallback};
}
async function settle(page,frames=6){await page.evaluate(async n=>{for(let i=0;i<n;i++)await new Promise(requestAnimationFrame);},frames);}
async function state(page){return page.evaluate(()=>({...window.__YALI_B04__.getState(),lighting:window.__YALI_RENDER__.state(),programs:window.__YALI_RENDER_RAW__.renderer.info.programs.length}));}
async function capture(session,view,filename=view,performanceSample=false){
 const {page,viewport}=session;
 if(view)await page.evaluate(v=>window.__YALI_B04__.setView(v),view);
 await settle(page,8);
 let timing=null;
 if(performanceSample){timing=await page.evaluate(async()=>{const values=[];let last=await new Promise(requestAnimationFrame);for(let i=0;i<60;i++){const next=await new Promise(requestAnimationFrame);values.push(next-last);last=next;}const sorted=[...values].sort((a,b)=>a-b);return {warmupFrames:8,samples:values.length,medianMs:(sorted[29]+sorted[30])/2,p95Ms:sorted[56],minMs:sorted[0],maxMs:sorted[59],valuesMs:values,method:'requestAnimationFrame intervals; includes software GPU scheduling, not GPU timer queries'};});}
 const s=await state(page),file=filename+'.png';
 await page.screenshot({path:path.join(out,file),timeout:300000});
 const result={requestedView:view||'(default fresh load)',actualView:s.view,file,sha256:sha(await fs.readFile(path.join(out,file))),viewport,deviceScaleFactor:1,fallback:session.fallback,performance:timing,...s};
 report.views.push(result);console.log('VIEW',filename,JSON.stringify({actualView:s.view,calls:s.calls,triangles:s.triangles,glError:s.glError,medianMs:timing?.medianMs,p95Ms:timing?.p95Ms}));
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));return result;
}
try{
 const desktop=await openPage({width:1280,height:840},'b04-science',true);report.initializationMs=desktop.initializationMs;
 report.scene=await desktop.page.evaluate(()=>{
  const {scene,renderer}=window.__YALI_RENDER_RAW__,geometries=new Set(),materials=new Set(),finishes=new Set(),owners={},probes={};let triangles=0,geometryBytes=0,meshes=0;
  scene.traverseVisible(o=>{if(!o.isMesh)return;meshes++;const g=o.geometry,count=o.isInstancedMesh?o.count:1,n=(g.index?.count??g.attributes.position.count)/3*count;triangles+=n;
   const owner=o.userData.facility||o.userData.owner||'environment';owners[owner]=(owners[owner]||0)+n;
   if(!geometries.has(g.uuid)){geometries.add(g.uuid);geometryBytes+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0);}
   for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m.uuid);if(m.userData.finish)finishes.add(m.userData.finish);if(m.userData.reflectionProbe){probes[owner]??=[];if(!probes[owner].includes(m.userData.reflectionProbe))probes[owner].push(m.userData.reflectionProbe);}}
  });const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {visibleModelTriangles:triangles,geometryBytes,meshes,geometries:geometries.size,materials:materials.size,finishes:[...finishes].sort(),trianglesByOwner:owners,reflectionOwnership:probes,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),webgl:gl.getParameter(gl.VERSION),renderState:window.__YALI_RENDER__.state(),integration:window.__YALI_B04__.integration};
 });console.log('SCENE',JSON.stringify(report.scene));
 const newViews=draft?['b04-science','b04-science-close','b04-science-bay','b04-longya','b04-longya-close','b04-museum','b04-office','b04-information','b04-neighbours']:
 ['b04-science','b04-science-close','b04-science-lobby','b04-science-bay','b04-longya','b04-longya-close','b04-longya-side','b04-office','b04-museum','b04-information','b04-neighbours','b04-west-group','b04-overview'];
 for(const v of newViews)await capture(desktop,v,v,!draft&&['b04-science-close','b04-longya','b04-overview'].includes(v));
 const accessStart=Date.now();report.access=await desktop.page.evaluate(()=>window.__YALI_B04__.checkAccess());report.accessDurationMs=Date.now()-accessStart;
 console.log('ACCESS',JSON.stringify(report.access));
 report.invariants=await desktop.page.evaluate(()=>{const roots=window.__YALI_M11A__.getRoots(),a=window.__YALI_R3__;return {axis:[roots['08'][0],roots['15'][0],roots['18'][0]],mainFloor:roots['15'][1],flags:window.__YALI_B01__.countFlags(),shutters:a.model.access.every((d,i)=>{const s=i?1:-1,[x,y,z]=d.door;return a.probe([x+s*.5,y+1.5,z],[x-s*.5,y+1.5,z]).length===0;})};});
 if(!draft){
  // Shared probe assignment and initial camera integration trigger section 7 regression.
  for(const v of ['overview','r3-overview','b02-photo-front','b03-photo-library','b03-garden','b03-canteen','top','r3-axis'])await capture(desktop,v,'regression-'+v,v==='overview');
  report.inheritedAccess=await desktop.page.evaluate(()=>({b02:window.__YALI_B02__.checkAccess(),b03:window.__YALI_B03__.checkAccess()}));
 }
 await desktop.context.close();
 const mobile=await openPage({width:390,height:844},null,false);report.mobile={freshContext:true,initializationMs:mobile.initializationMs,...await state(mobile.page)};
 await capture(mobile,null,'mobile-initial',!draft);
 report.mobile.ui=await mobile.page.evaluate(()=>({noOverflow:document.documentElement.scrollWidth<=innerWidth,innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,initialShadowResolution:window.__YALI_RENDER__.state().shadowResolution}));
 await mobile.page.evaluate(()=>document.body.classList.add('clean'));await capture(mobile,'b04-science-close','mobile-science');await mobile.context.close();
 if(!draft){
  const fallback=await openPage({width:1280,height:840},'b04-longya',true,true);report.fallback={method:'Simulated extension absence before scene initialization; actual log-depth material/render path',initializationMs:fallback.initializationMs,...await state(fallback.page)};
  for(const v of ['b04-longya','top','r3-axis'])await capture(fallback,v,'fallback-'+v);
  await fallback.context.close();
 }
 report.passed=report.errors.length===0&&report.externalRequests.length===0&&report.access.passed&&report.views.every(v=>v.triangles>0&&!v.glError&&!v.contextLost&&(v.requestedView==='(default fresh load)'||v.view===v.requestedView))&&report.mobile.ui.noOverflow&&report.mobile.ui.initialShadowResolution===2048&&report.invariants.axis.every(x=>x===73)&&report.invariants.mainFloor===3.45&&report.invariants.flags===3&&report.invariants.shutters;
 if(!draft)report.passed=report.passed&&report.inheritedAccess.b03.passed&&report.inheritedAccess.b02.routes.every(r=>r.failures===0)&&report.inheritedAccess.b02.doors.every(d=>d.bad.length===0)&&report.inheritedAccess.b02.sharedWallBlocked&&report.fallback.lighting.logarithmicDepthBuffer&&!report.fallback.lighting.reversedDepthBuffer;
}catch(e){report.errors.push({message:String(e),stack:e.stack});console.error(e);}finally{
 report.completedAt=new Date().toISOString();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();
}
if(!report.passed)process.exitCode=1;
