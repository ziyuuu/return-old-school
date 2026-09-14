import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {exportAvatarGLB} from './avatar-export.mjs';
import {createCampusMaterials} from '../render/materials';
import {installDaylight} from '../render/daylight';
import {createStudentAvatar} from './student-avatar';

const style=document.createElement('style');style.textContent=`*{box-sizing:border-box}body{font:13px system-ui,'Microsoft YaHei';color:#34473f;background:#edf0e8;overflow:hidden}canvas{display:block;touch-action:none}header{position:absolute;top:24px;left:28px;pointer-events:none}h1{font-size:22px;margin:0 0 7px;font-weight:600}p{margin:3px 0;color:#65756b;font-size:12px}.bar{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:5px;max-width:95%;width:max-content;background:#f7f8f0df;padding:7px;border:1px solid #c9d2c7;border-radius:9px}button{font:inherit;padding:8px 13px;border:1px solid #c9d2c7;border-radius:5px;color:#354e45;background:#f9faf3;cursor:pointer}button.active{background:#375e51;color:#fff}small{position:absolute;right:24px;top:28px;color:#718276;max-width:300px;text-align:right;line-height:1.7}@media(max-width:600px){header{top:17px;left:16px}h1{font-size:17px}small{display:none}.bar{bottom:16px}button{padding:8px 10px}}`;
document.head.append(style);document.body.insertAdjacentHTML('beforeend',`<header><h1>复原雅礼 · 学生模型</h1><p>C2 R2 · 同一实装蒙皮模型 / 非概念图</p><p>拖动环绕 · 滚轮远近 · 白领 / 蓝身 / 白红横带 / YL</p></header><small>独立人物工坊，不是校园通行验收<br>通用虚构学生 · 非真实人物肖像<br>精确染色、裁剪与人体参数为 H</small><nav class="bar"><button data-view="front">正面</button><button data-view="side">侧面</button><button data-view="back">背面</button><button data-view="face">面部</button><button data-pose="idle" class="active">站立</button><button data-pose="walk">行走</button><button data-pose="run">跑步</button><button id="export">GLB 模型</button></nav>`);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);document.getElementById('studio')!.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,innerWidth/innerHeight,.02,100);camera.position.set(2.1,1.65,3.5);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.87,0);controls.minDistance=.32;controls.maxDistance=6;controls.maxPolarAngle=Math.PI*.64;
const daylight=installDaylight(renderer,scene);daylight.setResolution(1024);daylight.focus(new THREE.Vector3(0,.85,0),3.5);
const ramps=[['#788f8d','#b7c6b6','#e9e5d2'],['#476b63','#75907b','#a6b493'],['#637f7b','#9caaa0','#cad0bc'],['#806d63','#b6937c','#d4b89b'],['#527374','#8aa4a0','#b9d0c3'],['#6c7a79','#9eaba7','#c8d0c6'],['#687a7a','#a2afaa','#ccd2c2'],['#8c7d5e','#c1b186','#e5d7ad'],['#73827c','#becbbb','#f2f0da'],['#345c77','#397b9b','#57a3ba'],['#3e595e','#526b6a','#698179'],['#6f6760','#95735e','#ba8b65'],['#6f816b','#c4aa5a','#e6c555'],['#3e7068','#4c9479','#74b089'],['#82918d','#cad0c4','#efede1'],['#5b6f6d','#aeb9b3','#d9dfd4'],['#253d41','#405e60','#73918b'],['#774f4c','#a77770','#c69c92'],['#811e24','#b5252b','#d33b3c'],['#bb9436','#e5bb4e','#f8d169'],['#58383b','#845254','#a87673'],['#345a7b','#477da3','#7ba5c1']];
const mats=createCampusMaterials(ramps,renderer),avatar=createStudentAvatar(mats);scene.add(avatar.root);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mats[14]);floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
let pose='idle',travel=0,last=0,frozen=false;
function frame(t:number){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(!frozen){const speed=pose==='walk'?1.65:pose==='run'?3.4:0;travel+=speed*dt;avatar.update([0,0,0],0,speed,travel,true,false,dt);}controls.update();renderer.render(scene,camera);}
function view(v:string){const settings:any={front:[[0,1.03,3.5],[0,.85,0]],back:[[0,1.03,-3.5],[0,.85,0]],side:[[3.5,1.03,0],[0,.85,0]],face:[[.28,1.61,.78],[0,1.56,0]],oblique:[[2.1,1.65,3.5],[0,.87,0]]};camera.position.fromArray(settings[v][0]);controls.target.fromArray(settings[v][1]);controls.update();}
function setPose(v:string){pose=v;document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',(b as HTMLElement).dataset.pose===v));}
async function exportGLB(){return await exportAvatarGLB(avatar) as ArrayBuffer;}
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view!));document.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(b=>b.onclick=()=>setPose(b.dataset.pose!));
document.getElementById('export')!.onclick=async()=>{const data=await exportGLB(),url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download='Yali_Student_C2_R2.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
Object.assign(window,{__C2_STUDIO__:{ready:true,view,setPose,avatar,renderer,scene,camera,
  freeze:(value=true)=>frozen=value,step:(d:number,s=1.65)=>{travel+=d;avatar.update([0,0,0],0,s,travel,true,false,.1);renderer.render(scene,camera);return avatar.state();},
  shot:()=>{renderer.render(scene,camera);renderer.getContext().finish();return renderer.domElement.toDataURL('image/png');},exportGLB}});
view('front');renderer.setAnimationLoop(frame);
