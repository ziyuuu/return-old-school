import * as THREE from 'three';
import config from '../../../../data/m11c/c1/config.json';
import {initPhysics,RAPIER,PlayerMotor,FollowCamera} from './motor.mjs';
import {CampusCollisionWorld} from './collision-world.mjs';
import {createStudentAvatar} from './student-avatar';
import './player.css';

type Host={graphics?:{state:()=>any;set:(mode:string)=>void};scene:THREE.Scene;camera:THREE.PerspectiveCamera;canvas:HTMLCanvasElement;mats:THREE.MeshPhysicalMaterial[];prepare:()=>void;review:()=>void;pool:{x:number;z:number;width:number;depth:number;surface:number}};
export async function createPlayerMode(host:Host) {
  const ui=document.createElement('section');ui.id='c1-ui';ui.setAttribute('aria-label','C1 校园漫游');
  ui.innerHTML=`<header class="c1-header"><div class="c1-brand"><span aria-hidden="true">雅</span><div><b>复原雅礼</b><small>C2 · 学生漫游 / 2006–2010工作重建</small></div></div><div class="c1-tools"><button id="c1-perspective" type="button" title="V 切换视角">第三人称</button><button id="c1-menu" type="button" aria-expanded="false">暂停 / 帮助</button></div></header>
  <p class="c1-hint" id="c1-hint">WASD 行走 · Shift 跑步 · 拖动视角 · 滚轮远近 · V 视角 · Esc 暂停</p><div class="c1-status" id="c1-status" role="status" aria-live="polite">正在准备地面与碰撞…</div>
  <div class="c1-touch"><div id="c1-stick" role="group" aria-label="移动摇杆"><span></span><small>移动</small></div><button id="c1-run" type="button" aria-pressed="false">跑步</button></div>
  <div id="c1-pause" class="c1-pause" hidden><section role="dialog" aria-modal="true" aria-labelledby="c1-dialog-title" tabindex="-1"><small>RETURN OLD SCHOOL / C1</small><h2 id="c1-dialog-title">暂停漫游</h2><p>WASD / 方向键行走，Shift 跑步。拖动观察，滚轮调节远近，V 切换第一／第三人称，R 返回本次起点。触屏左侧摇杆移动，右侧拖动观察。</p><p class="c1-boundary">C2 R3 块面学生形象按用户确认的白领、蓝身、上白下红横带与左胸 YL 制作。精确染色、裁剪、YL字形及通用脸型为H；不对应真实个人。C3再做全校园连续走测。</p><label for="c1-quality">画质与手机负载</label><select id="c1-quality"><option value="balanced">手机流畅 · 自适应分辨率</option><option value="detail">完整清晰 · 原画质</option></select><p class="c1-boundary">两档保留相同模型、材质与碰撞。流畅档只降低画布和阴影分辨率，界面文字保持清晰。</p><label for="c1-spawn">测试起点</label><select id="c1-spawn">${Object.entries(config.spawns).map(([k,s])=>`<option value="${k}">${s.label}</option>`).join('')}</select><div class="c1-dialog-actions"><button id="c1-resume" type="button">继续漫游</button><button id="c1-reset" type="button">回到所选起点</button><button id="c1-review" type="button">审阅建筑模型</button></div></section></div>`;
  document.getElementById('app')!.append(ui);
  const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
  const status=get('c1-status'),dialog=get('c1-pause'),dialogPanel=dialog.querySelector('section')!,stick=get('c1-stick'),stickKnob=stick.querySelector('span')!;
  get<HTMLSelectElement>('c1-quality').value=host.graphics?.state().mode??'detail';
  get<HTMLSelectElement>('c1-quality').onchange=()=>host.graphics?.set(get<HTMLSelectElement>('c1-quality').value);
  const enterButton=document.createElement('button');enterButton.id='c1-enter';enterButton.textContent='进入角色漫游';enterButton.type='button';document.getElementById('app')!.append(enterButton);
  if(innerWidth<700||matchMedia('(pointer:coarse)').matches)get('c1-hint').textContent='左摇杆移动 · 右侧拖动观察 · 跑步按钮切换';
  const shouldStart=!new URLSearchParams(location.search).has('view')&&new URLSearchParams(location.search).get('mode')!=='review';
  if(shouldStart)document.body.classList.add('c1-mode');
  await initPhysics();
  const collision=new CampusCollisionWorld(host.scene,config);
  const motor=new PlayerMotor(collision.world,config,(position:any,force=false)=>collision.ensure(position,force),(position:any)=>collision.containsPointInSolid(position));
  const follow=new FollowCamera(collision.world,motor,config),avatar=createStudentAvatar(host.mats);host.scene.add(avatar.root);avatar.root.visible=false;
  let enabled=false,ready=false,currentSpawn='gate',touchRun=false,lookPointer:number|null=null,stickPointer:number|null=null,lookX=0,lookY=0;
  let joy={x:0,z:0},lastNotice='',lastNoticeAt=0,lastFrame:any=null,physicsMs=0,avatarMotionSpeed=0,frameSamples:number[]=[],tickSamples:number[]=[];
  const keys=new Set<string>(),cleanup:Array<()=>void>=[];
  function listen(target:EventTarget,event:string,fn:EventListener,options?:AddEventListenerOptions){target.addEventListener(event,fn,options);cleanup.push(()=>target.removeEventListener(event,fn,options));}
  function notice(text:string){if(lastNotice!==text){status.textContent=text;lastNotice=text;lastNoticeAt=performance.now();}}
  function release(){keys.clear();joy={x:0,z:0};stickKnob.style.transform='translate(-50%,-50%)';lookPointer=stickPointer=null;touchRun=false;get('c1-run').setAttribute('aria-pressed','false');}
  function pause(value:boolean,focus=true){release();motor.setPaused(value);dialog.hidden=!value;get('c1-menu').setAttribute('aria-expanded',String(value));if(value&&focus)get('c1-resume').focus();if(!value&&focus)host.canvas.focus();}
  function spawn(key:string){
    const data=config.spawns[key as keyof typeof config.spawns];if(!data)throw Error('Unknown spawn');
    currentSpawn=key;get<HTMLSelectElement>('c1-spawn').value=key;
    const f=[...data.feet];collision.ensure({x:f[0],y:f[1]+1,z:f[2]},true);
    const hit=collision.world.castRayAndGetNormal(new RAPIER.Ray({x:f[0],y:f[1]+.8,z:f[2]},{x:0,y:-1,z:0}),1.6,true,undefined,undefined,motor.collider,motor.body);
    if(hit&&hit.normal.y>.65)f[1]=f[1]+.8-hit.timeOfImpact+.06;
    motor.spawn(f,data.yaw);follow.yaw=data.yaw;follow.pitch=config.camera.pitch;follow.distance=follow.zoom=config.camera.distance;release();notice(`${data.label} · 从这里开始行走`);
  }
  function activate(){
    if(!ready)return;host.prepare();enabled=true;document.body.classList.add('c1-mode');document.body.classList.remove('clean');
    host.camera.fov=config.camera.fov;host.camera.near=.08;host.camera.updateProjectionMatrix();
    spawn(currentSpawn);pause(false,false);host.canvas.focus();
  }
  function deactivate(goReview=false){enabled=false;release();motor.setPaused(true);dialog.hidden=true;avatar.root.visible=false;document.body.classList.remove('c1-mode');if(goReview)host.review();}
  function viewToggle(){follow.firstPerson=!follow.firstPerson;get('c1-perspective').textContent=follow.firstPerson?'第一人称':'第三人称';get('c1-perspective').setAttribute('aria-pressed',String(follow.firstPerson));}
  get('c1-menu').onclick=()=>pause(!motor.paused);get('c1-resume').onclick=()=>pause(false);
  get('c1-reset').onclick=()=>{try{spawn(get<HTMLSelectElement>('c1-spawn').value);pause(false);}catch(e){notice(String(e));}};
  get('c1-review').onclick=()=>deactivate(true);get('c1-perspective').onclick=viewToggle;enterButton.onclick=activate;
  get('c1-run').onclick=()=>{touchRun=!touchRun;get('c1-run').setAttribute('aria-pressed',String(touchRun));};
  host.canvas.tabIndex=0;host.canvas.setAttribute('aria-label','校园角色漫游；WASD移动，Esc暂停');
  const motionKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight']);
  listen(window,'keydown',((e:KeyboardEvent)=>{
    if(!enabled)return;
    if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause(!motor.paused);return;}
    if(motor.paused){if(e.code==='Tab'){const nodes=Array.from(dialog.querySelectorAll<HTMLElement>('button,select'));const i=nodes.indexOf(document.activeElement as HTMLElement);e.preventDefault();nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();}return;}
    if((e.target as HTMLElement)?.matches('input,select,textarea,button'))return;
    if(motionKeys.has(e.code)){e.preventDefault();keys.add(e.code);}
    if(!e.repeat&&e.code==='KeyV'){e.preventDefault();viewToggle();}
    if(!e.repeat&&e.code==='KeyR'){e.preventDefault();spawn(currentSpawn);}
  }) as EventListener);
  listen(window,'keyup',((e:KeyboardEvent)=>{keys.delete(e.code);}) as EventListener);
  listen(window,'blur',(()=>{if(enabled)pause(true,false);}) as EventListener);
  listen(document,'visibilitychange',(()=>{if(enabled&&document.hidden)pause(true,false);}) as EventListener);
  listen(host.canvas,'webglcontextlost',(()=>{if(enabled){pause(true,false);notice('图形上下文丢失，已暂停移动。');}}) as EventListener);
  listen(host.canvas,'contextmenu',((e:Event)=>{if(enabled)e.preventDefault();}) as EventListener);
  listen(host.canvas,'pointerdown',((e:PointerEvent)=>{
    if(!enabled||motor.paused||lookPointer!==null)return;e.preventDefault();host.canvas.focus();lookPointer=e.pointerId;lookX=e.clientX;lookY=e.clientY;host.canvas.setPointerCapture(e.pointerId);
  }) as EventListener);
  listen(host.canvas,'pointermove',((e:PointerEvent)=>{if(enabled&&!motor.paused&&lookPointer===e.pointerId){follow.orbit(e.clientX-lookX,e.clientY-lookY);lookX=e.clientX;lookY=e.clientY;}}) as EventListener);
  const endLook=((e:PointerEvent)=>{if(e.pointerId===lookPointer)lookPointer=null;}) as EventListener;
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(host.canvas,type,endLook);
  listen(host.canvas,'wheel',((e:WheelEvent)=>{if(enabled&&!motor.paused){e.preventDefault();follow.zoomBy(e.deltaY);}}) as EventListener,{passive:false});
  function moveStick(e:PointerEvent){const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/42,z=-(e.clientY-r.top-r.height/2)/42,m=Math.hypot(x,z),s=1/Math.max(1,m);joy=m<.12?{x:0,z:0}:{x:x*s,z:z*s};stickKnob.style.transform=`translate(calc(-50% + ${joy.x*37}px),calc(-50% + ${-joy.z*37}px))`;}
  listen(stick,'pointerdown',((e:PointerEvent)=>{if(!enabled||motor.paused||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);}) as EventListener);
  listen(stick,'pointermove',((e:PointerEvent)=>{if(e.pointerId===stickPointer)moveStick(e);}) as EventListener);
  const endStick=((e:PointerEvent)=>{if(e.pointerId===stickPointer){stickPointer=null;joy={x:0,z:0};stickKnob.style.transform='translate(-50%,-50%)';}}) as EventListener;
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(stick,type,endStick);
  function input(){const side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x,forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+joy.z;return {...follow.moveVector(side,forward),run:touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight')};}
  function update(dt:number){
    if(!enabled)return;const begin=performance.now();motor.advance(dt,input());physicsMs=performance.now()-begin;
    if(motor.feet()[1]<-12||!Object.values(motor.position).every(Number.isFinite)){motor.reset();release();notice('已返回安全起点。');}
    const p=host.pool,feet=motor.feet();
    if(Math.abs(feet[0]-p.x)<p.width/2&&Math.abs(feet[2]-p.z)<p.depth/2&&feet[1]<p.surface+.05){spawn(currentSpawn);notice('C1 不包含游泳，已返回起点。');}
    lastFrame=follow.update(Math.min(dt,.1));host.camera.position.set(lastFrame.position.x,lastFrame.position.y,lastFrame.position.z);host.camera.up.set(0,1,0);host.camera.lookAt(lastFrame.target.x,lastFrame.target.y,lastFrame.target.z);
    avatarMotionSpeed=motor.blocked?motor.actualSpeed:Math.hypot(motor.velocity.x,motor.velocity.z);
    avatar.update(motor.feet(),motor.heading,avatarMotionSpeed,motor.travel,motor.grounded,lastFrame.hideAvatar,Math.min(dt,.1));
    avatar.root.updateMatrixWorld(true);host.camera.updateMatrixWorld(true);
    if(!motor.paused&&performance.now()-lastNoticeAt>4000)notice(motor.blocked?'前方有实体阻挡 · 可沿墙转向':`${currentSpawn in config.spawns?'校园漫游':''} · ${motor.grounded?(motor.actualSpeed>.1?'行走中':'已接地'):'下落中'}`);
    if(dt>0&&!motor.paused){frameSamples.push(dt*1000);tickSamples.push(physicsMs);if(frameSamples.length>600){frameSamples.shift();tickSamples.shift();}}
  }
  function state(){return {ready,enabled,version:config.version,config,motor:motor.state(),camera:lastFrame,collision:collision.state(),input:input(),graphics:host.graphics?.state(),avatar:{visible:avatar.root.visible,footPosition:avatar.root.position.toArray(),animationDriveSpeed:avatarMotionSpeed,...avatar.state()},physicsMs};}
  const diag={state,config,activate,deactivate,pause,spawn,reset:()=>spawn(currentSpawn),setFirstPerson:(v:boolean)=>{if(follow.firstPerson!==v)viewToggle();},orbit:(dx:number,dy:number)=>follow.orbit(dx,dy),zoom:(v:number)=>follow.zoom=v,
    drive:(direction:{x:number;z:number;run:boolean},ticks:number)=>{const trace:any[]=[];for(let i=0;i<ticks;i++){motor.step(direction);if(i%15===0)trace.push(motor.state());}update(0);return {trace,end:state()};},
    walkTo:(points:number[][],run=true,maxTicks=7200)=>{
      const trace:any[]=[];let ticks=0,stalled=0,reason='complete';
      for(const point of points){let lastDistance=Infinity;
        while(ticks<maxTicks){const dx=point[0]-motor.position.x,dz=point[1]-motor.position.z,d=Math.hypot(dx,dz);if(d<.16)break;
          motor.step({x:dx/d,z:dz/d,run});ticks++;if(ticks%30===0)trace.push(motor.state());
          stalled=d>=lastDistance-.0005?stalled+1:0;lastDistance=d;if(stalled>120){reason='blocked';break;}
        }
        if(reason!=='complete'||ticks>=maxTicks){if(ticks>=maxTicks)reason='budget';break;}
      }
      for(let i=0;i<20;i++)motor.step({x:0,z:0,run:false});update(0);return {reason,ticks,trace,end:state()};
    },
    tick:(dt:number)=>{update(dt);return state();},
    relocateForTest:(feet:number[],yaw=0)=>{motor.spawn(feet,yaw);follow.yaw=yaw;update(0);return state();},
    frameSamples:()=>({intervalMs:[...frameSamples],physicsCpuMs:[...tickSamples]}),clearSamples:()=>{frameSamples=[];tickSamples=[];}
  };
  ready=true;Object.assign(window,{__YALI_C1__:diag});
  if(shouldStart)activate();else document.body.classList.remove('c1-mode');
  return {get enabled(){return enabled;},update,disable:()=>deactivate(),target:()=>new THREE.Vector3(motor.position.x,motor.position.y,motor.position.z),state,dispose(){cleanup.forEach(fn=>fn());avatar.dispose();motor.dispose();collision.dispose();ui.remove();enterButton.remove();}};
}
export type PlayerMode=Awaited<ReturnType<typeof createPlayerMode>>;
