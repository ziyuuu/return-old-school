import * as THREE from 'three';
import {b04Geometry} from './batch04-geometry.mjs';
import {detailBox} from './render/detail-geometry.mjs';
import {foliageGeometry} from './render/foliage-geometry.mjs';
import {stadiumPoints} from './batch05-core.mjs';
/** True rendered shapes. Fine mesh wire uses explicit 8 radial segments (8 mm radius),
 * while structural near-view rods retain 48, and rings retain 32×192.
 */
export function b05Geometry(p){
 const v=a=>new THREE.Vector3(...a);let g;
 if(p.shape==='box'){g=detailBox(p.size,p.role);g.translate(...p.center);}
 else if(p.shape==='rod'){
  const a=v(p.a),b=v(p.b),d=b.clone().sub(a);if(d.length()<1e-6)throw Error('Zero rod '+p.id);
  g=new THREE.CylinderGeometry(p.radius,p.radius,d.length(),p.segments??48);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());
 }else if(p.shape==='ring'){
  g=new THREE.TorusGeometry(p.radius,p.tube,32,192);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),v(p.normal).normalize()));g.translate(...p.center);
 }else if(p.shape==='tube'){
  const path=new THREE.CatmullRomCurve3(p.points.map(v),p.closed,'centripetal');g=new THREE.TubeGeometry(path,Math.max(24,p.points.length*6),p.radius,p.segments??48,p.closed);
 }else if(p.shape==='leaf'){
  g=foliageGeometry(p);g.translate(...p.center);
 }else if(p.shape==='baluster'){
  const profile=[[0,0],[1,0],[1,.05],[.70,.12],[.66,.28],[1.28,.43],[1.12,.57],[.60,.71],[.68,.90],[1,.96],[1,1],[0,1]].map(([r,h])=>new THREE.Vector2(r*p.radius,h*p.height));
  g=new THREE.LatheGeometry(profile,48);g.translate(...p.center);
 }else if(p.shape==='stadium'){
  const shape=new THREE.Shape(stadiumPoints(p.width,p.length,192).map(([x,z])=>new THREE.Vector2(x*p.scale[0],-z*p.scale[1])));g=new THREE.ShapeGeometry(shape,96);g.rotateX(-Math.PI/2);g.translate(...p.center);
 }else if(p.shape==='ribbon'){
  const pos=[],indices=[],uv=[];
  for(let i=1;i<p.points.length;i++){
   const a=p.points[i-1],b=p.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<1e-7)continue;
   const rx=dz/len*p.width/2,rz=-dx/len*p.width/2,k=pos.length/3;
   pos.push(a[0]-rx,a[1],a[2]-rz,a[0]+rx,a[1],a[2]+rz,b[0]+rx,b[1],b[2]+rz,b[0]-rx,b[1],b[2]-rz);uv.push(0,0,1,0,1,1,0,1);indices.push(k,k+2,k+1,k,k+3,k+2);
  }
  g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 }else if(p.shape==='rock'){
  const N=48,M=16,pos=[],uv=[],ix=[],[w,h,d]=p.size,[x,y,z]=p.center;
  for(let j=0;j<=M;j++){
   const t=j/M,profile=t<.12?.88+t*.75:t<.60?1-(t-.12)*.15:t<.88?.928-(t-.60)*1.8:.424-(t-.88)*2.65;
   for(let i=0;i<=N;i++){
    const a=i/N*Math.PI*2,noise=1+.07*Math.sin(a*3+t*8)+.035*Math.sin(a*7-t*5),r=profile*noise;
    let xx=Math.cos(a)*w*.48*r-w*.12*t,zz=Math.sin(a)*d*.48*r;
    if(Math.sin(a)<-.60 && t>.16 && t<.76)zz=-.4*d;
    pos.push(x+xx,y+t*h,z+zz);uv.push(i/N,t);
   }
  }
  for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,e=c+1;ix.push(a,c,b,b,c,e);}
  const bot=pos.length/3;pos.push(x,y,z);uv.push(.5,0);const top=pos.length/3;pos.push(x-w*.12,y+h,z);uv.push(.5,1);
  for(let i=0;i<N;i++){ix.push(bot,i,i+1);const a=M*(N+1)+i;ix.push(top,a+1,a);}
  g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
 }else g=b04Geometry(p);
 g.computeBoundingBox();g.computeBoundingSphere();g.userData={partId:p.id,owner:p.owner,role:p.role,evidence:p.evidence};return g;
}
