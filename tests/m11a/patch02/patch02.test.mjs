import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyPatch02,patch02Checks,galleryParts,galleryRoute,gymWorld} from '../../../apps/campus/src/patch02-core.mjs';
import {buildTerrainModel} from '../../../apps/campus/src/terrain-core.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../../../data/'+name,import.meta.url)));
const base=read('m10/campus-layout.json'),terrain=read('m11a/terrain-input.json'),spec=read('m11a/patch02/input.json');
const result=applyPatch02(base,terrain,spec),{layout:l,terrain:t}=result;
for(const c of patch02Checks(l,t,spec,base).results)test(c.id,()=>assert.ok(c.passed,JSON.stringify(c.detail)));
test('P02 does not mutate inputs',()=>{const before=JSON.stringify([base,terrain,spec]);applyPatch02(base,terrain,spec);assert.equal(JSON.stringify([base,terrain,spec]),before);});
test('P02 every original facility XZ still exactly matches',()=>{for(let i=0;i<28;i++)assert.deepEqual(l.facilities[i].position,base.facilities[i].position);});
test('P02 stair starts at lower floor and ends on gallery',()=>{const a=galleryParts(spec);assert.equal(a.length,28);assert.equal(a[0].base,.04);assert.ok(Math.abs(a.at(-1).top-4.24)<1e-8);});
test('P02 stair tread elevation increases monotonically',()=>{const a=galleryParts(spec);for(let i=1;i<a.length;i++)assert.ok(Math.abs(a[i].top-a[i-1].top-.15)<1e-8);});
test('P02 gallery route reaches actual upper level',()=>{const p=galleryRoute(spec);assert.equal(p[0].y,.04);assert.equal(p.at(-1).y,4.24);assert.ok(p.at(-1).v>15);});
test('P02 left of main-facing facade is plan +Z',()=>assert.ok(gymWorld(-18,0,1)[2]>45));
const mutations=[
 ['wrong door orientation',q=>q.layout.entrances.find(e=>e.id==='03-front').facing=[0,0,-1],'P02_FRONT_FACES_MAIN'],
 ['old entry spur',q=>q.layout.navigation.edges.push(['junction-gym','gym-entry']),'P02_NO_OLD_ENTRY_SPUR'],
 ['open loop',q=>q.layout.navigation.edges=q.layout.navigation.edges.filter(e=>!e.includes('gym-loop-west-north')),'P02_LOOP_CLOSED'],
 ['missing forecourt',q=>q.terrain.forecourts=[],'P02_FORECOURT_SPACE'],
 ['old shallow slope',q=>q.terrain.gradeKnots=q.terrain.gradeKnots.map(([z,y])=>[z,z===24?.2:y]),'P02_ENTRANCE_5_PERCENT'],
 ['moved music footprint',q=>q.layout.facilities.find(f=>f.id==='24').position[0]+=1,'P02_ALL_XZ_PRESERVED'],
 ['restored green road',q=>q.layout.navigation.edges.push(['east-bottom','garden-turn']),'P02_FORBIDDEN_ROUTES'],
 ['short gym',q=>q.layout.facilities.find(f=>f.id==='03').size[1]=15,'P02_ONLY_GYM_HEIGHT'],
 ['changed toilet floor',q=>q.layout.toilet25.floors.pop(),'P02_FROZEN_MAIN_TOILET'],
];
for(const[name,change,expected]of mutations)test('P02 rejects '+name,()=>{const q=applyPatch02(base,terrain,spec);change(q);let failed=false;try{failed=patch02Checks(q.layout,q.terrain,spec,base).results.some(r=>r.id===expected&&!r.passed);}catch(e){failed=true;}assert.ok(failed);});
test('P02 route tour has only valid edges',()=>{const e=new Set(l.navigation.edges.map(([a,b])=>[a,b].sort().join('|')));for(let i=1;i<l.navigation.tourPath.length;i++)assert.ok(e.has([l.navigation.tourPath[i-1],l.navigation.tourPath[i]].sort().join('|')));});
test('P02 interior relative deltas preserved after rise',()=>{const before=buildTerrainModel(base,terrain),after=buildTerrainModel(l,t);for(const id of ['03','24','25','15','17','18','04','05','06','08','11','20'])assert.ok(Math.abs(after.anchors[id].floor-before.anchors[id].floor-.8)<.005,id);});
