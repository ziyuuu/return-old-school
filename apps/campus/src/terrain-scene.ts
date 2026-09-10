import * as THREE from 'three';
import {buildTerrainModel,terrainChecks,rectOf} from './terrain-core.mjs';
/** Add a reversible vertical adapter. The frozen layout is never mutated. */
export function installTerrain(api:any, spec:any){
 const {scene,surfaces,volumes,outlines,routeOverlay,roots,labels,layout,box,mats,structures}=api;
 const model=buildTerrainModel(layout,spec),report=terrainChecks(layout,spec);
 const surfaceGroup=new THREE.Group();surfaceGroup.name='M11A-ground-and-roads';surfaces.add(surfaceGroup);
 const solidGroup=new THREE.Group();solidGroup.name='M11A-foundations-and-landings';volumes.add(solidGroup);
 const walking:THREE.Object3D[]=[],added:THREE.Object3D[]=[],hidden:THREE.Object3D[]=[],originalPositions=new Map<THREE.Object3D,number>();
 const oldLabels=new Map<string,number>(),lineCopies:{object:any,old:THREE.BufferGeometry,raised:THREE.BufferGeometry}[]=[];
 let enabled=false;
 const saveY=(o:any)=>{if(!originalPositions.has(o))originalPositions.set(o,o.position.y);};
 for(const g of roots.values())saveY(g);
 for(const [id,l]of labels)oldLabels.set(id,l.point.y);
 const oldGround=surfaces.children[0];hidden.push(oldGround);
 const thresholdIds=new Set(layout.thresholds.map((t:any)=>t.id));
 for(const o of surfaces.children)if(o.name.startsWith('road-')||thresholdIds.has(o.name))hidden.push(o);
 structures.traverse((o:any)=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line)saveY(o);});
 for(const parent of [outlines,routeOverlay])parent.traverse((o:any)=>{if(!(o instanceof THREE.Line))return;const old=o.geometry,raised=old.clone(),a=raised.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+model.groundHeight(a.getX(i),a.getZ(i)));raised.computeBoundingSphere();lineCopies.push({object:o,old,raised});});
 function patchGrid(name:string,b:number[],step:number,offset:number,row:number,parent:THREE.Group=surfaceGroup,walk=true){
  const nx=Math.ceil((b[2]-b[0])/step),nz=Math.ceil((b[3]-b[1])/step),pos:number[]=[],indices:number[]=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=b[0]+(b[2]-b[0])*i/nx,z=b[1]+(b[3]-b[1])*j/nz;pos.push(x,model.groundHeight(x,z)+offset,z);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,mats[row]);m.name=name;m.receiveShadow=true;m.castShadow=false;m.userData.terrain=true;parent.add(m);added.push(m);if(walk)walking.push(m);return m;
 }
 function strip(name:string,a:number[],b:number[],width:number,offset:number,row=2){
  const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),nx=Math.max(1,Math.ceil(width/.5)),nz=Math.max(1,Math.ceil(length/.5)),pos:number[]=[],indices:number[]=[];
  const rx=dz/length,rz=-dx/length;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const q=width*(i/nx-.5),x=a[0]+dx*j/nz+rx*q,z=a[2]+dz*j/nz+rz*q;pos.push(x,model.groundHeight(x,z)+offset,z);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,mats[row]);m.name=name;m.userData.width=width;m.userData.terrain=true;m.receiveShadow=true;m.castShadow=false;surfaceGroup.add(m);walking.push(m);added.push(m);return m;
 }
 patchGrid('M11A-site-surface',layout.ground.bounds,1,0,1);
 const gb=layout.ground.bounds,corners=[[gb[0],gb[1]],[gb[2],gb[1]],[gb[2],gb[3]],[gb[0],gb[3]]];
 for(let side=0;side<4;side++){
  const a=corners[side],b=corners[(side+1)%4],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])),pos:number[]=[],idx:number[]=[];
  for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;pos.push(x,model.groundHeight(x,z),z,x,-1.5,z);if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mats[6]);m.material=mats[6].clone();(m.material as THREE.Material).side=THREE.DoubleSide;m.name='M11A-site-thickness-'+side;surfaceGroup.add(m);
 }
 for(const p of model.profiles){const a=layout.navigation.nodes[p.from],b=layout.navigation.nodes[p.to];const m=strip(`M11A-road-${p.from}--${p.to}`,a,b,p.width,spec.roadSurfaceOffset);m.userData.route=[p.from,p.to];}
 for(const[id,p]of Object.entries(layout.navigation.nodes) as [string,number[]][]){const m=patchGrid('M11A-joint-'+id,[p[0]-.35,p[2]-.35,p[0]+.35,p[2]+.35],.35,spec.roadSurfaceOffset+.002,2);m.userData.node=id;}
 const stairByOwner=new Set(model.stairs.map((s:any)=>s.facilityId));
 for(const th of layout.thresholds){const owner=th.id.slice(0,2);if(stairByOwner.has(owner))continue;strip('M11A-'+th.id,th.start,th.end,th.width,spec.roadSurfaceOffset);}
 for(const s of model.stairs)for(const p of model.stairParts(s)){const[x,y,z]=p.center,[w,h,d]=p.size,m=box(solidGroup,w,h,d,x,y-h/2,z,6);m.rotation.y=p.yaw;m.name=p.id;m.userData={...m.userData,terrain:true,facility:s.facilityId,role:'entrance-step',hypothesis:true};walking.push(m);added.push(m);}
 for(const f of layout.facilities){const anchor=model.anchors[f.id];if(!f.position||!f.size||!anchor||!anchor.rise)continue;
  const[x,,z]=f.position,[w,,d]=f.size,bottom=anchor.floor-anchor.rise-.2,top=anchor.floor+.04,m=box(solidGroup,w,top-bottom,d,x,bottom,z,6);
  m.name='M11A-foundation-'+f.id;m.userData={terrain:true,facility:f.id,role:'podium',hypothesis:true};walking.push(m);added.push(m);
 }
 const lib=layout.facilities.find((f:any)=>f.id==='18'),lng=layout.facilities.find((f:any)=>f.id==='17');
 for(const f of [lib,lng]){const [x,,z]=f.position,[w,,d]=f.size;const m=box(solidGroup,3,.04,2.4,x,model.anchors[f.id].floor,z-d/2+1.2,6);m.name='M11A-entrance-deck-'+f.id;walking.push(m);}
 for(const p of model.profiles.filter((p:any)=>layout.navigation.mainRoadChain.includes(p.from)&&layout.navigation.mainRoadChain.includes(p.to))){
  const a=layout.navigation.nodes[p.from],b=layout.navigation.nodes[p.to],len=Math.hypot(b[0]-a[0],b[2]-a[2]);if(len<6)continue;
  const ux=(b[0]-a[0])/len,uz=(b[2]-a[2])/len,rx=uz,rz=-ux;
  for(const sign of [-1,1]){const dist=sign*(p.width/2+.10),start=[a[0]+ux*1.8+rx*dist,0,a[2]+uz*1.8+rz*dist],end=[b[0]-ux*1.8+rx*dist,0,b[2]-uz*1.8+rz*dist];const curb=strip('M11A-road-edge-'+p.from+'-'+sign,start,end,.16,.10,6);curb.userData.role='edge';}
 }
 const foreground=roots.get('14');const flagBase=foreground.children[1],flagPole=foreground.children[2];hidden.push(flagBase);saveY(flagPole);
 const fa=layout.facilities.find((f:any)=>f.id==='14'),fy=model.anchors['14'].floor,fx=fa.position[0]-8,fz=fa.position[2];
 const fp=box(solidGroup,2.6,.45,2.6,fx,fy+.08,fz,0);fp.name='M11A-flag-platform-H';added.push(fp);
 for(let i=0;i<3;i++){const m=box(solidGroup,2.6,.15*(i+1),.32,fx,fy+.08,fz+1.3+.32*(2.5-i),6);m.name='M11A-flag-step-'+i;added.push(m);}
 function visible(o:THREE.Object3D):boolean {let p:THREE.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
 function setEnabled(on:boolean){enabled=on;surfaceGroup.visible=solidGroup.visible=on;hidden.forEach(o=>o.visible=!on);
  for(const[id,g]of roots){g.position.y=originalPositions.get(g)!+(on?(model.anchors[id]?.floor??0):0);}
  structures.traverse((o:any)=>{if(!originalPositions.has(o))return;const id=o.userData.facility??'25';o.position.y=originalPositions.get(o)!+(on?(model.anchors[id]?.floor??0):0);});
  flagPole.position.y=originalPositions.get(flagPole)!+(on ? .23 : 0);
  for(const v of lineCopies)v.object.geometry=on?v.raised:v.old;
  for(const[id,l]of labels)l.point.y=oldLabels.get(id)!+(on?(model.anchors[id]?.floor??0):0);
  scene.updateMatrixWorld(true);return enabled;
 }
 function probeGround(x:number,z:number){scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(x,30,z),new THREE.Vector3(0,-1,0),0,40);return ray.intersectObjects(walking.filter(visible),false).map(h=>({name:h.object.name,y:h.point.y}));}
 function probeActual(a:number[],b:number[]){scene.updateMatrixWorld(true);const origin=new THREE.Vector3(a[0],a[1],a[2]),end=new THREE.Vector3(b[0],b[1],b[2]),len=origin.distanceTo(end),ray=new THREE.Raycaster(origin,end.sub(origin).normalize(),.002,len-.002),meshes:THREE.Object3D[]=[];scene.traverse((o:any)=>{if(o instanceof THREE.Mesh&&visible(o))meshes.push(o);});return ray.intersectObjects(meshes,false).map(h=>({name:h.object.name,facility:h.object.userData.facility??null,distance:h.distance}));}
 function state(){return {enabled,version:spec.version,report,anchors:model.anchors,groundBounds:layout.ground.bounds,frozenTopologyUnmodified:true,exaggeration:1,addedMeshes:added.length};}
 function surfaceHeight(x:number,z:number){return enabled?model.walkHeight(x,z):.04;}
 function inspect(x:number,z:number){return {x,z,ground:model.groundHeight(x,z),walk:model.walkHeight(x,z),evidence:'H',measured:null};}
 setEnabled(true);
 return {setEnabled,probeGround,probeActual,state,surfaceHeight,inspect,model,report,surfaceGroup,solidGroup,get enabled(){return enabled;}};
}
