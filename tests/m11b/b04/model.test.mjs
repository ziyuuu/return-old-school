import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../../apps/campus/node_modules/three/build/three.module.js';
import {context} from '../../../tools/m11b-b04/context.mjs';
import {applyB04Layout} from '../../../apps/campus/src/batch04-core.mjs';
import {b04Geometry} from '../../../apps/campus/src/batch04-geometry.mjs';
import {detailBox, bevelProfile} from '../../../apps/campus/src/render/detail-geometry.mjs';
import {resolveFinish} from '../../../apps/campus/src/render/surface-profiles.mjs';
import {installSpatialIndex} from '../../../apps/campus/src/render/spatial-index.mjs';
const {previous,p,layout,terrain,model}=context();
const root=new URL('../../../',import.meta.url);

test('B04 leaves the cumulative B03 terrain, road graph, registered XZ and accepted owners untouched',()=>{
  assert.equal(terrain,previous.terrain);
  assert.deepEqual(layout.navigation,previous.layout.navigation);
  for(const f of previous.layout.facilities){
    const after=layout.facilities.find(x=>x.id===f.id);
    assert.deepEqual(after.position,f.position,'position '+f.id);
    assert.deepEqual(after.size,f.size,'registered envelope '+f.id);
    if(!p.scope.includes(f.id))assert.deepEqual(after,f,'accepted/non-B04 facility '+f.id);
    else if(f.id!=='16')assert.equal(after.floors,f.floors);
  }
  assert.equal(layout.facilities.find(f=>f.id==='16').floors,1);
  assert.equal(previous.layout.facilities.find(f=>f.id==='16').floors,2);
  assert.equal(terrain.anchors['15'].floor,3.45);
  for(const id of ['08','15','18'])assert.equal(layout.facilities.find(f=>f.id===id).position[0],73);
  const st=terrain.stairs.find(s=>s.facilityId==='17');
  assert.deepEqual(st.start,[129,246.8]);assert.deepEqual(st.end,[129,249]);assert.equal(st.steps,6);assert.equal(st.rise,.9);
});

test('Current acceptance remains B01/B02/B03 R2; B04 does not invent acceptance or surveyed metrics',()=>{
  for(const batch of ['01','02','03']){
    const a=JSON.parse(fs.readFileSync(new URL(`data/m11b/batch${batch}/acceptance.json`,root)));
    assert.match(a.status,/ALUMNI_APPROVED/);
    if(batch==='03')assert.equal(a.version,'R2');
  }
  assert.equal(fs.existsSync(new URL('data/m11b/batch04/acceptance.json',root)),false);
  assert.equal(p.surveyVerified,false);assert.equal(p.measured,null);
  assert.equal(model.status,'IMPLEMENTED / REVIEW_PENDING');assert.equal(model.standard,'1.0');
  assert.throws(()=>applyB04Layout(previous.layout,{...p,surveyVerified:true}),/must stay H/);
  for(const id of ['07','16','21'])assert.match(model.summaries.find(s=>s.owner===id).identity,/U/);
});

test('All generated parts have stable IDs, owner/role/evidence and finite nondegenerate geometry',()=>{
  assert.equal(new Set(model.parts.map(q=>q.id)).size,model.parts.length);
  assert.deepEqual([...new Set(model.parts.map(q=>q.owner))].sort(),['07','13','16','17','21']);
  const boxCache=new Map();
  for(const q of model.parts){
    assert.ok(q.role&&q.evidence,q.id);assert.ok(Number.isInteger(q.row)&&q.row>=0&&q.row<22,q.id);
    if(q.shape==='box'){
      assert.ok(q.size.every(n=>Number.isFinite(n)&&n>0),q.id);assert.ok(q.center.every(Number.isFinite),q.id);
      const profile=bevelProfile(q.size,q.role);if(profile){assert.ok(profile.radius<=.035);assert.ok([3,4].includes(profile.segments));}
      continue;
    }
    if(q.shape==='leaf'){assert.ok(q.size.every(n=>n>0));continue;}
    const g=b04Geometry(q);assert.ok(g.attributes.position.count>0,q.id);
    for(const [name,a]of Object.entries(g.attributes))assert.ok(a.array.every(Number.isFinite),`${q.id} ${name}`);
    g.computeBoundingBox();const size=g.boundingBox.getSize(new THREE.Vector3());assert.ok(size.length()>0,q.id);g.dispose();
  }
});

