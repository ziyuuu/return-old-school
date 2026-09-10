import * as THREE from 'three';
import {toiletParts} from './revision-r4-core.mjs';
/** Partition a solid prism by rectangular recesses, leaving real openings instead of painted doors. */
function carved(box:any,g:THREE.Group,x0:number,x1:number,z0:number,z1:number,y:number,h:number,cuts:number[][],row=0){
 const xs=[...new Set([x0,x1,...cuts.flatMap(c=>[Math.max(x0,c[0]),Math.min(x1,c[1])])])].sort((a,b)=>a-b);
 const zs=[...new Set([z0,z1,...cuts.flatMap(c=>[Math.max(z0,c[2]),Math.min(z1,c[3])])])].sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  const x=(xs[i]+xs[i-1])/2,z=(zs[j]+zs[j-1])/2;
  if(xs[i]<=xs[i-1]||zs[j]<=zs[j-1]||cuts.some(c=>x>c[0]&&x<c[1]&&z>c[2]&&z<c[3]))continue;
  box(g,xs[i]-xs[i-1],h,zs[j]-zs[j-1],x,y,z,row);
 }
}
export function r4Facility(f:any,g:THREE.Group,api:any):boolean{
 const {box,rect,layout}=api,[w,h,d]=f.size;
 if(f.id==='25'){
  const levels=new Map<number,THREE.Group>();
  for(const fl of layout.toilet25.floors){const group=new THREE.Group();group.name=`25-floor-group-${fl.level}`;group.userData.floor=fl.level;g.add(group);levels.set(fl.level,group);}
  for(const part of toiletParts(layout)){
   const parent=part.level?levels.get(part.level)!:g,[x,y,z]=part.center,[pw,ph,pd]=part.size;
   const row=['rail','rail-post','column','slab'].includes(part.role)?6:0;
   const m=box(parent,pw,ph,pd,x,y-ph/2,z,row);m.name=part.id;m.userData.floor=part.level;m.userData.role=part.role;m.userData.facility='25';
  }
  return true;
 }
 if(f.id==='15'){
  const story=h/f.floors,front=-d/2+2.1,back=d/2;
  for(let j=0;j<f.floors;j++){
   const y=j*story,cuts=[[-w/2,-w/2+3,front,1.2]];
   if(j===0)cuts.push([-1.4,1.4,front,front+2.4],[-1.4,1.4,back-2.4,back],[w/2-2.4,w/2,-1.2,1.2]);
   carved(box,g,-w/2,w/2,front,back,y,2.7,cuts);
   box(g,w,story-2.7,back-front,0,y+2.7,(front+back)/2,0);
   box(g,3,.14,back-front,-w/2+1.5,y-.1,(front+back)/2,6);
   box(g,w,.14,2.1,0,y-.1,-d/2+1.05,6);
   for(let k=0;k<=12;k++){
    const x=-w/2+.2+k*(w-.4)/12;
    if(j===0&&Math.abs(x)<1.6)continue;
    box(g,.3,story-.14,.3,x,y,-d/2+.17,6);
   }
   rect(g,-w/2,-d/2,w/2,d/2,y+story-.04,'#809890');
  }
  box(g,w,.24,d,0,h,0,6);return true;
 }
 if(['16','21'].includes(f.id)){
  const door=layout.entrances.find((e:any)=>e.id===(f.id==='16'?'16-east':'21-west'));
  const sign=door.facing[0],zz=door.position[2]-f.position[2],cuts=sign>0?[[w/2-2.4,w/2,zz-1.2,zz+1.2]]:[[-w/2,-w/2+2.4,zz-1.2,zz+1.2]];
  carved(box,g,-w/2,w/2,-d/2,d/2,0,2.7,cuts);
  box(g,w,h-2.7,d,0,2.7,0,0);
  for(let j=1;j<f.floors;j++)rect(g,-w/2,-d/2,w/2,d/2,j*h/f.floors,'#809890');
  box(g,w,.24,d,0,h,0,6);return true;
 }
 return false;
}
export function setToiletSection(roots:Map<string,THREE.Group>,level:number){
 const toilet=roots.get('25');if(!toilet)return;
 for(const child of toilet.children){
  if(child.userData.floor)child.visible=level===0||child.userData.floor<=level;
  else if(child.name==='25-continuous-roof')child.visible=level===0;
  else if(child.name.startsWith('25-gallery-column'))child.visible=level===0;
 }
}
