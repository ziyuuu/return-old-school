/** Same hosted browser/viewport, exact old and new offline Viewers. Synchronous
 * render+GL completion cost is NOT requestAnimationFrame FPS or a phone benchmark.
 */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=path.join(root,'qa/m11c-c1/mobile-r12/benchmark');fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const report={method:'60 synchronous render+gl.finish wall-cost samples after 8 warmup; same software GPU/browser/viewport; not user phone FPS',viewport:{width:390,height:844},deviceScaleFactor:3,startedAt:new Date().toISOString(),sessions:[],passed:false};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});report.browser=browser.version();
try{
 for(const [version,file]of[['R1.1','Yali_C1_R1_1_Viewer.html'],['R1.2','Yali_C1_R1_2_Viewer.html']]){
  const full=path.join(root,'artifacts/m11c-c1',file),session={version,viewer:file,viewerSHA256:createHash('sha256').update(fs.readFileSync(full)).digest('hex'),errors:[],externalRequests:[],valuesMs:[]};report.sessions.push(session);save();
  const c=await browser.newContext({viewport:report.viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true}),p=await c.newPage();p.setDefaultTimeout(240000);
  p.on('pageerror',e=>session.errors.push(String(e)));p.on('request',r=>{if(/^https?:/.test(r.url()))session.externalRequests.push(r.url());});
  console.log('OPEN',version);await p.goto(pathToFileURL(full).href+'?diagnostics=1',{waitUntil:'load',timeout:600000});await p.waitForFunction(()=>window.__YALI_C1_READY__,null,{timeout:600000});
  await p.evaluate(()=>window.__YALI_RENDER_RAW__.pause());
  session.initial=await p.evaluate(()=>({player:window.__YALI_C1__.state(),render:window.__YALI_RENDER__.state()}));
  for(let i=0;i<68;i++){
   const sample=await p.evaluate(()=>{const r=window.__YALI_RENDER_RAW__,g=r.renderer.getContext(),start=performance.now();r.renderFrame();g.finish();return {ms:performance.now()-start,calls:r.renderer.info.render.calls,triangles:r.renderer.info.render.triangles,ratio:r.renderer.getPixelRatio()};});
   if(i>=8){session.valuesMs.push(sample.ms);session.lastFrame=sample;}if(i%10===0){console.log(version,'frame',i,sample.ms);save();}
  }
  const sorted=[...session.valuesMs].sort((a,b)=>a-b);session.medianMs=(sorted[29]+sorted[30])/2;session.p95Ms=sorted[56];save();
  // Pixels come from the tested WebGL canvas, immediately after the ordinary
  // render entrypoint. This is outside timed samples and excludes the DOM HUD.
  const data=await p.evaluate(()=>{const r=window.__YALI_RENDER_RAW__;r.renderFrame();r.renderer.getContext().finish();return r.renderer.domElement.toDataURL('image/png');});
  session.screenshot=version+'-gate.png';session.screenshotMethod='Actual same-frame WebGL readback; native drawing-buffer dimensions, not a CSS screenshot';
  fs.writeFileSync(path.join(out,session.screenshot),Buffer.from(data.split(',')[1],'base64'));
  session.screenshotSHA256=createHash('sha256').update(fs.readFileSync(path.join(out,session.screenshot))).digest('hex');save();
  session.route=await p.evaluate(()=>{const a=window.__YALI_C1__;a.spawn('lane');const start=performance.now(),r=a.walkTo([[17,15.5],[23,22],[65,26.11765],[105,30.0392],[125,32],[129,32]],true);return {milliseconds:performance.now()-start,reason:r.reason,ticks:r.ticks,motor:r.end.motor,collision:r.end.collision};});
  session.final=await p.evaluate(()=>({player:window.__YALI_C1__.state(),render:window.__YALI_RENDER__.state(),glError:window.__YALI_RENDER_RAW__.renderer.getContext().getError()}));
  assert.equal(session.valuesMs.length,60);assert.equal(session.route.reason,'complete');assert.equal(session.errors.length,0);assert.equal(session.externalRequests.length,0);assert.equal(session.final.glError,0);save();await c.close();
 }
 const [before,after]=report.sessions;report.comparison={synchronousFrameCostRatio:after.medianMs/before.medianMs,p95CostRatio:after.p95Ms/before.p95Ms,routeCpuCostRatio:after.route.milliseconds/before.route.milliseconds,warning:'Same hosted software renderer; includes changed raster budget; do not infer phone frame rate.'};
 report.passed=true;
} catch(e){report.error=String(e);throw e;}finally{report.completedAt=new Date().toISOString();save();await browser.close();}
