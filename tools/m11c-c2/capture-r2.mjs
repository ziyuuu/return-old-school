import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const group=process.env.GROUP||'studio',phase=process.env.PHASE||'iteration01';
const out=path.resolve('qa/m11c-c2/r2',phase,group);fs.mkdirSync(out,{recursive:true});
const dir=path.resolve('artifacts/m11c-c2/r2'),name=group==='studio'?'Yali_C2_R2_Character.html':'Yali_C2_R2_Viewer.html';
const viewer=path.join(dir,name),sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(viewer.replace('.html','.manifest.json')));
if(sha(fs.readFileSync(viewer))!==manifest.sha256)throw Error('Viewer mismatch');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const mobile=group==='mobile',viewport=mobile?{width:390,height:844}:group==='studio'?{width:1000,height:900}:{width:800,height:600};
const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),page=await ctx.newPage();
const errors=[],warnings=[],externalRequests=[],checks=[],shots=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
page.on('request',r=>{if(/^https?:/.test(r.url()))externalRequests.push(r.url());});
const check=(name,pass,data={})=>checks.push({name,pass:!!pass,data});
const compact=s=>({avatar:s.avatar,motor:s.motor,camera:s.camera,graphics:s.graphics,physicsMs:s.physicsMs});
async function shot(label){
 const data=await page.evaluate(studio=>{
  const s=studio?window.__C2_STUDIO__:window.__YALI_RENDER_RAW__,r=s.renderer;
  r.render(s.scene,studio?s.camera:s.camera());r.getContext().finish();return r.domElement.toDataURL('image/png');
 },group==='studio');
 const f=label+'.png';fs.writeFileSync(path.join(out,f),Buffer.from(data.split(',')[1],'base64'));shots.push({file:f,sha256:sha(fs.readFileSync(path.join(out,f))),method:'same-frame actual WebGL canvas readback; no compositing or scene replacement'});
 console.log('CAPTURE',f);
}
try {
 await page.goto(pathToFileURL(viewer).href+'?diagnostics=1&quality=balanced',{waitUntil:'load',timeout:600000});
 await page.waitForFunction(studio=>studio?window.__C2_STUDIO__?.ready:window.__YALI_C1__?.state().ready,group==='studio',{timeout:600000});
 if(group==='studio'){
  await page.evaluate(()=>{window.__C2_STUDIO__.freeze();window.__C2_STUDIO__.renderer.setAnimationLoop(null);});
  for(const v of ['front','side','back','face']){await page.evaluate(v=>window.__C2_STUDIO__.view(v),v);await shot('studio-'+v);}
  for(const [mode,speed]of [['walk',1.65],['run',3.4]]){
   const state=await page.evaluate(({mode,speed})=>{const s=window.__C2_STUDIO__;s.view('oblique');s.setPose(mode);for(let i=0;i<10;i++)s.step(.042,speed);return s.avatar.state();},{mode,speed});
   check(mode+' rig state',state.animation===mode,state);await shot('studio-'+mode);
  }
  const data=await page.evaluate(async()=>{const b=await window.__C2_STUDIO__.exportGLB();return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob([b]));});});
  const glb=Buffer.from(data.split(',')[1],'base64');fs.writeFileSync(path.join(out,'Yali_Student_C2_R2.glb'),glb);
  const json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
  check('GLB contains actual skin and idle walk run clips',glb.readUInt32LE(0)===0x46546c67&&json.skins?.length>0&&json.animations?.length===3,{sha256:sha(glb),bytes:glb.length,skins:json.skins?.length,animations:json.animations?.map(a=>a.name)});
 }else{
  await page.evaluate(()=>window.__YALI_RENDER_RAW__.pause());
  const s=await page.evaluate(()=>window.__YALI_C1__.state());
  check('new rig active in actual campus',s.avatar.artVersion==='C2.R2'&&s.avatar.uniform.logo==='YL',compact(s));
  check('C1 mobile policy inherited',s.graphics.mode==='balanced',s.graphics);await shot('campus-gate-back');
  if(!mobile){
   await page.evaluate(()=>{const p=window.__YALI_C1__;p.orbit(785,0);p.tick(0);});await shot('campus-gate-front');
   for(const [label,run]of [['walk',false],['run',true]]){
    const state=await page.evaluate(run=>{const p=window.__YALI_C1__;p.spawn('gate');p.pause(false,false);return p.drive({x:0,z:1,run},72).end;},run);
    check(label+' in actual campus',state.avatar.animation===label&&state.motor.travel>.8,compact(state));await shot('campus-'+label);
   }
   const lane=await page.evaluate(()=>{const p=window.__YALI_C1__;p.spawn('lane');p.pause(false,false);return p.drive({x:0,z:1,run:false},150).end;});
   check('lane ground and unchanged capsule',lane.motor.grounded&&lane.motor.feet[2]>6,compact(lane));await shot('campus-lane');
   await page.evaluate(()=>{const p=window.__YALI_C1__;p.setFirstPerson(true);p.tick(0);});
   const first=await page.evaluate(()=>window.__YALI_C1__.state());check('first person hides visible student',first.avatar.visible===false,first.camera);
   await page.evaluate(()=>{const p=window.__YALI_C1__;p.setFirstPerson(false);p.spawn('courts');p.tick(0);});await shot('campus-courts');
  }else{
   const stick=await page.locator('#c1-stick').boundingBox(),client=await ctx.newCDPSession(page);
   const x=stick.x+stick.width/2,y=stick.y+stick.height/2;
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-40,id:1}]});
   const moved=await page.evaluate(()=>{const p=window.__YALI_C1__;for(let i=0;i<90;i++)p.tick(1/60);return p.state();});
   check('real browser touch drives visible skinned student',moved.motor.travel>1&&moved.avatar.animation==='walk',compact(moved));
   await shot('mobile-touch-walk');await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const bounds=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,stick:getComputedStyle(document.getElementById('c1-stick')).display}));
   check('390x844 no horizontal overflow',bounds.width===390&&bounds.scrollWidth<=390,bounds);
  }
 }
 const gl=await page.evaluate(studio=>{const s=studio?window.__C2_STUDIO__:window.__YALI_RENDER_RAW__,r=s.renderer,g=r.getContext(),ext=g.getExtension('WEBGL_debug_renderer_info');return {browser:navigator.userAgent,gpu:ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),glError:g.getError(),contextLost:g.isContextLost(),submittedTriangles:r.info.render.triangles,drawCalls:r.info.render.calls,buffer:[r.domElement.width,r.domElement.height]};},group==='studio');
 check('WebGL healthy',gl.glError===0&&!gl.contextLost,gl);
 const report={version:'C2.R2',group,phase,viewer:name,viewerSHA256:manifest.sha256,runtimeSource:manifest.gitHead,browser:browser.version(),viewport,gl,checks,errors,warnings,externalRequests,screenshots:shots,passed:checks.every(c=>c.pass)&&errors.length===0&&externalRequests.length===0};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({group,passed:report.passed,checks:checks.length,shots:shots.length,errors}));
 if(!report.passed)process.exitCode=1;
}catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(e),errors,shots,viewerSHA256:manifest.sha256},null,2));throw e;}
finally{await browser.close();}
