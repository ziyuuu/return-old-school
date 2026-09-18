import * as THREE from 'three';
import { createPlanarStudentParts } from './student-planar-geometry.mjs';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2, clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
const V = a => new THREE.Vector3(...a);
const colourCache = new Map();
function rgb(value) { if (!colourCache.has(value)) colourCache.set(value,new THREE.Color(value).toArray()); return colourCache.get(value); }

// Rest coordinates are metres, +Y up, +Z forward. Face is fictional, not a portrait.
export const JOINTS = [
  ['pelvis',-1,[0,.905,0]], ['spine',0,[0,1.18,0]], ['head',1,[0,1.435,0]],
  ['left-upper-arm',1,[.233,1.335,0]], ['left-elbow',3,[.283,1.035,0]], ['left-hand',4,[.300,.790,.012]],
  ['right-upper-arm',1,[-.233,1.335,0]], ['right-elbow',6,[-.283,1.035,0]], ['right-hand',7,[-.300,.790,.012]],
  ['left-hip',0,[.105,.900,0]], ['left-knee',9,[.105,.475,.009]], ['left-ankle',10,[.105,.090,.024]],
  ['right-hip',0,[-.105,.900,0]], ['right-knee',12,[-.105,.475,.009]], ['right-ankle',13,[-.105,.090,.024]],
];

