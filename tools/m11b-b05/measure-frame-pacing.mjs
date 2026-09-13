/** Real interactive frame-pacing measurement. No per-frame readPixels forcing a
 * different serialized workload. Original renderFrame, full scene/quality, 8 warm-up
 * frames then 60 requestAnimationFrame intervals. Not a hardware FPS guarantee. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../../',import.meta.url)),view=process.env.B05_MEASURE_VIEW||'b05-hoop',phase=process.env.B05_PHASE||'final-r1.1';
assert.ok(['b05-gate-close','b05-hoop','b05-overview'].includes(view));
const out=path.join(root,'qa/m11b-b05',phase,'performance-resume',view);await fs.mkdir(out,{recursive:true});
const viewer='artifacts/m11b-b05/Yali_B05_R1_1_Viewer.html',hash=b=>createHash('sha256').update(b).digest('hex'),html=await fs.readFile(path.join(root,viewer));
const manifest=JSON.parse(await fs.readFile(path.join(root,'artifacts/m11b-b05/viewer-manifest.json'),'utf8'));assert.equal(hash(html),manifest.sha256);
for(const [file,h]of Object.entries(manifest.sources))assert.equal(hash(await fs.readFile(path.join(root,file))),h,'Source drift '+file);
const report={batch:'B05',phase,group:'performance',status:'IMPLEMENTED / REVIEW_PENDING',standard:'1.0',viewer,viewerSHA256:manifest.sha256,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),runtimeSourceCommit:manifest.gitHead,run:process.env.GITHUB_RUN_ID??null,startedAt:new Date().toISOString(),viewport:{width:1280,height:840},deviceScaleFactor:1,baseline:false,fallback:false,errors:[],warnings:[],externalRequests:[],samples:[],views:[],passed:false};
const save=()=>fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');let browser;
try{
 browser=await chromium.launch({headless:true,timeout:120000,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 report.environment={browser:browser.version(),node:process.version,platform:process.platform,runner:process.env.GITHUB_ACTIONS?'GitHub Actions hosted Linux':'local',method:'8 warm-up rendered frames; 60 requestAnimationFrame intervals using the unchanged continuous renderFrame callback. Full geometry/materials, original desktop shadow resolution. Includes browser scheduling and software GPU; not GPU-only timings, not comparable to serialized readPixels history.'};
 const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());else if(e.type()==='warning')report.warnings.push(e.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
 const q='?diagnostics=1&clean=1&view='+view;const start=Date.now();
 if(process.env.B05_LOAD_MODE==='memory'){report.viewerLoading='Exact exported bytes through setContent; browser navigation policy unchanged';await page.evaluate(q=>history.replaceState({},'', 'about:blank'+q),q);await page.setContent(html.toString(),{waitUntil:'load',timeout:600000});}
 else{report.viewerLoading='Direct offline file URL';await page.goto(pathToFileURL(path.join(root,viewer)).href+q,{waitUntil:'load',timeout:600000});}
 await page.waitForFunction(()=>window.__YALI_B05__?.ready&&window.__YALI_RENDER_RAW__,null,{timeout:600000});report.initializationMs=Date.now()-start;
 await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__;window.__B05_PACING__={values:[],warmup:0,last:null};r.renderer.setAnimationLoop(()=>{r.renderFrame();const p=window.__B05_PACING__,now=performance.now();if(p.warmup<8)p.warmup++;else if(p.last!==null)p.values.push({ms:now-p.last,calls:r.renderer.info.render.calls,triangles:r.renderer.info.render.triangles});p.last=now;if(p.values.length>=60)r.renderer.setAnimationLoop(null);});});
 for(let i=0;i<1440;i++){await page.waitForTimeout(1000);const p=await page.evaluate(()=>window.__B05_PACING__);report.samples=p.values;report.stage=`${report.samples.length}/60 frames`;if(i%10===0){console.log(view,report.stage);await save();}if(report.samples.length>=60)break;}
 assert.equal(report.samples.length,60,'Frame-pacing session incomplete');
 const state=await page.evaluate(()=>({...window.__YALI_B05__.getState(),lighting:window.__YALI_RENDER__.state()}));assert.equal(state.view,view);assert.equal(state.glError,0);assert.equal(state.contextLost,false);
 const glInfo=await page.evaluate(()=>{const g=window.__YALI_RENDER_RAW__.renderer.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');return {gpu:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),webgl:g.getParameter(g.VERSION)}});Object.assign(report.environment,glInfo);
 const vals=report.samples.map(s=>s.ms),sorted=[...vals].sort((a,b)=>a-b),performance={samples:60,warmupFrames:8,medianMs:(sorted[29]+sorted[30])/2,p95Ms:sorted[56],minMs:sorted[0],maxMs:sorted[59],valuesMs:vals,method:report.environment.method};
 const data=await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__;r.renderFrame();r.renderer.getContext().finish();return r.renderer.domElement.toDataURL('image/png');});const file=view+'.png',bytes=Buffer.from(data.split(',')[1],'base64');await fs.writeFile(path.join(out,file),bytes);
 report.views.push({file,sha256:hash(bytes),screenshotMethod:'Actual same-frame WebGL canvas readback after frame-pacing session',requestedView:view,...state,performance});report.passed=!report.errors.length&&!report.externalRequests.length;report.stage=report.passed?'complete':'failed';
}catch(e){report.errors.push({message:String(e),stack:e.stack});report.stage='failed';console.error(e);}finally{report.completedAt=new Date().toISOString();await save();if(browser)await browser.close();}
console.log('RESULT',JSON.stringify({view,passed:report.passed,samples:report.samples.length,viewerSHA256:report.viewerSHA256,errors:report.errors}));if(!report.passed)process.exitCode=1;
