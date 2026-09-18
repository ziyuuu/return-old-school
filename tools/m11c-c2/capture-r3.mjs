import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const group=process.env.GROUP||'studio',mobile=group==='mobile',studio=group==='studio';
const out=path.resolve(process.env.C2_QA_ROOT||'qa/m11c-c2/r3/release',group);fs.mkdirSync(out,{recursive:true});
const name=studio?'Yali_C2_R3_Character.html':'Yali_C2_R3_Viewer.html',viewer=path.resolve(process.env.C2_ARTIFACT_DIR||'artifacts/m11c-c2/r3',name);
const sha=b=>createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(viewer.replace('.html','.manifest.json')));
if(sha(fs.readFileSync(viewer))!==manifest.sha256)throw Error('Wrong Viewer bytes');
const viewport=mobile?{width:390,height:844}:studio?{width:1000,height:900}:{width:800,height:600};
const errors=[],warnings=[],externalRequests=[],checks=[],screenshots=[];let measurements={},glb=null;
const check=(name,pass,data={})=>checks.push({name,pass:!!pass,data});
const compact=s=>({avatar:s.avatar,motor:s.motor,camera:s.camera,graphics:s.graphics,physicsMs:s.physicsMs});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await ctx.newPage();
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))externalRequests.push(r.url());});
async function shot(label,ui=false){
 const file=label+'.png',dest=path.join(out,file);
 if(ui)await page.screenshot({path:dest,timeout:180000});
 else {const data=await page.evaluate(studio=>{const s=studio?window.__C2_STUDIO__:window.__YALI_RENDER_RAW__,r=s.renderer;r.render(s.scene,studio?s.camera:s.camera());r.getContext().finish();return r.domElement.toDataURL('image/png');},studio);fs.writeFileSync(dest,Buffer.from(data.split(',')[1],'base64'));}
 screenshots.push({file,sha256:sha(fs.readFileSync(dest)),method:ui?'Chromium page screenshot with actual DOM controls':'Same-frame WebGL canvas readback of exact exported Viewer; no scene replacement or compositing'});console.log('CAPTURE',file);
}
try {
 await page.goto(pathToFileURL(viewer).href+'?diagnostics=1'+(mobile?'':'&quality=balanced'),{waitUntil:'load',timeout:600000});
 await page.waitForFunction(studio=>studio?window.__C2_STUDIO__?.ready:window.__YALI_C1__?.state().ready,studio,{timeout:600000});
 if(studio){
  await page.evaluate(()=>{const s=window.__C2_STUDIO__;s.freeze();s.renderer.setAnimationLoop(null);s.step(0,0);});
  for(const v of ['front','side','back','face']){await page.evaluate(v=>window.__C2_STUDIO__.view(v),v);await shot('studio-'+v);}
  for(const [mode,speed]of [['walk',1.65],['run',3.4]]){
   const state=await page.evaluate(({mode,speed})=>{const s=window.__C2_STUDIO__;s.view('oblique');s.setPose(mode);for(let i=0;i<10;i++)s.step(.042,speed);return s.avatar.state();},{mode,speed});check(mode+' actual rig state',state.animation===mode,state);await shot('studio-'+mode);
  }
  measurements=await page.evaluate(()=>({scope:'character identity only; not a device performance benchmark',avatar:window.__C2_STUDIO__.avatar.state()}));
  const data=await page.evaluate(async()=>{const b=await window.__C2_STUDIO__.exportGLB();return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob([b]));});});
  const bytes=Buffer.from(data.split(',')[1],'base64');fs.writeFileSync(path.join(out,'Yali_Student_C2_R3.glb'),bytes);const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  glb={file:'Yali_Student_C2_R3.glb',sha256:sha(bytes),bytes:bytes.length,skins:json.skins?.length,animations:json.animations?.map(a=>a.name)};
  check('export is real GLB with skin and Idle Walk Run tracks',bytes.readUInt32LE(0)===0x46546c67&&glb.skins>0&&glb.animations?.join(',')==='Idle,Walk,Run',glb);
 }else{
  await page.evaluate(()=>window.__YALI_RENDER_RAW__.pause());const state=await page.evaluate(()=>window.__YALI_C1__.state());
  check('approved-direction R3 rig is installed in real campus',state.avatar.artVersion==='C2.R3'&&state.avatar.uniform.logo==='YL',compact(state));check('balanced raster with original C1 collision',state.graphics.mode==='balanced',state.graphics);await shot('campus-gate-back');
  if(!mobile){
   await page.evaluate(()=>{const p=window.__YALI_C1__;p.spawn('gate');p.pause(false,false);p.tick(0);});await page.locator('#viewport canvas').focus();await page.keyboard.down('KeyD');
   const right=await page.evaluate(()=>{const p=window.__YALI_C1__;for(let i=0;i<60;i++)p.tick(1/60);return p.state();});await page.keyboard.up('KeyD');check('actual D key remains camera-right at initial yaw',right.motor.feet[0]<-1,compact(right));
   await page.evaluate(()=>{const p=window.__YALI_C1__;p.spawn('gate');p.orbit(785,0);p.zoom(2.7);p.tick(0);});await shot('campus-gate-front');
   for(const [label,run]of [['walk',false],['run',true]]){const s=await page.evaluate(run=>{const p=window.__YALI_C1__;p.spawn('gate');p.pause(false,false);p.tick(0);return p.drive({x:0,z:1,run},72).end;},run);check(label+' visible rig follows actual campus displacement',s.avatar.animation===label&&s.motor.travel>.8,compact(s));await shot('campus-'+label);}
   const lane=await page.evaluate(()=>{const p=window.__YALI_C1__;p.spawn('lane');p.pause(false,false);return p.drive({x:0,z:1,run:false},150).end;});check('side-lane traversal remains grounded',lane.motor.grounded&&lane.motor.feet[2]>6,compact(lane));await shot('campus-lane');
   const first=await page.evaluate(()=>{const p=window.__YALI_C1__;p.setFirstPerson(true);p.tick(0);return p.state();});check('first person hides character',first.avatar.visible===false,first.camera);
   await page.evaluate(()=>{const p=window.__YALI_C1__;p.setFirstPerson(false);p.spawn('courts');p.tick(0);});await shot('campus-courts');
  }else{
   const rect=await page.locator('#c1-stick').boundingBox(),cdp=await ctx.newCDPSession(page),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-40,id:1}]});
   const moved=await page.evaluate(()=>{const p=window.__YALI_C1__;for(let i=0;i<90;i++)p.tick(1/60);return p.state();});check('real browser touch moves visible skinned student',moved.motor.travel>1&&moved.avatar.animation==='walk',compact(moved));await shot('mobile-touch-walk');await shot('mobile-ui',true);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const bounds=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));check('390x844 without horizontal overflow',bounds.width===390&&bounds.scrollWidth<=390,bounds);
   await page.locator('#c1-menu').click();const paused=await page.evaluate(()=>{const p=window.__YALI_C1__,a=p.state();for(let i=0;i<30;i++)p.tick(1/60);return {a,b:p.state()};});check('pause releases movement and does not travel',paused.b.motor.paused&&paused.b.input.x===0&&paused.b.input.z===0&&Math.hypot(...paused.b.motor.feet.map((v,i)=>v-paused.a.motor.feet[i]))<.001,compact(paused.b));
   await page.locator('#c1-quality').selectOption('detail');const detail=await page.evaluate(()=>window.__YALI_C1__.state());check('reversible detail mode retains identical rig geometry',detail.graphics.mode==='detail'&&detail.avatar.geometry.triangles===moved.avatar.geometry.triangles,detail.graphics);await page.locator('#c1-quality').selectOption('balanced');await page.locator('#c1-resume').click();
   measurements={scope:'mobile touch and UI verification only; no real-device FPS claim'};
  }
 }
 const gl=await page.evaluate(studio=>{const s=studio?window.__C2_STUDIO__:window.__YALI_RENDER_RAW__,r=s.renderer,g=r.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');let triangles=0,geometryBytes=0;const seen=new Set();s.scene.traverseVisible(o=>{if(!o.isMesh)return;const geo=o.geometry;triangles+=(geo.index?.count??geo.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(!seen.has(geo)){seen.add(geo);geometryBytes+=(geo.index?.array.byteLength??0)+Object.values(geo.attributes).reduce((a,b)=>a+b.array.byteLength,0);}});return {browser:navigator.userAgent,gpu:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),depthMode:r.capabilities.reversedDepthBuffer?'reversed':r.capabilities.logarithmicDepthBuffer?'logarithmic':'standard-studio',glError:g.getError(),contextLost:g.isContextLost(),visibleModelTriangles:triangles,geometryBytes,submittedTriangles:r.info.render.triangles,drawCalls:r.info.render.calls,buffer:[r.domElement.width,r.domElement.height]};},studio);
 check('WebGL context remains healthy',gl.glError===0&&!gl.contextLost,gl);const report={version:'C2.R3',group,viewer:name,viewerSHA256:manifest.sha256,runtimeSource:manifest.gitHead,browser:browser.version(),viewport,gl,checks,errors,warnings,externalRequests,screenshots,measurements,glb,passed:checks.every(c=>c.pass)&&errors.length===0&&externalRequests.length===0};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({group,passed:report.passed,checks:checks.length,screenshots:screenshots.length,errors}));if(!report.passed)process.exitCode=1;
}catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(e),errors,screenshots,viewerSHA256:manifest.sha256},null,2));throw e;}finally{await browser.close();}
