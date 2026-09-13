import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addDetailedBoxInstances} from './render/detail-geometry.mjs';
import {foliageGeometry} from './render/foliage-geometry.mjs';
import {surfaceMaterial,cloneSurfaceMaterial} from './render/materials';
import {b04Geometry} from './batch04-geometry.mjs';

export function buildB04Facility(f:any,g:THREE.Group,{mats}:any,model:any):boolean{
  if(!model.summaries.some((s:any)=>s.owner===f.id))return false;
  const parts=model.parts.filter((p:any)=>p.owner===f.id),boxes=parts.filter((p:any)=>p.shape==='box');
  addDetailedBoxInstances(g,boxes,(p:any)=>surfaceMaterial(mats[p.row],p.role,p.shape),f.id,'B04');
  const batches=new Map<string,{geos:THREE.BufferGeometry[],parts:string[],role:string,shape:string,material:THREE.MeshPhysicalMaterial}>();
  for(const p of parts.filter((p:any)=>p.shape!=='box')){
    let geo=p.shape==='leaf'?foliageGeometry(p):b04Geometry(p);
    if(p.shape==='leaf')geo.translate(...p.center as [number,number,number]);
    const material=surfaceMaterial(mats[p.row],p.role,p.shape),key=p.role+'|'+p.row+'|'+material.userData.finish+'|'+p.shape;
    if(!batches.has(key))batches.set(key,{geos:[],parts:[],role:p.role,shape:p.shape,material});
    const b=batches.get(key)!;b.geos.push(geo.index?geo.toNonIndexed():geo);b.parts.push(p.id);
  }
  for(const [key,b]of batches){
    const geometry=mergeGeometries(b.geos,false);b.geos.forEach(g=>g.dispose());if(!geometry)throw Error('B04 merge failed '+key);
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const m=new THREE.Mesh(geometry,b.material);m.name='B04-'+f.id+'-'+key;
    m.userData={facility:f.id,owner:f.id,role:b.role,surfaceShape:b.shape,surfaceResolved:true,batch:'B04',partIds:b.parts,evidence:'see source parts: A/P features; metric H'};
    m.castShadow=!['glass','water'].includes(b.material.userData.finish);m.receiveShadow=true;g.add(m);
  }
  for(const fixture of model.fixtures.filter((q:any)=>q.owner===f.id)){
    // Only documented building text. Rasterized locally from system type; not a photograph or supplied font file.
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,512,160);ctx.fillStyle='white';ctx.font='100px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(fixture.text,256,82);
    const mat=cloneSurfaceMaterial(surfaceMaterial(mats[12],'name-mark'));mat.map=new THREE.CanvasTexture(canvas);mat.transparent=true;mat.alphaTest=.3;mat.depthWrite=false;mat.onBeforeCompile=()=>{};mat.customProgramCacheKey=()=> 'b04-local-name-native-uv';
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.55,.80),mat);sign.position.set(...fixture.position as [number,number,number]);sign.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...fixture.normal as [number,number,number]));
    sign.name='B04-'+f.id+'-documented-name';sign.userData={facility:f.id,role:'name-mark',surfaceResolved:true,batch:'B04',evidence:fixture.basis};g.add(sign);
  }
  g.traverse((o:any)=>{if(!o.isMesh)return;o.userData.batch='B04';o.userData.owner=f.id;if(o.material?.userData.finish==='glass')o.castShadow=false;});
  g.userData.batch04=true;return true;
}
export function finishB04Integration(scene:THREE.Scene){
  const retired:THREE.Object3D[]=[];
  scene.traverse(o=>{if(o.name==='M11A-entrance-deck-17'||o.name.startsWith('ST-LONGYA-step-'))retired.push(o);});
  retired.forEach(o=>o.removeFromParent());scene.updateMatrixWorld(true);
  return {retired:retired.map(o=>o.name),reason:'B04 exact inherited centreline/rise, photo-shaped splayed steps; no changes to terrain or roads'};
}
