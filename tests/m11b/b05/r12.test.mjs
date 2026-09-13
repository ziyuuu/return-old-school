import test from 'node:test';
import assert from 'node:assert/strict';
import {context} from '../../../tools/m11b-b05/context.mjs';
import {b05Geometry} from '../../../apps/campus/src/batch05-geometry.mjs';
const {model}=context();
test('R1.2 stone is on the platform in front of, not alongside or behind the right gate tower',()=>{
 const s=model.parts.find(p=>p.id==='B05-27-r12-standing-stone');
 assert.ok(s.center[0]>-13&&s.center[0]<-8.8);
 assert.ok(s.center[2]+s.size[2]/2<-2);
 assert.equal(s.center[1],.75);
 assert.ok(model.parts.some(p=>p.id==='B05-27-r12-ramp'));
 assert.equal(model.routes.filter(r=>['stone-front','stone-side'].includes(r.id)).length,2);
});
test('Side enclosure uses continuous shared miter vertices and leaves the residential fork open',()=>{
 const lane=model.spatialCorrections.lane;
 assert.deepEqual(lane.centerline,[[17,1.48],[17,16],[23,22],[125,32]]);
 assert.equal(lane.sides.length,2);
 assert.ok(model.routes.some(r=>r.id==='side-residential-fork'));
 for(const side of lane.sides) assert.equal(side.inner.length,lane.centerline.length);
});
test('B05 crown tufts retain detail=4 and previous tree count; no unrequested shared decimation',()=>{
 assert.equal(model.trees.length,57);
 const p=model.parts.find(p=>p.crownProfile==='lobed');
 const g=b05Geometry(p);assert.equal(g.parameters.detail,4);g.dispose();
 assert.ok(model.parts.filter(p=>p.crownProfile==='lobed').length>300);
});
