/** R4 geometry is authored from explicit parameters. All dimensions remain H, not surveyed. */
import {edgeWidth} from './revision-core.mjs';
const EPS=1e-6;
export function toiletParts(l){
 const f=l.facilities.find(v=>v.id==='25'),t=l.toilet25,[w,h,d]=f.size,parts=[];
 const front=w/2-t.galleryWidth,back=-w/2,outer=w/2,wall=t.wallThickness;
 const add=(id,level,role,center,size)=>parts.push({id,owner:'25',level,role,center,size});
 const beam=(id,level,y,a,b)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1];
  add(id,level,'rail',[(a[0]+b[0])/2,y,(a[1]+b[1])/2],[Math.abs(dx)||.055,.06,Math.abs(dz)||.055]);
 };
 for(const fl of t.floors){
  const j=fl.level,y=fl.elevation,top=y+t.slabTopOffset,height=h/f.floors-t.slabTopOffset-.16,prefix=`25-L${j}`;
  if(fl.hasFullSlab)add(prefix+'-full-floor',j,'slab',[0,top-t.slabThickness/2,0],[w,t.slabThickness,d]);
  // One uninterrupted rectangular body, normal internal partition, and no central exterior slot.
  add(prefix+'-back',j,'wall',[back+wall/2,top+height/2,0],[wall,height,d]);
  for(const sign of [-1,1])add(prefix+'-end-'+sign,j,'wall',[(back+front)/2,top+height/2,sign*(d/2-wall/2)],[front-back,height,wall]);
  add(prefix+'-partition',j,'partition',[(back+front)/2,top+height/2,0],[front-back,height,wall]);
  const doors=[...fl.doorOffsetsZ].sort((a,b)=>a-b),dw=t.doorWidth,dh=t.doorHeight;
  let at=-d/2;
  for(const [i,z] of doors.entries()){
   const end=z-dw/2;
   if(end>at)add(prefix+'-front-'+i,j,'wall',[front-wall/2,top+height/2,(at+end)/2],[wall,height,end-at]);
   add(prefix+'-lintel-'+i,j,'lintel',[front-wall/2,top+dh+(height-dh)/2,z],[wall,height-dh,dw]);
   at=z+dw/2;
  }
  if(at<d/2)add(prefix+'-front-last',j,'wall',[front-wall/2,top+height/2,(at+d/2)/2],[wall,height,d/2-at]);
  // Front gallery balustrade has one central bridge opening, plus rails at each end.
  const rx=outer-.06,zEnd=d/2-.07,halfGap=t.bridgeOpeningWidth/2;
  const segments=[[[rx,-zEnd],[rx,-halfGap]],[[rx,halfGap],[rx,zEnd]],[[front,-zEnd],[rx,-zEnd]],[[front,zEnd],[rx,zEnd]]];
  segments.forEach(([a,b],i)=>{
   for(const rh of [.46,t.railHeight])beam(prefix+'-rail-'+i+'-'+rh,j,top+rh,a,b);
   const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/t.railPostSpacing);
   for(let k=0;k<=n;k++)add(prefix+'-post-'+i+'-'+k,j,'rail-post',[a[0]+(b[0]-a[0])*k/n,top+t.railHeight/2,a[1]+(b[1]-a[1])*k/n],[.055,t.railHeight,.055]);
  });
 }
 add('25-continuous-roof',0,'roof',[0,h+.11,0],[w,.22,d]);
 // Slim front columns carry the stacked galleries, leaving the bridge opening clear.
 for(const sign of [-1,1])add('25-gallery-column-'+sign,0,'column',[outer-.15,h/2,sign*(d/2-.3)],[.18,h,.18]);
 return parts;
}
export function toiletRoutes(l){
 const f=l.facilities.find(v=>v.id==='25'),t=l.toilet25,[x,,z]=f.position,[w,,d]=f.size,front=x+w/2-t.galleryWidth,galleryX=front+t.galleryWidth/2;
 return t.floors.flatMap(fl=>fl.doorOffsetsZ.map((offset,i)=>({id:`25-L${fl.level}-door-${i?'B':'A'}`,level:fl.level,
  points:[[x+w/2+1,fl.elevation, z],[galleryX,fl.elevation,z],[galleryX,fl.elevation,z+offset],[front-.8,fl.elevation,z+offset]],
  portal:[front,fl.elevation,z+offset],width:t.doorWidth,fullSlab:fl.hasFullSlab})));
}
export function r4Checks(l,{bounds,overlap}){
 const out=[],put=(id,ok,detail)=>out.push({id,passed:Boolean(ok),detail}),f=id=>l.facilities.find(v=>v.id===id),n=l.navigation,t=l.toilet25;
 const edges=new Set(n.edges.flatMap(([a,b])=>[a+'|'+b,b+'|'+a]));
 put('R4_ROSTRUM_UP',f('10').position[2]<132&&f('10').position[0]===19,'10 up only (-Z); numeric22m move is H');
 put('R4_FAMILY_UP_RIGHT',f('20').position[0]>166&&f('20').position[2]<82,'20 +X/-Z while keeping R3 size');
 put('R4_FAMILY_SIZE_KEPT',f('20').size[0]===60&&f('20').size[2]===104,'R3 larger mass retained');
 const b=bounds(f('20')),ground=l.ground.bounds;
 put('R4_FAMILY_WITHIN_GROUND',b.minX>=ground[0]&&b.maxX<=ground[2]&&b.minZ>=ground[1]&&b.maxZ<=ground[3],'No hidden cropping of shifted family block');
 put('R4_NO_GREEN_DETOUR',['garden-turn','garden-east','garden-entry'].every(k=>!n.nodes[k]&&n.edges.every(e=>!e.includes(k))),'Delete obsolete green path, do not invent a replacement garden entrance');
 const trunk=n.mainRoadChain||[];
 put('R4_MAIN_ROAD_WIDTH',trunk.length===6&&trunk.slice(1).every((b,i)=>edges.has(trunk[i]+'|'+b)&&edgeWidth(l,trunk[i],b)===7),'Explicit7m along entire09, including office→forecourt');
 for(const [id,chain] of [['16',['junction-museum','museum-entry']],['15',['forecourt-15','main-front','teaching-entry']],['21',['main-east','east-cross','info-west']]])
  put('R4_BLACK_ROUTE_'+id,chain.every((p,i)=>n.nodes[p]&&(!i||edges.has(chain[i-1]+'|'+p))),'Black annotation short connection '+id);
 put('R4_TOILET_CONTINUOUS',t.continuousBody===true&&t.galleryWidth>1.5,'Continuous body behind front gallery, no central slot');
 put('R4_TOILET_EVERY_FLOOR',t.floors.length===f('15').floors&&t.floors.every((v,i)=>v.level===i+1&&Math.abs(v.elevation-(l.connections[i]?.y ?? Infinity))<EPS&&v.hasFullSlab===true),'Complete slab on every level, matching the bridge datum');
 put('R4_TOILET_END_DOORS',t.floors.every(v=>v.doorOffsetsZ.length===2&&v.doorOffsetsZ[0]<-f('25').size[2]*.25&&v.doorOffsetsZ[1]>f('25').size[2]*.25&&Math.max(...v.doorOffsetsZ.map(Math.abs))+t.doorWidth/2<f('25').size[2]/2-t.wallThickness),'Two separated end doors on the same east-facing wall, not centre doors');
 const doors=l.entrances.filter(e=>e.kind==='toilet-door');
 put('R4_TOILET_DOOR_RECORDS',doors.length===t.floors.length*2&&doors.every(e=>e.facing[0]===1&&e.facilityId==='25'&&Math.abs(e.position[0]-(f('25').position[0]+f('25').size[0]/2-t.galleryWidth))<EPS),'8 east-facing end door records, 25-link is only a gallery arrival');
 put('R4_GALLERY_OPEN_AT_BRIDGE',t.bridgeOpeningWidth>=Math.max(...l.connections.map(v=>v.width))&&t.bridgeOpeningWidth<t.floors[0].doorOffsetsZ[1]*2,'Front railing opening admits bridge width but end sections remain railed');
 put('R4_FULL_SLAB_BOXES',toiletParts(l).filter(p=>p.role==='slab').length===f('15').floors&&toiletParts(l).filter(p=>p.role==='slab').every(p=>p.size[0]===f('25').size[0]&&p.size[2]===f('25').size[2]&&p.size[1]>.1),'Each slab is one full rectangle, not a narrow centre ribbon');
 put('R4_RAILS_ON_EACH_FLOOR',t.floors.every(fl=>toiletParts(l).some(p=>p.level===fl.level&&p.role==='rail')&&toiletParts(l).some(p=>p.level===fl.level&&p.role==='rail-post')),'Actual rail meshes, not annotation lines');
 return out;
}
