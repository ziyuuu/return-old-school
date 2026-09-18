import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {createStudentRig} from '../../../apps/campus/src/player/student-rig.mjs';
const C={blue:'#315fa2',blueFold:'#2b548e',white:'#eeeae0',red:'#b84646',skin:'#d6a47c',skinShade:'#be865f',hair:'#302e2c',hairLight:'#45413e',eye:'#382a24',eyeWhite:'#f2e9dc',lip:'#a56454',sole:'#d5d4cc',shoe:'#797e80'};
const mats=Object.fromEntries(['cloth','skin','hair','detail','shoe'].map(k=>[k,new THREE.MeshPhysicalMaterial()]));
const rig=createStudentRig(mats,C);
test('clip export preserves current visible pose',()=>{rig.pose(1.1,3.4,true,.8,1);const a=rig.bones.map(b=>[...b.position.toArray(),...b.quaternion.toArray()]);rig.animationClips();rig.bones.forEach((b,i)=>assert.deepEqual([...b.position.toArray(),...b.quaternion.toArray()],a[i]));rig.pose(0,0);});
test('approved design sheet is never relabelled as an archival photo',()=>{const e=JSON.parse(fs.readFileSync('data/m11c/c2/evidence.json','utf8'));assert.equal(e.confirmedByUser.grade,'A');assert.match(e.designReference.kind,/NOT an archival photo/);assert.ok(e.superseded.some(x=>x.includes('synthetic')));});
test('actual R3 rig stays within additive five-mesh and 8MB geometry budget',()=>{assert.equal(rig.stats.drawMeshes,5);assert.ok(rig.stats.geometryBytes<8000000);assert.ok(rig.stats.triangles<100000);});

// The old 40-segment horizontal cap was intentionally replaced by a sloping
// ten-sided sewn shoulder. Verify outward winding, not obsolete R2 coordinates.
test('both revised shoulder closures are real, closed and outward-facing',async()=>{
 const {createPlanarStudentParts}=await import('../../../apps/campus/src/player/student-planar-geometry.mjs');
 const parts=createPlanarStudentParts(C);
 for(const side of [-1,1]){
  const p=parts.find(x=>x.name==='continuous-sleeve-'+side).geometry.attributes.position;
  let count=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<p.count;i+=3){
   a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
   if([a,b,c].every(v=>Math.abs(v.y+.57*side*(v.x-side*.207)-1.324)<1e-6)){
    assert.ok(b.sub(a).cross(c.sub(a)).normalize().y>.8);count++;
   }
  }
  assert.equal(count,8);
 }
 parts.forEach(p=>p.geometry.dispose());
});
test('R3 uses minimal square eyes, wedge nose and connected angular hair',()=>{
 const names=rig.stats.parts.map(p=>p.name);
 assert.equal(names.filter(n=>n.startsWith('small-rectangular-eye')).length,2);
 assert.ok(names.includes('small-wedge-nose'));assert.ok(names.includes('connected-angular-hair-and-fringe'));
 assert.ok(!names.some(n=>/iris|pupil|glint|eyelid|swept-hair/.test(n)));
});
test('R3 matte surfaces remove character specular and procedural micro-noise only',()=>{
 const s=fs.readFileSync('apps/campus/src/render/character-materials.ts','utf8');
 assert.match(s,/specularIntensity = 0/);assert.match(s,/m\.map = null/);assert.match(s,/m\.bumpMap = null/);
 assert.match(s,/cloneSurfaceMaterial/);assert.match(s,/m\.roughness = 1/);
});
