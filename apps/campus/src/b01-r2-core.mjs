import {toiletParts} from './revision-r4-core.mjs';
import {horizontalSnapshot} from './terrain-core.mjs';
import {segmentBox,hasFloor} from './batch01-core.mjs';
const clone=x=>structuredClone(x),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** Evidence-driven exceptions are applied to a clone; R4 and accepted P3/P4 inputs stay immutable. */
export function applyB01R2(base,terrain,p04,p){
 const layout=clone(base),spec=clone(terrain),site=clone(p04),changes=[];
 const fac=id=>layout.facilities.find(f=>f.id===id),record=(path,before,after)=>changes.push({path,before:clone(before),after:clone(after),issue:p.issue});
 for(const [id,dx]of Object.entries(p.axis.facilityShifts)){
  const f=fac(id),before=clone(f.position);f.position[0]+=dx;record(`facilities.${id}.position`,before,f.position);
  for(const e of layout.entrances.filter(e=>e.facilityId===id)){const before=clone(e.position);e.position[0]+=dx;record(`entrances.${e.id}`,before,e.position);}
  for(const t of layout.thresholds.filter(t=>t.id.startsWith(id+'-'))){const before=clone(t);t.start[0]+=dx;t.end[0]+=dx;record(`thresholds.${t.id}`,before,t);}
  for(const s of spec.stairs.filter(s=>s.facilityId===id)){const before=clone(s);s.start[0]+=dx;s.end[0]+=dx;record(`terrain.stairs.${s.id}`,before,s);}
 }
 for(const [id,dx]of Object.entries(p.axis.nodeShifts)){const before=clone(layout.navigation.nodes[id]);layout.navigation.nodes[id][0]+=dx;record(`navigation.nodes.${id}`,before,layout.navigation.nodes[id]);}
 const count=p.main.floorCount,story=p.main.storyHeight;
 for(const id of ['15','25']){const f=fac(id);record(`facilities.${id}.floors`,f.floors,count);f.floors=count;f.size[1]=count*story;}
 const proto=clone(layout.toilet25.floors[0]);layout.toilet25.floors=Array.from({length:count},(_,i)=>({...clone(proto),level:i+1,elevation:i*story}));
 const oldConnections=clone(layout.connections),cp=clone(oldConnections[0]);
 layout.connections=Array.from({length:count},(_,i)=>({...cp,id:`15-25-L${String(i+1).padStart(2,'0')}`,level:i+1,y:i*story,xEnd:p.bridge.newMainEndpoint,evidence:'A every-floor relation; H R2 endpoint/level extension, issue28'}));
 record('connections',oldConnections,layout.connections);
 const oldDoors=layout.entrances.filter(e=>e.kind==='toilet-door'),doorProtos=oldDoors.filter(e=>e.level===1);
 layout.entrances=layout.entrances.filter(e=>e.kind!=='toilet-door');
 for(let i=0;i<count;i++)for(const d of doorProtos)layout.entrances.push({...clone(d),id:d.id.replace('L01','L'+String(i+1).padStart(2,'0')),level:i+1,position:[d.position[0],i*story,d.position[2]]});
 const front=layout.entrances.find(e=>e.id==='15-front'),beforeFront=clone(front.position);front.position[2]-=p.main.centralProjection;record('entrances.15-front.projection',beforeFront,front.position);
 const frontThreshold=layout.thresholds.find(t=>t.id==='15-front-threshold');const beforeThreshold=clone(frontThreshold);frontThreshold.end[2]=front.position[2]+.10;record('thresholds.15-front-threshold.projection',beforeThreshold,frontThreshold);
 // The original teaching-entry equals the new projected doorway; a 10cm overlap is deliberate support.
 record('site.flag.center',site.forecourt.flag.center,p.axis.flagCenterAfter);site.forecourt.flag.center=clone(p.axis.flagCenterAfter);
 layout.b01r2={issue:p.issue,source:p.baseMain,changes};
 return {layout,spec,site,changes};
}
/** Exact same parts feed renderer, plan/section exports and fault tests. */
export function buildB01R2Model(layout,terrain,p){
 const parts=[],spaces=[],portals=[],routes=[],m=p.main,fac=id=>layout.facilities.find(f=>f.id===id),main=fac('15'),wc=fac('25');
 const [w,,d]=main.size,front=-d/2,rear=d/2,[c0,c1]=m.corridorZ,half=m.centralWidth/2,story=m.storyHeight;
 let serial=0;
 function add(owner,level,role,size,center,id,extra={}){
  if(size.some(v=>!Number.isFinite(v)||v<=1e-7))throw Error('Invalid part '+(id??role));
  const q={id:id??`R2-${owner}-L${level}-${role}-${serial++}`,owner,level,role,size,center,shape:'box',...extra};parts.push(q);return q;
 }
 function wall(owner,level,axis,at,a,b,y0,y1,cuts=[],role='wall',th=m.wallThickness){
  const us=[...new Set([a,b,...cuts.flatMap(c=>[c[0],c[1]]).filter(v=>v>a&&v<b)])].sort((a,b)=>a-b);
  const ys=[...new Set([y0,y1,...cuts.flatMap(c=>[c[2],c[3]]).filter(v=>v>y0&&v<y1)])].sort((a,b)=>a-b);
  for(let i=1;i<us.length;i++)for(let j=1;j<ys.length;j++){
   const u=(us[i-1]+us[i])/2,y=(ys[j-1]+ys[j])/2;if(cuts.some(c=>u>c[0]&&u<c[1]&&y>c[2]&&y<c[3]))continue;
   add(owner,level,role,axis==='z'?[us[i]-us[i-1],ys[j]-ys[j-1],th]:[th,ys[j]-ys[j-1],us[i]-us[i-1]],axis==='z'?[u,y,at]:[at,y,u]);
  }
 }
 function window(l,at,x,sill,width=m.windowWidth,height=m.windowHeight){
  const f=m.frameWidth;add('15',l,'glazing',[width-2*f,height-2*f,.04],[x,sill+height/2,at]);
  for(const sign of [-1,1]){add('15',l,'frame',[f,height,.14],[x+sign*(width-f)/2,sill+height/2,at]);add('15',l,'frame',[width,f,.14],[x,sill+(sign>0?height-f/2:f/2),at]);}
  add('15',l,'frame',[f,height,.12],[x,sill+height/2,at]);add('15',l,'frame',[width,.045,.12],[x,sill+height*.67,at]);
  add('15',l,'sill',[width+.12,.10,.34],[x,sill-.05,at]);
 }
 function rail(owner,l,axis,at,a,b,y,role='rail'){
  for(const rh of [.48,1.05])add(owner,l,role,axis==='z'?[b-a,.055,.06]:[.06,.055,b-a],axis==='z'?[(a+b)/2,y+rh,at]:[at,y+rh,(a+b)/2]);
  const n=Math.ceil((b-a)/1.1);for(let i=0;i<=n;i++)add(owner,l,'rail-post',[.055,1.05,.055],axis==='z'?[a+(b-a)*i/n,y+.525,at]:[at,y+.525,a+(b-a)*i/n]);
 }
 const bands=m.stairBands,ranges=[[bands[0][1],-half],[half,bands[1][0]]],rooms=[];
 for(const [a,b]of ranges)for(let i=0;i<m.classroomsPerWing;i++)rooms.push({a:a+(b-a)*i/m.classroomsPerWing,b:a+(b-a)*(i+1)/m.classroomsPerWing});
 function roomRow(l,fy,ceiling,z0,z1,row){
  for(const r of rooms){const x=(r.a+r.b)/2,doorX=r.a+1.15;spaces.push({id:`R2-L${l}-${row}-${r.a}`,level:l,kind:'classroom',row,bounds:[r.a,z0,r.b,z1]});
   wall('15',l,'x',r.a,z0,z1,fy,ceiling,[],'room-partition');
   portals.push({level:l,kind:'classroom-door',row,x:doorX,z:row==='front'?c0:c1,width:1.05});
  }
  for(const [,b]of ranges)wall('15',l,'x',b,z0,z1,fy,ceiling,[],'room-partition');
 }
 for(let j=0;j<m.floorCount;j++){
  const l=j+1,fy=j*story+.04,ceiling=(j+1)*story-.14,upper=l>=4,backLimit=l===5?c1:rear;
  add('15',l,'slab',[w,m.slabThickness,backLimit-front],[0,fy-m.slabThickness/2,(front+backLimit)/2],`R2-15-L${l}-floor`);
  add('15',l,'slab',[m.centralWidth,m.slabThickness,m.centralProjection],[0,fy-m.slabThickness/2,front-m.centralProjection/2],`R2-15-L${l}-projection-floor`);
  spaces.push({id:`R2-L${l}-corridor`,level:l,kind:'corridor',bounds:[-w/2,c0,w/2,c1]});
  spaces.push({id:`R2-L${l}-central-function`,level:l,kind:'central-functional',uses:['broadcast-and-other-functions'],floorAssignment:'H unassigned',bounds:[-half,front-m.centralProjection,half,c0]});
  roomRow(l,fy,ceiling,front,c0,'front');if(l<=3)roomRow(l,fy,ceiling,c1,rear,'rear');
  // All classrooms open onto the central corridor, not an invented front-edge exterior gallery.
  for(const [row,z]of [['front',c0],...(l<=3?[['rear',c1]]:[])]){
   const cuts=portals.filter(v=>v.level===l&&v.row===row).map(v=>[v.x-v.width/2,v.x+v.width/2,fy,fy+2.5]);
   cuts.push([-1.5,1.5,fy,fy+m.doorHeight]);
   for(const [a,b]of bands)cuts.push([(a+b)/2-.75,(a+b)/2+.75,fy,fy+2.5]);
   wall('15',l,'z',z,-w/2,w/2,fy,ceiling,cuts,'corridor-wall');
  }
  for(const [a,b]of bands){
   spaces.push({id:`R2-L${l}-stair-${a}`,level:l,kind:'stairwell-reserved',bounds:[a,front,b,c0],note:'shell only; internal flights belong to circulation stage'});
   wall('15',l,'z',front+.12,a,b,fy,ceiling,[],'stair-front-blank');
  }
  for(const [a,b]of ranges){const cuts=[];
   for(const r of rooms.filter(r=>r.a>=a-1e-7&&r.b<=b+1e-7))for(const s of [-1,1]){const x=(r.a+r.b)/2+s*.95;cuts.push([x-m.windowWidth/2,x+m.windowWidth/2,fy+m.windowSill,fy+m.windowSill+m.windowHeight]);window(l,front+.10,x,fy+m.windowSill);}
   wall('15',l,'z',front+.12,a,b,fy,ceiling,cuts);
  }
  const cp=front-m.centralProjection,cd=l===1?[[-m.frontDoorWidth/2,m.frontDoorWidth/2,fy,fy+m.doorHeight]]:[[-1.9,1.9,fy+.7,fy+3.05]];
  wall('15',l,'z',cp+.12,-half,half,fy,ceiling,cd,'central-functional-front');
  for(const x of [-half,half])wall('15',l,'x',x,cp,front,fy,ceiling,[],'central-return');
  if(l>1)window(l,cp+.1,0,fy+.7,3.8,2.35);
  add('15',l,'cornice',[m.centralWidth+.15,.17,m.centralProjection+.16],[0,(j+1)*story-.08,front-m.centralProjection/2]);
  add('15',l,'cornice',[w,.14,.24],[0,(j+1)*story-.07,front+.10]);
  for(const x of [-w/2+.12,w/2-.12])wall('15',l,'x',x,front,backLimit,fy,ceiling,[[c0+.15,c1-.15,fy,fy+m.doorHeight]],'end-wall');
  if(l<=3){const cuts=[];
   for(const r of rooms)for(const s of [-1,1]){const x=(r.a+r.b)/2+s*.95;cuts.push([x-m.windowWidth/2,x+m.windowWidth/2,fy+m.windowSill,fy+m.windowSill+m.windowHeight]);window(l,rear-.12,x,fy+m.windowSill);}
   if(l===1)cuts.push([-1.5,1.5,fy,fy+m.doorHeight]);
   wall('15',l,'z',rear-.12,-w/2,w/2,fy,ceiling,cuts,'rear-wall');
  }
  if(upper){
   // The fifth corridor slab is the fourth corridor's canopy; the terrace is outside its edge.
   for(const x of [...ranges.flatMap(r=>r),...rooms.map(r=>(r.a+r.b)/2)].filter((v,i,a)=>a.indexOf(v)===i))add('15',l,'corridor-post',[.24,ceiling-fy,.24],[x,(fy+ceiling)/2,c1-.12]);
   if(l===5)rail('15',l,'z',c1-.06,-w/2+.15,w/2-.15,fy);
  }
  if(l===4){
   spaces.push({id:'R2-L4-terrace',level:4,kind:'open-terrace',bounds:[-w/2,c1,w/2,rear]});
   const n=18,pitch=w/n,pd=m.terrace.planterDepth,ph=m.terrace.planterHeight;
   for(let i=0;i<n;i++){const x=-w/2+(i+.5)*pitch,z=rear-pd/2;
    add('15',4,'planter-bottom',[pitch-.03,.12,pd],[x,fy+.25,z]);
    for(const s of [-1,1]){add('15',4,'planter-side',[pitch-.03,ph-.25,.10],[x,fy+.25+(ph-.25)/2,z+s*(pd-.10)/2]);add('15',4,'planter-end',[.10,ph-.25,pd],[x+s*(pitch-.13)/2,fy+.25+(ph-.25)/2,z]);}
    add('15',4,'planter-soil',[pitch-.24,.06,pd-.20],[x,fy+ph-.15,z]);
    for(const s of [-1,1])add('15',4,'planter-leg',[.22,.25,pd-.12],[x+s*pitch*.32,fy+.125,z]);
   }
   for(const x of [-w/2+.06,w/2-.06])rail('15',4,'x',x,c1,rear,fy);
  }
 }
 const h=m.floorCount*story;
 add('15',0,'roof',[w,.22,c1-front],[0,h+.11,(front+c1)/2],'R2-15-upper-roof');
 add('15',0,'roof',[m.centralWidth,.22,m.centralProjection],[0,h+.11,front-m.centralProjection/2]);
 for(const z of [front,c1])add('15',0,'roof-parapet',[w,.3,.22],[0,h+.37,z]);
 for(const x of [-w/2,w/2])add('15',0,'roof-parapet',[.22,.3,c1-front],[x,h+.37,(front+c1)/2]);
 const cu=m.cupola;add('15',0,'cupola-plinth',[cu.radius*2+.4,.24,cu.radius*2+.4],[0,h+.34,cu.z]);
 parts.push({id:'R2-cupola-drum',owner:'15',level:0,role:'cupola',shape:'cylinder',center:[0,h+.46+cu.drumHeight/2,cu.z],size:[cu.radius*2,cu.drumHeight,cu.radius*2]});
 parts.push({id:'R2-cupola-cap',owner:'15',level:0,role:'cupola',shape:'dome',center:[0,h+.46+cu.drumHeight,cu.z],size:[cu.radius*2,cu.capHeight,cu.radius*2]});
 const sp=m.sidePorch,px=w/2+sp.projection/2;
 add('15',1,'porch-landing',[sp.projection,.18,sp.width],[px,.04-.09,0],'R2-porch-landing');
 for(const z of [-1,1])add('15',1,'porch-post',[sp.postWidth,sp.roofHeight,sp.postWidth],[w/2+sp.projection-sp.postWidth/2,sp.roofHeight/2,z*(sp.width-sp.postWidth)/2]);
 add('15',1,'porch-roof',[sp.projection+.15,sp.roofThickness,sp.width+.15],[px,sp.roofHeight+sp.roofThickness/2,0]);
 add('15',1,'porch-trim',[sp.projection+.22,sp.trimHeight,sp.width+.22],[px,sp.roofHeight+sp.roofThickness+sp.trimHeight/2,0]);
 // Reuse the continuous body, full slabs, end doors and bridge gap on every effective level.
 for(const q of toiletParts(layout))parts.push({...q,shape:'box'});
 for(const b of layout.connections){
  add('bridge',b.level,'bridge-floor',[b.xEnd-b.xStart,.18,b.width],[(b.xStart+b.xEnd)/2,b.y+.04-.09,b.z],b.id);
  if(b.level>1)for(const s of [-1,1])rail('bridge',b.level,'z',b.z+s*b.width/2,b.xStart,b.xEnd,b.y+.04,'bridge-rail');
 }
 const origin=owner=>owner==='bridge'?[0,terrain.anchors['25'].floor,0]:[fac(owner).position[0],terrain.anchors[owner].floor,fac(owner).position[2]];
 const worldParts=parts.map(q=>({...q,center:q.center.map((v,i)=>v+origin(q.owner)[i])}));
 const [mx,,mz]=main.position,[wx,,wz]=wc.position,galleryX=wx+wc.size[0]/2-layout.toilet25.galleryWidth/2;
 for(const b of layout.connections){const y=terrain.anchors['15'].floor+b.y+.04;
  for(const sign of [-1,1])routes.push({id:`R2-L${b.level}-${sign<0?'A':'B'}`,level:b.level,points:[[mx+18,y,mz],[mx-w/2+.5,y,mz],[galleryX,y,wz],[galleryX,y,wz+sign*5.1],[wx-.1,y,wz+sign*5.1]]});
 }
 const axis=[{id:'08',x:fac('08').position[0],z:fac('08').position[2]},{id:'14-national',x:p.axis.flagCenterAfter[0],z:p.axis.flagCenterAfter[1]},{id:'15',x:mx,z:mz},{id:'18',x:fac('18').position[0],z:fac('18').position[2]}];
 const model={version:p.version,p,parts,worldParts,spaces,portals,routes,axis,horizontal:horizontalSnapshot(layout),mainFloor:terrain.anchors['15'].floor,toiletFloor:terrain.anchors['25'].floor,changes:layout.b01r2.changes};
 const exportData=()=>({version:p.version,input:p,parts,worldParts,spaces,portals,routes,axis,horizontal:model.horizontal,mainFloor:model.mainFloor,toiletFloor:model.toiletFloor,changes:model.changes,status:'IMPLEMENTED / REVIEW_PENDING'});
 return {...model,exportData};
}
export function b01R2Checks(base,layout,model,p){
 const out=[],put=(id,ok,detail=null)=>out.push({id,passed:!!ok,detail}),ps=model.parts,fac=(l,id)=>l.facilities.find(f=>f.id===id);
 put('R2_AXIS_ALL_FOUR',model.axis.length===4&&model.axis.every(a=>Math.abs(a.x-p.axis.x)<1e-7));
 put('R2_ONLY_AUTHORIZED_FACILITIES',base.facilities.every(a=>{const b=fac(layout,a.id),c=clone(a);if(p.axis.facilityShifts[a.id])c.position[0]+=p.axis.facilityShifts[a.id];if(['15','25'].includes(a.id)){c.floors=5;c.size[1]=19;}return eq(b,c);}));
 put('R2_ONLY_AUTHORIZED_ROAD_NODES',Object.entries(base.navigation.nodes).every(([id,a])=>{const c=clone(a);c[0]+=p.axis.nodeShifts[id]??0;return eq(c,layout.navigation.nodes[id]);}));
 put('R2_EDGES_WIDTHS_UNCHANGED',eq(base.navigation.edges,layout.navigation.edges)&&eq(base.navigation.edgeWidths,layout.navigation.edgeWidths));
 put('R2_NO_NEW_NODE_OR_SHORTCUT',eq(Object.keys(base.navigation.nodes),Object.keys(layout.navigation.nodes))&&eq(base.navigation.forbiddenEdges,layout.navigation.forbiddenEdges));
 put('R2_FIVE_LEVELS',p.main.floorCount===5&&[1,2,3,4,5].every(l=>ps.some(q=>q.id===`R2-15-L${l}-floor`)));
 put('R2_CENTRAL_CORRIDORS',model.spaces.filter(s=>s.kind==='corridor').length===5&&model.spaces.filter(s=>s.kind==='corridor').every(s=>s.bounds[1]===-1.4&&s.bounds[3]===1.4));
 for(let l=1;l<=5;l++)put('R2_ROOM_ROWS_L'+l,['front',...(l<=3?['rear']:[])].every(row=>model.spaces.filter(s=>s.level===l&&s.kind==='classroom'&&s.row===row).length===12)&&!(l>=4&&model.spaces.some(s=>s.level===l&&s.row==='rear')));
 put('R2_LIBRARY_ENTRY_ON_AXIS',Math.abs(layout.entrances.find(e=>e.id==='18-front').position[0]-p.axis.x)<1e-7);
 const fourth=model.mainFloor+11.44;
 put('R2_TERRACE_HAS_FLOOR',hasFloor(model,p.axis.x+18,fourth,228));
 put('R2_TERRACE_OPEN_SKY',!model.worldParts.some(q=>segmentBox([p.axis.x+18,fourth+.5,228],[p.axis.x+18,fourth+20,228],q)));
 put('R2_CORRIDOR_COVERED_ABOVE_L4',model.worldParts.some(q=>q.role==='slab'&&q.level===5&&segmentBox([p.axis.x+18,fourth+.5,224],[p.axis.x+18,fourth+5,224],q)));
 put('R2_NO_L5_REAR_SLAB',ps.filter(q=>q.owner==='15'&&q.level===5&&q.role==='slab').every(q=>q.center[2]+q.size[2]/2<=1.4+1e-7));
 put('R2_FUNCTIONAL_PROJECTION',ps.some(q=>q.role==='central-functional-front'&&q.center[2]<-8.5)&&p.main.centralRole==='broadcast-and-other-functional-spaces'&&!model.spaces.some(s=>s.kind==='stairwell-reserved'&&s.bounds[0]<0&&s.bounds[2]>0));
 put('R2_BLANK_STAIR_BANDS',ps.filter(q=>q.owner==='15'&&q.role==='glazing'&&q.center[2]<-6).every(q=>!p.main.stairBands.some(([a,b])=>q.center[0]>a&&q.center[0]<b))&&ps.filter(q=>q.role==='stair-front-blank').length>=10);
 put('R2_SIDE_PORCH',ps.filter(q=>q.role==='porch-post').length===2&&ps.some(q=>q.role==='porch-roof')&&ps.some(q=>q.role==='porch-landing'));
 put('R2_PAIRED_DATUM',model.mainFloor===model.toiletFloor);
 put('R2_FIVE_BRIDGES_AND_FULL_TOILET_SLABS',layout.connections.length===5&&ps.filter(q=>q.owner==='25'&&q.role==='slab').length===5&&ps.filter(q=>q.owner==='25'&&q.role==='slab').every(q=>q.size[0]===6&&q.size[2]===14.4));
 put('R2_BRIDGE_ENDS',layout.connections.every(b=>b.xStart===-7&&b.xEnd===24&&b.z===224&&b.width===2.1));
 for(const r of model.routes){let clear=true,support=true;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2]));for(let k=0;k<=n;k++)if(!hasFloor(model,a[0]+(b[0]-a[0])*k/n,a[1],a[2]+(b[2]-a[2])*k/n))support=false;for(const h of [.4,1.1,1.8])if(model.worldParts.some(q=>segmentBox([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],q)))clear=false;}put(r.id+'_SUPPORT',support);put(r.id+'_CLEAR',clear);}
 const y=model.mainFloor+1.7,mx=p.axis.x;
 for(const [id,a,b]of [['front',[mx,y,213],[mx,y,224]],['rear',[mx,y,224],[mx,y,235]],['underpass',[6.5,y,216],[6.5,y,239]],['side',[126,y,224],[119,y,224]]])put('R2_CLEAR_'+id,!model.worldParts.some(q=>segmentBox(a,b,q)));
 put('R2_IDS_UNIQUE',new Set(ps.map(q=>q.id)).size===ps.length);
 return {passed:out.every(c=>c.passed),results:out};
}
