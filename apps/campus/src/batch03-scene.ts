import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Render the same solids used by the access report. No textured facades or proxy doors. */
export function buildB03Facility(f:any,g:THREE.Group,{mats}:any,model:any):boolean{
 if(!['11','12','18','19'].includes(f.id))return false;
 const batches=new Map<string,{row:number,role:string,geos:THREE.BufferGeometry[]}>();
 const v=(a:number[])=>new THREE.Vector3(a[0],a[1],a[2]);
 for(const p of model.parts.filter((q:any)=>q.owner===f.id)){
  let geo:THREE.BufferGeometry;
  if(p.shape==='box')geo=new THREE.BoxGeometry(...p.size as [number,number,number]);
  else if(p.shape==='leaf'){geo=new THREE.IcosahedronGeometry(1,1);geo.scale(...p.size as [number,number,number]);}
  else if(p.shape==='rod'){
   const a=v(p.a),b=v(p.b),d=b.clone().sub(a);geo=new THREE.CylinderGeometry(p.radius,p.radius,d.length(),7);
   geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));geo.translate(...a.add(b).multiplyScalar(.5).toArray() as [number,number,number]);
  }else{
   const shape=new THREE.Shape(p.points.map((q:number[])=>new THREE.Vector2(q[0],-q[1])));geo=new THREE.ExtrudeGeometry(shape,{depth:p.y1-p.y0,bevelEnabled:false,steps:1,curveSegments:1});geo.rotateX(-Math.PI/2);geo.translate(0,p.y0,0);
  }
  if(p.center)geo.translate(...p.center as [number,number,number]);
  // Material/role batching reduces draw calls, without changing triangles or hiding collision.
  if(['paving','planting','frame','railing','cornice','seat-edge','parapet','louvre'].includes(p.role)){
   const key=p.role+'-'+p.row,b=batches.get(key)??{row:p.row,role:p.role,geos:[] as THREE.BufferGeometry[]};b.geos.push(geo.toNonIndexed? (geo.index?geo.toNonIndexed():geo):geo);batches.set(key,b);
  }else{const m=new THREE.Mesh(geo,mats[p.row]);m.name=p.id;m.userData={facility:f.id,role:p.role,batch:'B03',evidence:p.evidence};m.castShadow=m.receiveShadow=true;g.add(m);}
 }
 for(const [key,b]of batches){const geo=mergeGeometries(b.geos,false);b.geos.forEach(g=>g.dispose());if(!geo)throw Error('B03 merge failed '+key);const m=new THREE.Mesh(geo,mats[b.row]);m.name=`B03-${f.id}-${key}-merged`;m.userData={facility:f.id,role:b.role,batch:'B03'};m.castShadow=b.role!=='paving';m.receiveShadow=true;g.add(m);}
 g.userData.batch03=true;return true;
}
/** P04 owns a legacy shop override. Retire just the superseded shop, not P04 courts/flags. */
export function finishB03Integration(api:any,model:any){
 const {scene,roots,mats}=api;
 const shop=roots.get('12');shop.clear();buildB03Facility({id:'12'},shop,{mats},model);
 const obsolete:THREE.Object3D[]=[];
 scene.traverse((o:THREE.Object3D)=>{if(o.name.startsWith('P04-shop-approach-')||o.name==='M11A-entrance-deck-18'||o.name.startsWith('ST-LIBRARY-step-'))obsolete.push(o);});
 obsolete.forEach(o=>o.removeFromParent());scene.updateMatrixWorld(true);
}
/** Directional rays inspect full-scene triangles, including overhead slabs and planted objects. */
export function checkB03Access(scene:THREE.Scene,meshes:THREE.Object3D[],model:any){
 scene.updateMatrixWorld(true);
 const ray=(a:number[],b:number[])=>{const o=new THREE.Vector3(...a as [number,number,number]),d=new THREE.Vector3(...b as [number,number,number]).sub(o),len=d.length();if(len<.004)return [];return new THREE.Raycaster(o,d.normalize(),.002,len-.002).intersectObjects(meshes,false).map(h=>({name:h.object.name,y:h.point.y,distance:h.distance}));};
 const routes=model.routes.map((r:any)=>{const bad:any[]=[],ps=r.points;let supports=0,clearances=0;
  for(let i=1;i<ps.length;i++){
   const a=ps[i-1],b=ps[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=len?-dz/len:0,nz=len?dx/len:0;
   for(const off of [-.34,0,.34]){
    for(const h of [.26,1.1,1.9]){clearances++;const y=Math.max(a[1],b[1])+h,hit=ray([a[0]+nx*off,y,a[2]+nz*off],[b[0]+nx*off,y,b[2]+nz*off]);if(hit.length)bad.push({kind:'body',i,off,h,hits:hit.slice(0,3)});}
    const n=Math.max(1,Math.ceil(len/.6));for(let j=0;j<=n;j++){
     const x=a[0]+dx*j/n+nx*off,z=a[2]+dz*j/n+nz*off,y=a[1]+(b[1]-a[1])*j/n;supports++;
     const hits=ray([x,y+.24,z],[x,y-.24,z]),floor=hits.find(q=>Math.abs(q.y-y)<.225);
     if(!floor)bad.push({kind:'support',i,off,q:[x,y,z],hits:hits.slice(0,3)});
     else{clearances++;const head=ray([x,floor.y+.23,z],[x,floor.y+1.9,z]);if(head.length)bad.push({kind:'head',i,off,q:[x,floor.y,z],hits:head.slice(0,3)});}
    }
   }
  }
  return {id:r.id,label:r.label,supports,clearances,failures:bad.length,bad:bad.slice(0,18)};
 });
 const doors=model.portals.map((d:any)=>{const n=new THREE.Vector3(...d.normal as [number,number,number]),t=new THREE.Vector3(n.z,0,-n.x),bad:any[]=[];for(const off of [-d.width/2+.18,0,d.width/2-.18])for(const h of [.3,1.5,d.height-.17]){const q=new THREE.Vector3(...d.center as [number,number,number]).addScaledVector(t,off);q.y=d.floor+h;const hits=ray(q.clone().addScaledVector(n,.5).toArray(),q.clone().addScaledVector(n,-.5).toArray());if(hits.length)bad.push({off,h,hits});}return {id:d.id,bad};});
 return {routes,doors,passed:routes.every((q:any)=>q.failures===0)&&doors.every((q:any)=>!q.bad.length),meshCount:meshes.length};
}
