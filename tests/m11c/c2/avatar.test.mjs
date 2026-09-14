import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {STUDENT_PROFILE,locomotionState,locomotionParams} from '../../../apps/campus/src/player/student-avatar-profile.mjs';
import {createStudentRig} from '../../../apps/campus/src/player/student-rig.mjs';
const C={blue:'#315fa2',blueFold:'#2b548e',white:'#eeeae0',red:'#b84646',skin:'#d6a47c',skinShade:'#be865f',hair:'#302e2c',hairLight:'#45413e',eye:'#382a24',eyeWhite:'#f2e9dc',lip:'#a56454',sole:'#d5d4cc',shoe:'#797e80'};
const mats=Object.fromEntries(['cloth','skin','hair','detail','shoe'].map(k=>[k,new THREE.MeshPhysicalMaterial()]));
const rig=createStudentRig(mats,C);
test('R2 follows user-confirmed white collar, blue body, white over red bands and left-chest YL',()=>{
 const u=STUDENT_PROFILE.uniform;assert.equal(u.logo,'YL');assert.equal(u.collar,'white-folded');assert.equal(u.backLogo,false);assert.equal(u.trouserSideStripe,false);
 assert.deepEqual(u.stripeOrderTopToBottom,['blue','white','red','blue']);assert.match(STUDENT_PROFILE.evidence,/A:.*用户确认/);
 assert.ok(rig.stats.parts.some(p=>p.name==='YL-left-chest-Y'));assert.ok(rig.stats.parts.some(p=>p.name==='YL-left-chest-L'));
 assert.ok(!rig.stats.parts.some(p=>/back.*logo|back.*emblem/.test(p.name)));
});
test('locomotion states remain speed and ground driven',()=>{assert.equal(locomotionState(0,true),'idle');assert.equal(locomotionState(1.4,true),'walk');assert.equal(locomotionState(3,true),'run');assert.equal(locomotionState(1,false),'air');assert.ok(locomotionParams(3,true).stride>locomotionParams(1,true).stride);});
test('continuous skinned silhouette has 15 joints, five material draws, finite normalized weights',()=>{
 assert.equal(rig.bones.length,15);assert.equal(rig.meshes.length,5);assert.ok(rig.stats.triangles>15000&&rig.stats.triangles<100000);
 for(const m of rig.meshes){assert.ok(m.isSkinnedMesh);const a=m.geometry.attributes;for(const value of a.position.array)assert.ok(Number.isFinite(value));
 for(let i=0;i<a.skinWeight.count;i++){const sum=a.skinWeight.getX(i)+a.skinWeight.getY(i)+a.skinWeight.getZ(i)+a.skinWeight.getW(i);assert.ok(Math.abs(sum-1)<1e-6);assert.ok(a.skinIndex.getX(i)<15);}}
});
test('student dimensions fit the inherited 1.72 m scale instead of the discarded 2.4 m box puppet',()=>{
 rig.pose(0,0);const box=new THREE.Box3().setFromObject(rig.root);assert.ok(box.max.y<1.75&&box.max.y>1.65);assert.ok(box.min.y>=-.01);assert.ok(box.max.x-box.min.x<.80);
});
test('sleeve and trouser positions deform at knee/elbow without detached limb pieces',()=>{
 const mesh=rig.meshes.find(m=>m.name.endsWith('cloth')),a=mesh.geometry.attributes.position;
 let i=0;for(;i<a.count;i++)if(a.getY(i)<.3&&a.getX(i)>.05)break;
 rig.pose(0,0);const before=new THREE.Vector3();mesh.getVertexPosition(i,before);rig.pose(1.3,1.65);const after=new THREE.Vector3();mesh.getVertexPosition(i,after);assert.ok(after.distanceTo(before)>.01);
 for(const v of after.toArray())assert.ok(Number.isFinite(v));rig.pose(0,0);
});
test('export supplies real idle walk run skeletal clips',()=>{const clips=rig.animationClips();assert.deepEqual(clips.map(c=>c.name),['Idle','Walk','Run']);for(const c of clips){assert.ok(c.tracks.length>=30);assert.ok(c.validate());}});
test('character surfaces reuse shared physical factory and do not introduce photo textures or lights',()=>{
 const s=fs.readFileSync(new URL('../../../apps/campus/src/render/character-materials.ts',import.meta.url),'utf8');assert.match(s,/surfaceMaterial/);assert.match(s,/cloneSurfaceMaterial/);
 const model=fs.readFileSync(new URL('../../../apps/campus/src/player/student-rig.mjs',import.meta.url),'utf8');assert.ok(!/TextureLoader|new THREE\.(SpotLight|PointLight|DirectionalLight)/.test(model+s));
});
test('C1 R1.2 physics, inputs, camera and mobile policy have not been replaced',()=>{
 const paths=['apps/campus/src/player/motor.mjs','apps/campus/src/player/collision-world.mjs','apps/campus/src/player/player.css','apps/campus/src/main.ts','apps/campus/src/render/performance-policy.mjs','apps/campus/src/render/exact-index.mjs','apps/campus/src/render/daylight.ts'];
 for(const p of paths){const base=execFileSync('git',['show','6fb290608bb16a4b8b3f3523a9689a5b95335914:'+p]);assert.ok(fs.readFileSync(p).equals(base),p);}
 assert.ok(!fs.existsSync('apps/campus/src/c2-player.ts'));
});
