import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {context,read} from '../../../tools/m11b/r3/model.mjs';
import {b01R3Checks,hitPart,hasR3Floor,arcZ} from '../../../apps/campus/src/b01-r3-core.mjs';
const C=context(),{before,layout,model,p,terrain,baseTerrain}=C;
for(const q of C.report.results)test(q.id,()=>assert.equal(q.passed,true,JSON.stringify(q)));
test('R3 old protected files retain their exact hashes',()=>{for(const [path,sha]of Object.entries(read('data/m11b/batch01-r2/protected-hashes.json')))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,path);});
test('R3 only two entrance records change; every old non-east entrance preserved',()=>{for(const e of before.entrances.filter(e=>e.id!=='15-east'))assert.deepEqual(layout.entrances.find(v=>v.id===e.id),e);assert.deepEqual(layout.thresholds,before.thresholds);assert.deepEqual(layout.connections,before.connections);});
test('R3 protected terrain is identical outside two stated apron envelopes',()=>{let n=0;for(let x=-100;x<205;x+=2)for(let z=0;z<290;z+=2){const weight=terrain.r3ApronWeight(x,z);if(!weight){assert.equal(terrain.groundHeight(x,z),baseTerrain.groundHeight(x,z));n++;}}assert.ok(n>21000);assert.deepEqual(terrain.anchors,baseTerrain.anchors);});
test('R3 aprons terminate at three actual risers rather than a raised floating porch',()=>{for(const A of model.access){const [x,,z]=A.stepProbes[0],toeZ=224+A.stepStart;assert.ok(Math.abs(terrain.groundHeight(x,toeZ)+.04-(model.mainFloor+.04-p.entrances.totalRise))<1e-7);const last=A.stepProbes.at(-1);assert.ok(Math.abs(last[1]-(model.mainFloor+.04))<1e-7);for(const pt of A.stepProbes)for(const d of [-1.4,0,1.4])assert.ok(hasR3Floor(model,pt[0]+d,pt[1],pt[2]));}});
test('R3 shallow arc symmetry, apex and fixed central axis',()=>{assert.equal(arcZ(0,p),-8.8);assert.ok(Math.abs(arcZ(4.4,p)-arcZ(0,p)-.35)<1e-7);for(let x=0;x<=4.4;x+=.1)assert.equal(arcZ(x,p),arcZ(-x,p));});
test('R3 original fifth floor / rear terrace / toilet semantic spaces retained',()=>{assert.equal(model.spaces.filter(v=>v.kind==='corridor').length,5);assert.equal(model.spaces.filter(v=>v.level>=4&&v.row==='rear').length,0);assert.equal(model.routes.length,10);assert.equal(model.parts.filter(v=>v.owner==='25'&&v.role==='slab').length,5);});
function recenter(m){const origin=id=>id==='bridge'?[0,m.toiletFloor,0]:[layout.facilities.find(v=>v.id===id).position[0],id==='15'?m.mainFloor:m.toiletFloor,layout.facilities.find(v=>v.id===id).position[2]];m.worldParts=m.parts.map(q=>({...q,center:q.center.map((x,i)=>x+origin(q.owner)[i])}));}
function fault(name,change){test('FAULT R3 '+name,()=>{const m={...structuredClone(model.exportData()),p:C.r2,r3:structuredClone(p)},l=structuredClone(layout);change(m,l);recenter(m);assert.equal(b01R3Checks(before,l,m,m.r3).passed,false);});}
for(const [i,side]of ['west','east'].entries()){
 fault(side+' rotates door back onto mountain wall',m=>m.access[i].normal=[1,0,0]);
 fault(side+' collapses entrance recess',m=>m.access[i].door[2]=215);
 fault(side+' body wall stops at porch',m=>{for(const q of m.parts.filter(q=>q.id.startsWith(`R3-${side}-forward-wall-`)))q.size[2]=1;});
 fault(side+' upper continuation wall missing',m=>m.parts=m.parts.filter(q=>q.id!==`R3-${side}-forward-wall-L5`));
 fault(side+' canopy removed',m=>m.parts=m.parts.filter(q=>q.role!=='porch-roof'||Math.sign(q.center[0])!==(i?1:-1)));
 fault(side+' one front post removed',m=>{const k=m.parts.findIndex(q=>q.role==='porch-post'&&Math.sign(q.center[0])===(i?1:-1));m.parts.splice(k,1);});
 fault(side+' step floats',m=>m.parts.find(q=>q.id===`R3-${side}-step-2`).center[1]+=.2);
 fault(side+' step removed',m=>m.parts=m.parts.filter(q=>q.id!==`R3-${side}-step-1`));
 fault(side+' closed door',m=>m.parts.push({id:'bad-door',owner:'15',level:1,shape:'box',role:'wall',center:[p.entrances.doorCentersX[i],1.5,-5],size:[2.5,3,.3]}));
 fault(side+' upper notch filled by old rectangular slab',m=>m.parts.push({id:'bad-upper-slab',owner:'15',level:3,shape:'box',role:'slab',center:[p.entrances.doorCentersX[i],7.64-.09,-6],size:[3.5,.18,2]}));
}
fault('central arc made flat in parameter',m=>m.r3.central.sagitta=0);
fault('central arc floor actually flattened',m=>{for(const q of m.parts.filter(q=>q.id.startsWith('R3-curve-floor')))for(const v of q.polygon)if(v[1]+q.center[2]<-7.5)v[1]=-8.8-q.center[2];});
fault('arc walls deleted',m=>m.parts=m.parts.filter(q=>q.role!=='central-curved-wall'));
fault('old flat facade restored',m=>m.parts.push({id:'bad-flat-front',owner:'15',level:2,shape:'box',role:'central-functional-front',center:[0,5,-8.8],size:[8.8,3.8,.24]}));
fault('central entrance blocked',m=>m.parts.push({id:'bad-central-door',owner:'15',level:1,shape:'box',role:'wall',center:[0,1.5,-8.7],size:[3,3,.24]}));
fault('fifth main level deleted',m=>m.parts=m.parts.filter(q=>q.id!=='R3-main-floor-5'));
fault('fourth terrace lost',m=>m.parts=m.parts.filter(q=>q.id!=='R3-main-floor-4'));
fault('terrace roofed over',m=>m.parts.push({id:'badroof',owner:'15',level:5,shape:'box',role:'slab',center:[18,15.15,4],size:[4,.18,5]}));
fault('toilet fifth floor lost',m=>m.parts=m.parts.filter(q=>!(q.owner==='25'&&q.role==='slab'&&q.level===5)));
fault('fifth bridge raised',m=>m.parts.find(q=>q.id==='15-25-L05').center[1]+=.25);
fault('bridge opening sealed',m=>m.parts.push({id:'badbridge',owner:'bridge',level:3,shape:'box',role:'wall',center:[-7,8.5,224],size:[.3,2.7,2.2]}));
fault('axis drifts',m=>m.axis[1].x-=1);
fault('unrelated library moved',(_,l)=>l.facilities.find(f=>f.id==='18').position[0]+=1);
fault('road graph changed',(_,l)=>l.navigation.edges.pop());
fault('old east door wall reopened',m=>m.parts=m.parts.filter(q=>q.id!=='R3-retired-east-door-closure'));
