import * as THREE from 'three';
import {galleryParts, gymLocal} from './patch02-core.mjs';
/** Parametric architectural working shell; all exact dimensions are H, not measured. */
export function buildPatch02Gym(f:any,g:THREE.Group,api:any,p:any):boolean{
 if(f.id!=='03')return false;
 const {box,mats}=api,h=p.gym.galleryHeight,slabTop=.04,parts:THREE.Object3D[]=[];
 const B=(id:string,w:number,hh:number,d:number,u:number,y:number,v:number,row=0,role='shell')=>{
  const m=box(g,d,hh,w,21-v,y,-u,row);m.name='P02-GYM-'+id;m.userData={facility:'03',role,hypothesis:true};parts.push(m);return m;
 };
 function prism(id:string,pts:number[][],offset:number[],row=0,role='upper-shell'){
  const a=pts.map(([u,y,v])=>gymLocal(u,y,v)),b=pts.map(([u,y,v])=>gymLocal(u+offset[0],y+offset[1],v+offset[2]));
  const vv=[...a,...b].map(v=>new THREE.Vector3(...v as [number,number,number])),n=pts.length,centre=new THREE.Vector3();vv.forEach(v=>centre.add(v));centre.multiplyScalar(1/vv.length);
  const faces:number[][]=[];for(let i=1;i<n-1;i++){faces.push([0,i,i+1]);faces.push([n,n+i,n+i+1]);}
  for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([i,j,n+j],[i,n+j,n+i]);}
  const pos:number[]=[];
  for(let ids of faces){const [x,y,z]=ids.map(i=>vv[i]),normal=y.clone().sub(x).cross(z.clone().sub(x)),mid=x.clone().add(y).add(z).multiplyScalar(1/3).sub(centre);if(normal.dot(mid)<0)ids=[ids[0],ids[2],ids[1]];ids.forEach(i=>pos.push(...vv[i].toArray()));}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,mats[row]);m.name='P02-GYM-'+id;m.userData={facility:'03',role,hypothesis:true};m.castShadow=m.receiveShadow=true;g.add(m);parts.push(m);return m;
 }
 const rail=(id:string,a:number[],b:number[],bottom=.0)=>{
  const A=new THREE.Vector3(...gymLocal(a[0],a[1],a[2]) as [number,number,number]),Z=new THREE.Vector3(...gymLocal(b[0],b[1],b[2]) as [number,number,number]),len=A.distanceTo(Z);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,len,6),mats[6]);m.position.copy(A).add(Z).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),Z.sub(A).normalize());m.name='P02-GYM-'+id;m.castShadow=m.receiveShadow=true;m.userData={facility:'03',role:'rail'};g.add(m);parts.push(m);
 };
 B('base-slab',42,.18,42,0,-.14,21,6,'floor');
 // Doorway faces the main road (+X), with a shallow vestibule and full-width low stair apron.
 for(const [u,w]of [[-10,12],[10,12]]){
  B('lobby-wall-'+u,w,3.96,.4,u,.04,2,0,'lower-wall');
  B('lobby-window-'+u,w-1.4,2.6,.08,u,.5,1.76,4,'window');
  for(let j=-2;j<=2;j++)B('lobby-mullion-'+u+'-'+j,.12,2.6,.1,u+j*1.7,.5,1.70,6,'mullion');
 }
 B('door-lintel',7,0.96,.4,0,3.04,2,0,'door-lintel');
 for(const u of [-3.55,3.55])B('door-jamb-'+u,.16,3.0,.2,u,.04,1.75,6,'door-frame');
 B('door-head',7.2,.14,.2,0,3.0,1.75,6,'door-frame');
 // Continuous front balcony canopy. Stair bay stays open above the rising flight.
 B('gallery-front-deck',42,.26,1.35,0,h-.22,.675,6,'gallery-floor');
 B('gallery-main-deck',37,.26,4.85,2.5,h-.22,3.775,6,'gallery-floor');
 B('gallery-fascia',42,.42,.35,0,h-.38,.1,6,'fascia');
 B('gallery-parapet',42,p.gym.parapetHeight,.24,0,h+.04,.16,6,'parapet');
 for(const u of [-14,-6,6,14])B('lobby-column-'+u,.55,h,.6,u,.04,.9,6,'column');
 // Recessed upper fenestration, concrete frame and opaque spandrel.
 B('clerestory-glass',32,3.2,.12,0,p.gym.windowSill,5.25,4,'window');
 B('clerestory-spandrel',33,p.gym.signBottom-p.gym.windowHead,.4,0,p.gym.windowHead,5.35,0,'spandrel');
 for(const u of [-14,-7,0,7,14])B('upper-column-'+u,.42,p.gym.signBottom-h,.48,u,h,4.9,6,'column');
 for(let u=-15;u<=15;u+=2.5)B('clerestory-mullion-'+u,.10,3.2,.18,u,p.gym.windowSill,5.14,6,'mullion');
 B('window-transom',32,.12,.18,0,6.65,5.14,6,'mullion');
 B('upper-front-panel',30,p.gym.signTop-p.gym.signBottom,.3,0,p.gym.signBottom,.45,0,'upper-shell');
 // Tall side folds run backwards in depth; they are solid shells, not a single triangle.
 for(const sign of [-1,1]){
  const u=sign*20.72;
  prism('fold-side-'+sign,[[u,10.4,0],[u,p.gym.height,0],[u,p.gym.roofRearHeight,41.8],[u,4.8,41.8]],[sign*.28,0,0]);
  prism('fold-front-'+sign,[[sign*15,10.4,.4],[sign*15,18,.4],[sign*20.72,19.2,0],[sign*20.72,5.4,0]],[0,0,.28]);
 }
 const us=[-20.72,-15,15,20.72],ys=[19.2,18,18,19.2];
 for(let i=0;i<3;i++)prism('roof-'+i,[[us[i],ys[i],.4],[us[i+1],ys[i+1],.4],[us[i+1],11.8,41.8],[us[i],11.8,41.8]],[0,-.28,0],0);
 // Lower side wall openings are not confused with the former wrong north entrance.
 B('north-lower-wall',.4,5.1,41.8,20.8,.04,20.9,0,'lower-wall');
 B('rear-wall',41.6,11.5,.4,0,.04,41.6,0,'lower-wall');
 const contact=api.layout.buildingContacts[0],centreV=21-(contact.portalCenter[0]-f.position[0]);
 const lo=centreV-contact.portalWidth/2,hi=centreV+contact.portalWidth/2;
 for(const [a,b]of [[0,lo],[hi,41.8]])B('south-wall-'+a,.4,4.2,b-a,-20.8,.04,(a+b)/2,0,'lower-wall');
 B('contact-lintel',.4,1.1,contact.portalWidth,-20.8,3.14,centreV,0,'contact-lintel');
 // Left exterior flight (viewer looking from +X). Every riser is a solid supported box.
 const s=p.gym.spectatorStair,end=s.startV+s.steps*s.tread;
 for(const st of galleryParts(p))B(st.id.replace('P02-GYM-',''),st.width,st.top-st.base,st.depth,st.u,st.base,st.v,6,'spectator-step');
 B('spectator-bottom-landing',s.width,.16,s.startV,s.u,-.12,s.startV/2,6,'floor');
 B('spectator-top-landing',5.5,.24,2.4,-17.0,h-.20,end+1.2,6,'gallery-floor');
 B('spectator-aisle',4.4,.24,23.5,-14.4,h-.20,23.55,6,'gallery-floor');
 B('gallery-side-connection',4.4,.24,6,-14.4,h-.20,9,6,'gallery-floor');
 for(const u of [s.u-s.width/2,s.u+s.width/2]){
  rail('stair-handrail-'+u,[u,1.04,s.startV],[u,h+1.04,end]);
  for(let i=0;i<=s.steps;i+=4){const y=.04+h*i/s.steps,v=s.startV+i*s.tread;B('stair-post-'+u+'-'+i,.075,1,.075,u,y,v,6,'rail-post');}
 }
 // Outer landing rail; leave the inward passage from the stair to the viewing aisle open.
 rail('landing-outer-rail',[-19.72,h+1.04,end],[-19.72,h+1.04,end+2.4]);
 rail('landing-end-rail',[-19.72,h+1.04,end+2.4],[-16.6,h+1.04,end+2.4]);
 for(let v=15;v<=35;v+=2.5){B('view-post-'+v,.07,1,.07,-12.15,h+.04,v,6,'rail-post');}
 rail('view-handrail',[-12.15,h+1.04,15],[-12.15,h+1.04,35]);
 // An open frame marks the transition onto the viewing level; no invisible solid blocker.
 for(const v of [end-.1,end+2.3])B('view-entry-jamb-'+v,.16,2.7,.16,-14.2,h+.04,v,6,'gallery-door');
 B('view-entry-head',.16,.18,2.55,-14.2,h+2.62,end+1.1,6,'gallery-door');
 // Minimal playing floor only; interior seating/structure remain M1.2 work.
 B('court-surface',25,.025,28,2,.045,24,1,'floor');
 for(const u of [-10.5,14.5])B('court-edge-u'+u,.07,.025,28,u,.071,24,8,'court-mark');
 for(const v of [10,24,38])B('court-edge-v'+v,25,.025,.07,2,.071,v,8,'court-mark');
 // Five-ring emblem: geometric rings, colours from dedicated rows in the shared ramp LUT.
 for(const [u,y,row]of [[-4.3,14.2,9],[0,14.2,10],[4.3,14.2,11],[-2.15,12.65,12],[2.15,12.65,13]]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,.09,8,48),mats[row]??mats[6]);ring.rotation.y=Math.PI/2;ring.position.set(20.76,y,-u);ring.name='P02-GYM-RING-'+row;ring.castShadow=ring.receiveShadow=true;ring.userData={facility:'03',role:'emblem'};g.add(ring);parts.push(ring);
 }
 g.userData.patch02=true;g.userData.heightH=p.gym.height;g.userData.frontNormal=[1,0,0];
 return true;
}
export function setGymCutaway(roots:Map<string,THREE.Group>,cut:boolean){
 roots.get('03')?.traverse(o=>{if(o.userData.role==='upper-shell')o.visible=!cut;});
}
