import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {applyPatch02} from '../../apps/campus/src/patch02-core.mjs';
import {horizontalSnapshot} from '../../apps/campus/src/terrain-core.mjs';
import {buildPatch03Model,patch03Checks} from '../../apps/campus/src/patch03-core.mjs';
import {buildPatch04Model,patch04Checks} from '../../apps/campus/src/patch04-core.mjs';
import {buildBatch01Model,batch01Checks,segmentBox,hasFloor} from '../../apps/campus/src/batch01-core.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url)));
const source=read('data/m10/campus-layout.json'),t=read('data/m11a/terrain-input.json'),p2=read('data/m11a/patch02/input.json'),p3=read('data/m11a/patch03/input.json'),p4=read('data/m11a/patch04/input.json'),input=read('data/m11b/batch01/input.json');
const patch=applyPatch02(source,t,p2),layout=patch.layout;
const terrain=()=>buildPatch04Model(buildPatch03Model(layout,patch.terrain,p3),p4);
const model=()=>buildBatch01Model(layout,terrain(),input);
const b=model();
for(const check of [...patch03Checks(layout,patch.terrain,p3).results,...patch04Checks(layout,terrain(),p4).results,...batch01Checks(layout,b).results])test(check.id,()=>assert.ok(check.passed,JSON.stringify(check)));
test('B01 pure generation preserves all inputs',()=>{const before=JSON.stringify([source,layout,input,p3,p4]);model();assert.equal(JSON.stringify([source,layout,input,p3,p4]),before);});
test('B01 all parts have unique IDs, positive finite geometry',()=>{assert.equal(new Set(b.parts.map(p=>p.id)).size,b.parts.length);for(const p of b.parts){assert.ok(p.size.every(v=>Number.isFinite(v)&&v>0),p.id);assert.ok(p.center.every(Number.isFinite),p.id);}});
test('B01 keeps original15 and25 footprint envelopes',()=>{for(const id of ['15','25']){const f=layout.facilities.find(f=>f.id===id);for(const q of b.parts.filter(q=>q.owner===id&&q.shape==='box')){assert.ok(Math.abs(q.center[0])+q.size[0]/2<=f.size[0]/2+.2,q.id);assert.ok(Math.abs(q.center[2])+q.size[2]/2<=f.size[2]/2+.2,q.id);}}});
test('B01 bridge floors inherit R4 exact end points',()=>{for(const q of layout.connections){const f=b.parts.find(p=>p.id===q.id);assert.equal(f.center[0]-f.size[0]/2,q.xStart);assert.equal(f.center[0]+f.size[0]/2,q.xEnd);assert.equal(f.size[2],q.width);}});
test('B01 4 full main floors and4 full toilet floors',()=>{for(const id of ['15','25'])assert.equal(b.parts.filter(q=>q.owner===id&&q.role==='slab').length,4);});
test('B01 has eight through-door supported routes',()=>assert.equal(b.routes.length,8));
test('B01 no gender-end assignment fabricated',()=>assert.match(input.toilet.genderEnds,/unknown/));
test('B01 P4 base remains approved, B01 review not inherited',()=>{assert.equal(p4.alumniReview,'APPROVED');assert.equal(input.status,'IMPLEMENTED / REVIEW_PENDING');});
test('B01 front and rear doorway have real headroom',()=>{for(const z of [[214,222],[224,235]])assert.ok(!b.worldParts.some(q=>segmentBox([69,b.mainFloor+1.7,z[0]],[69,b.mainFloor+1.7,z[1]],q,.2)));});
// Parts are mutated AFTER generation: these probes cannot pass merely by reading input flags.
const mutations=[
 ['removed second floor',m=>{m.parts=m.parts.filter(q=>q.id!=='25-L2-full-floor');m.worldParts=m.worldParts.filter(q=>q.id!=='25-L2-full-floor');},'B01-L2-FULL-TOILET-SLAB'],
 ['bridge slab raised',m=>{m.worldParts.find(q=>q.id==='15-25-L03').center[1]+=.5;},'B01-L3-A-SUPPORTED'],
 ['gallery floor cut in half',m=>{m.worldParts.find(q=>q.id==='25-L4-full-floor').size[2]=2;},'B01-L4-B-SUPPORTED'],
 ['toilet wrong datum',m=>m.toiletFloor+=.5,'B01-COMMON-DATUM'],
 ['modern orange material',m=>m.p.main.material='modern orange-red','B01-OLD-NOT-MODERN'],
 ['windowless mass',m=>m.parts=m.parts.filter(q=>q.role!=='glazing'),'B01-REAL-WINDOWS'],
 ['terrace roofed over',m=>m.worldParts.push({shape:'box',role:'roof',size:[98,.3,14],center:[69,m.mainFloor+15.4,224]}),'B01-TERRACE-OPEN-SKY'],
 ['terrace guard removed',m=>m.parts=m.parts.filter(q=>q.role!=='terrace-guard'),'B01-TERRACE-RAIL'],
 ['road data changed',m=>m.horizontal={...m.horizontal,corruptedRoad:true},'B01-XZ-ROADS-FROZEN'],
 ['toilet partition deleted',m=>m.parts=m.parts.filter(q=>!(q.owner==='25'&&q.level===2&&q.role==='partition')),'B01-L2-CONTINUOUS-BODY'],
];
for(const [label,mutate,expected] of mutations)test('FAULT '+label,()=>{const m=model();m.p=structuredClone(m.p);mutate(m);assert.ok(batch01Checks(layout,m,layout).results.some(c=>c.id===expected&&!c.passed),expected);});
for(let l=1;l<=4;l++)for(const [label,x,z]of [['bridge gap',-7,224],['end A door',-9.2,218.9],['end B door',-9.2,229.1]])test(`FAULT L${l} blocked ${label}`,()=>{const m=model(),y=m.mainFloor+(l-1)*3.8; m.worldParts.push({shape:'box',center:[x,y+1.5,z],size:[.24,3,label==='bridge gap'?2.4:1.4]});assert.ok(batch01Checks(layout,m).results.some(c=>c.id.startsWith(`B01-L${l}-`)&&c.id.endsWith('CLEAR')&&!c.passed));});
for(const [label,center,size,expected] of [['underpass',[6.5,5,224],[2,4,1],'B01-BRIDGE-UNDERPASS'],['rear door',[69,5,231],[2.8,4,.3],'B01-REAR-DOOR'],['terrace door',[69,16,226.8],[2.8,3,.3],'B01-TERRACE-DOOR']])test('FAULT closed '+label,()=>{const m=model();m.worldParts.push({shape:'box',center,size});assert.ok(batch01Checks(layout,m).results.some(c=>c.id===expected&&!c.passed));});
const p3Faults=[['short slope',q=>{q.entrance.endZ=22;q.entrance.run=20;},'P03-LONGER'],['shallow slope',q=>{q.entrance.knots=q.entrance.knots.map(([z,y])=>[z,y/3]);},'P03-STEEPER'],['level field',q=>{q.field.lower=3;q.field.depression=0;},'P03-FIELD-DEPRESSED'],['sunken apron',q=>{q.gym.forecourt=1.8;},'P03-GYM-APRON-HELD'],['sealed field',q=>q.barrier.openings=[],'P03-OPENINGS'],['tilted field',q=>q.field.playingSurfaceTilt=.02,'P03-SPORTS-PLANAR']];
for(const [label,mutate,expected]of p3Faults)test('FAULT P3 '+label,()=>{const q=structuredClone(p3);mutate(q);assert.ok(patch03Checks(layout,patch.terrain,q).results.some(c=>c.id===expected&&!c.passed));});
const p4Faults=[['flat courts',q=>{q.courts.lift=0;q.courts.top=3;},'P04-RAISED'],['tilted courts',q=>q.courts.tilt=.02,'P04-PLANAR'],['sealed courts',q=>q.courts.openings=[],'P04-TWO-ENTRIES'],['one flag',q=>q.forecourt.flag.count=1,'P04-THREE-FLAGS'],['flag moved back',q=>q.forecourt.flag.center[1]=198,'P04-FLAGS-NEAR-FIELD'],['narrow forecourt',q=>q.forecourt.pavingBounds[3]=204,'P04-WIDE-FORECOURT'],['detached shop',q=>q.shop.newDetachedBuilding=true,'P04-SHOP-PARENT'],['sealed shop',q=>q.shop.closedDoor=true,'P04-SHOP-OPEN']];
for(const [label,mutate,expected]of p4Faults)test('FAULT P4 '+label,()=>{const q=structuredClone(p4);mutate(q);const m=buildPatch04Model(buildPatch03Model(layout,patch.terrain,p3),q);assert.ok(patch04Checks(layout,m,q).results.some(c=>c.id===expected&&!c.passed));});
