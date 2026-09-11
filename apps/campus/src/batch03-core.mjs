/** B03: source-controlled building solids, real openings and local terrain amendment.
 * Coordinates in parameters are H metres; only relationships marked A are alumni testimony.
 */
const clamp=v=>Math.max(0,Math.min(1,v));
export function applyB03Layout(base,p){
 const l=structuredClone(base);
 for(const id of ['18','11']){const f=l.facilities.find(f=>f.id===id),s=id==='18'?p.library:p.canteen;f.floors=s.floors;f.size[1]=s.floors*s.floorHeight;f.note=s.basis;}
 const entries=[{id:'18-front',facilityId:'18',position:[73,0,p.library.doorZ],facing:[0,0,-1],width:p.library.doorWidth,status:'A axis and approach; P recessed front entrance; H exact doorway'},
 {id:'18-rear',facilityId:'18',position:[73,0,260.5],facing:[0,0,1],width:p.library.rearDoorWidth,status:'H minimal lobby exit to A rear garden'},
 {id:'18-spiral',facilityId:'18',position:[p.spiral.center[0]-(p.spiral.innerRadius+p.spiral.outerRadius)/2,0,260.5],facing:[0,0,1],status:'P curved stair / H exact upper doorway'},
 {id:'11-front',facilityId:'11',position:[p.canteen.doorX,0,p.canteen.stair.centerZ],facing:[-1,0,0],width:p.canteen.doorWidth,status:'P stair/upper entrance; H recessed wall and level'},
 {id:'12-front',facilityId:'12',position:[p.shop.doorX,0,p.shop.doorZ],facing:[-1,0,0],width:p.shop.doorWidth,status:'R canteen lower shop / H retained location and open doorway'}];
 for(const e of entries){const i=l.entrances.findIndex(q=>q.id===e.id);if(i<0)l.entrances.push(e);else l.entrances[i]={...l.entrances[i],...e};}
 l.batch03={version:p.version,status:p.status,relatedFacilities:['18','19','11','12'],localException:'A library approach climbs; H local terrain lift only behind z232.8. Existing road nodes/widths and facility X/Z unchanged.'};
 return l;
}
export function adaptB03Terrain(base,layout,p){
 const s=p.terrain,anchors=structuredClone(base.anchors);
 const lift=(x,z)=>s.rise*clamp((x-s.leftStartX)/(s.leftPlateauX-s.leftStartX))*clamp((s.rightEndX-x)/(s.rightEndX-s.rightPlateauX))*clamp((z-s.startZ)/(s.crestZ-s.startZ))*clamp((s.endZ-z)/(s.endZ-s.endPlateauZ));
 const groundHeight=(x,z)=>base.groundHeight(x,z)+lift(x,z);
 anchors['18']={...anchors['18'],site:base.anchors['18'].site+s.rise,floor:base.anchors['18'].floor+s.rise,evidence:['A uphill approach','P entrance low steps','H local +1.20m terrain / +0.45m entrance rise']};
 anchors['19']={...anchors['19'],site:base.anchors['19'].site+s.rise,floor:base.anchors['19'].floor+s.rise};
 const stairs=base.stairs.map(q=>q.facilityId==='18'?{...q,base:q.base+s.rise,top:q.top+s.rise}:q);
 function walkHeight(x,z){for(const st of stairs){const q=base.stairCoordinate(st,x,z);if(q.t>=0&&q.t<=1&&Math.abs(q.side)<=st.width/2)return st.base+.04+Math.ceil(q.t*st.steps-1e-8)*st.rise/st.steps;}return groundHeight(x,z)+.04;}
 return {...base,anchors,stairs,groundHeight,walkHeight,tileHeight:(kind,x,z)=>base.tileHeight(kind,x,z)+lift(x,z),b03Lift:lift,exportData:()=>({...base.exportData(),batch03:p.terrain,anchors,stairs})};
}
export function buildB03Model(layout,terrain,p){
 const fs=Object.fromEntries(layout.facilities.filter(f=>f.position).map(f=>[f.id,f])),parts=[],portals=[],routes=[];
 const origin=id=>[fs[id].position[0],terrain.anchors[id]?.floor??0,fs[id].position[2]],loc=(id,q)=>q.map((n,i)=>n-origin(id)[i]);
 function box(id,name,role,a,b,row=14,evidence='H'){if(b.some((v,i)=>v<=a[i]))throw Error('Invalid B03 box '+name);parts.push({id:`B03-${id}-${name}`,owner:id,shape:'box',role,center:loc(id,a.map((v,i)=>(v+b[i])/2)),size:b.map((v,i)=>v-a[i]),row,evidence});}
 function poly(id,name,role,points,y0,y1,row=6,evidence='H'){parts.push({id:`B03-${id}-${name}`,owner:id,shape:'poly',role,points:points.map(q=>[q[0]-origin(id)[0],q[1]-origin(id)[2]]),y0:y0-origin(id)[1],y1:y1-origin(id)[1],row,evidence});}
 function rod(id,name,a,b,r=.04,row=6,role='railing'){parts.push({id:`B03-${id}-${name}`,owner:id,shape:'rod',role,a:loc(id,a),b:loc(id,b),radius:r,row,evidence:'P/H'});}
 function leaf(id,name,q,size,row=13){parts.push({id:`B03-${id}-${name}`,owner:id,shape:'leaf',role:'planting',center:loc(id,q),size,row,evidence:'P foliage coverage / H exact leaves'});}
 function panel(a,b,y0,y1,holes,emit){const xs=[...new Set([a,b,...holes.flatMap(h=>[h[0],h[1]])].filter(x=>x>=a&&x<=b))].sort((a,b)=>a-b),ys=[...new Set([y0,y1,...holes.flatMap(h=>[h[2],h[3]])].filter(x=>x>=y0&&x<=y1))].sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){const x=(xs[i]+xs[i-1])/2,y=(ys[j]+ys[j-1])/2;if(!holes.some(h=>x>h[0]&&x<h[1]&&y>h[2]&&y<h[3]))emit(i+'-'+j,xs[i-1],xs[i],ys[j-1],ys[j]);}}
 function wall(id,name,axis,k,a,b,y0,y1,holes=[],row=14,t=.24){const emit=(n,u,v,lo,hi,r=row,th=t,at=k)=>axis==='x'?box(id,name+n,'wall',[u,lo,at-th/2],[v,hi,at+th/2],r):box(id,name+n,'wall',[at-th/2,lo,u],[at+th/2,hi,v],r);panel(a,b,y0,y1,holes,(n,...v)=>emit(n,...v));}
 function frame(id,name,axis,k,a,b,y0,y1,row=6,glass=true){const B=(n,u,v,lo,hi,r,th=.10)=>axis==='x'?box(id,name+n,r===4?'window':'frame',[u,lo,k-th/2],[v,hi,k+th/2],r):box(id,name+n,r===4?'window':'frame',[k-th/2,lo,u],[k+th/2,hi,v],r);for(const u of [a,b])B('j'+u,u-.045,u+.045,y0,y1,row);for(const y of [y0,y1])B('h'+y,a,b,y-.045,y+.045,row);if(glass){B('glass',a+.05,b-.05,y0+.05,y1-.05,4,.035);const n=Math.max(1,Math.round((b-a)/1.05));for(let i=1;i<n;i++){const u=a+(b-a)*i/n;B('m'+i,u-.029,u+.029,y0,y1,row);}B('transom',a,b,y1-.55,y1-.50,row);}}
 function door(id,name,axis,k,center,floor,width,height,row=20){frame(id,name,axis,k,center-width/2,center+width/2,floor,floor+height,row,false);const normal=axis==='x'?[0,0,k<253?-1:1]:[-1,0,0],q=axis==='x'?[center,floor,k]:[k,floor,center];portals.push({id:name,facility:id,center:q,normal,width:width-.1,height:height-.08,floor});
  for(const s of [-1,1]){const u=center+s*(width/2-.055);if(axis==='x')box(id,name+'open'+s,'open-door',[u-.035,floor+.05,k+.18],[u+.035,floor+height-.07,k+1.18],row);else box(id,name+'open'+s,'open-door',[k+.18,floor+.05,u-.035],[k+1.18,floor+height-.07,u+.035],row);}}
 function rail(id,name,a,b,y,height=1.05){rod(id,name+'top',[a[0],y+height,a[1]],[b[0],y+height,b[1]]);rod(id,name+'mid',[a[0],y+.52,a[1]],[b[0],y+.52,b[1]],.025);const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/1.1);for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;rod(id,name+'p'+i,[x,y,z],[x,y+height,z],.032);}}
 const L=p.library,ly=terrain.anchors['18'].floor+L.floorOffset,gy=terrain.anchors['19'].floor+.04,lh=L.floorHeight;
 // Library: hollow, retained envelope; recessed lower entrance and large glazed window bays.
 const front=245.5,rear=260.5,left=45.5,right=100.5;
 for(let f=0;f<L.floors;f++){
  const y=ly+f*lh,holes=[];
  for(const x of [49.2,55.4,61.6,67.8,78.2,84.4,90.6,96.8]){if(f===0&&x>65&&x<81)continue;holes.push([x-2.1,x+2.1,y+1.0,y+3.15]);frame('18','frontWin'+f+'-'+x,'x',front-.02,x-2.1,x+2.1,y+1,y+3.15);}
  if(f===0){wall('18','frontL','x',front,left,67,y,y+lh,holes);wall('18','frontR','x',front,79,right,y,y+lh,holes);wall('18','recess','x',L.doorZ,67,79,y,y+lh,[[71.1,74.9,y,y+L.doorHeight],[70.4,75.6,y+L.doorHeight,y+3.25]]);wall('18','returnL','z',67,front,L.doorZ,y,y+lh);wall('18','returnR','z',79,front,L.doorZ,y,y+lh);door('18','library-main','x',L.doorZ,73,y,L.doorWidth,L.doorHeight);frame('18','mainTransom','x',L.doorZ-.03,70.4,75.6,y+L.doorHeight+.06,y+3.25,20);for(let j=0;j<5;j++)box('18','entryLouvre'+j,'louvre',[70.4,y+3.30+j*.065,L.doorZ-.08],[75.6,y+3.325+j*.065,L.doorZ+.025],20);box('18','blueNotice','notice-panel',[67.8,y+.7,L.doorZ-.16],[70,y+2.9,L.doorZ-.13],21);}
  else{holes.push([70.5,75.5,y+1,y+3.15]);frame('18','centralWindow'+f,'x',front-.02,70.5,75.5,y+1,y+3.15);wall('18','front'+f,'x',front,left,right,y,y+lh,holes);}
  for(const k of [left,right]){const h=[[248.5,251,y+1,y+3.05],[254,257.7,y+1,y+3.05]];wall('18','side'+f+'-'+k,'z',k,front,rear,y,y+lh,h);for(const [i,v]of h.entries())frame('18','sideW'+f+'-'+k+'-'+i,'z',k,...v);}
  const rholes=[],topX=p.spiral.center[0]-(p.spiral.innerRadius+p.spiral.outerRadius)/2;
  for(const x of [49.5,60.6,66.8,79.2,85.4,91.6,97]){rholes.push([x-2.0,x+2.0,y+.95,y+3.1]);frame('18','rearW'+f+'-'+x,'x',rear+.03,x-2,x+2,y+.95,y+3.1);}
  if(f===0){rholes.push([71.6,74.4,y,y+2.8]);door('18','library-garden','x',rear,73,y,2.8,2.8);}
  if(f===1){rholes.push([topX-1.25,topX+1.25,y,y+2.8]);door('18','spiral-upper','x',rear,topX,y,2.5,2.8);}
  wall('18','rear'+f,'x',rear,left,right,y,y+lh,rholes);
  if(f>0)box('18','floor'+f,'floor',[left,y-.22,front],[right,y,rear],15);
  box('18','band'+f,'cornice',[left-.10,y+lh-.12,front-.20],[right+.10,y+lh+.07,front+.22],15);
 }
 // A short ground lobby connects real front and rear doors. Empty adjacent rooms are not a finished interior.
 for(const x of [69.4,76.6])wall('18','lobbySide'+x,'z',x,L.doorZ,rear,ly,ly+lh-.22,[],14,.18);
 box('18','roof','roof',[left-.35,ly+3*lh-.02,front-.4],[right+.35,ly+3*lh+.20,rear+.35],15);
 for(const z of [front,rear])box('18','roofParapet'+z,'parapet',[left,ly+3*lh+.2,z-.13],[right,ly+3*lh+.58,z+.13],14);
 // A covered rear landing and upper receiving platform are part of the building, not floating stair doors.
 box('18','rearGroundLanding','floor',[49,ly-.24,rear],[79,ly,262.4],15);
 box('18','rearUpperLanding','floor',[49,ly+lh-.24,rear],[66.5,ly+lh,262.2],15);
 const topX=p.spiral.center[0]-(p.spiral.innerRadius+p.spiral.outerRadius)/2;
 rail('18','upperEdgeL',[49,262.2],[topX-1.18,262.2],ly+lh);rail('18','upperEdgeR',[topX+1.18,262.2],[66.5,262.2],ly+lh);rail('18','upperEnd',[66.5,260.5],[66.5,262.2],ly+lh);
 for(const x of [49.3,65.7,78.7])box('18','rearColumn'+x,'column',[x-.15,gy,262.15],[x+.15,ly+lh-.24,262.45],14);
 for(let i=0;i<3;i++)box('18','gardenStep'+i,'step',[71.3,gy,263.6-.4*(i+1)],[74.7,gy+.15*(i+1),263.6-.4*i],6);
 // Photo-visible green lower dado; no foliage may cover door clearance.
 wall('18','rearDado','x',rear+.14,left,right,ly,ly+.8,[[71.5,74.5,ly,ly+.8]],13,.035);
 let seed=3050;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(const [n,x0,x1,y0,y1,z]of [['left',46,66,ly+.4,ly+7.8,front-.19],['head',67,79,ly+3.8,ly+5.0,front-.22],['right',81,90,ly+.5,ly+5.0,front-.18]])for(let i=0;i<160;i++){const x=x0+rnd()*(x1-x0),y=y0+rnd()*(y1-y0);if(Math.sin(x*1.1+y*.5)+Math.sin(y*1.7)<-.45)continue;leaf('18','ivy-'+n+'-'+i,[x,y,z],[.19+rnd()*.16,.18+rnd()*.17,.08],i%3?13:1);}
 // Wide curved stair: annular concrete treads and open central well (no pole).
 const S=p.spiral,[cx,cz]=S.center,rm=(S.innerRadius+S.outerRadius)/2,xy=(r,a)=>[cx+r*Math.cos(a),cz+r*Math.sin(a)],arc=(r,a,b,n=4)=>Array.from({length:n+1},(_,i)=>xy(r,a+(b-a)*i/n));
 const stairPoints=[[cx+rm,ly,261.7]];
 for(let i=0;i<S.steps;i++){
  const a=S.startAngle+i*S.sweep/S.steps,b=S.startAngle+(i+1)*S.sweep/S.steps,y=ly+(i+1)*S.rise/S.steps;
  poly('19','curvedTread'+i,'step',[...arc(S.outerRadius,a,b),...arc(S.innerRadius,b,a)],y-.23,y,6,'P curved flight / H tread dimensions');
  poly('19','innerParapet'+i,'parapet',[...arc(S.innerRadius+.13,a,b),...arc(S.innerRadius-.06,b,a)],y-.30,y+.78,14,'P tiled inner parapet');
  for(const r of [S.innerRadius+.025,S.outerRadius-.08]){const qa=xy(r,a),qb=xy(r,b),ya=ly+i*S.rise/S.steps;rod('19','curveRail'+i+'-'+r,[qa[0],ya+1.01,qa[1]],[qb[0],y+1.01,qb[1]],.045,16);if(i%2===0)rod('19','curvePost'+i+'-'+r,[qa[0],ya+.02,qa[1]],[qa[0],ya+1.01,qa[1]],.031,16);}
  const q=xy(rm,(a+b)/2);stairPoints.push([q[0],y,q[1]]);
 }
 stairPoints.push([topX,ly+lh,261.7],[topX,ly+lh,259.1],[topX,ly+lh,257.9]);
 // Garden stone terrace and curved low basin/seat edge, exactly linked to the rear steps.
 const B=p.garden.pavingBounds;
 for(let z=B[1];z<B[3];z+=1)for(let x=B[0];x<B[2];x+=1){const xe=Math.min(x+1,B[2]),ze=Math.min(z+1,B[3]),y=terrain.groundHeight((x+xe)/2,(z+ze)/2)+.035;box('19','pave'+x+'-'+z,'paving',[x,y-.10,z],[xe,y,ze],(Math.floor(x+z)%11===0)?6:2);}
 const [pcx,pcz]=p.garden.pondCenter,[rx,rz]=p.garden.pondRadius,n=64,outline=Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,r=1+.07*Math.sin(3*a);return [pcx+rx*r*Math.cos(a),pcz+rz*r*Math.sin(a)];});
 poly('19','basin','basin',outline,gy+.03,gy+.11,4,'P curved depression / H dark surface state');
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,q=outline[i],r=outline[(i+1)%n],qa=[q[0]+.32*Math.cos(a),q[1]+.32*Math.sin(a)],rb=[r[0]+.32*Math.cos(b),r[1]+.32*Math.sin(b)];poly('19','basinEdge'+i,'seat-edge',[q,r,rb,qa],gy,gy+.42,14,'P low curved edge / H dimensions');}
 for(const [i,t]of p.garden.trees.entries()){const [x,z,h,r]=t,by=terrain.groundHeight(x,z);box('19','bed'+i,'planter',[x-r,by,z-r*.65],[x+r,by+.42,z+r*.65],6);box('19','soil'+i,'planting',[x-r+.12,by+.42,z-r*.65+.12],[x+r-.12,by+.47,z+r*.65-.12],1);rod('19','trunk'+i,[x,by+.46,z],[x-.15,by+h-.2,z+.1],.15,11,'tree-trunk');for(let j=0;j<7;j++)leaf('19','crown'+i+'-'+j,[x+(rnd()-.5)*r,by+h+(rnd()-.4)*r,z+(rnd()-.5)*r],[r*.74,r*.53,r*.74],j%2?1:13);}
 // Canteen: lower shop/undercroft + dining entrance one level up. Stair stays inside the existing footprint.
 const C=p.canteen,cy=terrain.anchors['11'].floor+C.floorOffset,ch=C.floorHeight,dy=cy+ch,st=C.stair,z0=st.centerZ-st.width/2,z1=st.centerZ+st.width/2;
 box('11','groundFloor','floor',[145,cy-.18,141],[189,cy,163],6);
 for(const x of [145.35,166,188.65])for(const z of [141.4,153.0,162.6])box('11','baseColumn'+x+'-'+z,'column',[x-.19,cy,z-.19],[x+.19,dy-.24,z+.19],14);
 // Divided upper slab leaves the entire real stairwell empty, with a landing at its end.
 box('11','diningSlabRear','floor',[151,dy-.24,141],[189,dy,163],15);
 box('11','diningSlabNorth','floor',[145,dy-.24,141],[151,dy,z0],15);
 box('11','diningSlabSouth','floor',[145,dy-.24,z1],[151,dy,163],15);
 for(let f=1;f<C.floors;f++){
  const y=cy+f*ch,holes=[];
  for(const z of [144.2,149.7]){holes.push([z-2.1,z+2.1,y+.9,y+3.0]);frame('11','westWin'+f+'-'+z,'z',144.96,z-2.1,z+2.1,y+.9,y+3.0);}
  if(f===1){wall('11','westNorth','z',145,141,z0,y,y+ch,holes);wall('11','westSouth','z',145,z1,163,y,y+ch);wall('11','entryRecess','z',C.doorX,z0,z1,y,y+ch,[[st.centerZ-C.doorWidth/2,st.centerZ+C.doorWidth/2,y,y+C.doorHeight]]);door('11','canteen-main','z',C.doorX,st.centerZ,y,C.doorWidth,C.doorHeight,6);wall('11','recessReturn','x',z0,145,C.doorX,y,y+ch);wall('11','recessReturnS','x',z1,145,C.doorX,y,y+ch);}
  else{holes.push([154.8,159.9,y+.9,y+3.0]);frame('11','westWinUpper','z',144.96,154.8,159.9,y+.9,y+3);wall('11','westUpper','z',145,141,163,y,y+ch,holes);box('11','upperSlab','floor',[145,y-.24,141],[189,y,163],15);}
  for(const z of [141,163]){const hs=[];for(let x=150;x<188;x+=6.8){hs.push([x-2.4,x+2.4,y+.9,y+2.9]);frame('11','sideWin'+f+'-'+x+'-'+z,'x',z,x-2.4,x+2.4,y+.9,y+2.9);}wall('11','longSide'+f+'-'+z,'x',z,145,189,y,y+ch,hs);}
  wall('11','back'+f,'z',189,141,163,y,y+ch,[[143,148,y+1,y+2.9],[153,159,y+1,y+2.9]]);for(const q of [[143,148],[153,159]])frame('11','backWin'+f+'-'+q[0],'z',189,...q,y+1,y+2.9);
 }
 for(let i=0;i<st.steps;i++){const a=st.startX+(st.endX-st.startX)*i/st.steps,b=st.startX+(st.endX-st.startX)*(i+1)/st.steps;box('11','entryTread'+i,'step',[a,cy,z0],[b,cy+(i+1)*st.rise/st.steps,z1],6,'P broad entry stair / H exact count');}
 for(const z of [z0+.10,z1-.10]){rod('11','stairRail'+z,[145,cy+1.03,z],[151,dy+1.03,z],.05);for(let i=0;i<=st.steps;i+=3){const x=145+6*i/st.steps,y=cy+st.rise*i/st.steps;rod('11','stairPost'+z+'-'+i,[x,y,z],[x,y+1.03,z],.033);}}
 box('11','lobbyBack','wall',[161.3,dy,154.4],[161.5,dy+ch-.24,162],14);
 box('11','roof','roof',[144.7,cy+3*ch,140.7],[189.3,cy+3*ch+.24,163.3],15);
 for(const z of [141,163])box('11','roofEdge'+z,'parapet',[145,cy+3*ch+.24,z-.12],[189,cy+3*ch+.67,z+.12]);
 // Shop remains wholly within 11. All lower legacy solid shop blocks will be bypassed.
 const K=p.shop,ky=terrain.anchors['12'].floor+.04,kz=K.doorZ;
 wall('12','shopFront','z',K.doorX,144,154,ky,ky+3.35,[[kz-K.doorWidth/2,kz+K.doorWidth/2,ky,ky+K.doorHeight]]);door('12','shop-main','z',K.doorX,kz,ky,K.doorWidth,K.doorHeight,6);
 for(const z of [144,154])wall('12','shopSide'+z,'x',z,151,165,ky,ky+3.35);wall('12','shopBack','z',165,144,154,ky,ky+3.35);box('12','shopCeiling','floor',[151,ky+3.32,144],[165,ky+3.48,154],15);
 // Short new access paving, joined to existing road/terrain, never crossing another building.
 function path(id,name,ps,width=2.2){for(let k=1;k<ps.length;k++){const a=ps[k-1],b=ps[k],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/.5),nx=-dz/len*width/2,nz=dx/len*width/2;for(let i=0;i<n;i++){const x=a[0]+dx*i/n,z=a[1]+dz*i/n,xx=a[0]+dx*(i+1)/n,zz=a[1]+dz*(i+1)/n,y=terrain.groundHeight((x+xx)/2,(z+zz)/2)+.04;poly(id,name+k+'-'+i,'paving',[[x+nx,z+nz],[xx+nx,zz+nz],[xx-nx,zz-nz],[x-nx,z-nz]],y-.15,y,2);}}}
 path('19','westGardenPath',[[73,242],[43,242],[43,269],[68,269],[73,270]],2.4);path('11','canteenApproach',[[142,152],[142,157.5],[145,157.5]],2.4);path('12','shopApproach',[[142,152],[142,149],[151,149]],2.4);path('11','perimeterWalk',[[142,166],[142,137],[192,137],[192,166]],2.2);
 const gp=ps=>{const result=[];for(let k=1;k<ps.length;k++){const a=ps[k-1],b=ps[k],n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.4);for(let i=0;i<n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;result.push([x,terrain.groundHeight(x,z)+.04,z]);}}const a=ps.at(-1);result.push([a[0],terrain.groundHeight(...a)+.04,a[1]]);return result;};
 const libSteps=Array.from({length:3},(_,i)=>[73,terrain.anchors['18'].site+.04+(i+1)*.15,243.6+1.9*(i+.5)/3]);
 const libEnd=[...libSteps,[73,ly,245.5],[73,ly,246.4],[73,ly,248.0],[73,ly,251.0]];
 routes.push({id:'main-library',label:'主楼后门—上坡—图书馆门厅',points:[...gp([[73,232.8],[73,239],[73,243.6]]),...libEnd]});
 routes.push({id:'gap-library',label:'15/25桥下—后路—图书馆',points:[...gp([[6.5,224],[6.5,238],[30,239],[73,239],[73,243.6]]),...libEnd]});
 const rearSteps=Array.from({length:3},(_,i)=>[73,ly-.15*i,262.6+.4*i]);
 routes.push({id:'library-garden',label:'图书馆短门厅—后门—后花园',points:[[73,ly,251],[73,ly,258.8],[73,ly,261.4],[73,ly,262.35],...rearSteps,...gp([[73,263.8],[73,270],[68,270]])]});
 routes.push({id:'garden-around',label:'图书馆西侧绕行至后花园',points:gp([[73,242],[43,242],[43,269],[68,269],[73,270]])});
 routes.push({id:'garden-spiral',label:'后花园—低台阶—弧梯—二层真门洞',points:[...gp([[73,270],[73,263.8]]),...rearSteps.toReversed(),[73,ly,261.3],[cx+rm,ly,261.3],...stairPoints]});
 const foodSteps=Array.from({length:st.steps},(_,i)=>[st.startX+(st.endX-st.startX)*(i+.5)/st.steps,cy+(i+1)*st.rise/st.steps,st.centerZ]);
 routes.push({id:'canteen',label:'已有道路—食堂宽梯—上层门厅',points:[...gp([[142,152],[142,157.5],[145,157.5]]),...foodSteps,[151.3,dy,157.5],[153,dy,157.5],[155.2,dy,157.5],[159,dy,157.5]]});
 routes.push({id:'shop',label:'已有道路—食堂下层小卖部',points:[...gp([[142,152],[142,149],[150.2,149]]),[151.7,ky,149],[155,ky,149]]});
 routes.push({id:'canteen-perimeter',label:'食堂外围通行／H局部外缘步道',points:gp([[139,181],[142,166],[142,152],[142,137],[168,137],[192,137],[192,166]])});
 return {version:p.version,parts,portals,routes,anchors:terrain.anchors,stairPoints,summary:{libraryFloor:ly,libraryUpper:ly+lh,gardenGround:gy,localTerrainRise:p.terrain.rise,mainRearGround:terrain.groundHeight(73,232.8)+.04,canteenLower:cy,canteenDining:dy,stairTreads:S.steps,stairRiser:S.rise/S.steps,doorCount:portals.length,source:'S03-049/050/031/032; A uphill and rear garden; H metric completion'}};
}
