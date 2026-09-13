import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addDetailedBoxInstances} from './render/detail-geometry.mjs';
import {surfaceMaterial,cloneSurfaceMaterial} from './render/materials';
import {b05Geometry} from './batch05-geometry.mjs';

/** Install late, after all inherited terrain/adapters. Parts remain in world coordinates
 * in the catalogue; root-local translation never changes an approved anchor. */
export function finishB05Integration({scene,roots,mats,pickables}:any,model:any){
 const removed=new Set<THREE.Object3D>(),retired:string[]=[];
 const retire=(o:THREE.Object3D)=>{o.traverse(q=>removed.add(q));retired.push(o.name);o.removeFromParent();};
 for(const id of model.replaceRoots){const root=roots.get(id);if(!root)throw Error('Missing B05 root '+id);[...root.children].forEach(retire);}
 // The previous schematic track roof and open court fence are superseded, not duplicated.
 const legacy:THREE.Object3D[]=[];
 scene.traverse((o:any)=>{if(model.retiredNames.includes(o.name)||(o.userData.facility==='05'&&o.isMesh&&!o.name.startsWith('B05-')))legacy.push(o);});
 legacy.forEach(retire);
 for(let i=pickables.length-1;i>=0;i--)if(removed.has(pickables[i]))pickables.splice(i,1);
 const owners=[...new Set<string>(model.parts.map((p:any)=>p.owner))];
 let addedMeshes=0;
 for(const owner of owners){
  const root:THREE.Group=roots.get(owner);if(!root)throw Error('Missing owner '+owner);
  const offset=root.position.clone(),local=(a:number[])=>a.map((v,i)=>v-offset.getComponent(i));
  const parts=model.parts.filter((p:any)=>p.owner===owner);
  const group=new THREE.Group();group.name='B05-'+owner;group.userData={facility:owner,batch:'B05'};root.add(group);
  const boxes=parts.filter((p:any)=>p.shape==='box').map((p:any)=>({...p,center:local(p.center),size:p.size.map((n:number)=>Math.round(n*1e8)/1e8)}));
  // Canonical 10-nanometre arithmetic precision only removes floating-point bucket noise.
  // It does not decimate triangles, stretch rounded corners or alter a meaningful dimension.
  addDetailedBoxInstances(group,boxes,(p:any)=>surfaceMaterial(mats[p.row],p.role,p.shape),owner,'B05');
  const batches=new Map<string,{geos:THREE.BufferGeometry[],ids:string[],role:string,shape:string,material:THREE.MeshPhysicalMaterial}>();
  for(const p of parts.filter((p:any)=>p.shape!=='box')){
   const geo=b05Geometry(p);geo.translate(-offset.x,-offset.y,-offset.z);
   const material=surfaceMaterial(mats[p.row],p.role,p.shape);
   const centre=p.center??p.a??p.points?.[0]??[0,0,0];
   // Spatially grouped foliage preserves local shadow/frustum culling rather than one giant tree mesh.
   const tile=owner==='09'?`${Math.floor(centre[0]/32)},${Math.floor((centre[2]??0)/32)}`:'';
   const key=p.role+'|'+p.row+'|'+p.shape+'|'+tile;
   if(!batches.has(key))batches.set(key,{geos:[],ids:[],role:p.role,shape:p.shape,material});
   const b=batches.get(key)!;b.geos.push(geo.index?geo.toNonIndexed():geo);b.ids.push(p.id);if(geo.index)geo.dispose();
  }
  for(const[key,b]of batches){
   const geometry=mergeGeometries(b.geos,false);b.geos.forEach(g=>g.dispose());if(!geometry)throw Error('B05 geometry merge failed '+key);
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new THREE.Mesh(geometry,b.material);mesh.name='B05-'+owner+'-'+key;
   mesh.userData={facility:owner,owner,role:b.role,surfaceShape:b.shape,surfaceResolved:true,batch:'B05',partIds:b.ids,evidence:'Per-part P/H; see B05 evidence, never measured'};
   group.add(mesh);
  }
  for(const fixture of model.fixtures.filter((q:any)=>q.owner===owner)){
   const canvas=document.createElement('canvas');
   // Canvas pixels share the physical plaque aspect ratio; do not stretch glyphs.
   const ratio=fixture.width/fixture.height;
   canvas.width=ratio>=1?2048:Math.max(256,Math.round(1024*ratio));
   canvas.height=Math.max(128,Math.round(canvas.width/ratio));
   const ctx=canvas.getContext('2d')!,lines=fixture.text.split('\n');
   const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);
   ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';
   let font=H*.76/(lines.length*1.06);ctx.font=`600 ${font}px sans-serif`;
   const widest=Math.max(...lines.map((s:string)=>ctx.measureText(s).width));
   if(widest>W*.88){font*=W*.88/widest;ctx.font=`600 ${font}px sans-serif`;}
   lines.forEach((s:string,i:number)=>{
    const y=H/2+(i-(lines.length-1)/2)*font*1.15,tokens=s.split(/\s{2,}/);
    // Broad gate inscription: spread character centres, not each character's width.
    if(tokens.length>1)tokens.forEach((t:string,j:number)=>ctx.fillText(t,W*(.12+.76*j/(tokens.length-1)),y));
    else ctx.fillText(s,W/2,y);
   });
   const material=cloneSurfaceMaterial(surfaceMaterial(mats[fixture.row],'name-mark'));
   material.map=new THREE.CanvasTexture(canvas);material.transparent=true;material.alphaTest=.30;material.depthWrite=false;
   material.onBeforeCompile=()=>{};material.customProgramCacheKey=()=> 'b05-local-type-native-uv';
   const text=new THREE.Mesh(new THREE.PlaneGeometry(fixture.width,fixture.height),material);
   text.name=fixture.id;text.position.fromArray(local(fixture.position));text.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3().fromArray(fixture.normal));
   text.userData={facility:owner,owner,role:'name-mark',batch:'B05',surfaceResolved:true,evidence:fixture.basis};group.add(text);
  }
  group.traverse((o:any)=>{if(!o.isMesh)return;o.userData.owner=owner;o.userData.surfaceResolved=true;o.userData.batch='B05';
   o.castShadow=!['glass','water'].includes(o.material.userData.finish)&&!['line-paint','name-mark'].includes(o.userData.role);o.receiveShadow=true;pickables.push(o);addedMeshes++;
  });
 }
 scene.updateMatrixWorld(true);
 return {retired,addedMeshes,owners,worldSpaceCatalogue:true,acceptedRootsUnchanged:true,roadGraphUnchanged:true,terrainUnchanged:true};
}
