import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLayout } from '../../apps/campus/src/layout-core.mjs';
const layout=JSON.parse(readFileSync(new URL('../../data/m10/campus-layout.json',import.meta.url),'utf8'));
for(const [name,id,mutate] of [
 ['stone on old side','R3_STONE_LEFT',l=>l.facilities.find(f=>f.id==='27').position[0]=17],
 ['side gate at field rear','R3_SIDE_GATE_AT_ENTRANCE',l=>l.facilities.find(f=>f.id==='02').position=[129,0,184]],
 ['shortcut reinserted','R3_NO_ENTRY_SHORTCUT',l=>l.navigation.edges.push(['junction-gym','side-branch'])],
 ['geometric path crossing main','R3_SIDE_PAVING_SEPARATE',l=>l.navigation.nodes['side-entry'][0]=0],
 ['longya shift reverted','R3_LONGYA_SHIFTED_LEFT',l=>l.facilities.find(f=>f.id==='17').position[0]=165],
 ['road misses front door','R3_LONGYA_DOOR_ALIGNMENT',l=>l.navigation.nodes['longya-entry'][0]+=2],
 ['small residential envelope','R3_FAMILY_AREA_ENLARGED',l=>l.facilities.find(f=>f.id==='20').size=[54,23,58]],
 ['old large residential gap','R3_FAMILY_CANTEEN_GAP',l=>l.facilities.find(f=>f.id==='20').position[2]-=30],
 ['shrunken actual residential mass','R3_CONTEXT_REAL_MASS_REACHES_CANTEEN',l=>l.contextBlocks.forEach(b=>b.localPosition[2]*=.3)],
 ['one metre music gap','R3_GYM_MUSIC_ABUT',l=>l.facilities.find(f=>f.id==='24').position[2]+=1],
 ['music intersects gym','R3_GYM_MUSIC_ABUT',l=>l.facilities.find(f=>f.id==='24').position[2]-=1],
 ['external link restored','R3_NO_EXTERNAL_GYM_LINK',l=>l.buildingLinks.push({id:'03-24-LINK',path:[],width:2.4})],
 ['shared doorway drifts','R3_SHARED_PORTALS',l=>l.entrances.find(e=>e.id==='24-gym').position[0]+=1]
])test('R3 regression: '+name,()=>{const l=structuredClone(layout);mutate(l);assert.equal(checkLayout(l).results.find(r=>r.id===id).passed,false);});
test('R3/R4 preserve 22 unaffected facility transforms relative to R2',()=>{
 const old=JSON.parse(readFileSync(new URL('../../data/m10/baseline-r2-input.json',import.meta.url),'utf8'));
 const rows=old.facilityRows.map(r=>Object.fromEntries(old.facilityColumns.map((c,i)=>[c,r[i]])));
 const allowed=new Set(['02','17','20','24','27','10']);let count=0;
 for(const f of layout.facilities){if(allowed.has(f.id))continue;const r=rows.find(r=>r.id===f.id);assert.deepEqual(f.position,r.position,f.id);assert.deepEqual(f.size,r.size,f.id);count++;}
 assert.equal(count,22);assert.deepEqual(layout.origin,old.origin);assert.deepEqual(layout.axes,old.axes);
});
