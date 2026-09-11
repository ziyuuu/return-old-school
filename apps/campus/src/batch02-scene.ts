import * as THREE from 'three';
/** Render only 03/24. Returning true bypasses both old builders, not an overlay. */
export function buildB02Facility(f:any,g:THREE.Group,{mats}:any,model:any):boolean{
 if(!['03','24'].includes(f.id))return false;
 const vec=(q:number[])=>new THREE.Vector3(q[0],q[1],q[2]);
 for(const p of model.parts.filter((q:any)=>q.owner===f.id)){
  let geo:THREE.BufferGeometry;
  if(p.shape==='box')geo=new THREE.BoxGeometry(...p.size as [number,number,number]);
  else if(p.shape==='ring')geo=new THREE.TorusGeometry(p.radius,p.tube,8,48);
  else if(p.shape==='rod')geo=new THREE.CylinderGeometry(p.radius,p.radius,vec(p.a).distanceTo(vec(p.b)),6);
  else {
   const vs=p.points.map(vec),n=vs.length;vs.push(...p.points.map((q:number[])=>vec(q).add(vec(p.offset))));
   const c=vs.reduce((a:THREE.Vector3,b:THREE.Vector3)=>a.add(b),new THREE.Vector3()).multiplyScalar(1/vs.length),faces:number[][]=[];
   for(let i=1;i<n-1;i++)faces.push([0,i,i+1],[n,n+i,n+i+1]);
   for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([i,j,n+j],[i,n+j,n+i]);}
   const pos:number[]=[];
   for(let indices of faces){const[a,b,d]=indices.map(i=>vs[i]),normal=b.clone().sub(a).cross(d.clone().sub(a)),mid=a.clone().add(b).add(d).multiplyScalar(1/3).sub(c);if(normal.dot(mid)<0)indices=[indices[0],indices[2],indices[1]];indices.forEach(i=>pos.push(...vs[i].toArray()));}
   geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
  }
  geo.computeBoundingBox();geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,mats[p.row]);m.name=p.id;m.userData={facility:f.id,role:p.role,evidence:p.evidence,batch:'B02'};
  if(p.center)m.position.copy(vec(p.center));
  if(p.shape==='ring')m.rotation.y=Math.PI/2;
  if(p.shape==='rod'){const a=vec(p.a),b=vec(p.b);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());}
  m.castShadow=m.receiveShadow=true;g.add(m);
 }
 g.userData.batch02=true;return true;
}
