/** B02: one parameter source, physical shell parts and access routes. No terrain replacement. */
export function applyB02Layout(base,p){
 const l=structuredClone(base),g=l.facilities.find(f=>f.id==='03'),m=l.facilities.find(f=>f.id==='24');
 g.size[1]=p.gym.height;m.size[1]=p.music.height;m.floors=p.music.floors;
 const front=l.entrances.find(e=>e.id==='03-front');
 if(front)Object.assign(front,{position:[g.position[0]+g.size[0]/2-p.gym.lobby.frontV,0,g.position[2]],facing:[1,0,0],entryDirection:[-1,0,0],approachPosition:[-20.5,0,45],porchDirection:[-1,0,0],status:'A main-road-facing entrance; P recessed front wall; H exact portal geometry'});
 const music=l.entrances.find(e=>e.id==='24-front');
 if(music)Object.assign(music,{position:[m.position[0]+p.music.entry.localX,0,m.position[2]+p.music.entry.localZ],facing:[0,0,1],entryDirection:[0,0,-1],status:'H existing registered ballfield-side doorway retained; no clear original entrance photograph'});
 // Preserve the archival input. Retire only its unsupported H portal, not the A contact.
 l.entrances=l.entrances.filter(e=>!['03-music','24-gym'].includes(e.id));
 for(const c of l.buildingContacts??[])if(c.id==='03-24-CONTACT')Object.assign(c,{portalOpen:false,portalWidth:0,portalHeight:0,evidence:'A attached bodies; H shared plane; closed wall, no assumed internal link'});
 l.batch02={version:p.version,status:p.status,retiredHypothesis:['03-music','24-gym'],unchangedRoadTopology:true};
 return l;
}
export function buildB02Model(layout,terrain,p){
 const gym=layout.facilities.find(f=>f.id==='03'),music=layout.facilities.find(f=>f.id==='24');
 const G=p.gym,M=p.music,fy=G.floorOffset,gy=fy+G.galleryRise,t=G.wallThickness,parts=[];
 const owners={'03':gym,'24':music},anchors=terrain.anchors;
 const local=(u,y,v)=>[gym.size[0]/2-v,y,-u];
 const world=(u,y,v)=>{const a=local(u,y,v);return [a[0]+gym.position[0],a[1]+anchors['03'].floor,a[2]+gym.position[2]];};
 const mw=(x,y,z)=>[x+music.position[0],y+anchors['24'].floor,z+music.position[2]];
 function box(owner,id,role,a,b,row=14,evidence='H'){
  const size=b.map((q,i)=>q-a[i]);if(size.some(q=>q<=0))throw Error('Invalid B02 box '+id);
  parts.push({id:'B02-'+owner+'-'+id,owner,role,shape:'box',center:a.map((q,i)=>(q+b[i])/2),size,row,evidence});
 }
 const gb=(id,role,u0,u1,y0,y1,v0,v1,row=14,e='H')=>box('03',id,role,local(u1,y0,v1),local(u0,y1,v0),row,e);
 const mb=(id,role,x0,x1,y0,y1,z0,z1,row=0)=>box('24',id,role,[x0,y0,z0],[x1,y1,z1],row);
 function prism(owner,id,role,points,offset,row=14,evidence='P/H'){
  parts.push({id:'B02-'+owner+'-'+id,owner,role,shape:'prism',points,offset,row,evidence});
 }
 const gp=(id,role,pts,delta,row=14,e='P/H')=>prism('03',id,role,pts.map(q=>local(...q)),[-delta[2],delta[1],-delta[0]],row,e);
 function rod(id,a,b,r=.043,row=6){parts.push({id:'B02-03-'+id,owner:'03',role:'railing',shape:'rod',a:local(...a),b:local(...b),radius:r,row,evidence:'H'});}
 function rail(id,a,b,base){
  rod(id+'-top',[a[0],base+1.02,a[1]],[b[0],base+1.02,b[1]]);
  rod(id+'-mid',[a[0],base+.51,a[1]],[b[0],base+.51,b[1]],.027);
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.4));
  for(let i=0;i<=n;i++)rod(id+'-post'+i,[a[0]+(b[0]-a[0])*i/n,base,a[1]+(b[1]-a[1])*i/n],[a[0]+(b[0]-a[0])*i/n,base+1.02,a[1]+(b[1]-a[1])*i/n],.035);
 }
 /** Subtract rectangles by partitioning a wall. Actual openings, not dark paint. */
 function panel(id,a,b,y0,y1,holes,emit){
  const xs=[a,b,...holes.flatMap(h=>[h[0],h[1]])].filter(x=>x>=a&&x<=b).sort((a,b)=>a-b);
  const ys=[y0,y1,...holes.flatMap(h=>[h[2],h[3]])].filter(y=>y>=y0&&y<=y1).sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){
   if(xs[i]-xs[i-1]<1e-6||ys[j]-ys[j-1]<1e-6)continue;
   const x=(xs[i]+xs[i-1])/2,y=(ys[j]+ys[j-1])/2;
   if(!holes.some(h=>x>h[0]&&x<h[1]&&y>h[2]&&y<h[3]))emit(id+'-'+i+'-'+j,xs[i-1],xs[i],ys[j-1],ys[j]);
  }
 }
 function frontFrame(id,u0,u1,y0,y1,v,row=6){
  for(const u of [u0,u1])gb(id+'-jamb'+u,'frame',u-.055,u+.055,y0,y1,v-.13,v+.04,row);
  for(const y of [y0,y1])gb(id+'-bar'+y,'frame',u0,u1,y-.05,y+.05,v-.13,v+.04,row);
 }
 // The current terrain's full-footprint foundation supplies the real floor at +0.04.
 // Do NOT stack another coplanar ground slab on it.
 const lf=G.lobby.frontV,lr=G.lobby.rearV,lh=G.lobby.halfWidth,dw=G.lobby.doorWidth;
 const lowHoles=[[-dw/2,dw/2,fy,fy+G.lobby.doorHeight],[-13.4,-5.4,.5,3.2],[5.4,13.4,.5,3.2]];
 panel('lobby-front',-lh,lh,fy,gy-.26,lowHoles,(id,a,b,c,d)=>gb(id,'lobby-wall',a,b,c,d,lf-t/2,lf+t/2));
 for(const [i,h]of lowHoles.slice(1).entries()){
  gb('lobby-window'+i,'window',h[0],h[1],h[2],h[3],lf+.02,lf+.075,4,'P/H');frontFrame('lobby-window'+i,h[0],h[1],h[2],h[3],lf-.03);
  for(let u=h[0]+1.33;u<h[1];u+=1.33)gb('lobby-mullion'+u,'frame',u-.04,u+.04,h[2],h[3],lf-.03,lf+.09,6);
 }
 frontFrame('main-door',-dw/2,dw/2,fy,fy+G.lobby.doorHeight,lf-.12);
 // Default open double leaves are parked along the jambs, never across the aperture.
 for(const sign of [-1,1]){
  gb('main-open-leaf'+sign,'open-door',sign*dw/2-.035,sign*dw/2+.035,fy+.05,3.02,lf+.2,lf+1.5,4);
  if(sign<0)gb('lobby-side'+sign,'lobby-wall',sign*lh-t/2,sign*lh+t/2,fy,gy-.26,lf,lr,14);
  else panel('right-lobby-wall',lf,13.2,fy,gy-.26,[[lf+.35,12.85,.5,3.4]],(id,a,b,c,d)=>gb(id,'lobby-wall',lh-t/2,lh+t/2,c,d,a,b,14));
 }
 panel('lobby-rear',-lh,lh,fy,gy-.26,[[-3.4,3.4,fy,3.14]],(id,a,b,c,d)=>gb(id,'lobby-wall',a,b,c,d,lr-t/2,lr+t/2));
 // Ground lobby ceiling / spectator floor, plus the projecting front platform.
 gb('lobby-ceiling','gallery-floor',-12.1,lh,gy-.26,gy,G.balcony.backV,lr,15);
 gb('gallery-front-strip','gallery-floor',-21,21,gy-.26,gy,0,.72,15);
 gb('gallery-front-deck','gallery-floor',G.balcony.leftEdge,21,gy-.26,gy,.72,G.balcony.backV,15);
 gb('fascia-lower','fascia',-21,21,G.balcony.fasciaBottom,gy-.04,-.08,.24,15,'P/H');
 gb('fascia-upper','parapet',-21,21,gy,G.balcony.parapetTop,-.06,.24,15,'P/H');
 gb('fascia-reveal','fascia',-21,21,gy-.04,gy,-.03,.23,16,'P/H');
 gb('parapet-cap','parapet',-21.06,21.06,G.balcony.parapetTop,G.balcony.parapetTop+.08,-.13,.31,14);
 for(let u=-20;u<=20;u+=1.3)gb('fascia-joint'+u,'joint',u-.013,u+.013,3.74,5.31,-.092,-.081,6);
 for(const u of [-14.6,-5.0,5.0,14.6])gb('front-column'+u,'column',u-.24,u+.24,fy,gy-.26,.84,1.39,14,'P/H');
 // Right gallery return and recessed lower side glazing, as visible in S03-017.
 gb('right-return-floor','gallery-floor',lh,21,gy-.26,gy,G.balcony.backV,13.2,15);
 gb('right-return-parapet','parapet',20.7,21,G.balcony.fasciaBottom,5.32,.24,13.2,15);
 gb('right-return-reveal','fascia',20.68,21.01,gy-.04,gy,.24,13.2,16);
 rail('stairwell-inner',[-15.84,.73],[-15.84,5.65],gy);
 rail('stairwell-front',[-20.85,.73],[-15.84,.73],gy);
 rail('right-return-end',[20.8,13.15],[18,13.15],gy);
 const fw=G.frontHalfWidth+(G.rearHalfWidth-G.frontHalfWidth)*G.glazing.frontV/G.roofDepth;
 const ud=G.glazing.upperDoorU,uw=G.glazing.upperDoorWidth,wv=G.glazing.frontV;
 const upperDoor=[ud-uw/2,ud+uw/2,gy,gy+3.1];
 panel('front-upper-sill',-fw,fw,gy,G.glazing.sill,[upperDoor],(id,a,b,c,d)=>gb(id,'spandrel',a,b,c,d,wv-.16,wv+.16,15));
 panel('front-glass',-fw,fw,G.glazing.sill,G.glazing.head,[upperDoor],(id,a,b,c,d)=>gb(id,'window',a,b,c,d,wv+.015,wv+.075,4,'P/H'));
 gb('front-spandrel','spandrel',-fw,fw,G.glazing.head,G.sign.bottom,wv-.05,wv+.22,14,'P/H');
 for(const u of [-fw,-7.6,0,7.6,fw])gb('upper-column'+u,'column',u-.2,u+.2,gy,G.sign.bottom,wv-.24,wv+.3,15,'P/H');
 for(let u=-15.5;u<fw;u+=1.55){if(u>upperDoor[0]&&u<upperDoor[1])continue;gb('front-mullion'+u,'frame',u-.037,u+.037,G.glazing.sill,G.glazing.head,wv-.035,wv+.09,6);}
 panel('front-transom',-fw,fw,6.61,6.7,[upperDoor],(id,a,b,c,d)=>gb(id,'frame',a,b,c,d,wv-.035,wv+.1,6));
 frontFrame('gallery-front-door',upperDoor[0],upperDoor[1],gy,gy+3.1,wv-.12);
 // Ring panel floats FORWARD of glazing on short concrete beams, not on the same plane.
 gb('ring-panel','upper-shell',-G.sign.width/2,G.sign.width/2,G.sign.bottom,G.sign.top,G.sign.v,G.sign.v+.3,14,'P/H');
 for(const u of [-14.7,-7.6,0,7.6,14.7])gb('eave-beam'+u,'upper-shell',u-.17,u+.17,G.sign.bottom-.32,G.sign.bottom,G.sign.v+.25,wv+.2,15);
 // Two tall long side plates, narrower at the front than the projecting balcony.
 const sideU=v=>G.frontHalfWidth+(G.rearHalfWidth-G.frontHalfWidth)*v/G.roofDepth;
 const sideBottom=v=>G.sign.bottom+(4.8-G.sign.bottom)*v/G.roofDepth;
 for(const sign of [-1,1]){
  gp('fold-'+sign,'upper-shell',[[sign*G.frontHalfWidth,G.sign.bottom,0],[sign*G.frontHalfWidth,G.height,0],[sign*G.rearHalfWidth,G.roofRearHeight,G.roofDepth],[sign*G.rearHalfWidth,4.8,G.roofDepth]],[sign*.2,0,0]);
  // Sloping side infill follows the fold, with a TRUE door on the left upper side.
  const s=G.stair,door=sign<0?[s.doorCenterV-s.doorWidth/2,s.doorCenterV+s.doorWidth/2,gy,gy+s.doorHeight]:null;
  const vs=[wv,8,door?.[0],door?.[1],16,(G.sign.bottom-8.15)/(G.sign.bottom-4.8)*G.roofDepth,20,24,28,32,36,40,G.roofDepth].filter(v=>v!==undefined).sort((a,b)=>a-b);
  const sidePart=(id,a,b,lo,hi,row=4)=>{
   if(hi<=lo+.001)return;
   gp(id,row===4?'window':'spandrel',[[sign*sideU(a),lo,a],[sign*sideU(b),lo,b],[sign*sideU(b),Math.min(hi,sideBottom(b)),b],[sign*sideU(a),Math.min(hi,sideBottom(a)),a]],[sign*.075,0,0],row);
  };
  for(let i=1;i<vs.length;i++){
   const a=vs[i-1],b=vs[i],mid=(a+b)/2,top=Math.max(sideBottom(a),sideBottom(b));
   const hole=door&&mid>door[0]&&mid<door[1];
   sidePart('side-glass-'+sign+'-'+i,a,b,hole?door[3]:gy,Math.min(8.15,top),4);
   if(top>8.15)sidePart('side-spandrel-'+sign+'-'+i,a,b,8.15,top,14);
   if(!hole){const u=sign*sideU(a);gb('side-mullion-'+sign+'-'+i,'frame',u-.07,u+.07,gy,sideBottom(a),a-.04,a+.04,6);}
  }
  if(door){
   for(const v of [door[0],door[1]]){const u=-sideU(v);gb('side-door-jamb'+v,'frame',u-.09,u+.09,gy,door[3],v-.06,v+.06,15);}
   gp('side-door-head','frame',[[ -sideU(door[0]),door[3],door[0]],[-sideU(door[1]),door[3],door[1]],[-sideU(door[1]),door[3]+.16,door[1]],[-sideU(door[0]),door[3]+.16,door[0]]],[.2,0,0],15,'H');
  }
 }
 // Folded roof plates share exact edges. No old roof remains underneath.
 const us=[-G.frontHalfWidth,-14.9,14.9,G.frontHalfWidth],ys=[G.height,G.sign.top,G.sign.top,G.height];
 const rearUs=[-G.rearHalfWidth,-20.3,20.3,G.rearHalfWidth];
 for(let i=0;i<3;i++)gp('roof-'+i,'upper-shell',[[us[i],ys[i],0],[us[i+1],ys[i+1],0],[rearUs[i+1],G.roofRearHeight,G.roofDepth],[rearUs[i],G.roofRearHeight,G.roofDepth]],[0,-G.roofThickness,0]);
 // Closed rear and lower flanks. The shared wall with music has NO portal.
 gb('rear-wall','wall',-21,21,fy,G.roofRearHeight-.22,41.68,42,14);
 for(const sign of [-1,1]){
  const u=sign*20.84;
  gb('rear-side-base'+sign,'wall',u-.16,u+.16,fy,gy,13.2,41.68,14);
  const a=13.2,b=41.68;gp('side-cornice'+sign,'fascia',[[sign*sideU(a),gy,a],[sign*21,gy,a],[sign*21,gy,b],[sign*sideU(b),gy,b]],[0,-.26,0],15);
  gb('side-cornice-edge'+sign,'fascia',u-.16,u+.16,gy-.28,gy+.3,13.2,41.68,15);
  if(sign>0){
   gb('side-lower-glass','window',15.36,15.43,.55,3.35,lf,13.2,4);
   for(let v=lf;v<13.2;v+=1.3)gb('side-lower-frame'+v,'frame',15.28,15.48,.5,3.4,v-.045,v+.045,6);
  }
 }
 // The exterior flight is LEFT (u<0), open above the full tread run.
 const s=G.stair,end=s.startV+s.steps*s.tread,rise=G.galleryRise/s.steps;
 for(let i=0;i<s.steps;i++)gb('stair-'+String(i+1).padStart(2,'0'),'spectator-step',s.u-s.width/2,s.u+s.width/2,fy,fy+(i+1)*rise,s.startV+i*s.tread,s.startV+(i+1)*s.tread,15);
 gb('upper-landing','gallery-floor',s.u-s.width/2-.15,-12.1,gy-.26,gy,end,end+s.landingDepth,15);
 const ig=G.insideGallery;
 gb('inside-aisle-front','gallery-floor',ig.u0,ig.u1,gy-.26,gy,G.balcony.backV,end,15);
 gb('inside-aisle','gallery-floor',ig.u0,ig.u1,gy-.26,gy,end+s.landingDepth,ig.v1,15);
 for(const u of [s.u-s.width/2-.07,s.u+s.width/2+.07]){
  rod('stair-rail'+u,[u,fy+1.02,s.startV],[u,gy+1.02,end]);
  rod('stair-mid'+u,[u,fy+.52,s.startV],[u,gy+.52,end],.027);
  for(let i=0;i<=s.steps;i+=4)rod('stair-post'+u+'-'+i,[u,fy+rise*i,s.startV+i*s.tread],[u,fy+rise*i+1.02,s.startV+i*s.tread],.035);
 }
 rail('landing-outer',[s.u-s.width/2-.07,end],[s.u-s.width/2-.07,end+s.landingDepth],gy);
 rail('landing-rear',[s.u-s.width/2-.07,end+s.landingDepth],[-sideU(end+s.landingDepth)-.1,end+s.landingDepth],gy);
 rail('aisle-inner',[ig.u1+.02,10.35],[ig.u1+.02,ig.v1],gy);
 rail('aisle-outer',[ig.u0-.02,end+s.landingDepth+.06],[ig.u0-.02,ig.v1],gy);
 rail('aisle-end',[ig.u0,ig.v1],[ig.u1,ig.v1],gy);
 // Short supported spectator circulation only; no invented full seating layout.
 for(const [u,y,row]of [[-4.3,14.2,9],[0,14.2,10],[4.3,14.2,11],[-2.15,12.65,12],[2.15,12.65,13]])parts.push({id:'B02-03-ring'+row,owner:'03',role:'emblem',shape:'ring',center:local(u,y,G.sign.v-.13),radius:1.55,tube:.09,row,evidence:'P/H'});
 gb('court-working-floor','floor',-10.5,14.5,.045,.065,12,39,7);
 for(const u of [-10.4,14.4])gb('court-line-u'+u,'marking',u-.03,u+.03,.066,.075,12,39,8);
 for(const v of [12.1,25.5,38.9])gb('court-line-v'+v,'marking',-10.4,14.4,.066,.075,v-.03,v+.03,8);
 // MUSIC: independent four-storey envelope, no extra connection building or bridge.
 const w=music.size[0],d=music.size[2],mt=M.wallThickness;
 function musicFacade(id,a,b,y0,y1,holes,axis,fixed){
  const emit=(id,x0,x1,z0,z1,role='wall',row=0,depth=mt)=>axis==='x'?mb(id,role,x0,x1,z0,z1,fixed-depth/2,fixed+depth/2,row):mb(id,role,fixed-depth/2,fixed+depth/2,z0,z1,x0,x1,row);
  panel(id,a,b,y0,y1,holes,(...v)=>emit(...v));
  for(const [i,h]of holes.entries()){
   const door=h[4]==='door';
   if(!door)emit(id+'-glass'+i,h[0]+.07,h[1]-.07,h[2]+.06,h[3]-.06,'window',4,.06);
   for(const x of [h[0],h[1]])emit(id+'-frame'+i+'-'+x,x-.045,x+.045,h[2],h[3],'frame',6,mt+.04);
   emit(id+'-head'+i,h[0],h[1],h[3]-.045,h[3]+.045,'frame',6,mt+.04);
   if(!door){emit(id+'-sill'+i,h[0]-.08,h[1]+.08,h[2]-.06,h[2]+.04,'sill',15,mt+.13);const x=(h[0]+h[1])/2;emit(id+'-mullion'+i,x-.036,x+.036,h[2],h[3],'frame',6,mt+.03);}
  }
 }
 for(let n=0;n<M.floors;n++){
  const y=M.floorOffset+n*M.storeyHeight,ceil=n===3?14.85:(n+1)*M.storeyHeight-.18;
  const holes=M.windows.frontCenters.map(x=>[x-M.windows.width/2,x+M.windows.width/2,y+M.windows.sill,y+M.windows.sill+M.windows.height]);
  if(n===0)holes[0]=[M.entry.localX-M.entry.width/2,M.entry.localX+M.entry.width/2,y,y+M.entry.height,'door'];
  musicFacade('front-L'+(n+1),-w/2,w/2,y,ceil,holes,'x',d/2-mt/2);
  // Shared segment x[-4,8] remains solid on every floor. Only the exposed west end can have windows.
  musicFacade('back-L'+(n+1),-w/2,w/2,y,ceil,[[-7.15,-4.85,y+.9,y+2.8]],'x',-d/2+mt/2);
  for(const sign of [-1,1])musicFacade('side'+sign+'-L'+(n+1),-d/2+mt,d/2-mt,y,ceil,M.windows.sideCenters.map(z=>[z-1.05,z+1.05,y+.9,y+2.8]),'z',sign*(w/2-mt/2));
  if(n>0)mb('floor-L'+(n+1),'floor',-w/2,w/2,n*M.storeyHeight-.18,y,-d/2,d/2,15);
  for(const sign of [-1,1])mb('belt'+n+'-'+sign,'belt',-w/2,w/2,ceil,ceil+.13,sign*(d/2-.02)-.07,sign*(d/2-.02)+.07,15);
 }
 mb('roof','roof',-8,8,14.85,15,-6,6,15);
 for(const z of [-5.86,5.86])mb('parapet-z'+z,'parapet',-8,8,15,15.2,z-.14,z+.14,0);
 for(const x of [-7.86,7.86])mb('parapet-x'+x,'parapet',x-.14,x+.14,15,15.2,-5.72,5.72,0);
 const e=M.entry,l=M.lobby;
 mb('lobby-rear','lobby-wall',l.x0,l.x1,M.floorOffset,3.62,l.z0-.16,l.z0+.16,0);
 mb('lobby-inner-side','lobby-wall',l.x1-.16,l.x1+.16,M.floorOffset,3.62,l.z0,5.68,0);
 for(const sign of [-1,1]){const x=e.localX+sign*(e.width/2+.025);mb('open-leaf'+sign,'open-door',x-.025,x+.025,.08,3.08,4.65,5.64,4);}
 mb('entry-small-canopy','canopy',e.localX-1.65,e.localX+1.65,3.22,3.4,5.68,6.65,15);
 // Routes use WORLD coordinates and current anchors. Floors remain actual P3/P4 datums.
 const routes=[];
 const ground=(x,z)=>[x,terrain.walkHeight(x,z),z];
 function entrySteps(owner,x,z){
  const st=terrain.stairs.find(s=>s.facilityId===owner);if(!st)throw Error('Missing inherited entrance steps '+owner);
  return terrain.stairParts(st).map(part=>[x??part.center[0],part.top,z??part.center[2]]);
 }
 const main=[ground(0,45),ground(-11,45),ground(-20.45,45),...entrySteps('03',null,45),world(0,fy,.12),world(0,fy,lf-.45),world(0,fy,lf+.45),world(0,fy,7.3)];
 const stair=[ground(0,63),ground(-11,63),ground(-20.45,63),...entrySteps('03',null,63),world(s.u,fy,.12),world(s.u,fy,s.startV-.05)];
 for(let i=0;i<s.steps;i++)stair.push(world(s.u,fy+(i+1)*rise,s.startV+(i+.5)*s.tread));
 stair.push(world(s.u,gy,end+.16),world(s.u,gy,s.doorCenterV),world(-14,gy,s.doorCenterV),world(-14,gy,18));
 const frontGallery=[world(-14,gy,s.doorCenterV),world(ud,gy,6.3),world(ud,gy,4.3),world(0,gy,3.3)];
 const musicRoute=[ground(-68,84),ground(-68,80.24),...entrySteps('24',null,null),mw(-6,M.floorOffset,5.95),mw(-6,M.floorOffset,5.35),mw(-6,M.floorOffset,3.2)];
 const loopIds=['junction-gym','gym-loop-north','gym-loop-west-north','gym-loop-west-south','music-approach','sports-front','junction-sports','gym-main-junction','junction-gym'];
 // Follow the existing NONLINEAR terrain profile; do not interpolate one straight
 // elevation between distant road nodes. No node, road width or surface is changed.
 const loop=[];
 for(let i=1;i<loopIds.length;i++){
  const a=layout.navigation.nodes[loopIds[i-1]],b=layout.navigation.nodes[loopIds[i]],N=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.5);
  for(let j=i===1?0:1;j<=N;j++)loop.push(ground(a[0]+(b[0]-a[0])*j/N,a[2]+(b[2]-a[2])*j/N));
 }
 for(const [id,label,points]of [['gym-main','主路→低台阶→真门洞→门厅',main],['spectator','前坪→左外梯→上层侧门→短观赛廊',stair],['front-platform','观赛层→前平台真正门洞',frontGallery],['music','绕馆路→既有门前台阶→音乐楼门厅',musicRoute],['loop','组团外缘连续绕馆路；不穿共享墙',loop]])routes.push({id,label,points});
 const portals=[
  {id:'gym-main',owner:'03',center:world(0,fy+1.5,lf),normal:[1,0,0],width:dw,height:G.lobby.doorHeight,floor:world(0,fy,lf)[1]},
  {id:'spectator',owner:'03',center:world(-sideU(s.doorCenterV),gy+1.5,s.doorCenterV),normal:[(G.rearHalfWidth-G.frontHalfWidth)/G.roofDepth,0,1],width:s.doorWidth,height:s.doorHeight,floor:world(0,gy,0)[1]},
  {id:'front-platform',owner:'03',center:world(ud,gy+1.5,wv),normal:[1,0,0],width:uw,height:3.1,floor:world(0,gy,0)[1]},
  {id:'music',owner:'24',center:mw(e.localX,M.floorOffset+1.5,e.localZ),normal:[0,0,1],width:e.width,height:e.height,floor:mw(0,M.floorOffset,0)[1]}
 ];
 return {version:p.version,status:p.status,parts,routes,portals,anchors:{'03':anchors['03'],'24':anchors['24']},world,mw,sideU,loopIds,
  summary:{gymFootprint:[...gym.size],musicFootprint:[...music.size],galleryAbsolute:anchors['03'].floor+gy,gymTopAbsolute:anchors['03'].floor+G.height,musicFloors:M.floors,sharedWall:M.sharedWall,terrainUnchanged:true}};
}
