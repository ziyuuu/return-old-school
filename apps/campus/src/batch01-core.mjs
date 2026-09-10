import {toiletParts} from './revision-r4-core.mjs';
import {structureParts} from './revision-core.mjs';
import {horizontalSnapshot} from './terrain-core.mjs';
/** Explicit shell parts. The rendering adapter and geometry tests consume this same model. */
export function buildBatch01Model(layout,terrain,p){
 const parts=[],fac=id=>layout.facilities.find(f=>f.id===id),main=fac('15'),wc=fac('25'),m=p.main;
 let serial=0;
 function add(owner,level,role,size,center,id){if(size.some(v=>v<=1e-6))return;const q={id:id??`B01-${owner}-L${level}-${role}-${serial++}`,owner,level,role,size,center,shape:'box'};parts.push(q);return q;}
 function wall(owner,level,axis,at,u0,u1,y0,y1,cuts=[],role='wall',th=m.wallThickness){
  const us=[...new Set([u0,u1,...cuts.flatMap(c=>[Math.max(u0,c[0]),Math.min(u1,c[1])]).filter(v=>v>=u0&&v<=u1)])].sort((a,b)=>a-b);
  const ys=[...new Set([y0,y1,...cuts.flatMap(c=>[Math.max(y0,c[2]),Math.min(y1,c[3])]).filter(v=>v>=y0&&v<=y1)])].sort((a,b)=>a-b);
  for(let i=1;i<us.length;i++)for(let j=1;j<ys.length;j++){
   const u=(us[i-1]+us[i])/2,y=(ys[j-1]+ys[j])/2;if(cuts.some(c=>u>c[0]&&u<c[1]&&y>c[2]&&y<c[3]))continue;
   add(owner,level,role,axis==='z'?[us[i]-us[i-1],ys[j]-ys[j-1],th]:[th,ys[j]-ys[j-1],us[i]-us[i-1]],axis==='z'?[u,y,at]:[at,y,u]);
  }
 }
 function window(owner,level,axis,at,u,y,w,h){
  const a=(role,W,H,D,U,Y,A)=>add(owner,level,role,axis==='z'?[W,H,D]:[D,H,W],axis==='z'?[U,Y,A]:[A,Y,U]);
  const f=m.frameWidth;
  a('glazing',w-2*f,h-2*f,.035,u,y+h/2,at+.025);
  for(const s of [-1,1]){a('frame',f,h,.16,u+s*(w-f)/2,y+h/2,at);a('frame',w,f,.16,u,y+(s>0?h-f/2:f/2),at);}
  a('frame',f,h,.13,u,y+h/2,at);a('frame',w,.045,.13,u,y+h*.67,at);
  a('sill',w+.16,.10,.36,u,y-.05,at-.045);
 }
 const [w,h,d]=main.size,story=m.storyHeight,front=-d/2,inner=front+m.corridorWidth,half=m.centralWidth/2;
 const ranges=[[-w/2+.5,-half-.45],[half+.45,w/2-.5]],bayCenters=[];
 for(const [a,b]of ranges)for(let i=0;i<m.bayCount/2;i++)bayCenters.push(a+(b-a)*(i+.5)/(m.bayCount/2));
 for(let j=0;j<m.floorCount;j++){
  const l=j+1,fy=j*story+.04,ceiling=(j+1)*story-.14,rear=l===m.terrace.level?m.terrace.rearWallZ:d/2-.12;
  add('15',l,'slab',[w,m.slabThickness,d],[0,fy-m.slabThickness/2,0],`B01-15-L${l}-full-floor`);
  // Internal front circulation strip; the photograph-facing outer wall has paired windows.
  const classroomCuts=[];
  for(const x of bayCenters){const dw=1.0,doorx=x-1.9;classroomCuts.push([doorx-dw/2,doorx+dw/2,fy,fy+2.5]);classroomCuts.push([x-.2,x+2.4,fy+m.windowSill,fy+m.windowSill+m.windowHeight]);window('15',l,'z',inner+.10,x+1.1,fy+m.windowSill,2.6,m.windowHeight);}
  // Keep the west return open from the bridge midpoint into the long front gallery.
  const cuts=[...classroomCuts,[-w/2,-w/2+m.westReturnWidth,fy,fy+2.7],[-m.frontDoorWidth/2,m.frontDoorWidth/2,fy,fy+2.7]];
  wall('15',l,'z',inner+.12,-w/2,w/2,fy,ceiling,cuts);
  // Old light facade, not an invented open-balcony elevation. The circulation strip
  // remains behind this window wall so all frozen bridge connections still work.
  for(const [left,right] of ranges){
   const fc=[];
   for(const x of bayCenters.filter(x=>x>=left&&x<=right))for(const sign of [-1,1]){
    const u=x+sign*.95,ww=m.windowWidth;
    fc.push([u-ww/2,u+ww/2,fy+m.windowSill,fy+m.windowSill+m.windowHeight]);
    window('15',l,'z',front+.14,u,fy+m.windowSill,ww,m.windowHeight);
   }
   wall('15',l,'z',front+.12,left-.45,right+.45,fy,ceiling,fc);
  }
  add('15',l,'beam',[w,.20,.36],[0,ceiling-.10,front+.18]);
  // Paired rear windows; top-storey rear wall is set back to leave the recorded terrace.
  const rc=[];
  for(const x of bayCenters)for(const s of [-1,1]){
   const u=x+s*.95,ww=m.windowWidth;rc.push([u-ww/2,u+ww/2,fy+m.windowSill,fy+m.windowSill+m.windowHeight]);
   window('15',l,'z',rear-.06,u,fy+m.windowSill,ww,m.windowHeight);
  }
  const rearDoors=j===0?[0]:l===m.terrace.level?m.terrace.doorXs:[];
  // Door bays replace any overlapping window units, rather than opening a hole behind glazing.
  for(const u of rearDoors){rc.push([u-m.rearDoorWidth/2,u+m.rearDoorWidth/2,fy,fy+m.doorHeight]);}
  for(let k=parts.length-1;k>=0;k--){const q=parts[k];if(q.owner==='15'&&q.level===l&&['glazing','frame','sill'].includes(q.role)&&Math.abs(q.center[2]-rear)<.5&&rearDoors.some(u=>Math.abs(q.center[0]-u)<m.rearDoorWidth/2+q.size[0]/2))parts.splice(k,1);}
  wall('15',l,'z',rear,-w/2,w/2,fy,ceiling,rc);
  // Side walls retain all original midpoint bridge openings; end returns remain unobstructed.
  wall('15',l,'x',-w/2+.12,front, rear,fy,ceiling,[[-1.2,1.2,fy,fy+m.doorHeight],[front,inner+.35,fy,fy+m.doorHeight]]);
  wall('15',l,'x', w/2-.12,front,rear,fy,ceiling,j===0?[[-1.2,1.2,fy,fy+m.doorHeight],[front,inner+.35,fy,fy+m.doorHeight]]:[]);
  // A restrained central stair/entrance bay, not the later building's red arch.
  const centerCuts=[[-1.4,1.4,fy,fy+(j===0?2.7:2.8)]];
  wall('15',l,'z',front+.1,-half,half,fy,ceiling,centerCuts,'central-wall');
  if(j>0)window('15',l,'z',front+.2,0,fy+.35,2.8,2.45);
  for(const s of [-1,1])add('15',l,'central-pier',[.45,ceiling-fy,.64],[s*half,(ceiling+fy)/2,front+.32]);
  add('15',l,'cornice',[w,.16,.28],[0,(j+1)*story-.04,front+.08]);
  if(l===m.terrace.level){
   wall('15',l,'z',d/2-.12,-w/2,w/2,fy,fy+m.terrace.guardHeight,[],'terrace-guard');
   for(const x of [-w/2+.12,w/2-.12])wall('15',l,'x',x,rear,d/2,fy,fy+m.terrace.guardHeight,[],'terrace-guard');
   add('15',0,'roof',[w,.22,rear-front],[0,h+.11,(front+rear)/2],'B01-15-setback-roof');
  }
 }
 const topRear=m.terrace.rearWallZ;
 for(const z of [front+.14,topRear-.14])add('15',0,'roof-parapet',[w,.35,.28],[0,h+.395,z]);
 for(const x of [-w/2+.14,w/2-.14])add('15',0,'roof-parapet',[.28,.35,topRear-front],[x,h+.395,(front+topRear)/2]);
 if(m.cupola.enabled){
  const c=m.cupola,[x,z]=c.center;
  add('15',0,'cupola-plinth',[c.radius*2+.5,.24,c.radius*2+.5],[x,h+.34,z]);
  parts.push({id:'B01-15-cupola-drum',owner:'15',level:0,role:'cupola',shape:'cylinder',center:[x,h+.46+c.drumHeight/2,z],size:[c.radius*2,c.drumHeight,c.radius*2]});
  parts.push({id:'B01-15-cupola-cap',owner:'15',level:0,role:'cupola',shape:'dome',center:[x,h+.46+c.drumHeight,z],size:[c.radius*2,c.capHeight,c.radius*2]});
 }
 // Retain the continuous R4 toilet body, gallery, eight end doors and full floor plates.
 for(const q of toiletParts(layout)){
  if(q.id.endsWith('-back')){
   const fy=(q.level-1)*story+.04,y=fy+p.toilet.highVentSill,hh=p.toilet.highVentHeight,ww=p.toilet.highVentWidth;
   wall('25',q.level,'x',-wc.size[0]/2+.12,-wc.size[2]/2,wc.size[2]/2,fy,fy+3.60,[[-4.0-ww/2,-4.0+ww/2,y,y+hh],[4-ww/2,4+ww/2,y,y+hh]]);
   for(const z of [-4,4])window('25',q.level,'x',-wc.size[0]/2+.08,z,y,ww,hh);
  } else parts.push({...q,shape:'box'});
 }
 const roofY=wc.size[1]+.22+p.toilet.parapetHeight/2;
 add('25',0,'roof-parapet',[wc.size[0],p.toilet.parapetHeight,.20],[0,roofY,-wc.size[2]/2+.1]);
 add('25',0,'roof-parapet',[wc.size[0],p.toilet.parapetHeight,.20],[0,roofY,wc.size[2]/2-.1]);
 for(const b of layout.connections){
  const floor=structureParts(layout).find(q=>q.id===b.id);parts.push({...floor,owner:'bridge',level:b.level,role:'bridge-floor',shape:'box'});
  if(b.level===1&&p.bridge.keepGroundCrossingOpen)continue;
  for(const sign of [-1,1]){
   const z=b.z+sign*b.width/2;
   for(const rh of [.48,p.bridge.railingHeight])add('bridge',b.level,'bridge-rail',[b.xEnd-b.xStart,.055,.055],[(b.xStart+b.xEnd)/2,b.y+.04+rh,z]);
   const n=Math.ceil((b.xEnd-b.xStart)/p.bridge.postSpacing);
   for(let i=0;i<=n;i++)add('bridge',b.level,'bridge-post',[.055,p.bridge.railingHeight,.055],[b.xStart+(b.xEnd-b.xStart)*i/n,b.y+.04+p.bridge.railingHeight/2,z]);
  }
 }
 function origin(owner){const f=owner==='bridge'?null:fac(owner);return f?[f.position[0],terrain.anchors[owner].floor,f.position[2]]:[0,terrain.anchors['25'].floor,0];}
 const worldParts=parts.map(q=>({...q,center:q.center.map((v,i)=>v+origin(q.owner)[i])}));
 const routes=[];
 for(const b of layout.connections){
  const y=terrain.anchors['15'].floor+b.y+.04;
  for(const sign of [-1,1])routes.push({id:`B01-L${b.level}-${sign<0?'A':'B'}`,level:b.level,points:[[30,y,218.15],[22,y,218.15],[22,y,224],[-8.1,y,224],[-8.1,y,224+sign*5.1],[-10.0,y,224+sign*5.1]]});
 }
 const horizontal=horizontalSnapshot(layout);
 return{version:p.version,p,parts,worldParts,routes,horizontal,mainFloor:terrain.anchors['15'].floor,toiletFloor:terrain.anchors['25'].floor,
  exportData:()=>({version:p.version,input:p,horizontal,parts,worldParts,routes,status:'IMPLEMENTED / REVIEW_PENDING'})};
}
export function segmentBox(a,b,q,margin=0){
 if(q.shape!=='box')return false;let lo=0,hi=1;
 for(let i=0;i<3;i++){
  const min=q.center[i]-q.size[i]/2-margin,max=q.center[i]+q.size[i]/2+margin,d=b[i]-a[i];
  if(Math.abs(d)<1e-9){if(a[i]<=min+1e-7||a[i]>=max-1e-7)return false;continue;}
  let l=(min-a[i])/d,h=(max-a[i])/d;if(l>h)[l,h]=[h,l];lo=Math.max(lo,l);hi=Math.min(hi,h);if(hi<=lo)return false;
 }return hi>0&&lo<1;
}
export function hasFloor(model,x,y,z){return model.worldParts.some(q=>q.shape==='box'&&['slab','bridge-floor'].includes(q.role)&&Math.abs(q.center[1]+q.size[1]/2-y)<.012&&x>=q.center[0]-q.size[0]/2-1e-6&&x<=q.center[0]+q.size[0]/2+1e-6&&z>=q.center[2]-q.size[2]/2-1e-6&&z<=q.center[2]+q.size[2]/2+1e-6);}
export function batch01Checks(layout,model,reference=layout){
 const r=[],put=(id,passed,detail='')=>r.push({id,passed:!!passed,detail}),ps=model.parts;
 put('B01-XZ-ROADS-FROZEN',JSON.stringify(model.horizontal)===JSON.stringify(horizontalSnapshot(reference)));
 put('B01-FOUR-FLOORS',model.p.main.floorCount===4&&model.p.main.storyHeight===3.8);
 put('B01-COMMON-DATUM',model.mainFloor===model.toiletFloor);
 put('B01-OLD-NOT-MODERN',model.p.main.material==='old-light-render; not modern orange-red main block');
 put('B01-REAL-WINDOWS',ps.filter(p=>p.role==='glazing').length>=100&&ps.filter(p=>p.role==='frame').length>=300);
 for(let l=1;l<=4;l++){
  put(`B01-L${l}-FULL-TOILET-SLAB`,ps.some(q=>q.owner==='25'&&q.level===l&&q.role==='slab'&&q.size[0]===6&&q.size[2]===14.4));
  put(`B01-L${l}-CONTINUOUS-BODY`,ps.some(q=>q.owner==='25'&&q.level===l&&q.role==='partition'));
  for(const route of model.routes.filter(v=>v.level===l)){
   let support=true,clear=true;
   for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.ceil(len/.35);
    for(let j=0;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[2]+(b[2]-a[2])*j/n;for(const [dx,dz]of [[0,0],[.20,0],[-.20,0],[0,.20],[0,-.20]])if(!hasFloor(model,x+dx,a[1],z+dz))support=false;}
    for(const h of [.35,1.05,1.75])if(model.worldParts.some(q=>segmentBox([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],q,.14)))clear=false;
   }
   put(route.id+'-SUPPORTED',support);put(route.id+'-CLEAR',clear);
  }
 }
 const y=model.mainFloor;
 put('B01-BRIDGE-UNDERPASS',!model.worldParts.some(q=>segmentBox([6.5,y+1.7,216],[6.5,y+1.7,239],q,.25)));
 put('B01-REAR-DOOR',!model.worldParts.some(q=>segmentBox([69,y+1.7,224],[69,y+1.7,235],q,.25)));
 const ty=y+11.44;
 put('B01-TERRACE-OPEN-SKY',!model.worldParts.some(q=>segmentBox([95,ty+1,229],[95,ty+12,229],q)));
 put('B01-TERRACE-FLOOR',hasFloor(model,95,ty,229));
 put('B01-TERRACE-RAIL',ps.filter(q=>q.role==='terrace-guard').length>=3);
 put('B01-TERRACE-DOOR',!model.worldParts.some(q=>segmentBox([69,ty+1.7,224],[69,ty+1.7,230],q,.2)));
 return{passed:r.every(v=>v.passed),results:r};
}
