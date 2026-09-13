import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {initPhysics,PlayerMotor,FollowCamera} from '../../../apps/campus/src/player/motor.mjs';
import {CampusCollisionWorld,collisionDisposition} from '../../../apps/campus/src/player/collision-world.mjs';
import {installSpatialIndex} from '../../../apps/campus/src/render/spatial-index.mjs';
const cfg=JSON.parse(fs.readFileSync(new URL('../../../data/m11c/c1/config.json',import.meta.url)));
await initPhysics();
function fixture(){
 const scene=new THREE.Scene();
 function box(x,y,z,w,h,d,finish='concrete'){
  const material=new THREE.MeshBasicMaterial();material.userData.finish=finish;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.name='fixture-'+scene.children.length;scene.add(mesh);return mesh;
 }
 box(0,-.1,0,120,.2,160);
 const build=(feet=[0,.06,0])=>{installSpatialIndex(scene);const adapter=new CampusCollisionWorld(scene,cfg),motor=new PlayerMotor(adapter.world,cfg,(p,force)=>adapter.ensure(p,force),p=>adapter.containsPointInSolid(p));motor.spawn(feet);return {motor,adapter,free:()=>{motor.dispose();adapter.dispose();scene.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});}}};
 return {scene,box,build};
}
function settle(m,n=25){for(let i=0;i<n;i++)m.step({x:0,z:0,run:false});}
function drive(m,x,z,n=180,run=false){for(let i=0;i<n;i++)m.step({x,z,run});}

