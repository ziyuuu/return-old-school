import * as THREE from 'three';
import {r2Facility,installR2Details} from './b01-r2-scene';
/** R3 prism adapter. Historic R2 box rendering and level visibility are retained. */
export function r3Facility(f:any,g:THREE.Group,api:any,model:any){
 if(!['15','25'].includes(f.id))return false;
 r2Facility(f,g,api,{parts:model.parts.filter((p:any)=>p.shape!=='prism')});
 for(const p of model.parts.filter((p:any)=>p.owner===f.id&&p.shape==='prism')){
  let level=g.children.find(o=>o.userData.floor===p.level);if(!level){level=new THREE.Group();level.name=`R2-${f.id}-level-${p.level}`;level.userData.floor=p.level;g.add(level);}
  const s=new THREE.Shape();p.polygon.forEach(([x,z]:number[],i:number)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:p.size[1],bevelEnabled:false,steps:1,curveSegments:64});geo.rotateX(-Math.PI/2);geo.translate(0,-p.size[1]/2,0);
  const row=p.role==='glazing'?16:p.role==='frame'?15:['slab','roof','curved-cornice'].includes(p.role)?6:14,src=api.mats[row],mat=src.clone();mat.onBeforeCompile=src.onBeforeCompile;mat.customProgramCacheKey=src.customProgramCacheKey;mat.side=THREE.DoubleSide;
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...p.center as [number,number,number]);mesh.name=p.id;mesh.castShadow=mesh.receiveShadow=true;mesh.userData={role:p.role,facility:f.id,floor:p.level};level.add(mesh);
 }
 return true;
}
export function installR3Details(api:any,model:any){
 const detail=installR2Details(api,model),group=new THREE.Group();group.name='R3-local-approaches';api.scene.add(group);
 const t=api.terrain;
 function pave(name:string,x0:number,z0:number,x1:number,z1:number,width:number){const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),nx=Math.ceil(width/.2),nz=Math.ceil(len/.2),pos:number[]=[],idx:number[]=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const d=width*(i/nx-.5),x=x0+dx*j/nz+dz/len*d,z=z0+dz*j/nz-dx/len*d;pos.push(x,t.groundHeight(x,z)+.041,z);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;idx.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,api.mats[2]);mesh.name=name;mesh.receiveShadow=true;mesh.userData={role:'approach',facility:'15'};group.add(mesh);
 }
 for(const A of model.access){const [start,end]=A.apron;pave('R3-'+A.id+'-approach',start[0],start[1],end[0],end[1],3.5);}
 // Keep the former east route as an arrival point; turn outside the building, then reach the front door.
 const path=[[123.8,224],[125.5,224],[125.5,211],[119.4,211]];for(let i=1;i<path.length;i++)pave('R3-east-perimeter-link-'+i,...path[i-1] as [number,number],...path[i] as [number,number],2.4);
 return{...detail,approaches:group};
}
