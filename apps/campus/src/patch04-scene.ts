import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Geometry restored from the accepted P04 delivery parameters. */
export function installPatch04Geometry(api:any,m:any,p:any){
 const {surfaces,volumes,roots,terrainSystem,box,mats}=api;
 const group=new THREE.Group();group.name='P04-site-features';volumes.add(group);
 const geos:THREE.BufferGeometry[]=[];
 function rail(w:number,h:number,d:number,x:number,y:number,z:number){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y+h/2,z);geos.push(g);}
 const c=p.courts,b=c.bounds;
 for(const [a,v] of [[[b[0],b[1]],[b[2],b[1]]],[[b[2],b[1]],[b[2],b[3]]],[[b[2],b[3]],[b[0],b[3]]],[[b[0],b[3]],[b[0],b[1]]]]){
  const dx=v[0]-a[0],dz=v[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/.5);
  for(let i=0;i<n;i++){
   const x=a[0]+dx*(i+.5)/n,z=a[1]+dz*(i+.5)/n;
   if(c.openings.some((o:any)=>Math.abs(x-o.at)<.1&&z>=o.from&&z<=o.to))continue;
   const w=dx?len/n:.15,d=dz?len/n:.15;
   const q=box(group,w,.3,d,x,3,z,6);q.name='P04-court-retaining-edge';
   for(let y=.15;y<=c.fenceHeight;y+=.4)rail(dx?len/n:.025,.025,dz?len/n:.025,x,c.top+y,z);
   rail(.025,c.fenceHeight,.025,x,c.top,z);
   if(i%5===0)rail(.075,c.fenceHeight,.075,x,c.top,z);
  }
 }
 if(geos.length){const g=mergeGeometries(geos),o=new THREE.Mesh(g,mats[5]);o.name='P04-court-open-fence';o.castShadow=true;group.add(o);geos.forEach(g=>g.dispose());}
 function paving(name:string,b:number[],height:(x:number,z:number)=>number){
  const nx=Math.ceil((b[2]-b[0])*2),nz=Math.ceil((b[3]-b[1])*2),pos:number[]=[],idx:number[]=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=b[0]+(b[2]-b[0])*i/nx,z=b[1]+(b[3]-b[1])*j/nz;pos.push(x,height(x,z),z);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;idx.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const o=new THREE.Mesh(g,mats[2]);o.name=name;o.receiveShadow=true;surfaces.add(o);return o;
 }
 roots.get('14').children.forEach((o:THREE.Object3D)=>o.visible=false);
 terrainSystem.solidGroup.traverse((o:THREE.Object3D)=>{if(o.name.startsWith('M11A-flag-'))o.visible=false;});
 paving('P04-teaching-forecourt',p.forecourt.pavingBounds,(x,z)=>m.groundHeight(x,z)+.035);
 const f=p.forecourt.flag,[fx,fz]=f.center,fy=m.groundHeight(fx,fz)+.04;
 const base=box(group,f.platformWidth,f.platformRise,f.platformDepth,fx,fy,fz,6);base.name='P04-three-flag-platform';
 for(let i=0;i<f.steps;i++){const h=f.platformRise*(i+1)/f.steps,z=fz+f.platformDepth/2+f.tread*(f.steps-i-.5);const o=box(group,f.platformWidth,h,f.tread,fx,fy,z,6);o.name='P04-flag-step-'+i;}
 for(let i=0;i<f.count;i++){
  const x=fx+(i-1)*f.poleSpacing,h=f.poleHeights[i];const o=new THREE.Mesh(new THREE.CylinderGeometry(.065,.085,h,8),mats[6]);o.position.set(x,fy+f.platformRise+h/2,fz);o.name='P04-flagpole-'+i;o.castShadow=true;group.add(o);
  const cloth=box(group,f.clothWidth,f.clothHeight,.025,x+f.clothWidth/2,fy+f.platformRise+h-1.1,fz,8);cloth.name='P04-flag-cloth-placeholder-'+i;
 }
 const shop=roots.get('12'),s=p.shop;shop.clear();const [w,,d]=api.layout.facilities.find((v:any)=>v.id==='12').size,dh=s.doorHeight,h=s.wallHeight,dw=s.doorWidth;
 const add=(name:string,W:number,H:number,D:number,x:number,y:number,z:number)=>{const o=box(shop,W,H,D,x,y,z,0);o.name='P04-shop-'+name;return o;};
 add('back',w-s.recessDepth,h,d,s.recessDepth/2,0,0);
 for(const sign of [-1,1])add('front-wing-'+sign,s.recessDepth,h,(d-dw)/2,-w/2+s.recessDepth/2,0,sign*(d+dw)/4);
 add('lintel',s.recessDepth,h-dh,dw,-w/2+s.recessDepth/2,dh,0);
 const floor=box(shop,w,.18,d,0,-.14,0,6);floor.name='P04-shop-threshold';
 for(let j=1;j<s.approach.length;j++){
  const a=s.approach[j-1],b=s.approach[j],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/.25),v:number[]=[],idx:number[]=[];
  for(let i=0;i<=n;i++)for(const sign of [-1,1]){const x=a[0]+dx*i/n+sign*dz/len*s.approachWidth/2,z=a[1]+dz*i/n-sign*dx/len*s.approachWidth/2;v.push(x,m.anchors['12'].floor+.04,z);}
  for(let i=0;i<n;i++){const k=2*i;idx.push(k,k+2,k+1,k+1,k+2,k+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const o=new THREE.Mesh(g,mats[2]);o.name='P04-shop-approach-'+j;surfaces.add(o);
 }
 return{group};
}