function weights(g, fn) {
  const a=g.attributes.position, si=[], sw=[];
  for(let i=0;i<a.count;i++) { const q=fn(a.getX(i),a.getY(i),a.getZ(i));
    si.push(q[0],q[2]??q[0],0,0); sw.push(q[1]??1,q[3]??0,0,0); }
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));
  g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
  return g;
}
function paint(g, fn) {
  const a=g.attributes.position, c=[];
  for(let i=0;i<a.count;i++) c.push(...rgb(typeof fn==='string'?fn:fn(a.getX(i),a.getY(i),a.getZ(i))));
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3)); return g;
}
/** R3 authored planar skin/garments; unchanged rig and displacement-driven gait. */
export function createStudentRig(materials, C) {
  const root=new THREE.Group();root.name='C2-student-avatar';root.userData={player:true,artVersion:'C2.R3',style:'authored-planar-matte'};
  const widthScale=.89; // H art-proportion correction; never changes the C1 capsule.
  const restJoints=JOINTS.map(([name,parent,p])=>[name,parent,[p[0]*widthScale,p[1],p[2]]]);
  const bones=JOINTS.map(([name])=>{const b=new THREE.Bone();b.name='C2-'+name;return b;});
  JOINTS.forEach(([,parent,p],i)=>{bones[i].position.copy(V(restJoints[i][2]));if(parent>=0){bones[i].position.sub(V(restJoints[parent][2]));bones[parent].add(bones[i]);}else root.add(bones[i]);});
  root.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);
  const bags={cloth:[],skin:[],hair:[],detail:[],shoe:[]}, parts=[];
  function add(name,g,material,color,bone=1,weightFn=null) {
    if(color)paint(g,color); weights(g,weightFn??(()=>[bone,1]));
    g.scale(bone===2?1:widthScale,1,1); // Face remains designed, clothing retains loose ease.
    // Attribute-complete and indexed, with no auxiliary flat boxes inside garments.
    if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
    if(g.index===null) {const packed=mergeVertices(g,1e-6);g.dispose();g=packed;}
    bags[material].push(g);parts.push({name,material,triangles:g.index.count/3,bone});
  }
  for (const part of createPlanarStudentParts(C)) {
    add(part.name, part.geometry, part.material, part.color, part.bone, part.weightFn);
  }
  const meshes=[];
  for(const [key,geoms] of Object.entries(bags)) {
    const g=mergeGeometries(geoms,false);geoms.forEach(x=>x.dispose());
    const mesh=new THREE.SkinnedMesh(g,materials[key]);mesh.name='C2-R3-'+key;
    mesh.userData={player:true,role:'student-'+key,surfaceResolved:true};mesh.castShadow=false;mesh.receiveShadow=true;
    // Only five dynamic draws; conservative local bound covers every supplied gait.
    mesh.frustumCulled=false;root.add(mesh);mesh.bind(skeleton);mesh.normalizeSkinWeights();meshes.push(mesh);
  }
  root.updateMatrixWorld(true);skeleton.update();
  const stats={triangles:meshes.reduce((s,m)=>s+m.geometry.index.count/3,0),vertices:meshes.reduce((s,m)=>s+m.geometry.attributes.position.count,0),
    geometryBytes:meshes.reduce((s,m)=>s+Object.values(m.geometry.attributes).reduce((a,b)=>a+b.array.byteLength,0)+m.geometry.index.array.byteLength,0),drawMeshes:meshes.length,bones:bones.length,parts};
  function pose(phase, speed=0, grounded=true, time=0, blend=1) {
    const run=clamp((speed-1.8)/1.5),moving=clamp(speed/.45)*blend;
    for(const b of bones)b.rotation.set(0,0,0);
    bones[0].position.y=.905-.042*moving;
    bones[1].rotation.x=(.012+run*.055)*moving;
    bones[1].rotation.y=Math.sin(phase)*.035*moving;
    bones[2].rotation.y=Math.sin(time*.6)*.025*(1-moving);
    bones[1].position.y=.275+Math.sin(time*2)*.0015*(1-moving);
    for(const s of[1,-1]){
      const t=((phase/TAU+(s>0?0:.5))%1+1)%1,hip=s>0?9:12,knee=hip+1,ankle=hip+2,
        upper=s>0?3:6,elbow=upper+1;
      const swing=t<.40,u=swing?t/.4:(t-.4)/.6,stride=(.215+run*.105)*moving;
      let z=swing?-stride+2*stride*smooth(0,1,u):stride*(1-2*u),lift=swing?Math.sin(Math.PI*u)*(.055+run*.08)*moving:0;
      if(!grounded){z=s*.04;lift=.10;}
      const dy=.81-.042*moving-lift,L1=.425,L2=.385,D=clamp(Math.hypot(dy,z),.1,L1+L2-.0001);
      const bend=Math.PI-Math.acos(clamp((L1*L1+L2*L2-D*D)/(2*L1*L2),-1,1));
      const a=Math.atan2(-z,dy)-Math.acos(clamp((L1*L1+D*D-L2*L2)/(2*L1*D),-1,1));
      bones[hip].rotation.x=a*moving; bones[knee].rotation.x=bend*moving;
      bones[ankle].rotation.x=-(a+bend)*moving+(swing?Math.sin(Math.PI*u)*.10:0)*moving;
      bones[upper].rotation.x=Math.sin(phase+(s>0?Math.PI:0))*(.30+run*.20)*moving;
      bones[upper].rotation.z=-s*(.015+.025*moving);
      bones[elbow].rotation.x=-.10-(.10+run*.7)*moving;
      if(!grounded){bones[hip].rotation.x=-.18; bones[knee].rotation.x=.35; bones[ankle].rotation.x=-.17;}
    }
    root.updateMatrixWorld(true);skeleton.update();
  }
  pose(0,0);
  function animationClips() {
    const saved=bones.map(b=>({q:b.quaternion.clone(),p:b.position.clone()}));
    const clips=[];
    for(const [name,speed,duration] of [['Idle',0,3],['Walk',1.65,1.0],['Run',3.4,.72]]) {
      const times=[],qs=bones.map(()=>[]),ps=bones.map(()=>[]),N=60;
      for(let i=0;i<=N;i++) {
        const t=duration*i/N;times.push(t);pose(TAU*i/N,speed,true,t,1);
        bones.forEach((b,j)=>{qs[j].push(...b.quaternion.toArray());ps[j].push(...b.position.toArray());});
      }
      const tracks=bones.flatMap((b,j)=>[new THREE.QuaternionKeyframeTrack(b.name+'.quaternion',times,qs[j]),new THREE.VectorKeyframeTrack(b.name+'.position',times,ps[j])]);
      clips.push(new THREE.AnimationClip(name,duration,tracks));
    }
    bones.forEach((b,i)=>{b.quaternion.copy(saved[i].q);b.position.copy(saved[i].p);});root.updateMatrixWorld(true);skeleton.update();return clips;
  }
  return {root,bones,skeleton,meshes,stats,pose,animationClips,
    dispose(){meshes.forEach(m=>m.geometry.dispose());skeleton.dispose();root.removeFromParent();}};
}
