import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import source from '../../../data/m10/campus-layout.json';
import { bounds, footprint, courtRects, checkLayout } from './layout-core.mjs';
import './style.css';
import { edgeWidth } from './revision-core.mjs';
import { r4Facility, setToiletSection } from './revision-r4-scene';
import { r3Facility, buildR3Thresholds } from './revision-r3-scene';
import { revisedFacility, buildRevisionParts } from './revision-scene';

// M1.0 hypotheses, not site measurements. No gameplay or night layer.
type Vec3 = [number, number, number];
type Facility = typeof source.facilities[number];
const layout=source, report=checkLayout(layout);
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=el<HTMLDivElement>('viewport');
let renderer: THREE.WebGLRenderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});}
catch {el('error').hidden=false;el('error').textContent='此浏览器无法建立 WebGL2 场景。请在支持硬件加速的桌面浏览器中打开；本文件不是静态图片。';throw new Error('WebGL2 unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewport.append(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();el('error').hidden=false;el('error').textContent='WebGL 上下文已丢失。当前只有校核视角，无游戏进度；恢复后刷新即可重新加载。';});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());

const scene=new THREE.Scene();scene.background=new THREE.Color('#edf0e8');
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,1,1100);
const topCamera=new THREE.OrthographicCamera(-200,200,200,-200,1,1100);
topCamera.up.set(0,0,-1);
let active:THREE.PerspectiveCamera|THREE.OrthographicCamera=camera;
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=8;controls.maxDistance=900;controls.maxPolarAngle=Math.PI*.495;
const topControls=new OrbitControls(topCamera,renderer.domElement);
topControls.enableRotate=false;topControls.enableDamping=true;topControls.enabled=false;topControls.minZoom=.45;topControls.maxZoom=8;
const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(-100,260,-80);sun.target.position.set(45,0,135);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-250,right:250,top:250,bottom:-250,near:1,far:900});sun.shadow.normalBias=.18;sun.shadow.bias=-.00015;
scene.add(sun,sun.target);

// Architectural colours use a Canvas Ramp LUT. Debug lines/HTML are a separate annotation layer.
const ramps=[
 ['#788f8d','#b7c6b6','#e9e5d2'],
 ['#476b63','#75907b','#a6b493'],
 ['#637f7b','#9caaa0','#cad0bc'],
 ['#806d63','#b6937c','#d4b89b'],
 ['#527374','#8aa4a0','#b9d0c3'],
 ['#6c7a79','#9eaba7','#c8d0c6'],
 ['#687a7a','#a2afaa','#ccd2c2'],
 ['#8c7d5e','#c1b186','#e5d7ad'],
 ['#73827c','#becbbb','#f2f0da']
];
const lutCanvas=document.createElement('canvas');lutCanvas.width=256;lutCanvas.height=ramps.length;
const ctx=lutCanvas.getContext('2d')!;
ramps.forEach((row,y)=>row.forEach((colour,j)=>{ctx.fillStyle=colour;const starts=[0,95,182],ends=[95,182,256];ctx.fillRect(starts[j],y,ends[j]-starts[j],1);}));
const lut=new THREE.CanvasTexture(lutCanvas);lut.colorSpace=THREE.SRGBColorSpace;lut.minFilter=lut.magFilter=THREE.NearestFilter;lut.generateMipmaps=false;lut.flipY=false;
const mats=ramps.map((_,row)=>{
 const mat=new THREE.MeshLambertMaterial({color:0xffffff});
 mat.onBeforeCompile=shader=>{
  shader.uniforms.uRamp={value:lut};shader.uniforms.uRampRow={value:(row+.5)/ramps.length};
  shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nuniform sampler2D uRamp;\nuniform float uRampRow;');
  shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
   'float rampIntensity = 0.7;\n#if NUM_DIR_LIGHTS > 0\nrampIntensity = dot(normal, normalize(directionalLights[0].direction)) * 0.5 + 0.5;\n#endif\nrampIntensity *= getShadowMask();\nvec3 outgoingLight = texture2D(uRamp, vec2(clamp(rampIntensity,0.002,0.998),uRampRow)).rgb;');
 };
 mat.customProgramCacheKey=()=>`yali-ramp-${row}`;return mat;
});
const volumes=new THREE.Group(), surfaces=new THREE.Group(), outlines=new THREE.Group(), routeOverlay=new THREE.Group();
scene.add(surfaces,volumes,outlines,routeOverlay);routeOverlay.visible=false;
const roots=new Map<string,THREE.Group>(), pickables:THREE.Object3D[]=[], labels=new Map<string,{node:HTMLDivElement,point:THREE.Vector3}>();
const keyLabels=new Set(['01','02','03','06','08','10','11','13','15','17','18','20','23','24','25','26','27']);
const solidKinds=new Set(['building','music','auxiliary','context','toilet-pool','canteen']);
function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,pos:Vec3=[0,0,0]){
 const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,row=0){return mesh(new THREE.BoxGeometry(w,h,d),mats[row],parent,[x,y+h/2,z]);}
