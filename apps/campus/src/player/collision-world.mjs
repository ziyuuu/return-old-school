import * as THREE from 'three';
import {RAPIER} from './motor.mjs';

/** Semantics for a human, not the old building-inspection ray: leaves and painted
 * markings do not stop a body. Glass, railings, gates, walls and net strands do. */
export function collisionDisposition(mesh) {
  const d=mesh.userData||{},role=String(d.role||d.surfaceRole||''),materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(d.player||d.collision==='none')return 'player-or-explicit-visual';
  if(/name-mark|line-paint|flag-surface|label|debug|survey/.test(role))return 'annotation-or-paint';
  if(materials.every(m=>m?.userData?.finish==='foliage'))return 'leaves';
  if(materials.every(m=>m?.userData?.finish==='water'))return 'water-no-swimming';
  return 'solid';
}

/** BVH selects the exact source triangles within a generous local region. Meshes
 * are NOT replaced by boxes or decimated, and the visible campus is not modified.
 * Only physics residency changes when crossing the region threshold. */
export class CampusCollisionWorld {
  constructor(scene, config) {
    this.config=config;this.world=new RAPIER.World({x:0,y:0,z:0});this.records=[];this.excluded={};this.colliders=[];
    this.centre=null;this.revisions=0;this.triangles=0;this.lastBuildMs=0;this.totalBuildMs=0;this.lastSources=[];
    scene.updateMatrixWorld(true);
    const instance=new THREE.Matrix4();
    scene.traverseVisible(mesh=>{
      if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
      const kind=collisionDisposition(mesh);
      if(kind!=='solid'){this.excluded[kind]=(this.excluded[kind]||0)+1;return;}
      mesh.geometry.computeBoundingBox();
      const count=mesh.isInstancedMesh?mesh.count:1;
      for(let i=0;i<count;i++){
        let matrix=mesh.matrixWorld.clone();
        if(mesh.isInstancedMesh){mesh.getMatrixAt(i,instance);matrix.multiply(instance);}
        this.records.push({mesh,geometry:mesh.geometry,matrix,inverse:matrix.clone().invert(),bounds:mesh.geometry.boundingBox.clone().applyMatrix4(matrix),flip:matrix.determinant()<0,instance:i});
      }
    });
  }
  ensure(position, force=false) {
    const cfg=this.config.collision;
    if(!force&&this.centre&&Math.hypot(position.x-this.centre.x,position.z-this.centre.z)<cfg.refreshDistance)return false;
    const begin=performance.now();
    const r=cfg.regionRadius,region=new THREE.Box3(new THREE.Vector3(position.x-r,cfg.verticalMin,position.z-r),new THREE.Vector3(position.x+r,cfg.verticalMax,position.z+r));
    const nextColliders=[],sources=[],triangle=new THREE.Triangle(),v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
    for(const rec of this.records){
      if(!region.intersectsBox(rec.bounds))continue;
      const local=region.clone().applyMatrix4(rec.inverse),geo=rec.geometry,vertices=[];let count=0;
      const push=t=>{
        // AABB/BVH broad phase is conservative. Keep only intersecting triangles,
        // retaining whole triangles (no clipping or retriangulation at the boundary).
        if(!local.intersectsTriangle(t))return;
        v[0].copy(t.a).applyMatrix4(rec.matrix);v[1].copy(t.b).applyMatrix4(rec.matrix);v[2].copy(t.c).applyMatrix4(rec.matrix);
        const cross=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));if(cross.lengthSq()<1e-18)return;
        // Very large coplanar triangles destabilize single-precision contact queries.
        // Split only in the triangle's own plane; retain the exact visible surface.
        const emit=(a,b,c,depth=0)=>{
          const t=new THREE.Triangle(a,b,c);if(!region.intersectsTriangle(t))return;
          const edges=[a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a)],long=Math.max(...edges);
          if(long>144&&depth<20){const i=edges.indexOf(long);if(i===0){const m=a.clone().add(b).multiplyScalar(.5);emit(a,m,c,depth+1);emit(m,b,c,depth+1);}else if(i===1){const m=b.clone().add(c).multiplyScalar(.5);emit(a,b,m,depth+1);emit(a,m,c,depth+1);}else{const m=c.clone().add(a).multiplyScalar(.5);emit(a,b,m,depth+1);emit(m,b,c,depth+1);}return;}
          for(const q of rec.flip?[a,c,b]:[a,b,c])vertices.push(q.x,q.y,q.z);count++;
        };
        emit(v[0].clone(),v[1].clone(),v[2].clone());
      };
      if(geo.boundsTree)geo.boundsTree.shapecast({intersectsBounds:b=>b.intersectsBox(local),intersectsTriangle:t=>{push(t);return false;}});
      else {
        const p=geo.attributes.position,index=geo.index,n=index?.count??p.count;
        for(let i=0;i<n;i+=3){triangle.a.fromBufferAttribute(p,index?index.getX(i):i);triangle.b.fromBufferAttribute(p,index?index.getX(i+1):i+1);triangle.c.fromBufferAttribute(p,index?index.getX(i+2):i+2);push(triangle);}
      }
      if(count){const data=new Float32Array(vertices),ix=Uint32Array.from({length:data.length/3},(_,i)=>i);nextColliders.push(this.world.createCollider(RAPIER.ColliderDesc.trimesh(data,ix,RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES | RAPIER.TriMeshFlags.ORIENTED)));}
      if(count)sources.push({name:rec.mesh.name,owner:rec.mesh.userData.facility||rec.mesh.userData.owner||'environment',role:rec.mesh.userData.role||rec.mesh.userData.surfaceRole||'',instance:rec.instance,triangles:count});
    }
    if(!nextColliders.length)throw Error('No physical ground at requested region');
    // Do not weld independent mesh solids to each other: coincident floor/stair
    // faces must not produce a non-manifold combined collider or false normals.
    this.colliders.forEach(c=>this.world.removeCollider(c,true));this.colliders=nextColliders;
    this.world.step();this.centre={x:position.x,z:position.z};this.revisions++;
    this.triangles=sources.reduce((n,s)=>n+s.triangles,0);this.lastSources=sources;this.lastBuildMs=performance.now()-begin;this.totalBuildMs+=this.lastBuildMs;
    return true;
  }
  containsPointInSolid(p) {
    const point=new THREE.Vector3(p.x,p.y,p.z),worldDirection=new THREE.Vector3(1,.037,.123).normalize();
    for(const rec of this.records){
      if(!rec.bounds.containsPoint(point))continue;
      const origin=point.clone().applyMatrix4(rec.inverse),direction=worldDirection.clone().transformDirection(rec.inverse);
      const probe=new THREE.Mesh(rec.geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
      const hits=new THREE.Raycaster(origin,direction,.0001,1000).intersectObject(probe,false);probe.material.dispose();
      // The first outward-facing hit indicates the centre was inside a solid.
      // Free room space hits an inward-facing wall instead, so is not rejected.
      if(hits.length&&hits[0].face&&hits[0].face.normal.dot(direction)*(rec.flip?-1:1)>1e-5)return true;
    }
    return false;
  }
  state(){return {method:'Rapier capsule against exact visible solid triangles selected by shared BVH',solidInstances:this.records.length,excluded:{...this.excluded},residentTriangles:this.triangles,regionRevisions:this.revisions,regionCentre:this.centre,regionRadius:this.config.collision.regionRadius,lastBuildMs:this.lastBuildMs,totalBuildMs:this.totalBuildMs,sources:this.lastSources};}
  dispose(){this.world.free();}
}
