import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {context} from '../../../tools/m11b-b05/context.mjs';
import {buildB05Model} from '../../../apps/campus/src/batch05-core.mjs';
import {b05Geometry} from '../../../apps/campus/src/batch05-geometry.mjs';
import {resolveFinish} from '../../../apps/campus/src/render/surface-profiles.mjs';
import {installSpatialIndex} from '../../../apps/campus/src/render/spatial-index.mjs';
const {previous,p,site,layout,terrain,model}=context();
const root=new URL('../../../',import.meta.url);

test('B05 uses cumulative B04 layout/terrain without mutating approved models, roads, grades or axis',()=>{
 assert.equal(layout,previous.layout);assert.equal(terrain,previous.terrain);
 const before=JSON.stringify(layout),anchors=JSON.stringify(terrain.anchors);
 buildB05Model(layout,terrain,p,site);assert.equal(JSON.stringify(layout),before);assert.equal(JSON.stringify(terrain.anchors),anchors);
 for(const id of ['08','15','18'])assert.equal(layout.facilities.find(f=>f.id===id).position[0],73);
 assert.equal(terrain.anchors['15'].floor,3.45);
 assert.deepEqual(model.invariants.flagCenter,[73,192.5]);assert.equal(model.invariants.flagCount,3);
 for(const file of ['apps/campus/src/batch02-core.mjs','apps/campus/src/batch03-core.mjs','apps/campus/src/batch04-core.mjs','data/m11b/batch03/input.json','data/m11b/batch04/input.json']){
  const original=execFileSync('git',['show',p.baseCommit+':'+file],{cwd:root});assert.deepEqual(fs.readFileSync(new URL(file,root)),original,file);
 }
});
test('B01–B04 acceptance remains explicit; B05 never invents an acceptance or surveyed metric',()=>{
 for(const id of ['01','02','03','04']){const a=JSON.parse(fs.readFileSync(new URL(`data/m11b/batch${id}/acceptance.json`,root)));assert.match(a.status,/ALUMNI_APPROVED/);if(id==='03')assert.equal(a.version,'R2');if(id==='04')assert.equal(a.version,'R1');}
 assert.equal(fs.existsSync(new URL('data/m11b/batch05/acceptance.json',root)),false);
 assert.equal(p.surveyVerified,false);assert.equal(p.measured,null);assert.equal(model.status,'IMPLEMENTED / REVIEW_PENDING');assert.equal(model.standard,'1.0');
 assert.throws(()=>buildB05Model(layout,terrain,{...p,surveyVerified:true},site));assert.equal(model.invariants.unlocated22,null);
});
test('Finite real geometry, stable IDs, correct owners and defined evidence on every part',()=>{
 assert.equal(new Set(model.parts.map(q=>q.id)).size,model.parts.length);
 for(const q of model.parts){assert.ok(q.role&&q.evidence,q.id);assert.ok(p.scope.includes(q.owner));assert.ok(q.row>=0&&q.row<22);
  const g=b05Geometry(q);assert.ok(g.attributes.position.count>0,q.id);for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite),q.id);assert.ok(g.boundingSphere.radius>0,q.id);g.dispose();
 }
});
test('Six inherited court rectangles, twelve H hoops, two goals and open perimeter gaps are explicit',()=>{
 assert.equal(model.courts.length,6);assert.equal(model.hoops.length,12);assert.equal(model.goals.length,2);
 for(const c of model.courts){const hoops=model.hoops.filter(h=>h.court===c.id);assert.equal(hoops.length,2);assert.equal(hoops[0].normal[2],-hoops[1].normal[2]);}
 assert.ok(!model.fenceSegments.some(f=>f.a[0]===-10&&f.b[0]===-10&&Math.min(f.a[1],f.b[1])<120&&Math.max(f.a[1],f.b[1])>120));
 assert.ok(!model.fenceSegments.some(f=>f.a[0]===-65&&f.b[0]===-65&&Math.min(f.a[1],f.b[1])<120&&Math.max(f.a[1],f.b[1])>120));
 assert.deepEqual(model.invariants.stoneAnchor,[-17,0,1]);
 for(const b of model.blocks){const old=layout.contextBlocks.find(q=>q.id===b.id);assert.deepEqual(b.size,old.size);}
});
test('Shared materials distinguish stone rails, thin fabric nets, glass and frames without a photo texture',()=>{
 assert.equal(resolveFinish(8,'stone-balustrade','rod'),'stone');assert.equal(resolveFinish(8,'net-fabric','rod'),'fabric');assert.equal(resolveFinish(5,'metal-roof','prism'),'painted-metal');
 for(const q of model.parts){if(q.role==='window')assert.equal(resolveFinish(q.row,q.role,q.shape),'glass');if(q.role==='window-frame')assert.notEqual(resolveFinish(q.row,q.role,q.shape),'glass');}
 assert.ok(model.parts.filter(q=>q.shape==='rod'&&q.radius>=.03).every(q=>(q.segments??48)===48));
 const hoop=b05Geometry(model.parts.find(q=>q.shape==='ring'));assert.equal(hoop.parameters.radialSegments,32);assert.equal(hoop.parameters.tubularSegments,192);hoop.dispose();
});
// Test actual nearby rendered triangles, not proxy bounding boxes. Bounds only select
// candidates conservatively; the rays below intersect full detailed geometry.
function nearGeometry(door){const center=new THREE.Vector3(...door.center),region=new THREE.Box3().setFromCenterAndSize(center.clone().add(new THREE.Vector3(0,door.height/2,0)),new THREE.Vector3(door.width+2,door.height+2,door.width+2));
 const scene=new THREE.Scene();for(const q of model.parts){const g=b05Geometry(q);if(!g.boundingBox.intersectsBox(region)){g.dispose();continue;}const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));m.name=q.id;scene.add(m);}scene.updateMatrixWorld(true);return scene;
}
test('All fourteen portal grids remain open through real parts before and after BVH',()=>{
 for(const d of model.portals){const scene=nearGeometry(d),n=new THREE.Vector3(...d.normal),t=new THREE.Vector3(n.z,0,-n.x),rays=[];
  for(const off of[-d.width/2+.18,0,d.width/2-.18])for(const h of[.30,1.50,d.height-.17]){const q=new THREE.Vector3(...d.center).addScaledVector(t,off);q.y=d.floor+h;rays.push(new THREE.Raycaster(q.clone().addScaledVector(n,.50),n.clone().negate(),.002,.998));}
  const hits=()=>rays.map(r=>r.intersectObjects(scene.children,false).map(h=>h.object.name));const before=hits();assert.ok(before.every(x=>!x.length),d.id+' '+JSON.stringify(before));
  installSpatialIndex(scene);assert.deepEqual(hits(),before,d.id);scene.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});
 }
});
test('Major vegetation is deterministic and trunks do not enter the main road or the P03 rear opening',()=>{
 assert.equal(model.trees.length,57);assert.deepEqual(buildB05Model(layout,terrain,p,site).trees,model.trees);
 assert.ok(model.trees.every(t=>!(Math.abs(t.x)<3.6&&t.z>0&&t.z<200)));
 assert.ok(model.trees.every(t=>!(t.x>79.6&&t.x<84.4&&t.z>187&&t.z<196)));
 assert.ok(!model.parts.some(q=>q.role==='planter-soil'&&q.owner==='09'&&q.center[0]-q.size[0]/2<84&&q.center[0]+q.size[0]/2>80));
});
test('New reflector ownership extends rather than moves the seven inherited probes',()=>{
 const src=fs.readFileSync(new URL('apps/campus/src/render/reflections.ts',root),'utf8');
 for(const item of['teaching: [73, 8, 194]','gym: [-15, 7, 48]','library: [73, 8, 239]','garden: [73, 7, 274]','eastTeaching: [139, 8, 212]','longya: [129, 9, 242]','westTeaching: [-23, 7, 188]','entrance: [0, 5, 7]','courts: [-38, 7, 120]','field: [73, 6, 114]','residential: [171, 8, 74]'])assert.ok(src.includes(item),item);
});
