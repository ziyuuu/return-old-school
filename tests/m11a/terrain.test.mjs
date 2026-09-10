import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {buildTerrainModel,terrainChecks} from '../../apps/campus/src/terrain-core.mjs';
const root=new URL('../../',import.meta.url),load=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const l=load('data/m10/campus-layout.json'),s=load('data/m11a/terrain-input.json'),ref=load('data/m11a/baseline-r4-layout.json'),model=buildTerrainModel(l,s);
for(const c of terrainChecks(l,s,ref).results)test(c.id,()=>assert.equal(c.passed,true,JSON.stringify(c.detail)));
for(const[p,h]of Object.entries(load('data/m11a/baseline-lock.json').file_sha256))test('frozen file unchanged '+p,()=>assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex'),h));
function bad(name,mutate,id){test('reject regression '+name,()=>{const a=structuredClone(l),b=structuredClone(s);mutate(a,b);assert.equal(terrainChecks(a,b,ref).results.find(x=>x.id===id).passed,false);});}
bad('moved building',a=>a.facilities.find(x=>x.id==='17').position[0]+=1,'BASELINE_XZ_TOPOLOGY');
bad('narrowed trunk',a=>a.navigation.edgeWidths['junction-museum|forecourt']=3,'BASELINE_XZ_TOPOLOGY');
bad('removed edge',a=>a.navigation.edges.pop(),'BASELINE_XZ_TOPOLOGY');
bad('steep grade',(a,b)=>b.gradeKnots=[[0,0],[10,50],[291,50]],'ROAD_GRADE_gate_junction-gym');
bad('longya invalid step count',(a,b)=>b.stairs.find(x=>x.facilityId==='17').steps=0,'STEP_GEOMETRY_ST-LONGYA');
bad('library incorrect rise',(a,b)=>b.stairs.find(x=>x.facilityId==='18').rise=.15,'STEP_RISE_ST-LIBRARY');
for(const[id,p]of Object.entries(l.navigation.nodes))test('node height consistent '+id,()=>{const values=model.profiles.filter(q=>q.from===id||q.to===id).map(q=>q.from===id?q.samples[0].y:q.samples.at(-1).y);assert.ok(values.length>0);assert.ok(Math.max(...values)-Math.min(...values)<1e-7);});
for(const st of model.stairs)test('solid steps / support '+st.id,()=>{const parts=model.stairParts(st);assert.equal(parts.length,st.steps);assert.ok(Math.abs(parts.at(-1).top-(model.anchors[st.facilityId].floor+s.roadSurfaceOffset))<1e-8);for(const p of parts)assert.ok(p.size.every(n=>n>0));});
test('no mutation by builders',()=>{const before=JSON.stringify(l);buildTerrainModel(l,s).exportData();assert.equal(JSON.stringify(l),before);});
test('bridge/toilet floor datum matches after lift',()=>{for(const c of l.connections){const t=l.toilet25.floors.find(x=>x.level===c.level);assert.ok(Math.abs(c.y+model.anchors['15'].floor-t.elevation-model.anchors['25'].floor)<1e-8);}});
test('sports pads no slope at corners',()=>{for(const id of ['05','06','08']){const f=l.facilities.find(x=>x.id===id),[x,,z]=f.position,[w,,d]=f.size;for(const dx of [-w/2,0,w/2])for(const dz of [-d/2,0,d/2])assert.ok(Math.abs(model.groundHeight(x+dx,z+dz))<1e-7);}});

bad('flat entrance contradicts source',(a,b)=>b.gradeKnots=[[0,0],[80,0],[160,.15],[214,.45],[291,.45]],'ENTRY_ASCENDS');
