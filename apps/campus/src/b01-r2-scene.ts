import * as THREE from 'three';
import {addDetailedBoxInstances} from './render/detail-geometry.mjs';
/** Renderer adapter for the R2 model. Geometry/semantic decisions live in the pure model. */
const materialCache=new WeakMap<THREE.Material,THREE.Material>();
function material(source:THREE.Material){let m=materialCache.get(source);if(!m){m=source.clone();m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=source.customProgramCacheKey;m.side=THREE.DoubleSide;materialCache.set(source,m);}return m;}
function row(role:string){return role==='glazing'?16:role==='frame'?15:role==='planter-soil'?1:role==='porch-trim'?17:['rail','rail-post','bridge-rail'].includes(role)?5:['slab','roof','bridge-floor','cornice','cupola','sill','porch-roof'].includes(role)?6:14;}
function partsInto(parent:THREE.Group,parts:any[],mats:THREE.Material[],owner:string){
 const levels=new Map<number,THREE.Group>(),buckets=new Map<string,any[]>();
 for(const p of parts){if(!levels.has(p.level)){const g=new THREE.Group();g.name=`R2-${owner}-level-${p.level}`;g.userData.floor=p.level;parent.add(g);levels.set(p.level,g);}
  const key=p.level+'|'+p.role+'|'+p.shape;const a=buckets.get(key)??[];a.push(p);buckets.set(key,a);
 }
 for(const [key,list]of buckets){const p=list[0],mat=material(mats[row(p.role)]),g=levels.get(p.level)!;
  if(p.shape!=='box'){for(const v of list){const geo=v.shape==='dome'?new THREE.SphereGeometry(1,96,48,0,Math.PI*2,0,Math.PI/2):new THREE.CylinderGeometry(1,1,1,96),mesh=new THREE.Mesh(geo,mat);mesh.position.set(...v.center as [number,number,number]);mesh.scale.set(v.size[0]/2,v.size[1],v.size[2]/2);mesh.name=v.id;mesh.userData={role:v.role,facility:owner};mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}continue;}
  if(['slab','bridge-floor','porch-landing'].includes(p.role)){for(const v of list){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...v.size as [number,number,number]),mat);mesh.position.set(...v.center as [number,number,number]);mesh.name=v.id;mesh.userData={role:v.role,facility:owner};mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}continue;}
  addDetailedBoxInstances(g,list,()=>mat,owner,'R2-'+p.level);
 }
}
export function r2Facility(f:any,g:THREE.Group,api:any,model:any){if(!['15','25'].includes(f.id))return false;partsInto(g,model.parts.filter((p:any)=>p.owner===f.id),api.mats,f.id);return true;}
export function installR2Details(api:any,model:any){
 const {volumes,roots,structures,mats,scene,renderer}=api;
 const group=new THREE.Group();group.name='R2-bridge-details';group.position.y=model.toiletFloor;volumes.add(group);
 // Keep inherited load-bearing bridge floors/columns, replace obsolete schematic rail lines.
 structures.traverse((o:any)=>{if(o instanceof THREE.Line)o.visible=false;});
 partsInto(group,model.parts.filter((p:any)=>p.owner==='bridge'&&p.role!=='bridge-floor'),mats,'bridge');
 const axis=new THREE.Group();axis.name='R2-axis-debug';scene.add(axis);axis.visible=false;
 const x=model.p.axis.x,geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,1.9,42),new THREE.Vector3(x,1.9,264)]);
 const line=new THREE.Line(geo,new THREE.LineDashedMaterial({color:'#a86934',dashSize:2,gapSize:1,depthTest:false}));line.computeLineDistances();line.renderOrder=500;axis.add(line);
 for(const a of model.axis){const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.5,32),new THREE.MeshBasicMaterial({color:'#a86934',depthTest:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(a.x,2,a.z);ring.renderOrder=500;axis.add(ring);}
 // Central national flag is actual vector geometry; side identities remain unknown.
 const old=scene.getObjectByName('P04-flag-cloth-placeholder-1');
 if(old){old.visible=false;const f=model.p,site=api.site.forecourt.flag,[fx,fz]=site.center,fy=api.terrain.groundHeight(fx,fz)+.04+site.platformRise+site.poleHeights[1]-1.1;
  const flag=new THREE.Group();flag.name='R2-national-flag';flag.position.set(fx,fy,fz);volumes.add(flag);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(site.clothWidth,site.clothHeight,.035),mats[18]);panel.position.set(site.clothWidth/2,site.clothHeight/2,0);panel.name='R2-national-red-field';flag.add(panel);
  const star=(cx:number,cy:number,r:number,turn:number)=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+turn+i*Math.PI/5,rr=i%2?r*.382:r;const xx=cx+Math.cos(a)*rr,yy=cy+Math.sin(a)*rr;if(!i)s.moveTo(xx,yy);else s.lineTo(xx,yy);}s.closePath();const g=new THREE.ShapeGeometry(s),mt=mats[19].clone();mt.onBeforeCompile=mats[19].onBeforeCompile;mt.customProgramCacheKey=mats[19].customProgramCacheKey;mt.side=THREE.DoubleSide;const mesh=new THREE.Mesh(g,mt);mesh.position.z=-.020;mesh.name='R2-national-star';flag.add(mesh);};
  const W=site.clothWidth,H=site.clothHeight,bx=W/6,by=H*.75;star(bx,by,H*.15,0);
  for(const [xx,yy]of [[.333,.90],[.40,.80],[.40,.65],[.333,.55]]){const cx=W*xx,cy=H*yy;star(cx,cy,H*.05,Math.atan2(by-cy,bx-cx)-Math.PI/2);}
 }
 let level=0,section=false;
 renderer.localClippingEnabled=true;
 const plane=new THREE.Plane(new THREE.Vector3(-1,0,0),model.p.display.clippingX);
 function setSection(n:number){level=n;for(const id of ['15','25'])for(const g of roots.get(id).children)g.visible=n===0||g.userData.floor>0&&g.userData.floor<=n;
  for(const g of group.children)g.visible=n===0||g.userData.floor<=n;
  structures.traverse((o:any)=>{if(o.name.startsWith('15-25-L'))o.visible=n===0||Number(o.name.slice(-2))<=n;if(o.name.startsWith('25-column-'))o.visible=n===0;if(o instanceof THREE.Line)o.visible=false;});
 }
 function setMode(mode:string){section=mode==='section';const clip=section?[plane]:[];
  for(const id of ['15','25'])roots.get(id).traverse((o:any)=>{if(o.isMesh)o.material.clippingPlanes=clip;});
  group.traverse((o:any)=>{if(o.isMesh)o.material.clippingPlanes=clip;});
  for(const [id,g]of roots)if(!['15','25','08','14','09','05','06','23','12'].includes(id))g.visible=!section;
  axis.visible=mode==='axis';
 }
 return {group,axis,setSection,setMode,setAxis:(on:boolean)=>axis.visible=on,state:()=>({level,section,axis:axis.visible})};
}
