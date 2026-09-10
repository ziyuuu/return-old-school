import * as THREE from 'three';
/** Render graph adapter; all dimensional decisions reside in batch01-core/input. */
function renderParts(parent:THREE.Group,parts:any[],mats:THREE.Material[],owner:string){
 const levels=new Map<number,THREE.Group>();
 for(const p of parts){if(!levels.has(p.level)){const g=new THREE.Group();g.name=`B01-${owner}-level-${p.level}`;g.userData.floor=p.level;parent.add(g);levels.set(p.level,g);}}
 const buckets=new Map<string,any[]>();
 const row=(role:string)=>['glazing'].includes(role)?16:['frame'].includes(role)?15:['rail','rail-post','bridge-rail','bridge-post'].includes(role)?5:['slab','bridge-floor','sill','cornice','roof','cupola','roof-parapet'].includes(role)?6:14;
 for(const p of parts){const group=levels.get(p.level)!;
  if(p.shape!=='box'){
   const geo=p.shape==='dome'?new THREE.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI/2):new THREE.CylinderGeometry(1,1,1,24);
   const mesh=new THREE.Mesh(geo,mats[row(p.role)]);mesh.position.set(...p.center as [number,number,number]);mesh.scale.set(p.size[0]/2,p.size[1],p.size[2]/2);mesh.name=p.id;mesh.userData={role:p.role,facility:owner};mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);continue;
  }
  if(['slab','roof','bridge-floor'].includes(p.role)){
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(...p.size as [number,number,number]),mats[row(p.role)]);mesh.position.set(...p.center as [number,number,number]);mesh.name=p.id;mesh.userData={role:p.role,floor:p.level,facility:owner};mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);continue;
  }
  const key=p.level+'|'+p.role;const list=buckets.get(key)??[];list.push(p);buckets.set(key,list);
 }
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
 for(const [key,list]of buckets){const p=list[0],g=levels.get(p.level)!,mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mats[row(p.role)],list.length);mesh.name=`B01-${owner}-${key}`;mesh.userData={role:p.role,facility:owner,partIds:list.map(x=>x.id)};
  list.forEach((v,i)=>{matrix.compose(new THREE.Vector3(...v.center as [number,number,number]),q,new THREE.Vector3(...v.size as [number,number,number]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);
 }
 return levels;
}
export function batch01Facility(f:any,g:THREE.Group,api:any,model:any){if(!['15','25'].includes(f.id))return false;renderParts(g,model.parts.filter((p:any)=>p.owner===f.id),api.mats,f.id);g.userData.batch='B01';return true;}
export function installBatch01Bridge(api:any,model:any){
 // Physical B01 rails replace the earlier schematic line rails, including in cutaway views.
 api.structures.traverse((o:any)=>{if(o instanceof THREE.Line)o.visible=false;});
 const group=new THREE.Group();group.name='B01-bridge-detail';group.position.y=model.toiletFloor;api.volumes.add(group);
 renderParts(group,model.parts.filter((p:any)=>p.owner==='bridge'&&p.role!=='bridge-floor'),api.mats,'25');
 return{group,setSection:(level:number)=>{
  for(const id of ['15','25'])for(const g of api.roots.get(id).children)if(g.name.startsWith('B01-'))g.visible=level===0||g.userData.floor>0&&g.userData.floor<=level;
  for(const g of group.children)g.visible=level===0||g.userData.floor<=level;
  api.structures.traverse((o:any)=>{if(o.name.startsWith('15-25-L'))o.visible=level===0||Number(o.name.slice(-2))<=level;if(o.name.startsWith('25-column-'))o.visible=level===0;});
 }};
}
