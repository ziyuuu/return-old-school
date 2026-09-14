import * as THREE from 'three';
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
function transform(g, scale=[1,1,1], pos=[0,0,0], rot=[0,0,0]) {
  g.scale(...scale); g.rotateX(rot[0]); g.rotateY(rot[1]); g.rotateZ(rot[2]); g.translate(...pos); return g;
}
function ellipsoid(pos,radii,segments=32) { return transform(new THREE.SphereGeometry(1,segments,Math.floor(segments*.65)),radii,pos); }
function curve(points, radius, seg=24, radial=8) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)),seg,radius,radial,false);
}
function ringsGeometry(rings, segments=48, folds=0, head=false) {
  const p=[], uv=[], ix=[];
  for(let i=0;i<rings.length;i++) {
    const [y,rx,rz,cx=0,cz=0]=rings[i];
    for(let j=0;j<=segments;j++) {
      const t=j/segments*TAU, f=folds*(Math.sin(t*7+y*24)+.45*Math.sin(t*11-y*37));
      const x=cx+(rx+f)*Math.sin(t); let z=cz+(rz+f*.65)*Math.cos(t);
      if(head && Math.cos(t)>.35) {
        // Sculpted bridge, cheeks and chin are part of the head, not a stuck-on snout.
        z += .018*Math.exp(-Math.pow(x/.016,2)-Math.pow((y-1.528)/.029,2));
        z += .003*Math.exp(-Math.pow((Math.abs(x)-.064)/.020,2)-Math.pow((y-1.505)/.025,2));
      }
      p.push(x,y,z); uv.push(j/segments*4,(y-rings[0][0])*6);
      if(i<rings.length-1&&j<segments) {
        const a=i*(segments+1)+j,b=a+segments+1;
        ix.push(a,a+1,b,a+1,b+1,b);
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function sampleProfiles(profiles, step=.016, extra=[]) {
  // Smooth radii within each monotonic span. Include colour boundaries exactly.
  const ys=new Set([...profiles.map(p=>p[0]),...extra]);
  for(let y=profiles[0][0];y<profiles.at(-1)[0];y+=step)ys.add(+y.toFixed(6));
  return [...ys].sort((a,b)=>a-b).map(y=>{
    let k=0;while(k<profiles.length-2&&profiles[k+1][0]<y)k++;
    const a=profiles[k],b=profiles[k+1],t=clamp((y-a[0])/(b[0]-a[0]));
    return [y,...[1,2,3,4].map(i=>{
      const pa=profiles[Math.max(0,k-1)],pb=profiles[Math.min(profiles.length-1,k+2)],av=a[i]??0,bv=b[i]??0,h=b[0]-a[0];
      const d=(bv-av)/h, m0=(bv-(pa[i]??0))/(b[0]-pa[0]),m1=((pb[i]??0)-av)/(pb[0]-a[0]);
      const limit=m=>d===0||m*d<=0?0:Math.sign(d)*Math.min(Math.abs(m),Math.abs(d)*2);
      return (2*t*t*t-3*t*t+1)*av+(t*t*t-2*t*t+t)*h*limit(m0)+(-2*t*t*t+3*t*t)*bv+(t*t*t-t*t)*h*limit(m1);
    })];
  });
}
function banded(g, palette, top=1.224, bottom=1.153, seam=1.189) {
  // Face-local constant colours avoid colour interpolation across uniform panels.
  const out=g.toNonIndexed(),p=out.attributes.position,c=[];
  for(let i=0;i<p.count;i+=3){const y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;
    const col=y<bottom||y>=top?palette.blue:y>=seam?palette.white:palette.red;
    for(let j=0;j<3;j++)c.push(...rgb(col));}
  out.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.dispose();return out;
}
function patch(points, depth=.002) {
  const area=THREE.ShapeUtils.area(points.map(p=>new THREE.Vector2(p[0],p[1])));
  if(area<0)points=[...points].reverse();
  const tris=THREE.ShapeUtils.triangulateShape(points.map(p=>new THREE.Vector2(p[0],p[1])),[]);
  const pos=points.flat(),uv=points.flatMap(([x,y])=>[x*4,y*4]),ix=[],n=points.length;
  pos.push(...points.flatMap(([x,y,z])=>[x,y,z-depth]));uv.push(...uv);
  for(const [a,b,c]of tris)ix.push(a,b,c,c+n,b+n,a+n);
  for(let a=0;a<n;a++){const b=(a+1)%n;ix.push(a,a+n,b,a+n,b+n,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function eyePatch(cx, y, z, width, height) {
  const points=[], n=32;
  for(let i=0;i<n;i++) {const a=i/n*TAU;points.push([cx+Math.cos(a)*width,y+Math.sin(a)*height*(.8+.2*Math.abs(Math.sin(a))),z-.11*Math.abs(Math.cos(a))*width]);}
  return patch(points,.0012);
}

/** Continuous skin + deliberately sewn garment sections, merged into five surfaces. */
export function createStudentRig(materials, C) {
  const root=new THREE.Group();root.name='C2-student-avatar';root.userData={player:true,artVersion:'C2.R2'};
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
  const bands=[1.153,1.189,1.224];
  const torsoProfiles=[ [.850,.197,.112],[.875,.203,.116],[.925,.207,.132],[1.02,.207,.131],
    [1.12,.219,.137],[1.224,.224,.137],[1.285,.219,.122],[1.334,.191,.100],[1.368,.131,.074],[1.382,.062,.053] ];
  const torso=banded(ringsGeometry(sampleProfiles(torsoProfiles,.013,bands),48,.0018),C);
  add('blue-jacket-with-white-over-red-sewn-bands',torso,'cloth',null,1,(_x,y)=>{const t=smooth(.89,1.07,y);return[0,1-t,1,t];});
  add('blue-ribbed-waist',ringsGeometry(sampleProfiles([[.842,.195,.110],[.857,.200,.114],[.877,.203,.116]],.007),48,.0005),'cloth',C.blueFold,0);
  add('neck',ellipsoid([0,1.416,.003],[.044,.069,.043]),'skin',C.skin,2);
  // Folded white collar: open at the throat, wraps back, with separate tipped leaves.
  const collarR=[];for(let i=0;i<=8;i++){const y=1.371+i*.005;collarR.push([y,.071-i*.0018,.059-i*.0007,0,0]);}
  const coll=ringsGeometry(collarR,48);add('white-back-collar',coll,'cloth',C.white,1);
  for(const s of[-1,1]){
    const pts=[[s*.010,1.393,.057],[s*.055,1.415,.042],[s*.103,1.363,.082],[s*.068,1.326,.126],[s*.020,1.364,.081]];
    const g=patch(s>0?pts:[...pts].reverse(),.004);
    // Soft edge geometry follows the folded collar, not a white cube at the neck.
    add('white-folded-collar-'+s,g,'cloth',C.white,1);
    add('collar-seam-'+s,curve([pts[1],pts[2],pts[3]],.0009,24,6),'detail','#dfded5',1);
  }
  add('red-short-placket',patch([[-.010,1.377,.066],[.010,1.377,.066],[.009,1.281,.128],[-.009,1.281,.128]],.003),'cloth',C.red,1);
  add('zipper-seam',curve([[0,.887,.118],[0,1.11,.142],[0,1.28,.133],[0,1.374,.068]],.0012,38,6),'detail','#9fa5ab',1);
  add('zipper-pull',ellipsoid([0,1.324,.118],[.0035,.009,.002],20),'detail','#ccd0d1',1);
  for(const s of[-1,1])add('side-pocket-seam-'+s,curve([[s*.172,.925,.082],[s*.158,.984,.108],[s*.152,1.025,.113]],.0011,28,6),'cloth',C.blueFold,1);
  // White YL on wearer's left chest. No back emblem, rectangle decal, or unrelated logo.
  const letterY=[[-.016,.040],[-.006,.040],[-.001,.026],[.006,.040],[.017,.040],[.005,.019],[.005,0],[-.005,0],[-.005,.019]];
  const letterL=[[.009,.027],[.018,.027],[.018,.006],[.033,.006],[.033,0],[.009,0]];
  for(const [name,ps]of[['Y',letterY],['L',letterL]]){
    add('YL-left-chest-'+name,patch(ps.map(([x,y])=>[x+.111,y+1.252,.123]),.001),'cloth',C.white,1);
  }
  // Puffy but sewn sleeves: a single smooth weighted surface per arm, not capsules.
  for(const s of[1,-1]){
    const upper=s>0?3:6,elbow=upper+1,hand=upper+2;
    const profiles=[[.789,.042,.044,s*.300,.012],[.807,.054,.052,s*.300,.008],[.846,.069,.062,s*.303,.005],
      [.907,.077,.071,s*.298,0],[1.00,.082,.076,s*.288,0],[1.07,.087,.080,s*.277,-.004],
      [1.16,.092,.084,s*.263,-.005],[1.224,.094,.084,s*.252,0],[1.285,.086,.081,s*.241,0],
      [1.335,.064,.061,s*.230,0],[1.356,.018,.018,s*.225,0]];
    add('continuous-sleeve-'+s,banded(ringsGeometry(sampleProfiles(profiles,.012,bands),40,.0016),C),'cloth',null,upper,(_x,y)=>{
      const t=smooth(1.004,1.077,y);return[elbow,1-t,upper,t];});
    add('cuff-'+s,ringsGeometry(sampleProfiles([[.774,.040,.041,s*.3,.012],[.798,.046,.044,s*.3,.012],[.807,.054,.05,s*.3,.008]],.006),40,.0006),'cloth',C.blueFold,elbow);
    add('palm-'+s,ellipsoid([s*.302,.737,.020],[.031,.047,.019]),'skin',C.skin,hand);
    for(let f=0;f<4;f++){
      const x=s*(.281+f*.014),length=[.049,.058,.055,.044][f];
      add('finger-'+s+'-'+f,curve([[x,.728,.022],[x+s*.002,.708,.030],[x+s*.001,.728-length,.034]],.0075,12,8),'skin',C.skin,hand);
      add('fingertip-'+s+'-'+f,ellipsoid([x+s*.001,.728-length,.034],[.0075,.008,.0075],16),'skin',C.skin,hand);
    }
    add('thumb-'+s,curve([[s*.282,.756,.022],[s*.268,.736,.037],[s*.270,.718,.043]],.010,12,10),'skin',C.skin,hand);
    // Loose blue trousers; no unverified white/red side stripes.
    const hip=s>0?9:12,knee=hip+1,ankle=hip+2;
    const pr=[[.081,.075,.073,s*.105,.024],[.105,.088,.085,s*.105,.009],[.130,.099,.090,s*.105,.001],
      [.175,.090,.083,s*.106,-.003],[.30,.089,.082,s*.106,-.002],[.43,.091,.088,s*.105,.002],
      [.49,.094,.094,s*.105,.005],[.58,.100,.098,s*.105,.001],[.72,.108,.108,s*.105,0],
      [.83,.104,.102,s*.101,0],[.907,.101,.089,s*.096,0],[.927,.089,.081,s*.093,0]];
    add('continuous-loose-trouser-'+s,ringsGeometry(sampleProfiles(pr,.016),40,.0021),'cloth',C.blue,hip,(_x,y)=>{
      const t=smooth(.43,.54,y);return[knee,1-t,hip,t];});
    // Sculpted low sneakers with separate sole, toe cap, tongue and laces.
    add('sneaker-upper-'+s,ellipsoid([s*.105,.065,.064],[.073,.046,.132],40),'shoe',C.sole,ankle);
    add('sneaker-sole-'+s,ellipsoid([s*.105,.025,.063],[.077,.022,.137],40),'shoe',C.white,ankle);
    add('sneaker-toe-'+s,ellipsoid([s*.105,.054,.148],[.065,.022,.043],32),'shoe','#e8e7e0',ankle);
    add('sneaker-tongue-'+s,ellipsoid([s*.105,.112,.076],[.039,.010,.057],28),'shoe',C.shoe,ankle);
    for(const q of[-1,1])add('sneaker-side-'+s+'-'+q,ellipsoid([s*.105+q*.068,.059,.038],[.012,.021,.081],28),'shoe',C.shoe,ankle);
    for(let l=0;l<4;l++)add('shoelace-'+s+'-'+l,curve([[s*.105-.026,.117,.041+l*.02],[s*.105,.119,.049+l*.02],[s*.105+.026,.117,.041+l*.02]],.002,12,6),'detail',C.white,ankle);
  }
  // A designed face with a tapered jaw; no blank sphere or deep uncanny eye sockets.
  const hp=[[1.438,.025,.032,0,.015],[1.449,.049,.050,0,.014],[1.474,.079,.068,0,.008],
    [1.510,.095,.081,0,.001],[1.548,.101,.087,0,0],[1.592,.103,.092,0,-.002],
    [1.636,.092,.088,0,-.007],[1.672,.056,.060,0,-.008],[1.689,.005,.006,0,-.008]];
  add('sculpted-head',ringsGeometry(sampleProfiles(hp,.007),64,0,true),'skin',C.skin,2);
  for(const s of[-1,1]){
    add('ear-'+s,ellipsoid([s*.101,1.535,-.003],[.017,.028,.014],28),'skin',C.skin,2);
    add('ear-fold-'+s,ellipsoid([s*.113,1.535,.005],[.004,.015,.006],20),'skin',C.skinShade,2);
    add('almond-eye-'+s,eyePatch(s*.043,1.551,.083,.019,.0084),'detail',C.eyeWhite,2);
    add('iris-'+s,ellipsoid([s*.043,1.551,.086],[.0068,.0075,.0024],24),'detail',C.eye,2);
    add('pupil-'+s,ellipsoid([s*.043,1.551,.088],[.0038,.005,.001],20),'detail','#211c18',2);
    add('eye-glint-'+s,ellipsoid([s*.043-.002,1.554,.089],[.0015,.0017,.0007],12),'detail',C.eyeWhite,2);
    add('upper-eyelid-'+s,curve([[s*.024,1.551,.083],[s*.043,1.559,.084],[s*.062,1.551,.079]],.0015,20,6),'detail',C.eye,2);
    add('eyebrow-'+s,curve([[s*.022,1.582,.088],[s*.041,1.585,.088],[s*.063,1.580,.080]],.0024,20,8),'hair',C.hair,2);
  }
  add('soft-mouth',curve([[-.017,1.488,.079],[0,1.485,.081],[.017,1.488,.079]],.0013,24,6),'detail',C.lip,2);
  // Crown cap plus swept, rounded hair locks: no pin spikes or helmet hemisphere.
  const pos=[],uv=[],ind=[], around=64,down=22;
  const hairPoint=(theta,phi,lift=0)=>new THREE.Vector3((.113+lift)*Math.sin(phi)*Math.sin(theta),1.597+(.121+lift)*Math.cos(phi),-.009+(.108+lift)*Math.sin(phi)*Math.cos(theta));
  const endPhi=a=>1.81-.35*Math.cos(a);
  for(let i=0;i<=down;i++)for(let j=0;j<=around;j++){
    const theta=j/around*TAU,phi=.004+(endPhi(theta)-.004)*i/down;
    pos.push(...hairPoint(theta,phi).toArray());uv.push(j/around,i/down);
    if(i<down&&j<around){const a=i*(around+1)+j,b=a+around+1;ind.push(a,b,a+1,b,b+1,a+1);}
  }
  const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));cap.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));cap.setIndex(ind);cap.computeVertexNormals();
  add('hair-underlayer',cap,'hair',C.hair,2);
  function lock(a,start,end,width,lift,seed){
    const verts=[],tex=[],idx=[],rings=16,sides=8;
    for(let i=0;i<=rings;i++){
      const t=i/rings,ph=start+(end-start)*t,th=a+.22*Math.sin(t*Math.PI/2)+.04*Math.sin(seed),
        centre=hairPoint(th,ph,lift*Math.sin(Math.PI*t));
      const normal=centre.clone().sub(V([0,1.597,-.009])).normalize(),side=new THREE.Vector3(Math.cos(th),0,-Math.sin(th));
      const w=Math.max(.00055,width*Math.pow(Math.sin(Math.PI*(t*.92+.04)),.7));
      for(let j=0;j<=sides;j++){
        const ang=j/sides*TAU,p=centre.clone().addScaledVector(side,Math.cos(ang)*w).addScaledVector(normal,Math.sin(ang)*w*.25);
        verts.push(...p.toArray());tex.push(j/sides,t);
        if(i<rings&&j<sides){const k=i*(sides+1)+j,q=k+sides+1;idx.push(k,k+1,q,k+1,q+1,q);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(tex,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  for(let layer=0;layer<3;layer++)for(let j=0;j<14;j++){
    const a=j/14*TAU+layer*.29,st=.08+layer*.34,en=endPhi(a)+.14*Math.sin(j*3.1)+.12;
    add('swept-hair-'+layer+'-'+j,lock(a,st,en,.027-layer*.001,.010+layer*.002,j),'hair',j%5===0?C.hairLight:C.hair,2);
  }
  const meshes=[];
  for(const [key,geoms] of Object.entries(bags)) {
    const g=mergeGeometries(geoms,false);geoms.forEach(x=>x.dispose());
    const mesh=new THREE.SkinnedMesh(g,materials[key]);mesh.name='C2-R2-'+key;
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