test('Uniform capsule, slope, stepping and clock configuration is not a surveyed metric',()=>{
 assert.equal(cfg.body.height,1.72);assert.equal(cfg.body.radius,.28);assert.equal(cfg.movement.maxStep,.28);assert.equal(cfg.simulation.hz,60);
 assert.match(cfg.purpose,/not historical/);assert.equal(cfg.avatar.historicalUniform,false);
});
test('Fixed-step walk is consistent at 30 / 60 / 144 display Hz and diagonals are normalized',()=>{
 const results=[];for(const hz of[30,60,144]){const f=fixture().build();f.motor.setPaused(false);for(let i=0;i<hz*2;i++)f.motor.advance(1/hz,{x:0,z:1,run:false});results.push(f.motor.feet()[2]);f.free();}
 assert.ok(Math.max(...results)-Math.min(...results)<.004,results.join(','));assert.ok(results[0]>3.1&&results[0]<3.3,results.join(','));
 const f=fixture().build();drive(f.motor,1,1,120);assert.ok(Math.hypot(f.motor.position.x,f.motor.position.z)<3.3);f.free();
});
test('Capsule stops at a thin wall and slides laterally, never ray-teleporting through it',()=>{
 const f=fixture();f.box(0,1.5,2,20,3,.08);const q=f.build();settle(q.motor);drive(q.motor,0,1,180,true);assert.ok(q.motor.position.z<1.70&&q.motor.position.z>1.5);const z=q.motor.position.z;drive(q.motor,1,1,120,true);assert.ok(q.motor.position.x>3);assert.ok(q.motor.position.z<z+.025);q.free();
});
test('Autostep climbs real 0.16 m risers and descends with ground contact',()=>{
 const f=fixture();for(let i=0;i<6;i++)f.box(0,(i+1)*.16/2,1.3+i*.5,4,(i+1)*.16,.5);
 f.box(0,.48,5.3,4,.96,2);const q=f.build();settle(q.motor);drive(q.motor,0,1,170);assert.ok(q.motor.feet()[1]>.93,JSON.stringify(q.motor.state()));assert.ok(q.motor.position.z>3.4);
 drive(q.motor,0,-1,170);assert.ok(q.motor.feet()[1]<.08);assert.ok(q.motor.grounded);q.free();
});
test('High obstacles and low lintels are blocked under the same body rules',()=>{
 const f=fixture();f.box(0,.24,1.7,4,.48,1);const q=f.build();settle(q.motor);drive(q.motor,0,1,150);assert.ok(q.motor.position.z<1.02);q.free();
 const low=fixture();low.box(0,1.65,1.7,4,.3,1);const z=low.build();settle(z.motor);drive(z.motor,0,1,150);assert.ok(z.motor.position.z<1.15);assert.ok(z.motor.feet()[1]<.05);z.free();
});
test('True door opening passes a 0.72m aperture but not a 0.44m aperture',()=>{
 for(const [gap,pass]of[[.72,true],[.44,false]]){const f=fixture();for(const sign of[-1,1])f.box(sign*(1+gap/2),1.5,2,2,3,.24);const q=f.build();settle(q.motor);drive(q.motor,0,1,150);assert.equal(q.motor.position.z>2.7,pass,JSON.stringify(q.motor.state()));q.free();}
});
test('Walkable slope follows real triangles and steep slope refuses upward climbing',()=>{
 for(const degrees of[18,58]){const f=fixture(),len=5,rise=len*Math.tan(degrees*Math.PI/180),g=new THREE.BufferGeometry();
  const points=[-3,0,1, 3,0,1, 3,rise,6, -3,rise,6];g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();const material=new THREE.MeshBasicMaterial();material.userData.finish='concrete';f.scene.add(new THREE.Mesh(g,material));
  const q=f.build();settle(q.motor);drive(q.motor,0,1,160);if(degrees===18){assert.ok(q.motor.position.z>3);assert.ok(q.motor.feet()[1]>.7);}else assert.ok(q.motor.position.z<1.6,JSON.stringify(q.motor.state()));q.free();}
});
test('Stepping off a ledge enters a fall, rather than snapping through large drops',()=>{
 const f=fixture();f.box(0,.4,0,4,.8,3);const q=f.build([0,.86,0]);settle(q.motor);let falling=false;for(let i=0;i<180;i++){q.motor.step({x:0,z:1,run:false});if(!q.motor.grounded&&q.motor.velocity.y<-.6)falling=true;}assert.ok(falling);assert.ok(q.motor.feet()[1]<.05);q.free();
});
test('Paused or stalled frames cannot make the body leap across obstacles',()=>{
 const q=fixture().build();q.motor.setPaused(true);const p=q.motor.feet();q.motor.advance(300,{x:0,z:1,run:true});assert.deepEqual(q.motor.feet(),p);q.motor.setPaused(false);q.motor.advance(300,{x:0,z:1,run:true});assert.ok(q.motor.position.z<.5);assert.ok(q.motor.droppedSeconds>299);q.free();
});
test('Unsafe checkpoint inside a wall is rejected without claiming safe spawn',()=>{
 const f=fixture();f.box(3,1,0,1,2,1);const q=f.build();assert.throws(()=>q.motor.spawn([3,.05,0]),/intersects/);q.free();
});
test('Camera uses sphere sweep and cannot ease beyond a blocking wall',()=>{
 const f=fixture();f.box(0,2,-1.7,5,4,.1);const q=f.build();settle(q.motor);const camera=new FollowCamera(q.adapter.world,q.motor,cfg);camera.pitch=0;camera.zoom=5;
 for(let i=0;i<30;i++){const c=camera.update();assert.ok(c.distance<1.5&&c.obstructed);assert.ok(c.position.z>-1.48);}
 camera.firstPerson=true;assert.equal(camera.update().hideAvatar,true);assert.equal(camera.update().distance,0);q.free();
});
test('Physics residency switches retain exact floor and wall triangles',()=>{
 const f=fixture();f.box(0,1.5,25,20,3,.1);const q=f.build();drive(q.motor,0,1,600,true);assert.ok(q.adapter.revisions>2);assert.ok(q.motor.position.z<24.7&&q.motor.position.z>24.5);assert.ok(q.motor.grounded);assert.ok(q.adapter.state().residentTriangles>0);q.free();
});
test('Leaves and annotations do not block; glass and wire stay physical',()=>{
 const f=fixture();const leaf=f.box(0,1.5,2,3,3,.1,'foliage');const glass=f.box(0,1.5,4,3,3,.05,'glass');assert.equal(collisionDisposition(leaf),'leaves');assert.equal(collisionDisposition(glass),'solid');const q=f.build();drive(q.motor,0,1,200);assert.ok(q.motor.position.z>3.5&&q.motor.position.z<3.8);q.free();
});
test('B01–B05 model files, renderer detail and acceptance are inherited byte-for-byte',()=>{
 const root=new URL('../../../',import.meta.url),files=execFileSync('git',['ls-tree','-r','--name-only',cfg.baseCommit,'apps/campus/src','data/m11b'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>/batch0[1-5]|b01-|render\/(foliage|detail)|acceptance\.json$/.test(p));
 for(const file of files){const base=execFileSync('git',['show',cfg.baseCommit+':'+file],{cwd:root,maxBuffer:50*1024*1024});assert.deepEqual(fs.readFileSync(new URL(file,root)),base,file);}
 const a=JSON.parse(fs.readFileSync(new URL('data/m11b/batch05/acceptance.json',root)));assert.equal(a.version,'R1.2');assert.match(a.status,/ALUMNI_APPROVED/);
});