test('Different source-backed silhouettes and real apertures are present, not five copied boxes',()=>{
  for(const key of ['13-canopy-warm-fascia','13-tower-pane','17-tower-glass','17-rounded-canopy','16-arched-front','16-roof-slope','07-porch-recess','21-vertical-stair-band'])
    assert.ok(model.parts.some(q=>q.id.includes(key)),key);
  assert.equal(model.portals.length,6);assert.equal(model.routes.length,7);
  assert.deepEqual(model.routes.map(q=>q.id).sort(),['information-entry','longya-direct','museum-east','office-entry','science-bay','science-main','science-stair']);
  for(const d of model.portals){assert.ok(d.width>=2&&d.height>=2.2,d.id);assert.ok(d.center.every(Number.isFinite));}
  assert.equal(model.fixtures.length,1);assert.equal(model.fixtures[0].text,'科学馆');
});

test('Shared surface semantics distinguish glass from frames, sills and flat support',()=>{
  for(const q of model.parts){const finish=resolveFinish(q.row,q.role,q.shape);
    if(q.role==='window')assert.equal(finish,'glass',q.id);
    if(/window-frame|window-mullion/.test(q.role))assert.notEqual(finish,'glass',q.id);
    if(/floor|step|wall/.test(q.role))assert.notEqual(finish,'glass',q.id);
  }
  const geometry=detailBox([.08,3,.12],'window-frame');assert.equal(geometry.userData.detail.kind,'physical-bevel');
  assert.equal(geometry.userData.detail.segments,3);geometry.dispose();
  const step=detailBox([3,.15,.32],'step');assert.equal(step.userData.detail.kind,'exact-box');step.dispose();
});

test('Museum arch is a real hole: width/height grid passes; spandrels above the arc remain solid before and after BVH',()=>{
  const q=model.parts.find(q=>q.id==='B04-16-arched-front'),g=b04Geometry(q);
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial());mesh.name=q.id;
  const scene=new THREE.Scene();scene.add(mesh);scene.updateMatrixWorld(true);
  const ray=(u,y)=>new THREE.Raycaster(new THREE.Vector3(17,y,-u),new THREE.Vector3(-1,0,0),0,4);
  const probes=[...[-1,-.5,0,.5,1].flatMap(u=>[.35,1.15,2.22,2.65].map(y=>({u,y,blocked:false}))),{u:0,y:4.1,blocked:true},{u:1.28,y:3.5,blocked:true},{u:1.28,y:2.6,blocked:false}];
  const evaluate=()=>probes.map(q=>({ ...q,actual:ray(q.u,q.y).intersectObject(mesh,false).length>0 }));
  const before=evaluate();for(const r of before)assert.equal(r.actual,r.blocked,JSON.stringify(r));
  const original=Array.from(g.attributes.position.array),indices=Array.from(g.index.array);
  const stats=installSpatialIndex(scene);assert.equal(stats.indexedGeometries,1);
  assert.deepEqual(evaluate(),before);assert.deepEqual(Array.from(g.attributes.position.array),original);assert.deepEqual(Array.from(g.index.array),indices);
  g.dispose();mesh.material.dispose();
});

test('New ownership maps to explicit local probes; old probe locations and roles remain present',()=>{
  const source=fs.readFileSync(new URL('apps/campus/src/render/reflections.ts',root),'utf8');
  for(const key of ['teaching: [73, 8, 194]','gym: [-15, 7, 48]','library: [73, 8, 239]','garden: [73, 7, 274]','eastTeaching: [139, 8, 212]','longya: [129, 9, 242]','westTeaching: [-23, 7, 188]'])assert.ok(source.includes(key));
});
