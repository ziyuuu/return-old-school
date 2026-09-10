import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {applyPatch02} from '../../../apps/campus/src/patch02-core.mjs';
import {buildPatch03Model} from '../../../apps/campus/src/patch03-core.mjs';
import {buildPatch04Model} from '../../../apps/campus/src/patch04-core.mjs';
import {applyB01R2,buildB01R2Model,b01R2Checks} from '../../../apps/campus/src/b01-r2-core.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),q=applyPatch02(read('data/m10/campus-layout.json'),read('data/m11a/terrain-input.json'),read('data/m11a/patch02/input.json')),p=read('data/m11b/batch01-r2/input.json'),e=applyB01R2(q.layout,q.terrain,read('data/m11a/patch04/input.json'),p),t=buildPatch04Model(buildPatch03Model(e.layout,e.spec,read('data/m11a/patch03/input.json')),e.site);
for(const [name,remove] of [
 ['corridor glazing removed',v=>v.role==='glazing'&&Math.abs(Math.abs(v.center[2])-1.4)<.01],
 ['second floor east exit opens onto void',v=>v.owner==='15'&&v.level===2&&v.role==='end-wall'&&v.center[0]>48]
])test('FAULT visual review: '+name,()=>{const m=buildB01R2Model(e.layout,t,p),ids=new Set(m.parts.filter(remove).map(v=>v.id));assert.ok(ids.size);m.parts=m.parts.filter(v=>!ids.has(v.id));m.worldParts=m.worldParts.filter(v=>!ids.has(v.id));assert.equal(b01R2Checks(q.layout,e.layout,m,p).passed,false);});
