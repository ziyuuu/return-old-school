import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {performanceProfile,RasterBudget,needsWalkShadowFocus} from '../../../apps/campus/src/render/performance-policy.mjs';
import {indexExactGeometry} from '../../../apps/campus/src/render/exact-index.mjs';
import {initPhysics,PlayerMotor} from '../../../apps/campus/src/player/motor.mjs';
import {CampusCollisionWorld} from '../../../apps/campus/src/player/collision-world.mjs';
import {installSpatialIndex} from '../../../apps/campus/src/render/spatial-index.mjs';
const cfg=JSON.parse(fs.readFileSync(new URL('../../../data/m11c/c1/config.json',import.meta.url)));
await initPhysics();
test('Mobile starts with a bounded raster budget and full-quality is reversible',()=>{
 const p=performanceProfile({width:390,dpr:3});assert.equal(p.pixelRatio,1);assert.equal(p.shadowResolution,1024);
 assert.equal(p.preserveDrawingBuffer,false);assert.equal(performanceProfile({width:390,dpr:3,mode:'detail'}).pixelRatio,1.5);
 assert.equal(performanceProfile({width:844,coarse:true,dpr:3}).mode,'balanced');assert.equal(performanceProfile({width:1280,dpr:2}).shadowResolution,4096);
});
test('Raster adaptation is bounded, hysteretic and inactive when paused',()=>{
 const b=new RasterBudget(performanceProfile({width:390,dpr:3}));for(let i=0;i<500;i++)b.sample(70);
 assert.equal(b.ratio,.75);const old=b.changes;for(let i=0;i<1000;i++)b.sample(16,false);assert.equal(b.changes,old);
 for(let i=0;i<900;i++)b.sample(16);assert.equal(b.ratio,1);assert.ok(b.changes<=4);
});
test('Walking sun cache spans minor movement but refreshes before local coverage ends',()=>{
 const c={x:0,y:1,z:0};assert.ok(!needsWalkShadowFocus(c,{x:4,y:1,z:3}));assert.ok(needsWalkShadowFocus(c,{x:6,y:1,z:0}));
 assert.ok(needsWalkShadowFocus(c,{x:0,y:4,z:0}));assert.ok(needsWalkShadowFocus(null,c));
});
test('Exact indexing retains every attribute bit, triangle, winding, UV seam and normal',()=>{
 const g=new THREE.SphereGeometry(2,48,24).toNonIndexed();const attrs=Object.fromEntries(Object.entries(g.attributes).map(([name,a])=>[name,{bits:new Uint32Array(a.array.buffer.slice(0)),size:a.itemSize}]));
 const before=g.attributes.position.count,bb=g.boundingBox;const stats=indexExactGeometry(g);
 assert.ok(stats.changed&&stats.verticesAfter<stats.verticesBefore);assert.equal(g.index.count,before);
 for(let i=0;i<before;i++)for(const [name,a] of Object.entries(attrs)){const actual=new Uint32Array(g.attributes[name].array.buffer);for(let j=0;j<a.size;j++)assert.equal(actual[g.index.array[i]*a.size+j],a.bits[i*a.size+j]);}
 assert.equal(g.boundingBox,bb);assert.equal(indexExactGeometry(g).changed,false);g.dispose();
});
test('Resident physics meshes are reused without gaps or new colliders at the same checkpoint',()=>{
 const scene=new THREE.Scene();const mat=new THREE.MeshBasicMaterial();mat.userData.finish='concrete';
 const ground=new THREE.Mesh(new THREE.BoxGeometry(100,.2,140),mat);ground.position.y=-.1;scene.add(ground);
 for(let i=0;i<12;i++){const wall=new THREE.Mesh(new THREE.BoxGeometry(1,3,.25),mat);wall.position.set(6,1.5,i*2);scene.add(wall);}
 const blocker=new THREE.Mesh(new THREE.BoxGeometry(20,3,.1),mat);blocker.position.set(0,1.5,25);scene.add(blocker);installSpatialIndex(scene);
 const adapter=new CampusCollisionWorld(scene,cfg),motor=new PlayerMotor(adapter.world,cfg,(p,f)=>adapter.ensure(p,f));motor.spawn([0,.06,0]);
 const created=adapter.createdColliders;adapter.ensure(motor.position,true);assert.equal(adapter.createdColliders,created);
 for(let i=0;i<650;i++)motor.step({x:0,z:1,run:true});
 assert.ok(adapter.reusedColliders>0);assert.ok(motor.position.z>24.5&&motor.position.z<24.7);assert.ok(motor.grounded);
 assert.equal(adapter.resident.size,adapter.colliders.length);motor.dispose();adapter.dispose();scene.traverse(o=>o.geometry?.dispose());mat.dispose();
});