function line(points:number[][],parent:THREE.Object3D,colour='#829c8c',dash=false){
 const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p as Vec3)));
 const mat=dash?new THREE.LineDashedMaterial({color:colour,dashSize:2,gapSize:1.2}):new THREE.LineBasicMaterial({color:colour});
 const l=new THREE.Line(g,mat);if(dash)l.computeLineDistances();parent.add(l);return l;
}
function rect(parent:THREE.Object3D,minX:number,minZ:number,maxX:number,maxZ:number,y=.17,colour='#7d9688'){
 return line([[minX,y,minZ],[maxX,y,minZ],[maxX,y,maxZ],[minX,y,maxZ],[minX,y,minZ]],parent,colour);
}
function ribbon(points:Vec3[],width:number,row=2,y=.02,parent:THREE.Object3D=surfaces){
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
  if(len<.01)continue;
  const m=box(parent,width,.045,len,(a[0]+b[0])/2,y,(a[2]+b[2])/2,row);m.rotation.y=Math.atan2(dx,dz);m.castShadow=false;
 }
}
const [minX,minZ,maxX,maxZ]=layout.ground.bounds;
box(surfaces,maxX-minX,1.4,maxZ-minZ,(minX+maxX)/2,-1.5,(minZ+maxZ)/2,1);
box(surfaces,1600,.1,1600,50,-1.75,130,2);
box(surfaces,maxX-minX,.06,12,(minX+maxX)/2,-.04,-12,2);
line([[minX,0,-12],[maxX,0,-12]],outlines,'#f3efe0',true);
rect(outlines,minX,0,maxX,maxZ,.12,'#748e80');
for(const [a,b] of layout.navigation.edges){
 const pa=layout.navigation.nodes[a as keyof typeof layout.navigation.nodes] as Vec3,pb=layout.navigation.nodes[b as keyof typeof layout.navigation.nodes] as Vec3;
 const before=surfaces.children.length;
 ribbon([pa,pb],edgeWidth(layout,a,b));
 for(const o of surfaces.children.slice(before)){o.name=`road-${a}--${b}`;o.userData.route=[a,b];o.userData.width=edgeWidth(layout,a,b);}
 line([[pa[0],.3,pa[2]],[pb[0],.3,pb[2]]],routeOverlay,'#b2793f',true);
}
const grid=new THREE.GridHelper(360,36,'#6a8f85','#a7b9a9');grid.position.set(51,-.005,139);grid.visible=false;scene.add(grid);
const axes=new THREE.AxesHelper(16);axes.position.y=.2;scene.add(axes);
rect(outlines,-2,-2,2,2,.18,'#b38146');
const shortLabels:Record<string,string>={'10':'主席台','23':'沙坑','02':'侧门','20':'家属区','24':'音乐楼 · 4F','25':'主楼厕所','26':'池畔厕所','27':'校名石'};
function addLabel(f:Facility){if(!f.position)return;
 const node=document.createElement('div');node.className='facility-label';node.innerHTML=`<b>${f.id}</b>${shortLabels[f.id] ?? f.name.replace(/（.*?）/g,'').replace('旧主教学楼／教室','旧主教学楼')}`;
 node.onclick=()=>selectFacility(f.id,true);viewport.append(node);
 labels.set(f.id,{node,point:new THREE.Vector3(f.position[0],(f.size?.[1]??0)+1.8,f.position[2])});
}
function addFootprint(f:Facility){const p=footprint(f);if(!p)return;line([...p,p[0]].map((v:number[])=>[v[0],.2,v[1]]),outlines,'#779286',true);}
for(const f of layout.facilities){
 if(!f.position||!f.size)continue;
 const [x,y,z]=f.position,[w,h,d]=f.size,g=new THREE.Group();g.name=`F${f.id}`;g.userData.facility=f.id;g.position.set(x,y,z);roots.set(f.id,g);
 (['field','courts','straight-track','pool','forecourt','sandpit','garden','route','marker','subspace'].includes(f.kind)?surfaces:volumes).add(g);
 addFootprint(f);addLabel(f);
 if(r4Facility(f,g,{box,mesh,line,rect,mats,layout}) || r3Facility(f,g,{box,mesh,line,rect,mats,layout}) || revisedFacility(f,g,{box,mesh,line,rect,mats,layout})) {
  // R2 builds real openings / larger envelopes without replacing unrelated facilities.
 } else if(solidKinds.has(f.kind)){
  if(f.kind==='context'){
    box(g,w,.1,d,0,0,0,5);
    for(const [px,pz,pw,pd,ph] of [[-13,-13,18,20,16],[13,-11,15,25,22],[-10,16,28,16,13],[17,18,11,15,18]])box(g,pw,ph,pd,px,0,pz,5);
  }else if(f.kind==='canteen'){
    box(g,w,7.2,d,0,3.6,0,0);box(g,w,.3,d,0,3.3,0,6);
    for(const px of [-w/2+1,0,w/2-1])for(const pz of [-d/2+1,d/2-1])box(g,.7,3.3,.7,px,0,pz,6);
  }else box(g,w,h,d,0,0,0,f.kind==='auxiliary'?6:0);
  if(f.floors&&f.floors>1&&f.kind!=='context')for(let j=1;j<f.floors;j++)rect(g,-w/2,-d/2,w/2,d/2,h*j/f.floors,'#809890');
  if(f.kind!=='context')box(g,w+.12,.24,d+.12,0,h+.02,0,6);
 } else if(f.kind==='teaching'){
   // A real open front corridor lets every floor bridge meet open space.
   box(g,w,h,d-2.1,0,0,1.05,0);
   for(let j=0;j<(f.floors??4);j++){
    box(g,w,.18,2.1,0,j*3.8,-d/2+1.05,6);
    for(let k=0;k<=12;k++)box(g,.32,3.6,.32,-w/2+.2+k*(w-.4)/12,j*3.8,-d/2+.18,6);
   }
 } else if(f.kind==='gym'){
   const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h*.62);s.lineTo(w*.29,h);s.lineTo(-w*.29,h);s.lineTo(-w/2,h*.62);s.closePath();
   mesh(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),mats[0],g,[0,0,-d/2]);
   box(g,w-2,.3,3,0,3.8,-d/2+1.5,6);box(g,w*.54,.25,.16,0,h*.6,-d/2-.1,5);
 } else if(f.kind==='gate'){
   box(g,3,5.2,d,-w/2+1.5,0,0,0);box(g,4,7,d,w/2-2,0,0,0);box(g,w,1.6,d,0,5.2,0,0);
 } else if(f.kind==='stone'){
   const m=mesh(new THREE.IcosahedronGeometry(1,0),mats[7],g,[0,h/2,0]);m.scale.set(w/2,h/2,d/2);
 } else if(f.kind==='field'){
   const s=new THREE.Shape(),r=w/2,halfStraight=d/2-r;
   s.moveTo(-r,-halfStraight);s.absarc(0,-halfStraight,r,Math.PI,Math.PI*2,false);s.lineTo(r,halfStraight);s.absarc(0,halfStraight,r,0,Math.PI,false);s.closePath();
   const outer=mesh(new THREE.ShapeGeometry(s,40),mats[3],g,[0,.08,0]);outer.rotation.x=-Math.PI/2;outer.castShadow=false;
   const inner=mesh(new THREE.ShapeGeometry(s,40),mats[1],g,[0,.16,0]);inner.rotation.x=-Math.PI/2;inner.scale.set(.86,.88,1);inner.castShadow=false;
   for(const scale of [.94,.98]){const pts=s.getPoints(100).map(v=>[v.x*scale,.12,-v.y*(.98-(1-scale)*.4)]);line([...pts,pts[0]],g,'#e1dfca');}
   rect(g,-w*.31,-d*.32,w*.31,d*.32,.22,'#e8e8d2');line([[-w*.31,.22,0],[w*.31,.22,0]],g,'#e8e8d2');
 } else if(f.kind==='courts'){
   box(g,w,.08,d,0,0,0,1);
   for(const c of courtRects(layout)){
    rect(g,c.minX-x,c.minZ-z,c.maxX-x,c.maxZ-z,.11,'#f3eed8');
    line([[c.minX-x,.11,(c.minZ+c.maxZ)/2-z],[c.maxX-x,.11,(c.minZ+c.maxZ)/2-z]],g,'#f3eed8');
   }
 } else if(f.kind==='straight-track'){
   box(g,w,.08,d,0,0,0,3);for(let i=1;i<6;i++)line([[-w/2+w*i/6,.10,-d/2],[-w/2+w*i/6,.10,d/2]],g,'#e9dfc8');
 } else if(f.kind==='pool'){
   box(g,w,.15,d,0,0,0,4);rect(g,-w/2,-d/2,w/2,d/2,.18,'#dce5d9');
 } else if(f.kind==='sandpit')box(g,w,.12,d,0,0,0,7);
 else if(f.kind==='forecourt'){
   box(g,w,.08,d,0,0,0,2);box(g,2.6,.22,2.6,-8,.08,0,0);
   mesh(new THREE.CylinderGeometry(.07,.08,10,8),mats[6],g,[-8,5.3,0]);
 } else if(f.kind==='garden')box(g,w,.1,d,0,0,0,1);
 else if(f.kind==='subspace')box(g,w,h,d,0,0,0,5);
 else if(f.kind==='marker')rect(g,-w/2,-d/2,w/2,d/2,.12,'#a5825d');
 else if(f.kind==='rostrum')box(g,w,h,d,0,0,0,0);
 g.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.facility=f.id;pickables.push(o);}});
}
const {structures,roofs}=buildRevisionParts(layout,{volumes,surfaces,box,line,rect,roots,pickables});
const selection=new THREE.Box3Helper(new THREE.Box3(),0xbc8a45);selection.visible=false;scene.add(selection);
let selected='',view='overview',fly=false,tour=false,labelsOn=true,planOnly=false;
let theta=0,phi=0,pointerDown=false,pointerLast=[0,0],clickStart=[0,0],last=0;
const keys=new Set<string>();
const select=el<HTMLSelectElement>('facility');
for(const f of layout.facilities){const o=document.createElement('option');o.value=f.id;o.textContent=`${f.id}  ${f.name}${f.position?'':' · 未定位'}`;select.append(o);}
el('check-summary').textContent=`空间约束 ${report.results.filter(r=>r.passed).length} / ${report.results.length}`;
el('checks').innerHTML=report.results.map(r=>`<div>${r.passed?'✓':'✕'} ${r.id}</div>`).join('');
function toast(text:string){el('toast').textContent=text;el('toast').classList.add('visible');setTimeout(()=>el('toast').classList.remove('visible'),3200);}
function setInspector(open:boolean){el('inspector').hidden=!open;el('inspect-btn').setAttribute('aria-expanded',String(open));}
function selectFacility(id:string,focus=false){
 const f=layout.facilities.find(v=>v.id===id);if(!f)return;
 selected=id;select.value=id;setInspector(true);
 const b=f.position&&f.size?bounds(f):null;selection.visible=Boolean(b);
 if(b)selection.box.set(new THREE.Vector3(b.minX,.1,b.minZ),new THREE.Vector3(b.maxX,(f.size?.[1]??0)+.6,b.maxZ));
 el('details').innerHTML=`<h3>${f.id} / ${f.name}</h3><span class="tag">${f.position?'H · 米制位置推定':'U · 未定位，不生成占地'}</span><dl><dt>工作中心</dt><dd>${f.position?f.position.map(n=>n.toFixed(2)).join(' / ')+' m':'无坐标'}</dd><dt>占地 × 高</dt><dd>${f.size?`${f.size[0]} × ${f.size[2]} / ${f.size[1]} m`:'尚未指定'}</dd><dt>楼层</dt><dd>${f.floors??'—'} ${f.floors?`[${f.evidence.floorCount}]`:''}</dd><dt>来源</dt><dd>${f.evidence.reference}</dd></dl><p>${f.note}</p><p><strong>后续核对：</strong>${f.evidence.unknowns}</p>`;
 if(focus&&f.position&&f.size){stopModes();active=camera;controls.enabled=true;topControls.enabled=false;
  const radius=Math.max(f.size[0],f.size[2],20);controls.target.set(...f.position as Vec3).y=Math.min(f.size[1]/2,9);
  camera.position.copy(controls.target).add(new THREE.Vector3(radius*.85,radius*.85,radius*1.15));controls.update();
 }
}
select.onchange=()=>selectFacility(select.value,true);
el('inspect-btn').onclick=()=>{if(!selected)selectFacility('01',false);else setInspector(el('inspector').hidden);};
el('close-inspector').onclick=()=>setInspector(false);
function stopModes(){fly=false;tour=false;keys.clear();el('fly-btn').classList.remove('active');el('tour-btn').classList.remove('active');el('help').textContent='拖动环绕 · 右键平移 · 滚轮缩放 · 点击体块查证';}
let toiletLevel=0;
function setToiletLevel(level:number,focus=false){
 toiletLevel=level;setToiletSection(roots,level);el<HTMLSelectElement>('toilet-level').value=String(level);
 if(focus&&level){stopModes();active=camera;controls.enabled=true;topControls.enabled=false;const y=(level-1)*3.8;camera.position.set(7,y+10,238);controls.target.set(-10,y+1,224);controls.update();}
}
function setView(name:string){
 const p=layout.cameraPresets[name as keyof typeof layout.cameraPresets];if(!p)return;stopModes();view=name;setToiletLevel(name==='toilet-floor'?2:0);
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',(b as HTMLElement).dataset.view===name));
 active=name==='top'?topCamera:camera;controls.enabled=name!=='top';topControls.enabled=name==='top';
 active.position.set(...p.position as Vec3);active.up.set(...(name==='top'?[0,0,-1]:[0,1,0]) as Vec3);
 (name==='top'?topControls:controls).target.set(...p.target as Vec3);active.lookAt(...p.target as Vec3);
 if(name==='top'){topCamera.zoom=1;topCamera.updateProjectionMatrix();}controls.update();topControls.update();
 el('view-name').innerHTML=`${p.label}<span>体量校核 / 非精模 · 坐标全部为工作推定</span>`;
}
for(const btn of document.querySelectorAll<HTMLButtonElement>('[data-view]'))btn.onclick=()=>setView(btn.dataset.view!);
el<HTMLSelectElement>('toilet-level').onchange=e=>setToiletLevel(Number((e.target as HTMLSelectElement).value),true);
el<HTMLInputElement>('labels-check').onchange=e=>labelsOn=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('roofs-check').onchange=e=>roofs.visible=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('grid-check').onchange=e=>grid.visible=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('routes-check').onchange=e=>routeOverlay.visible=(e.target as HTMLInputElement).checked;
el<HTMLInputElement>('footprints-check').onchange=e=>{planOnly=(e.target as HTMLInputElement).checked;volumes.visible=!planOnly;roots.get('12')!.visible=!planOnly;if(planOnly)setView('top');};
function download(name:string,data:Blob|string){const u=typeof data==='string'?data:URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=name;a.click();if(typeof data!=='string')setTimeout(()=>URL.revokeObjectURL(u),1000);}
el('download-layout').onclick=()=>download(`campus-layout-${layout.version}.json`,new Blob([JSON.stringify(layout,null,2)],{type:'application/json'}));
el('capture-btn').onclick=()=>{renderer.render(scene,active);download(`yali-M1.0-${view}.png`,renderer.domElement.toDataURL('image/png'));toast('已输出当前WebGL画布；尺寸仍为工作推定。');};
el('fly-btn').onclick=()=>{
 if(fly){setView(view);return;}stopModes();fly=true;active=camera;controls.enabled=topControls.enabled=false;camera.up.set(0,1,0);
 const direction=camera.getWorldDirection(new THREE.Vector3());phi=Math.asin(direction.y);theta=Math.atan2(-direction.x,-direction.z);
 el('fly-btn').classList.add('active');el('help').textContent='WASD 平移 · Q/R 升降 · 拖动观察 · Shift 加速 · Esc 退出（无碰撞）';toast('自由校核相机：允许穿过体量检查，不是人物控制器。');
};
const tourPath=layout.navigation.tourPath;
let tourEdge=0,tourT=0;
el('tour-btn').onclick=()=>{if(tour){setView('overview');return;}stopModes();tour=true;active=camera;controls.enabled=topControls.enabled=false;camera.up.set(0,1,0);tourEdge=tourT=0;const start=layout.navigation.nodes[tourPath[0] as keyof typeof layout.navigation.nodes],next=layout.navigation.nodes[tourPath[1] as keyof typeof layout.navigation.nodes];camera.position.set(start[0],layout.navigation.reviewHeight,start[2]);camera.lookAt(next[0],layout.navigation.reviewHeight,next[2]);el('tour-btn').classList.add('active');el('help').textContent='沿连通图进行地面路线巡览 · 点击停止或 Esc · 不是物理角色';};
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=true;pointerLast=clickStart=[e.clientX,e.clientY];});
window.addEventListener('pointerup',e=>{
 if(pointerDown&&!fly&&!tour&&Math.hypot(e.clientX-clickStart[0],e.clientY-clickStart[1])<5){
  const r=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),active);
  const hit=ray.intersectObjects(pickables.filter(v=>!planOnly||v.parent?.parent!==volumes),false)[0];if(hit?.object.userData.facility)selectFacility(hit.object.userData.facility);
 }pointerDown=false;
});
window.addEventListener('pointermove',e=>{if(pointerDown&&fly){theta-=(e.clientX-pointerLast[0])*.004;phi=THREE.MathUtils.clamp(phi-(e.clientY-pointerLast[1])*.004,-1.45,1.45);pointerLast=[e.clientX,e.clientY];}});
window.addEventListener('keydown',e=>{if((e.target as HTMLElement)?.matches('input,select,textarea'))return;if(e.key==='Escape'){setView(view);setInspector(false);return;}keys.add(e.code);if(fly&&['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyR','Space'].includes(e.code))e.preventDefault();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();pointerDown=false;});
function resize(){
 renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 const aspect=innerWidth/innerHeight;const half=Math.max(190,175/aspect);
 topCamera.left=-half*aspect;topCamera.right=half*aspect;topCamera.top=half;topCamera.bottom=-half;topCamera.updateProjectionMatrix();
}window.addEventListener('resize',resize);resize();
const projected=new THREE.Vector3();
function render(time:number){
 const dt=Math.min((time-last)/1000||0,.05);last=time;
 if(fly){
  const speed=(keys.has('ShiftLeft')?65:18)*dt,forward=new THREE.Vector3(-Math.sin(theta),0,-Math.cos(theta)),right=new THREE.Vector3(Math.cos(theta),0,-Math.sin(theta));
  const movement=new THREE.Vector3();if(keys.has('KeyW'))movement.add(forward);if(keys.has('KeyS'))movement.sub(forward);if(keys.has('KeyD'))movement.add(right);if(keys.has('KeyA'))movement.sub(right);
  if(keys.has('KeyR'))movement.y+=1;if(keys.has('KeyQ'))movement.y-=1;if(movement.lengthSq())camera.position.addScaledVector(movement.normalize(),speed);
  camera.position.y=Math.max(.8,camera.position.y);camera.rotation.order='YXZ';camera.rotation.set(phi,theta,0);
 }else if(tour){
  const a=layout.navigation.nodes[tourPath[tourEdge] as keyof typeof layout.navigation.nodes],b=layout.navigation.nodes[tourPath[(tourEdge+1)%tourPath.length] as keyof typeof layout.navigation.nodes];
  const len=Math.hypot(b[0]-a[0],b[2]-a[2]);tourT+=dt*12/Math.max(len,1);
  if(tourT>=1){tourT=0;tourEdge++;if(tourEdge>=tourPath.length-1){setView('overview');return;}}
  camera.position.set(THREE.MathUtils.lerp(a[0],b[0],tourT),layout.navigation.reviewHeight,THREE.MathUtils.lerp(a[2],b[2],tourT));camera.lookAt(b[0],layout.navigation.reviewHeight,b[2]);
 }else {if(controls.enabled)controls.update();if(topControls.enabled)topControls.update();}
 renderer.render(scene,active);
 for(const [id,label] of labels){
  projected.copy(label.point).project(active);const visible=labelsOn&&(keyLabels.has(id)||selected===id||view==='sports'&&['04','05','24','26','28'].includes(id)||view==='teaching'&&id==='25')&&projected.z<1&&projected.z>-1;
  label.node.style.display=visible?'block':'none';const ox=view==='top'?(id==='27'?-35:id==='02'?35:0):0,oy=view==='top'?(id==='01'?-18:['02','27'].includes(id)?8:0):0;label.node.style.left=`${(projected.x*.5+.5)*innerWidth+ox}px`;label.node.style.top=`${(-projected.y*.5+.5)*innerHeight+oy}px`;label.node.classList.toggle('selected',selected===id);
 }
}
setView('overview');renderer.setAnimationLoop(render);
buildR3Thresholds(layout,{surfaces,box});
const params=new URLSearchParams(location.search);if(params.has('view'))setView(params.get('view')!);if(params.get('clean')==='1')document.body.classList.add('clean');
function probeSegment(a:number[],b:number[]){
 scene.updateMatrixWorld(true);
 const origin=new THREE.Vector3(...a as Vec3),end=new THREE.Vector3(...b as Vec3),distance=origin.distanceTo(end);
 const ray=new THREE.Raycaster(origin,end.sub(origin).normalize(),.001,Math.max(.001,distance-.001));
 const meshes:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.geometry)meshes.push(o);});
 return ray.intersectObjects(meshes,false).map(h=>({name:h.object.name,facility:h.object.userData.facility||null,distance:h.distance}));
}
function geometrySnapshot(){
 scene.updateMatrixWorld(true);
 const snapshot:any={};const extra:THREE.Object3D[]=[];roots.get('25')?.traverse(o=>{if(o.name)extra.push(o);});extra.push(...surfaces.children.filter(o=>o.name.startsWith('road-')));
 for(const object of [...extra,...roots.values(),...roots.get('20')!.children,structures,...structures.children,roofs,...roofs.children,...structures.children.filter(v=>v!==roofs)]){
  const bb=new THREE.Box3().setFromObject(object);snapshot[object.name]={min:bb.min.toArray(),max:bb.max.toArray(),visible:object.visible};
 }
 return snapshot;
}
Object.assign(window,{__YALI_M10__:{version:layout.version,layout,report,setView,selectFacility,setToiletLevel,probeSegment,geometrySnapshot,
 probeFloor:(x:number,y:number,z:number)=>{scene.updateMatrixWorld(true);const objects:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh)objects.push(o);});const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.5,z),new THREE.Vector3(0,-1,0),0,.8);return ray.intersectObjects(objects,false).map(h=>({name:h.object.name,y:h.point.y}));},
 probeSurface:(x:number,z:number)=>{scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,3,z),new THREE.Vector3(0,-1,0),0,3.1);return ray.intersectObjects(surfaces.children,true).filter(h=>h.point.y>0).map(h=>({name:h.object.name,y:h.point.y}));},
 getState:()=>({toiletLevel,view,fly,tour,selected,camera:active.position.toArray(),renderer:renderer.info.render,canvas:[renderer.domElement.width,renderer.domElement.height],labelsOn,planOnly,roofsVisible:roofs.visible,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION)}),ready:true}});
