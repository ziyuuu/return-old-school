import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkLayout} from '../../apps/campus/src/layout-core.mjs';
import {toiletParts,toiletRoutes} from '../../apps/campus/src/revision-r4-core.mjs';
const layout=JSON.parse(readFileSync(new URL('../../data/m10/campus-layout.json',import.meta.url),'utf8'));
for(const [name,id,mutate] of [
 ['rostrum down again','R4_ROSTRUM_UP',l=>l.facilities.find(f=>f.id==='10').position[2]=132],
 ['family stays at R3','R4_FAMILY_UP_RIGHT',l=>l.facilities.find(f=>f.id==='20').position=[166,0,82]],
 ['family exceeds boundary','R4_FAMILY_WITHIN_GROUND',l=>l.facilities.find(f=>f.id==='20').position[0]+=30],
 ['green road returns','R4_NO_GREEN_DETOUR',l=>{l.navigation.nodes['garden-turn']=[156,0,239];l.navigation.edges.push(['east-bottom','garden-turn']);}],
 ['red-box road narrows','R4_MAIN_ROAD_WIDTH',l=>l.navigation.edgeWidths['junction-office|junction-museum']=3],
 ['16 spur missing','R4_BLACK_ROUTE_16',l=>l.navigation.edges=l.navigation.edges.filter(e=>!e.includes('museum-entry'))],
 ['front approach missing','R4_BLACK_ROUTE_15',l=>l.navigation.edges=l.navigation.edges.filter(e=>!e.includes('teaching-entry'))],
 ['21 spur missing','R4_BLACK_ROUTE_21',l=>l.navigation.edges=l.navigation.edges.filter(e=>!e.includes('info-west'))],
 ['split toilet returns','R4_TOILET_CONTINUOUS',l=>l.toilet25.continuousBody=false],
 ['third floor slab missing','R4_TOILET_EVERY_FLOOR',l=>l.toilet25.floors[2].hasFullSlab=false],
 ['doors moved to centre','R4_TOILET_END_DOORS',l=>l.toilet25.floors[1].doorOffsetsZ=[-.5,.5]],
 ['bridge railing sealed','R4_GALLERY_OPEN_AT_BRIDGE',l=>l.toilet25.bridgeOpeningWidth=0],
 ['door faces away','R4_TOILET_DOOR_RECORDS',l=>l.entrances.find(e=>e.id==='25-A-L02').facing=[-1,0,0]]
])test('R4 rejects '+name,()=>{const l=structuredClone(layout);mutate(l);assert.equal(checkLayout(l).results.find(v=>v.id===id).passed,false);});
test('R4 only changes10/20 footprints relative to verified R3',()=>{
 const old=JSON.parse(readFileSync(new URL('../../data/m10/baseline-r3-input.json',import.meta.url),'utf8'));let count=0;
 for(const f of layout.facilities){if(['10','20'].includes(f.id))continue;const r=old.facilityRows.find(r=>r[0]===f.id);assert.deepEqual(f.position,r[2],f.id);assert.deepEqual(f.size,r[3],f.id);count++;}
 assert.equal(count,26);assert.deepEqual(layout.origin,old.origin);assert.deepEqual(layout.axes,old.axes);
});
test('every toilet floor full slab and two branching routes',()=>{
 const parts=toiletParts(layout),routes=toiletRoutes(layout);assert.equal(routes.length,8);
 for(let level=1;level<=4;level++){assert.equal(parts.filter(p=>p.role==='slab'&&p.level===level).length,1);assert.equal(routes.filter(p=>p.level===level).length,2);}
});
