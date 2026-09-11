import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../apps/campus/node_modules/three/build/three.module.js';
import {transform} from '../../apps/campus/node_modules/esbuild/lib/main.js';
import {pathToFileURL} from 'node:url';
import {context,root} from './context.mjs';
const c=context(),{base,layout,model,p}=c,results=[];
const check=(id,run)=>{try{run();results.push({id,passed:true});console.log('PASS',id);}catch(e){results.push({id,passed:false,error:e.message});console.error('FAIL',id,e.message);}};
check('inherited footprints, roads and B01 approval',()=>{
 assert.deepEqual(layout.facilities.map(f=>[f.id,f.position,f.size?.[0],f.size?.[2]]),base.facilities.map(f=>[f.id,f.position,f.size?.[0],f.size?.[2]]));
 assert.deepEqual(layout.navigation,base.navigation);
 assert.match(fs.readFileSync(root+'data/m11b/batch01/acceptance.json','utf8'),/ALUMNI_APPROVED/);
});
check('current terrain datums and photographic layer order',()=>{
 assert.equal(model.anchors['03'].floor,3.6);assert.equal(model.anchors['24'].floor,3.6);
 assert.equal(model.summary.galleryAbsolute,7.84);assert.equal(model.summary.gymTopAbsolute,22.8);
 assert.ok(p.gym.lobby.frontV<p.gym.glazing.frontV&&p.gym.sign.v<p.gym.glazing.frontV);
 assert.ok(p.gym.sign.bottom>p.gym.glazing.head&&p.gym.height>p.gym.sign.top);
});
check('four storeys, direct contact, unsupported shared portal retired',()=>{
 assert.equal(p.music.floors,4);assert.equal(model.parts.filter(q=>q.owner==='24'&&q.role==='floor').length,3);
 assert.equal(layout.facilities.find(f=>f.id==='24').position[2]-6,layout.facilities.find(f=>f.id==='03').position[2]+21);
 assert.ok(!layout.entrances.some(e=>['03-music','24-gym'].includes(e.id)));
 assert.equal(layout.buildingContacts[0].portalOpen,false);
});
check('left flight, all treads and matched upper landing',()=>{
 const parts=model.parts.filter(q=>q.role==='spectator-step');assert.equal(parts.length,28);
 assert.ok(model.world(p.gym.stair.u,0,0)[2]>layout.facilities.find(f=>f.id==='03').position[2]);
 assert.ok(p.gym.galleryRise/p.gym.stair.steps<=.18);
 assert.ok(Math.abs(parts.at(-1).center[1]+parts.at(-1).size[1]/2-4.24)<1e-8);
});
check('finite nonzero geometry and replacement dispatch',()=>{
 for(const q of model.parts){for(const n of (q.size??q.center??q.points?.flat()??q.a))assert.ok(Number.isFinite(n),q.id);if(q.size)assert.ok(q.size.every(x=>x>0),q.id);}
 const s=fs.readFileSync(root+'apps/campus/src/main.ts','utf8');assert.ok(s.indexOf('if(buildB02Facility(')>=0);assert.ok(s.includes("from './b01-shutter-fix.mjs'"));
});
// Use the same actual Three.js adapter, not just metadata, to test the four apertures.
const src=fs.readFileSync(root+'apps/campus/src/batch02-scene.ts','utf8');
const js=(await transform(src,{loader:'ts',format:'esm'})).code.replace('"three"',JSON.stringify(pathToFileURL(root+'apps/campus/node_modules/three/build/three.module.js').href));
const {buildB02Facility}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const scene=new THREE.Scene(),mats=Array.from({length:20},()=>new THREE.MeshBasicMaterial());
for(const id of ['03','24']){const f=layout.facilities.find(f=>f.id===id),g=new THREE.Group();g.position.set(f.position[0],model.anchors[id].floor,f.position[2]);buildB02Facility(f,g,{mats},model);scene.add(g);}scene.updateMatrixWorld(true);
const ray=(a,b)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),len=A.distanceTo(B);return new THREE.Raycaster(A,B.sub(A).normalize(),.002,len-.002).intersectObjects(scene.children,true);};
check('real apertures through all four wall planes',()=>{
 for(const d of model.portals){const n=new THREE.Vector3(...d.normal).normalize(),side=new THREE.Vector3(n.z,0,-n.x);
  for(const off of [-d.width/2+.18,0,d.width/2-.18])for(const h of [.25,1.5,d.height-.2]){
   const c=new THREE.Vector3(...d.center).addScaledVector(side,off);c.y=d.floor+h;
   const hit=ray(c.clone().addScaledVector(n,.5).toArray(),c.clone().addScaledVector(n,-.5).toArray());assert.equal(hit.length,0,d.id+' '+off+' '+h+' '+hit.map(x=>x.object.name));
  }
 }
});
check('shared wall actually blocks crossing at ground level',()=>assert.ok(ray([-60,4.9,65.3],[-60,4.9,66.7]).length));
check('minimum lobbies have standing clearance',()=>{
 for(const a of [[-30,3.85,45],[-68,3.85,75.5]])assert.equal(ray(a,[a[0],a[1]+2.2,a[2]]).length,0);
});
const report={version:p.version,passed:results.every(r=>r.passed),results,note:'8 targeted groups; real scene-wide route support and occlusion are checked separately in Chromium.'};
fs.mkdirSync(root+'qa/m11b-b02',{recursive:true});fs.writeFileSync(root+'qa/m11b-b02/geometry-report.json',JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
