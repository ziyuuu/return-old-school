import * as THREE from 'three';
import {structureParts} from './revision-core.mjs';
/** Geometry adapters for the user-corrected R2 blockout. Not final construction drawings. */
export function revisedFacility(f:any,g:THREE.Group,api:any):boolean {
 const {box,mesh,line,rect,mats,layout}=api;
 const [w,h,d]=f.size;
 if(f.kind==='side-gate'){
  box(g,.3,h,.4,-w/2,0,0,6);box(g,.3,h,.4,w/2,0,0,6);
  box(g,w,.2,.4,0,h,0,6);return true;
 }
 if(f.kind==='teaching'){
  const story=h/f.floors,front=-d/2+2.1,back=d/2,side=3,opening=2.4;
  for(let j=0;j<f.floors;j++){
   const y=j*story;
   // An actual end-wall recess joins the midpoint bridge to the open front corridor.
   if(j===0){
    // Preserve a ground-level rear door recess, rather than a route into a solid wall.
    const coreMin=-w/2+side,coreMax=w/2,doorW=2.8,doorD=2.4;
    box(g,coreMax-coreMin,2.7,back-front-doorD,(coreMin+coreMax)/2,y,(front+back-doorD)/2,0);
    box(g,-doorW/2-coreMin,2.7,doorD,(coreMin-doorW/2)/2,y,back-doorD/2,0);
    box(g,coreMax-doorW/2,2.7,doorD,(coreMax+doorW/2)/2,y,back-doorD/2,0);
   }else box(g,w-side,2.7,back-front,side/2,y,(front+back)/2,0);
   box(g,side,2.7,back-opening/2,-w/2+side/2,y,(back+opening/2)/2,0);
   box(g,.24,2.7,-opening/2-front,-w/2+.12,y,(front-opening/2)/2,0);
   box(g,w,story-2.7,back-front,0,y+2.7,(front+back)/2,0);
   // Both corridors meet in the side recess. Floors have no ground obstruction.
   box(g,side,.14,back-front,-w/2+side/2,y-.1,(front+back)/2,6);
   box(g,w,.14,2.1,0,y-.1,-d/2+1.05,6);
   for(let k=0;k<=12;k++)box(g,.3,story-.14,.3,-w/2+.2+k*(w-.4)/12,y,-d/2+.17,6);
   rect(g,-w/2,-d/2,w/2,d/2,y+story-.04,'#809890');
  }
  box(g,w,.24,d,0,h,0,6);
  return true;
 }
 if(f.id==='18'||f.kind==='music'){
  const doorW=f.id==='18'?2.8:2.4,doorD=2.4;
  if(f.id==='18'){
   box(g,w,2.7,d-doorD,0,0,doorD/2,0);
   for(const sign of [-1,1])box(g,(w-doorW)/2,2.7,doorD,sign*(w+doorW)/4,0,-d/2+doorD/2,0);
  }else{
   box(g,w-doorD,2.7,d,-doorD/2,0,0,0);
   for(const sign of [-1,1])box(g,doorD,2.7,(d-doorW)/2,w/2-doorD/2,0,sign*(d+doorW)/4,0);
  }
  box(g,w,h-2.7,d,0,2.7,0,0);
  for(let j=1;j<f.floors;j++)rect(g,-w/2,-d/2,w/2,d/2,h*j/f.floors,'#809890');
  box(g,w,.24,d,0,h,0,6);return true;
 }
 if(f.kind==='gym'){
  const eave=h*.65,wall=.5,front=-d/2+2.2,back=d/2;
  box(g,w,.16,d,0,-.12,0,6);
  // Front platform lies within the enlarged envelope, with a true recessed central entrance.
  for(const sign of [-1,1])box(g,(w-3)/2,3.1,wall,sign*(w+3)/4,0,front,0);
  box(g,w,eave-3.1,wall,0,3.1,front,0);
  // A dark, recessed window band is geometric and obtains colour from the shared LUT.
  box(g,w*.65,2.8,.12,0,4.6,front-.27,5);
  for(let i=-4;i<=4;i++)box(g,.15,2.8,.18,i*w*.071,4.6,front-.3,6);
  const musicDoor=layout.buildingLinks[0].path[0][2]-f.position[2],doorW=2.4;
  for(const sign of [-1,1]){
   const x=sign*(w/2-wall/2);
   if(sign<0){
    box(g,wall,3.1,musicDoor-doorW/2-front,x,0,(front+musicDoor-doorW/2)/2,0);
    box(g,wall,3.1,back-musicDoor-doorW/2,x,0,(back+musicDoor+doorW/2)/2,0);
    box(g,wall,eave-3.1,back-front,x,3.1,(back+front)/2,0);
   }else box(g,wall,eave,back-front,x,0,(back+front)/2,0);
   box(g,.08,2.5,(back-front)*.72,x-sign*.02,4.6,(back+front)/2,5);
   for(let i=1;i<9;i++)box(g,.2,2.5,.18,x+sign*.2,4.6,front+(back-front)*i/9,6);
  }
  box(g,w,eave,.5,0,0,back-.25,0);
  const cap=new THREE.Shape();cap.moveTo(-w/2,eave);cap.lineTo(-w*.29,h);cap.lineTo(w*.29,h);cap.lineTo(w/2,eave);cap.closePath();
  for(const z of [front,back-.5])mesh(new THREE.ExtrudeGeometry(cap,{depth:.5,bevelEnabled:false}),mats[0],g,[0,0,z]);
  // Three folded roof slabs with thickness; not a single frontal triangle hiding a box.
  const xs=[-w/2,-w*.29,w*.29,w/2],ys=[eave,h,h,eave];
  for(let i=0;i<3;i++){
   const a=xs[i],b=xs[i+1],ya=ys[i],yb=ys[i+1],th=.25;
   const vertices=[a,ya,front,b,yb,front,b,yb,back,a,ya,back,a,ya-th,front,b,yb-th,front,b,yb-th,back,a,ya-th,back];
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
   geo.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5]);geo.computeVertexNormals();
   mesh(geo,mats[6],g);
  }
  // Recessed threshold / platform visible from the entrance and the side.
  box(g,w,.18,2.2,0,-.10,-d/2+1.1,6);
  return true;
 }
 return false;
}
export function buildRevisionParts(layout:any,api:any){
 const {volumes,surfaces,box,line,rect,roots,pickables}=api;
 const structures=new THREE.Group();structures.name='R2-structures';volumes.add(structures);
 const roofs=new THREE.Group();roofs.name='R2-toggleable-roofs';structures.add(roofs);
 for(const part of structureParts(layout)){
  const group=(part.role==='roof'||part.role==='beam')?roofs:structures;
  const [w,h,d]=part.size,[x,y,z]=part.center;
  const m=box(group,w,h,d,x,y-h/2,z,part.role==='roof'?0:6);m.name=part.id;
  m.userData.facility=part.owner;m.userData.structuralRole=part.role;pickables.push(m);
 }
 // Upper rails only: the first-floor intersection is left unobstructed.
 for(const b of layout.connections)if(b.level>1)for(const sign of [-1,1]){
  const z=b.z+sign*b.width/2;
  line([[b.xStart,b.y+1,z],[b.xEnd,b.y+1,z]],structures,'#748e86');
 }
 const rear=layout.sports.rearTrack,[x,,z]=rear.position,[w,,d]=rear.size;
 const track=box(surfaces,w,.10,d,x,.065,z,3);track.name=rear.id;track.userData.facility='08';pickables.push(track);
 const pit=layout.facilities.find((f:any)=>f.id==='23');
 const [px,,pz]=pit.position,[pw,,pd]=pit.size;
 for(let j=1;j<rear.lanes;j++){
  const zz=z-d/2+d*j/rear.lanes;
  if(zz>=pz-pd/2&&zz<=pz+pd/2){line([[x-w/2,.185,zz],[px-pw/2-.1,.185,zz]],surfaces,'#eadfc9');line([[px+pw/2+.1,.185,zz],[x+w/2,.185,zz]],surfaces,'#eadfc9');}
  else line([[x-w/2,.185,zz],[x+w/2,.185,zz]],surfaces,'#eadfc9');
 }
 // The unique facility23 surface must sit above the runway; no old sandpit remains.
 roots.get('23').position.y=.08;
 rect(surfaces,px-pw/2,pz-pd/2,px+pw/2,pz+pd/2,.23,'#d4bc80');
 // Short thresholds reach the door recesses without drawing routes through closed building mass.
 for(const [cx,a,b,width] of [[69,231,232.8,2.8],[75,243.6,245.5,2.8]])box(surfaces,width,.045,b-a,cx,.02,(a+b)/2,2);
 return {structures,roofs};
}
