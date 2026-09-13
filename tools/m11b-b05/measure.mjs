/** B05 exact-Viewer performance supplement. One fresh browser per viewpoint.
 * Each sample returns across CDP and reads an actual framebuffer pixel before the
 * next frame is submitted. No long synchronous 60-frame burst, reduced geometry,
 * altered lights, or lower shadow resolution. Results are NOT GPU-only timings/FPS.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../../',import.meta.url));
const view=process.env.B05_MEASURE_VIEW||'b05-hoop';
assert.ok(['b05-gate-close','b05-hoop','b05-overview'].includes(view));
const phase=process.env.B05_PHASE||'completion',viewport={width:1280,height:840};
const out=path.join(root,'qa/m11b-b05',phase,'performance-resume',view);
await fs.mkdir(out,{recursive:true});
const viewer='artifacts/m11b-b05/Yali_B05_R1_Viewer.html';
const hash=b=>createHash('sha256').update(b).digest('hex');
const viewerSHA256=hash(await fs.readFile(path.join(root,viewer)));
const manifest=JSON.parse(await fs.readFile(path.join(root,'artifacts/m11b-b05/viewer-manifest.json'),'utf8'));
assert.equal(viewerSHA256,manifest.sha256);
for(const [file,digest] of Object.entries(manifest.sources))assert.equal(hash(await fs.readFile(path.join(root,file))),digest,'Runtime drift: '+file);
const report={batch:'B05',phase,group:'performance',status:'IMPLEMENTED / REVIEW_PENDING',standard:'1.0',viewer,viewerSHA256,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),runtimeSourceCommit:manifest.gitHead,run:process.env.GITHUB_RUN_ID??null,startedAt:new Date().toISOString(),viewport,deviceScaleFactor:1,baseline:false,fallback:false,errors:[],warnings:[],externalRequests:[],views:[],samples:[],passed:false};
const save=()=>fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stage=async s=>{report.stage=s;console.log(new Date().toISOString(),view,s);await save();};
let browser;
try{
 browser=await chromium.launch({headless:true,timeout:120000,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 report.environment={browser:browser.version(),node:process.version,platform:process.platform,runner:process.env.GITHUB_ACTIONS?'GitHub Actions hosted Linux':'local',rendering:'ANGLE SwiftShader software renderer, not user hardware',method:'One fresh browser per view; 2 warm-up frames; 60 separately awaited renderFrame + synchronous 1-pixel readPixels samples. In-page wall time includes CPU submission, synchronization and readback, NOT GPU-only time or interactive FPS.'};
 const context=await browser.newContext({viewport,deviceScaleFactor:1}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());else if(e.type()==='warning'&&report.warnings.length<30)report.warnings.push(e.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
 await stage('opening exact offline Viewer');const start=Date.now();
 await page.goto(pathToFileURL(path.join(root,viewer)).href+'?diagnostics=1&clean=1&view='+view,{waitUntil:'load',timeout:600000});
 await page.waitForFunction(()=>window.__YALI_B05__?.ready&&window.__YALI_RENDER_RAW__,null,{timeout:600000});
 await page.evaluate(()=>window.__YALI_RENDER_RAW__.renderer.setAnimationLoop(null));
 report.initializationMs=Date.now()-start;
 const sample=()=>page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__,gl=r.renderer.getContext(),pixel=new Uint8Array(4);const start=performance.now();r.renderFrame();const submitted=performance.now();gl.readPixels(Math.floor(gl.drawingBufferWidth/2),Math.floor(gl.drawingBufferHeight/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);const end=performance.now();return {ms:end-start,submitMs:submitted-start,readbackMs:end-submitted,pixel:[...pixel],glError:gl.getError(),contextLost:gl.isContextLost(),calls:r.renderer.info.render.calls,triangles:r.renderer.info.render.triangles};});
 report.warmup=[];for(let i=0;i<2;i++){report.warmup.push(await sample());await stage('warm-up '+(i+1)+'/2');}
 for(let i=0;i<60;i++){const start=Date.now(),s=await sample();s.roundtripMs=Date.now()-start;assert.equal(s.glError,0);assert.equal(s.contextLost,false);report.samples.push(s);if((i+1)%10===0)await stage('completed '+(i+1)+'/60 actual readbacks');}
 const values=report.samples.map(s=>s.ms),sorted=[...values].sort((a,b)=>a-b);
 const performance={samples:60,warmupFrames:2,medianMs:(sorted[29]+sorted[30])/2,p95Ms:sorted[Math.ceil(.95*sorted.length)-1],minMs:sorted[0],maxMs:sorted.at(-1),valuesMs:values,method:report.environment.method};
 const state=await page.evaluate(()=>({...window.__YALI_B05__.getState(),lighting:window.__YALI_RENDER__.state(),programs:window.__YALI_RENDER_RAW__.renderer.info.programs.length}));
 assert.equal(state.view,view);assert.equal(state.glError,0);assert.equal(state.contextLost,false);
 // Actual same-frame browser canvas pixels, not a replacement scene or image generation.
 const data=await page.evaluate(()=>{const r=window.__YALI_RENDER_RAW__,gl=r.renderer.getContext();r.renderFrame();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));return r.renderer.domElement.toDataURL('image/png');});
 const file=view+'.png',bytes=Buffer.from(data.split(',')[1],'base64');await fs.writeFile(path.join(out,file),bytes);
 report.views.push({file,sha256:hash(bytes),screenshotMethod:'Actual same-frame WebGL canvas readback / clean viewport',requestedView:view,...state,performance});
 report.passed=report.samples.length===60&&report.errors.length===0&&report.externalRequests.length===0;
 await stage(report.passed?'complete':'failed');
}catch(e){report.errors.push({message:String(e),stack:e.stack});console.error(e);report.stage='failed';}
finally{report.completedAt=new Date().toISOString();await save();if(browser)await browser.close();}
console.log('RESULT',JSON.stringify({view,passed:report.passed,samples:report.samples.length,viewerSHA256,errors:report.errors}));
if(!report.passed)process.exitCode=1;
