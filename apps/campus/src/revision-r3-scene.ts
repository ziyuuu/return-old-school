import * as THREE from 'three';
/** Only the four R3 change sets. No unrelated campus blockout is replaced. */
export function r3Facility(f:any,g:THREE.Group,api:any):boolean {
 const {box,rect,layout}=api,[w,h,d]=f.size;
 if(f.id==='20'){
  for(const part of layout.contextBlocks){
   const [x,y,z]=part.localPosition,[pw,ph,pd]=part.size;
   const m=box(g,pw,ph,pd,x,y,z,5);m.name=part.id;m.userData.hypothesis=true;
  }
  return true;
 }
 if(f.id==='17'){
  const door=layout.entrances.find((v:any)=>v.id==='17-front');
  const dw=3,dd=2.4,dx=door.position[0]-f.position[0];
  box(g,w,3.1,d-dd,0,0,dd/2,0);
  for(const [a,b] of [[-w/2,dx-dw/2],[dx+dw/2,w/2]])box(g,b-a,3.1,dd,(a+b)/2,0,-d/2+dd/2,0);
  box(g,w,h-3.1,d,0,3.1,0,0);
  for(let i=1;i<f.floors;i++)rect(g,-w/2,-d/2,w/2,d/2,h*i/f.floors,'#809890');
  box(g,w,.24,d,0,h,0,6);return true;
 }
 if(f.id==='24'){
  const contact=layout.buildingContacts[0],frontDoor=layout.entrances.find((e:any)=>e.id==='24-front');
  const wall=.4,groundH=3.1;
  for(const sign of [-1,1])box(g,wall,groundH,d,sign*(w/2-wall/2),0,0,0);
  for(const [z,doorX,doorW] of [[-d/2+wall/2,contact.portalCenter[0]-f.position[0],contact.portalWidth],[d/2-wall/2,frontDoor.position[0]-f.position[0],2.4]]){
   for(const [a,b] of [[-w/2,doorX-doorW/2],[doorX+doorW/2,w/2]])if(b>a)box(g,b-a,groundH,wall,(a+b)/2,0,z,0);
  }
  box(g,w,.14,d,0,-.12,0,6);box(g,w,h-groundH,d,0,groundH,0,0);
  for(let i=1;i<f.floors;i++)rect(g,-w/2,-d/2,w/2,d/2,h*i/f.floors,'#809890');
  box(g,w,.24,d,0,h,0,6);return true;
 }
 return false;
}
export function buildR3Thresholds(layout:any,{surfaces,box}:any){
 for(const p of layout.thresholds){
  const [a,b]=[p.start,p.end],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  const m=box(surfaces,p.width,.045,length,(a[0]+b[0])/2,.02,(a[2]+b[2])/2,2);
  m.rotation.y=Math.atan2(dx,dz);m.name=p.id;m.castShadow=false;
 }
}
