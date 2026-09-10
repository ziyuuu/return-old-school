import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {applyPatch02} from '../../apps/campus/src/patch02-core.mjs';
import {buildPatch03Model,patch03Checks} from '../../apps/campus/src/patch03-core.mjs';
import {buildPatch04Model,patch04Checks} from '../../apps/campus/src/patch04-core.mjs';
import {buildBatch01Model,batch01Checks} from '../../apps/campus/src/batch01-core.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url)));
const source=read('data/m10/campus-layout.json'),terrain=read('data/m11a/terrain-input.json'),p2=read('data/m11a/patch02/input.json'),p3=read('data/m11a/patch03/input.json'),p4=read('data/m11a/patch04/input.json'),input=read('data/m11b/batch01/input.json');
const patch=applyPatch02(source,terrain,p2),l=patch.layout;
const g3=buildPatch03Model(l,patch.terrain,p3),g4=buildPatch04Model(g3,p4),b=buildBatch01Model(l,g4,input);
for(const report of [patch03Checks(l,patch.terrain,p3),patch04Checks(l,g4,p4),batch01Checks(l,b)])for(const r of report.results)test(r.id,()=>assert.ok(r.passed,r.detail));
const fail=(title,fn)=>test('FAULT '+title,()=>{const m=structuredClone({...b,exportData:undefined});fn(m);assert.equal(batch01Checks(l,m,l).passed,false);});
fail('missing toilet floor',m=>{m.parts=m.parts.filter(q=>q.id!=='25-L2-full-floor');m.worldParts=m.worldParts.filter(q=>q.id!=='25-L2-full-floor');});
fail('missing main floor',m=>{m.worldParts=m.worldParts.filter(q=>q.id!=='B01-15-L3-full-floor');});
fail('bridge step mismatch',m=>{m.worldParts.find(q=>q.id==='15-25-L03').center[1]+=.4;});
fail('discontinuous toilet body',m=>{m.parts=m.parts.filter(q=>q.role!=='partition');});
function block(m,id,center,size){m.worldParts.push({id,shape:'box',owner:'25',role:'fault-wall',center,size});}
fail('toilet bridge opening sealed',m=>block(m,'sealed-gallery',[-7,8.3,224],[.15,2.8,2.4]));
fail('main side portal sealed',m=>block(m,'sealed-side',[20,8.3,224],[.24,2.8,2.4]));
fail('bridge underpass blocked',m=>block(m,'bad-pier',[6.5,4.95,224],[.6,3,.6]));
fail('rear door sealed',m=>block(m,'rear',[69,4.95,230.9],[2.8,3,.24]));
fail('terrace covered by full roof',m=>block(m,'roof',[69,18.8,224],[98,.24,14]));
fail('terrace guard removed',m=>{m.parts=m.parts.filter(q=>q.role!=='terrace-guard');});
fail('terrace access sealed',m=>block(m,'terrace-door',[69,16.3,225.8],[2.8,2.8,.24]));
fail('toilet wrong elevation',m=>{m.toiletFloor+=.2;});
fail('modern main block material',m=>{m.p.main.material='modern-red';});
fail('road width altered',m=>{m.horizontal.navigation.edgeWidths[0][2]+=1;});
fail('building moved',m=>{m.horizontal.facilities.find(f=>f.id==='15').position[0]+=2;});
for(const [name,mutate]of [
 ['short entry',p=>{p.entrance.endZ=22;p.entrance.run=20;}],
 ['gentle entry',p=>{p.entrance.knots=[[0,0],[2,0],[44,1]];p.entrance.rise=1;}],
 ['level sports',p=>{p.field.lower=p.field.upper;}],
 ['lower gym apron',p=>{p.gym.forecourt=1.8;}],
 ['gym music mismatch',p=>{p.gym.musicFloor=2;}],
 ['sealed field fence',p=>{p.barrier.openings=[];}],
 ['floating field stairs',p=>{p.access.find(a=>a.kind==='stairs').base+=.4;}],
 ['tilted playing plane',p=>{p.field.playingSurfaceTilt=.015;}]
])test('FAULT P03 '+name,()=>{const q=structuredClone(p3);mutate(q);assert.equal(patch03Checks(l,patch.terrain,q).passed,false);});
for(const [name,mutate]of [
 ['flat courts',p=>{p.courts.lift=0;p.courts.top=3;}],['tilted courts',p=>{p.courts.tilt=.01;}],['closed court fence',p=>{p.courts.openings=[];}],['single flag',p=>{p.forecourt.flag.count=1;}],['old flag position',p=>{p.forecourt.flag.center=p.forecourt.flag.oldCenter;}],['narrow forecourt',p=>{p.forecourt.pavingBounds=[25,192,119,204];}],['detached shop',p=>{p.shop.newDetachedBuilding=true;}],['closed shop',p=>{p.shop.closedDoor=true;}]
])test('FAULT P04 '+name,()=>{const q=structuredClone(p4);mutate(q);assert.equal(patch04Checks(l,buildPatch04Model(g3,q),q).passed,false);});
test('M1.0 archive byte hashes unchanged',()=>{const manifest=read('data/m11b/batch01/frozen-files.json');for(const [p,hash]of Object.entries(manifest)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../../'+p,import.meta.url))).digest('hex'),hash,p);}});
test('input does not mutate frozen layout',()=>assert.deepEqual(source,read('data/m10/campus-layout.json')));
