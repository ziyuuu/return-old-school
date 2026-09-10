import {buildB01R2Model} from './b01-r2-core.mjs';
import {segmentBox} from './batch01-core.mjs';
const clone=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
/** Only the front-end entrance records change; global node/edge positions stay fixed. */
export function applyB01R3(layout,p){
 const out=clone(layout),f=out.facilities.find(f=>f.id==='15'),s=p.endEntrances,changes=[];
 const old=out.entrances.find(e=>e.id==='15-east');
 const east={...old,position:[f.position[0]+s.doorAbsX,0,f.position[2]+s.backZ],facing:clone(s.frontFacing),width:s.doorWidth,status:'A front-right recessed entrance / H local coordinates',revisionIssue:p.issue};
 out.entrances=out.entrances.map(e=>e.id==='15-east'?east:e);
 const west={...east,id:'15-west-front',position:[f.position[0]-s.doorAbsX,0,f.position[2]+s.backZ],status:'A front-left recessed entrance; distinct from west toilet bridge'};out.entrances.push(west);
 changes.push({path:'entrances.15-east',before:old,after:east},{path:'entrances.15-west-front',before:null,after:west});
 const th=out.thresholds.find(t=>t.id==='15-east-threshold');out.thresholds=out.thresholds.filter(t=>t.id!=='15-east-threshold');
 changes.push({path:'thresholds.15-east-threshold',before:th,after:'replaced by R3 local route around east end, main-east road node retained'});
 out.b01r3={issue:p.issue,changes};return out;
}
/** Bounded front-apron grading, without rewriting accepted terrain inputs or floor datums. */
export function buildR3Terrain(base,layout,p){
 const a=p.apron,m=layout.facilities.find(f=>f.id==='15'),xs=p.endEntrances.sides.map(s=>m.position[0]+s*p.endEntrances.doorAbsX);
 const delta=(x,z)=>{let k=0;for(const cx of xs){const wx=1-smooth((Math.abs(x-cx)-a.innerHalfWidth)/(a.outerHalfWidth-a.innerHalfWidth));const wz=smooth((z-a.fadeFromZ)/(a.fullFromZ-a.fadeFromZ))*(1-smooth((z-a.fullUntilZ)/(a.fadeToZ-a.fullUntilZ)));k=Math.max(k,wx*wz);}return -a.drop*k;};
 const t={...base,groundHeight:(x,z)=>base.groundHeight(x,z)+delta(x,z),tileHeight:(kind,x,z)=>base.tileHeight(kind,x,z)+delta(x,z),walkHeight:(x,z)=>base.walkHeight(x,z)+delta(x,z),r3Delta:delta};
 const oldWalk=t.walkHeight,es=p.endEntrances,fy=base.anchors['15'].floor+.04,stepStart=m.position[2]+es.landingFrontZ-es.stepCount*es.stepTread;
 t.walkHeight=(x,z)=>{for(const cx of xs){if(Math.abs(x-cx)<=es.porchWidth/2&&z>=stepStart&&z<m.position[2]+es.landingFrontZ)return fy-es.stepCount*es.stepRise+(Math.floor((z-stepStart)/es.stepTread)+1)*es.stepRise;if(Math.abs(x-cx)<=es.porchWidth/2&&z>=m.position[2]+es.landingFrontZ&&z<=m.position[2]+es.backZ+.1)return fy;}return oldWalk(x,z);};
 t.exportData=()=>({...base.exportData(),r3LocalAprons:{issue:p.issue,parameters:a,centres:xs},note:'R2 anchors retained; localized H front-end approach grades only'});return t;
}
export function curveZ(x,p2,p){const half=p2.main.centralWidth/2,s=p.curvedCentre.sagitta,R=(half*half+s*s)/(2*s);return -7-p2.main.centralProjection+R-Math.sqrt(Math.max(0,R*R-x*x));}
/** Build R3 as an explicit replacement layer over R2, not a new campus layout. */
export function buildB01R3Model(layout,terrain,p2,p){
 const base=buildB01R2Model(layout,terrain,p2),parts=[],s=p.endEntrances,m=p2.main,fac=id=>layout.facilities.find(f=>f.id===id),f=fac('15'),w=f.size[0],d=f.size[2],front=-d/2,story=m.storyHeight,half=m.centralWidth/2;
 let serial=0;
 const add=(level,role,size,center,id,extra={})=>{const q={id:id??`R3-L${level}-${role}-${serial++}`,owner:'15',level,role,shape:'box',size,center,...extra};parts.push(q);return q;};
 const polygonPart=(level,role,polygon,y0,y1,id)=>{const xs=polygon.map(v=>v[0]),zs=polygon.map(v=>v[1]);return add(level,role,[Math.max(...xs)-Math.min(...xs),y1-y0,Math.max(...zs)-Math.min(...zs)],[0,(y0+y1)/2,0],id,{shape:'prism',polygon});};
 const wall=(l,axis,at,a,b,y0,y1,cuts=[],role='wall')=>{
  const us=[...new Set([a,b,...cuts.flatMap(c=>[c[0],c[1]]).filter(v=>v>a&&v<b)])].sort((a,b)=>a-b),ys=[...new Set([y0,y1,...cuts.flatMap(c=>[c[2],c[3]]).filter(v=>v>y0&&v<y1)])].sort((a,b)=>a-b);
  for(let i=1;i<us.length;i++)for(let j=1;j<ys.length;j++){const u=(us[i]+us[i-1])/2,y=(ys[j]+ys[j-1])/2;if(cuts.some(c=>u>c[0]&&u<c[1]&&y>c[2]&&y<c[3]))continue;add(l,role,axis==='z'?[us[i]-us[i-1],ys[j]-ys[j-1],m.wallThickness]:[m.wallThickness,ys[j]-ys[j-1],us[i]-us[i-1]],axis==='z'?[u,y,at]:[at,y,u]);}
 };
 const notched=(back)=>[[-49,s.backZ],[-s.notchInnerX,s.backZ],[-s.notchInnerX,front],[s.notchInnerX,front],[s.notchInnerX,s.backZ],[49,s.backZ],[49,back],[-49,back]];
 const arc=(a,b,n=48,offset=0)=>Array.from({length:n+1},(_,i)=>{const x=a+(b-a)*i/n;return [x,curveZ(x,p2,p)+offset];});
 const ribbon=(a,b,depth)=>[...arc(a,b,Math.max(2,Math.ceil((b-a)/m.centralWidth*p.curvedCentre.segments))),...arc(a,b,Math.max(2,Math.ceil((b-a)/m.centralWidth*p.curvedCentre.segments)),depth).reverse()];
 const centrePlate=()=>[...arc(-half,half,p.curvedCentre.segments),[half,front],[-half,front]];
 // Remove obsolete one-side porch, flat central facade and straight unsupported edge pieces.
 for(const original of base.parts){const q=clone(original);if(q.owner!=='15'){parts.push(q);continue;}
  if(q.role.startsWith('porch-')||q.role==='stair-front-blank'||q.role==='central-functional-front'||q.role==='central-return')continue;
  if(['glazing','frame','sill'].includes(q.role)&&q.center[2]<front-.4&&Math.abs(q.center[0])<half+.2)continue;
  if(q.role==='cornice'&&(q.size[0]>90||q.center[2]<front-.4))continue;
  if(q.role==='slab'&&q.id.includes('projection-floor'))continue;
  if(q.role==='roof'&&q.center[2]<front)continue;
  if(q.role==='roof-parapet'&&(q.center[2]<-6.5||Math.abs(q.center[0])>48.7))continue;
  if(q.role==='slab'&&q.id.match(/^R2-15-L\d-floor$/)){const back=q.center[2]+q.size[2]/2;polygonPart(q.level,'slab',notched(back),q.center[1]-q.size[1]/2,q.center[1]+q.size[1]/2,q.id);continue;}
  if(q.id==='R2-15-upper-roof'){polygonPart(0,'roof',notched(m.corridorZ[1]),q.center[1]-.11,q.center[1]+.11,q.id);continue;}
  if(q.role==='end-wall'){const start=q.center[2]-q.size[2]/2,end=q.center[2]+q.size[2]/2;if(end<=s.backZ)continue;if(start<s.backZ){q.center[2]=(s.backZ+end)/2;q.size[2]=end-s.backZ;}}
  parts.push(q);
 }
 const sideDoors=[],accessRoutes=[],stepRecords=[];
 for(let l=1;l<=5;l++){
  const fy=(l-1)*story+.04,ceil=l*story-.14;
  polygonPart(l,'slab',centrePlate(),fy-m.slabThickness,fy,`R3-centre-L${l}-floor`);
  const opening=l===1?m.frontDoorWidth/2:1.9,lo=l===1?fy:fy+.7,hi=l===1?fy+m.doorHeight:fy+3.05;
  for(const [a,b]of [[-half,-opening],[opening,half]])polygonPart(l,'central-curved-wall',ribbon(a,b,m.wallThickness),fy,ceil);
  if(lo>fy)polygonPart(l,'central-curved-wall',ribbon(-opening,opening,m.wallThickness),fy,lo);
  polygonPart(l,'central-curved-wall',ribbon(-opening,opening,m.wallThickness),hi,ceil);
  for(const x of [-half,half])wall(l,'x',x,curveZ(x,p2,p),front,fy,ceil,[],'central-return');
  polygonPart(l,'curved-cornice',ribbon(-half,half,.28),l*story-.16,l*story+.01);
  if(l>1){
   polygonPart(l,'glazing',ribbon(-1.82,1.82,.035),fy+.765,fy+2.985);
   for(const x of [-1.865,0,1.865])add(l,'frame',[.065,2.35,.14],[x,fy+1.875,curveZ(x,p2,p)+.01]);
   for(const y of [fy+.735,fy+2.27,fy+3.015])polygonPart(l,'frame',ribbon(-1.9,1.9,.14),y-.025,y+.025);
  }
  add(l,'cornice',[2*s.notchInnerX,.14,.24],[0,l*story-.07,front+.10]);
  for(const sign of s.sides){
   const a=sign<0?-49:s.notchInnerX,b=sign<0?-s.notchInnerX:49,x=sign*s.doorAbsX,wx=sign*s.windowAbsX,inner=sign*s.notchInnerX;
   const cuts=l===1?[[x-s.doorWidth/2,x+s.doorWidth/2,fy,fy+s.doorHeight],[wx-s.windowWidth/2,wx+s.windowWidth/2,fy+.85,fy+.85+s.windowHeight]]:[];
   wall(l,'z',s.backZ,a,b,fy,ceil,cuts,'recess-back-wall');
   wall(l,'x',inner,front,s.backZ,fy,ceil,[],'five-storey-forward-return');
   wall(l,'z',front+.12,sign<0?-s.notchInnerX:43,sign<0?-43:s.notchInnerX,fy,ceil,[],'stair-front-blank');
   add(l,'cornice',[b-a,.14,.24],[(a+b)/2,l*story-.07,s.backZ]);
   if(l===1){
    add(l,'glazing',[s.windowWidth-.10,s.windowHeight-.1,.035],[wx,fy+.85+s.windowHeight/2,s.backZ]);
    for(const u of [-.5,.5])add(l,'frame',[.07,s.windowHeight,.1],[wx+u*s.windowWidth,fy+.85+s.windowHeight/2,s.backZ-.02]);
    for(let i=0;i<6;i++)add(l,'security-bar',[.022,s.windowHeight,.025],[wx+(i/5-.5)*s.windowWidth,fy+.85+s.windowHeight/2,s.backZ-.10]);
    for(const y of [fy+.85,fy+.85+s.windowHeight])add(l,'frame',[s.windowWidth,.07,.12],[wx,y,s.backZ-.04]);
    const top=fy,depth=s.backZ-s.landingFrontZ+.14;
    add(l,'porch-landing',[s.porchWidth,.18,depth],[x,top-.09,(s.backZ+s.landingFrontZ+.14)/2],`R3-${sign}-landing`);
    for(const side of [-1,1])add(l,'porch-post',[s.postWidth,s.roofHeight,s.postWidth],[x+side*(s.porchWidth-s.postWidth)/2,top+s.roofHeight/2,s.canopyFrontZ+s.postWidth/2],`R3-${sign}-post-${side}`);
    add(l,'porch-roof',[s.porchWidth+.12,s.roofThickness,s.backZ-s.canopyFrontZ+.2],[x,top+s.roofHeight+s.roofThickness/2,(s.backZ+s.canopyFrontZ)/2]);
    add(l,'porch-trim',[s.porchWidth+.14,s.trimHeight,.14],[x,top+s.roofHeight+s.roofThickness+s.trimHeight/2,s.canopyFrontZ-.04]);
    for(const side of [-1,1])add(l,'porch-trim',[.12,s.trimHeight,s.backZ-s.canopyFrontZ+.12],[x+side*(s.porchWidth+.02)/2,top+s.roofHeight+s.roofThickness+s.trimHeight/2,(s.backZ+s.canopyFrontZ)/2]);
    const start=s.landingFrontZ-s.stepCount*s.stepTread,baseY=top-s.stepCount*s.stepRise;
    for(let i=0;i<s.stepCount;i++){const y=baseY+(i+1)*s.stepRise,z=start+(i+.5)*s.stepTread,id=`R3-${sign}-step-${i+1}`;add(l,'entrance-step',[s.porchWidth+.32,y-baseY+.20,s.stepTread],[x,(baseY-.20+y)/2,z],id);stepRecords.push({id,sign,x:x+f.position[0],z:z+f.position[2],y:y+base.mainFloor,width:s.porchWidth+.32});}
    const dx=x+f.position[0],mz=f.position[2],y=base.mainFloor+fy;
    sideDoors.push({id:sign<0?'15-west-front':'15-east',sign,x:dx,z:mz+s.backZ,facing:clone(s.frontFacing),floor:y,canopyFrontZ:mz+s.canopyFrontZ,wallFrontZ:mz+front,wallX:f.position[0]+inner,backZ:mz+s.backZ});
    accessRoutes.push({id:`R3-front-${sign}`,sign,level:1,points:[[dx,y,mz+s.landingFrontZ+.1],[dx,y,mz+s.backZ+.3],[dx,y,mz]]});
   }
  }
 }
 // Close obsolete ground-floor east gable doorway, while preserving west bridge openings.
 wall(1,'x',49-.12,m.corridorZ[0]+.15,m.corridorZ[1]-.15,.04,m.doorHeight+.04,[],'closed-east-gable');
 const h=5*story;
 polygonPart(0,'roof',centrePlate(),h,h+.22,'R3-centre-roof');
 polygonPart(0,'curved-parapet',ribbon(-half,half,.22),h+.22,h+.52);
 for(const sign of s.sides){add(0,'roof-parapet',[49-s.notchInnerX,.3,.22],[sign*(49+s.notchInnerX)/2,h+.37,s.backZ]);add(0,'roof-parapet',[.22,.3,s.backZ-front],[sign*s.notchInnerX,h+.37,(front+s.backZ)/2]);add(0,'roof-parapet',[.22,.3,m.corridorZ[1]-s.backZ],[sign*49,h+.37,(s.backZ+m.corridorZ[1])/2]);}
 for(const [a,b]of [[-s.notchInnerX,-half],[half,s.notchInnerX]])add(0,'roof-parapet',[b-a,.3,.22],[(a+b)/2,h+.37,front]);
 const spaces=clone(base.spaces);for(const q of spaces)if(q.kind==='stairwell-reserved')q.bounds[1]=s.backZ;
 const model={...base,version:p.version,parts,spaces,r3:p,sideDoors,accessRoutes,stepRecords,r3Changes:layout.b01r3.changes,curve:{radius:(half*half+p.curvedCentre.sagitta**2)/(2*p.curvedCentre.sagitta),sagitta:p.curvedCentre.sagitta,span:2*half,samples:arc(-half,half,p.curvedCentre.segments)}};
 refreshR3World(model,layout);
 model.exportData=()=>Object.fromEntries(Object.entries(model).filter(([k,v])=>typeof v!=='function'));
 return model;
}
export function refreshR3World(model,layout){const f=id=>layout.facilities.find(f=>f.id===id);model.worldParts=model.parts.map(q=>{const o=q.owner==='bridge'?[0,model.toiletFloor,0]:[f(q.owner).position[0],q.owner==='15'?model.mainFloor:model.toiletFloor,f(q.owner).position[2]];return {...q,center:q.center.map((v,i)=>v+o[i]),polygon:q.polygon?.map(([x,z])=>[x+o[0],z+o[2]])};});}
export function inPolygon(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[c,d]=poly[j];if(((b>z)!==(d>z))&&(x<(c-a)*(z-b)/(d-b)+a))inside=!inside;}return inside;}
export function hitsPart(a,b,q){
 if(q.shape==='box')return segmentBox(a,b,q);
 if(q.shape!=='prism')return false;
 const y0=q.center[1]-q.size[1]/2,y1=q.center[1]+q.size[1]/2;
 // Fine deterministic samples plus exact polygon-edge intersections; catches thin rails/walls.
 const ts=[0,1];if(Math.abs(b[1]-a[1])>1e-10)for(const y of[y0,y1])ts.push((y-a[1])/(b[1]-a[1]));
 const dx=b[0]-a[0],dz=b[2]-a[2];
 for(let i=0;i<q.polygon.length;i++){const u=q.polygon[i],v=q.polygon[(i+1)%q.polygon.length],ex=v[0]-u[0],ez=v[1]-u[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-10)continue;const ax=u[0]-a[0],az=u[1]-a[2],t=(ax*ez-az*ex)/den,k=(ax*dz-az*dx)/den;if(k>=0&&k<=1&&t>=0&&t<=1)ts.push(t);}
 const sorted=ts.filter(t=>t>=0&&t<=1).sort((a,b)=>a-b);for(let i=1;i<sorted.length;i++){const t=(sorted[i-1]+sorted[i])/2,y=a[1]+(b[1]-a[1])*t;if(y>y0+1e-7&&y<y1-1e-7&&inPolygon(a[0]+dx*t,a[2]+dz*t,q.polygon))return true;}return false;
}
export function supported(model,x,y,z){return model.worldParts.some(q=>['slab','bridge-floor','porch-landing','entrance-step'].includes(q.role)&&Math.abs(q.center[1]+q.size[1]/2-y)<.012&&(q.shape==='prism'?inPolygon(x,z,q.polygon):Math.abs(x-q.center[0])<=q.size[0]/2+1e-7&&Math.abs(z-q.center[2])<=q.size[2]/2+1e-7));}
export function b01R3Checks(r2Layout,layout,model,p){
 const results=[],put=(id,ok,detail=null)=>results.push({id,passed:!!ok,detail}),ps=model.parts;
 put('R3_FACILITIES_AND_AXIS_UNMOVED',same(r2Layout.facilities,layout.facilities)&&model.axis.every(q=>q.x===73));
 put('R3_ALL_ROAD_NODES_EDGES_WIDTHS_RETAINED',same(r2Layout.navigation,layout.navigation));
 put('R3_BRIDGES_AND_TOILETS_RETAINED',same(r2Layout.connections,layout.connections)&&same(r2Layout.toilet25,layout.toilet25));
 put('R3_TWO_FRONT_DOORS',model.sideDoors.length===2&&model.sideDoors.every(q=>same(q.facing,[0,0,-1])&&q.z>217));
 put('R3_EAST_RECORD_FRONT_FACING',same(layout.entrances.find(q=>q.id==='15-east').facing,[0,0,-1]));
 put('R3_NOT_AN_EAST_GABLE_PORCH',!ps.some(q=>q.owner==='15'&&q.role.startsWith('porch-')&&q.center[0]>49));
 put('R3_NO_OBSOLETE_EAST_THRESHOLD',!layout.thresholds.some(q=>q.id==='15-east-threshold'));
 put('R3_TALL_WALL_BEYOND_PORCH',model.sideDoors.every(q=>q.canopyFrontZ-q.wallFrontZ>=.5)&&ps.filter(q=>q.role==='five-storey-forward-return').length===10);
 put('R3_TWO_PAIRS_OF_POSTS',ps.filter(q=>q.role==='porch-post').length===4);
 put('R3_TWO_ONE_LEVEL_CANOPIES',ps.filter(q=>q.role==='porch-roof').length===2&&ps.filter(q=>q.role.startsWith('porch-')).every(q=>q.level===1));
 put('R3_STEPS_PRESENT',ps.filter(q=>q.role==='entrance-step').length===6);
 put('R3_SHALLOW_ARC_GEOMETRY',model.curve.sagitta>0&&model.curve.sagitta<.7&&ps.some(q=>q.role==='central-curved-wall'&&q.polygon?.length>10)&&!ps.some(q=>q.role==='central-functional-front'));
 const curved=ps.filter(q=>q.role==='central-curved-wall');put('R3_ARC_CONSISTENT_EVERY_LEVEL',[1,2,3,4,5].every(l=>curved.some(q=>q.level===l)));
 const roof=ps.find(q=>q.id==='R3-centre-roof'),face=roof?.polygon?.slice(0,49)??[];
 put('R3_ACTUAL_ARC_BOW',face.length===49&&face[0][1]-face[24][1]>.1&&face[0][1]-face[24][1]<.7&&Math.abs(face[0][1]-face[48][1])<1e-7);
 put('R3_NO_CANOPY_OVER_NOTCH_ABOVE_PORCH',model.sideDoors.every(d=>!model.worldParts.some(q=>hitsPart([d.x,8,d.z-1.0],[d.x,26,d.z-1.0],q))));
 put('R3_ARC_NOT_CLOSED_BY_FLAT_WALL',!ps.some(q=>q.owner==='15'&&q.role==='central-functional-front'));
 put('R3_FIVE_FLOORS',[1,2,3,4,5].every(l=>ps.some(q=>q.id===`R2-15-L${l}-floor`)));
 put('R3_REAR_TERRACE_PRESERVED',model.spaces.some(s=>s.kind==='open-terrace'&&s.level===4)&&!model.spaces.some(s=>s.row==='rear'&&s.level>=4));
 put('R3_TOILET_FIVE_FULL_FLOORS',ps.filter(q=>q.owner==='25'&&q.role==='slab').length===5);
 for(const r of [...model.routes,...model.accessRoutes]){let support=true,clear=true;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.5));for(let j=0;j<=n;j++)if(!supported(model,a[0]+(b[0]-a[0])*j/n,a[1],a[2]+(b[2]-a[2])*j/n))support=false;for(const h of [.4,1.1,1.8])if(model.worldParts.some(q=>hitsPart([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],q)))clear=false;}put('R3_ROUTE_SUPPORT_'+r.id,support);put('R3_ROUTE_CLEAR_'+r.id,clear);}
 for(const q of model.stepRecords)put('R3_STEP_'+q.id,[-q.width/2+.12,0,q.width/2-.12].every(dx=>supported(model,q.x+dx,q.y,q.z)));
 const y=model.mainFloor+1.7;
 put('R3_OBSOLETE_EAST_OPENING_CLOSED',model.worldParts.some(q=>hitsPart([123,y,224],[121,y,224],q)));
 put('R3_CENTRAL_DOOR_CLEAR',!model.worldParts.some(q=>hitsPart([73,y,214],[73,y,224],q)));
 put('R3_BRIDGE_UNDERPASS_CLEAR',!model.worldParts.some(q=>hitsPart([6.5,y,216],[6.5,y,239],q)));
 put('R3_TERRACE_OPEN_SKY',!model.worldParts.some(q=>hitsPart([91,15.8,228],[91,28,228],q)));
 put('R3_L4_CORRIDOR_COVERED',model.worldParts.some(q=>q.level===5&&q.role==='slab'&&hitsPart([91,16,224],[91,20,224],q)));
 put('R3_IDS_UNIQUE',new Set(ps.map(q=>q.id)).size===ps.length);
 return{passed:results.every(q=>q.passed),results};
}
