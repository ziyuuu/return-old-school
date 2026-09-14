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
test('actual R2 rig stays within additive five-mesh and 8MB geometry budget',()=>{assert.equal(rig.stats.drawMeshes,5);assert.ok(rig.stats.geometryBytes<8000000);assert.ok(rig.stats.triangles<100000);});

test('both sleeve crowns have actual outward-facing closure triangles',()=>{
 const geometry=rig.meshes.find(m=>m.material===mats.cloth).geometry;
 const p=geometry.attributes.position,index=geometry.index,counts={left:0,right:0};
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<index.count;i+=3){
  a.fromBufferAttribute(p,index.getX(i));b.fromBufferAttribute(p,index.getX(i+1));c.fromBufferAttribute(p,index.getX(i+2));
  if([a,b,c].every(v=>Math.abs(v.y-1.356)<1e-6&&Math.abs(v.x)>.175&&Math.abs(v.x)<.23)){
   const side=a.x+b.x+c.x>0?'left':'right';counts[side]++;
   assert.ok(b.sub(a).cross(c.sub(a)).normalize().y>.99,'Crown cap must face outward, not down into sleeve');
  }
 }
 assert.deepEqual(counts,{left:40,right:40});
});
