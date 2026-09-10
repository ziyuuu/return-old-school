import {buildB01R2Model} from './b01-r2-core.mjs';
import {segmentBox} from './batch01-core.mjs';
const copy=x=>structuredClone(x),near=(a,b,e=1e-6)=>Math.abs(a-b)<e;
export function arcZ(x,p){const {halfWidth:a,sagitta:s,apexZ:z}=p.central;if(s<=0)return z;const r=(a*a+s*s)/(2*s);return z+r-Math.sqrt(Math.max(0,r*r-x*x));}
export function insidePolygon(x,z,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function hitPart(a,b,q){
 if(!segmentBox(a,b,{...q,shape:'box'}))return false;if(q.shape!=='prism')return true;
 const u=a.map((v,i)=>v-q.center[i]),v=b.map((v,i)=>v-q.center[i]),d=v.map((x,i)=>x-u[i]),ts=[0,1];
 for(const h of [-q.size[1]/2,q.size[1]/2])if(Math.abs(d[1])>1e-8)ts.push((h-u[1])/d[1]);
 for(let i=0;i<q.polygon.length;i++){const p=q.polygon[i],r=q.polygon[(i+1)%q.polygon.length],ex=r[0]-p[0],ez=r[1]-p[1],det=d[0]*ez-d[2]*ex;if(Math.abs(det)<1e-10)continue;const t=((p[0]-u[0])*ez-(p[1]-u[2])*ex)/det;ts.push(t);}
 const t=ts.filter(x=>x>=0&&x<=1).sort((a,b)=>a-b);for(let i=1;i<t.length;i++){const k=(t[i-1]+t[i])/2;if(Math.abs(u[1]+d[1]*k)<q.size[1]/2-1e-7&&insidePolygon(u[0]+d[0]*k,u[2]+d[2]*k,q.polygon))return true;}return false;
}
export function hasR3Floor(m,x,y,z){return m.worldParts.some(q=>['slab','bridge-floor','porch-landing','entrance-step'].includes(q.role)&&near(q.center[1]+q.size[1]/2,y,.012)&&x>=q.center[0]-q.size[0]/2-1e-7&&x<=q.center[0]+q.size[0]/2+1e-7&&z>=q.center[2]-q.size[2]/2-1e-7&&z<=q.center[2]+q.size[2]/2+1e-7&&(q.shape!=='prism'||insidePolygon(x-q.center[0],z-q.center[2],q.polygon)));}
/** Only entrance semantics change. The inherited road graph is retained as outside arrival paths. */
export function applyB01R3Layout(base,p){const l=copy(base),f=l.facilities.find(f=>f.id==='15'),old=l.entrances.find(e=>e.id==='15-east');l.entrances=l.entrances.filter(e=>e.id!=='15-east');
 for(const [i,x]of p.entrances.doorCentersX.entries())l.entrances.push({id:'15-front-'+(i?'east':'west'),facilityId:'15',position:[f.position[0]+x,0,f.position[2]+p.entrances.doorWallZ],facing:copy(p.entrances.frontNormal),width:p.entrances.doorWidth,height:p.entrances.doorHeight,status:'A front-recess relation / H parameters; issue29'});
 l.b01r3={issue:p.issue,retiredDoor:old,retainedEastRoad:'perimeter arrival, no longer a mountain-wall doorway',newDoors:l.entrances.filter(e=>e.id.startsWith('15-front-'))};return l;}
/** Local H apron grading is bounded; all anchors, main road, sports and axis remain unchanged. */
export function adaptB01R3Terrain(base,layout,p){const f=layout.facilities.find(f=>f.id==='15'),e=p.entrances,A=e.apron;
 function weight(x,z){const dz=z-f.position[2];if(dz<A.startZ||dz>A.backZ)return 0;const wz=dz<A.flatZ?(dz-A.startZ)/(A.flatZ-A.startZ):dz<=e.doorWallZ?1:(A.backZ-dz)/(A.backZ-e.doorWallZ);let wx=0;for(const cx of e.doorCentersX){const d=Math.abs(x-f.position[0]-cx);wx=Math.max(wx,Math.min(1,Math.max(0,(A.halfWidth-d)/(A.halfWidth-A.flatHalfWidth))));}return wx*wz;}
 const groundHeight=(x,z)=>base.groundHeight(x,z)-e.totalRise*weight(x,z),tileHeight=(kind,x,z)=>base.tileHeight(kind,x,z)-e.totalRise*weight(x,z);
 const profiles=base.profiles.map(r=>{const samples=r.samples.map(q=>({...q,y:groundHeight(q.x,q.z)+.04}));return {...r,samples};});
 return{...base,groundHeight,tileHeight,profiles,walkHeight:(x,z)=>base.walkHeight(x,z)-e.totalRise*weight(x,z),r3ApronWeight:weight,exportData:()=>({...base.exportData(),r3:{issue:p.issue,aprons:e.apron,doorCenters:e.doorCentersX,totalRise:e.totalRise}})};
}
export function buildB01R3Model(layout,terrain,r2,p){
 const old=buildB01R2Model(layout,terrain,r2),f=layout.facilities.find(f=>f.id==='15'),e=p.entrances,a=p.central.halfWidth,story=r2.main.storyHeight,th=r2.main.wallThickness,h=5*story,front=-7,c1=1.4,parts=[];let id=0;
 const add=(role,l,size,center,name,extra={})=>{const q={id:name??`R3-${role}-${l}-${id++}`,owner:'15',level:l,role,shape:'box',size,center,...extra};parts.push(q);return q;};
 const bx=(role,l,x0,x1,z0,z1,y0,y1,name)=>add(role,l,[x1-x0,y1-y0,z1-z0],[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],name);
 function prism(role,l,poly,y0,y1,name){const xs=poly.map(v=>v[0]),zs=poly.map(v=>v[1]),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),cx=(x0+x1)/2,cz=(z0+z1)/2;return add(role,l,[x1-x0,y1-y0,z1-z0],[cx,(y0+y1)/2,cz],name,{shape:'prism',polygon:poly.map(([x,z])=>[x-cx,z-cz])});}
 function wall(l,z,x0,x1,y0,y1,cuts=[],role='recess-front'){const xs=[...new Set([x0,x1,...cuts.flatMap(c=>[c[0],c[1]]).filter(x=>x>x0&&x<x1)])].sort((a,b)=>a-b),ys=[...new Set([y0,y1,...cuts.flatMap(c=>[c[2],c[3]]).filter(y=>y>y0&&y<y1)])].sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){const x=(xs[i]+xs[i-1])/2,y=(ys[j]+ys[j-1])/2;if(!cuts.some(c=>x>c[0]&&x<c[1]&&y>c[2]&&y<c[3]))bx(role,l,xs[i-1],xs[i],z,z+th,ys[j-1],ys[j]);}}
 const curve=(x0,x1,offset=0)=>{const n=Math.max(2,Math.ceil((x1-x0)/(2*a)*p.central.segments));return Array.from({length:n+1},(_,i)=>{const x=x0+(x1-x0)*i/n;return[x,arcZ(x,p)+offset];});};
 const ribbon=(role,l,x0,x1,y0,y1,offset=0,depth=th,name)=>prism(role,l,[...curve(x0,x1,offset),...curve(x0,x1,offset+depth).reverse()],y0,y1,name);
 // Retain non-targeted R2 parts verbatim. Trim physical end notches, not merely their texture.
 for(const source of old.parts){const q=copy(source);if(q.owner!=='15'){parts.push(q);continue;}
  if(q.role.startsWith('porch-')||['central-functional-front','central-return','stair-front-blank'].includes(q.role))continue;
  if(q.role==='slab'||q.role==='roof')continue;
  if(['glazing','frame','sill'].includes(q.role)&&Math.abs(q.center[0])<a+.3&&q.center[2]<-7.4)continue;
  if(q.role==='cornice'){if(q.size[0]<20)continue;q.size[0]=2*e.returnX;}
  if(q.role==='roof-parapet'){if(q.size[0]>50&&q.center[2]<0){q.size[0]=2*e.returnX;}if(q.size[2]>1&&Math.abs(q.center[0])>48){const hi=q.center[2]+q.size[2]/2;q.size[2]=hi-e.doorWallZ;q.center[2]=(hi+e.doorWallZ)/2;}}
  if(q.role==='end-wall'){const hi=q.center[2]+q.size[2]/2,lo=Math.max(e.doorWallZ,q.center[2]-q.size[2]/2);if(hi<=lo)continue;q.size[2]=hi-lo;q.center[2]=(lo+hi)/2;}
  parts.push(q);
 }
 // Five-storey front setbacks and the continuously projecting inboard wall at each entrance.
 for(let l=1;l<=5;l++){const fy=(l-1)*story+.04,ceiling=l*story-.14,back=l===5?c1:7;
  bx('slab',l,-e.returnX,e.returnX,front,back,fy-.18,fy,`R3-main-floor-${l}`);
  for(const sign of [-1,1]){const x0=sign<0?-49:e.returnX,x1=sign<0?-e.returnX:49,cx=sign*46.4,wx=sign*48.4;
   bx('slab',l,x0,x1,e.doorWallZ,back,fy-.18,fy);
   const b0=sign<0?-e.returnX:e.innerX,b1=sign<0?-e.innerX:e.returnX;
   bx('slab',l,b0,b1,e.forwardWallZ,front,fy-.18,fy);
   const cuts=l===1?[[cx-e.doorWidth/2,cx+e.doorWidth/2,fy,fy+e.doorHeight],[wx-e.barredWindowWidth/2,wx+e.barredWindowWidth/2,fy+.8,fy+.8+e.barredWindowHeight]]:[];
   wall(l,e.doorWallZ,x0,x1,fy,ceiling,cuts);
   wall(l,e.forwardWallZ,b0,b1,fy,ceiling,[],'stair-front-blank');
   const wallX=sign*e.returnX;bx('continuing-body-wall',l,wallX-th/2,wallX+th/2,e.forwardWallZ,e.doorWallZ+th,fy,ceiling,`R3-${sign<0?'west':'east'}-forward-wall-L${l}`);
   const inner=sign*e.innerX;bx('body-return-inner',l,inner-th/2,inner+th/2,e.forwardWallZ,front,fy,ceiling);
   bx('cornice',l,b0,b1,e.forwardWallZ-.04,front,ceiling,ceiling+.14);
  }
  // Arc apex/door axis are fixed; the side edges recede slightly. Wall, floors and cornices agree.
  prism('slab',l,[...curve(-a,a),[a,front],[-a,front]],fy-.18,fy,`R3-curve-floor-${l}`);
  const opening=l===1?[-1.5,1.5,fy,fy+2.7]:[-1.9,1.9,fy+.7,fy+3.05];
  ribbon('central-curved-wall',l,-a,opening[0],fy,ceiling);ribbon('central-curved-wall',l,opening[1],a,fy,ceiling);
  if(opening[2]>fy)ribbon('central-curved-wall',l,opening[0],opening[1],fy,opening[2]);ribbon('central-curved-wall',l,opening[0],opening[1],opening[3],ceiling);
  for(const x of [-a,a])bx('central-return',l,x-th/2,x+th/2,arcZ(x,p),front,fy,ceiling);
  ribbon('curved-cornice',l,-a,a,ceiling,ceiling+.16,-.04,th+.08);
  if(l>1){ribbon('glazing',l,-1.84,1.84,fy+.765,fy+2.985,.11,.04);
   for(const y of [fy+.735,fy+2.28,fy+3.015])ribbon('frame',l,-1.9,1.9,y-.03,y+.03,.065,.15);
   for(const x of [-1.865,0,1.865])bx('frame',l,x-.0325,x+.0325,arcZ(x,p)+.055,arcZ(x,p)+.205,fy+.7,fy+3.05);
  }
 }
 // Close the retired east mountain-wall exit. West bridges remain physically open.
 bx('retired-east-door-closure',1,48.76,49,-1.25,1.25,.04,2.74,'R3-retired-east-door-closure');
 // Complete roof follows the same recessed end footprint, including the full-height forward walls.
 bx('roof',0,-e.returnX,e.returnX,front,c1,h,h+.22);
 for(const sign of [-1,1]){const x0=sign<0?-49:e.returnX,x1=sign<0?-e.returnX:49,b0=sign<0?-e.returnX:e.innerX,b1=sign<0?-e.innerX:e.returnX;bx('roof',0,x0,x1,e.doorWallZ,c1,h,h+.22);bx('roof',0,b0,b1,e.forwardWallZ,front,h,h+.22);wall(0,e.forwardWallZ,b0,b1,h+.22,h+.52,[],'roof-parapet');wall(0,e.doorWallZ,x0,x1,h+.22,h+.52,[],'roof-parapet');bx('roof-parapet',0,sign*e.returnX-.12,sign*e.returnX+.12,e.forwardWallZ,e.doorWallZ,h+.22,h+.52);}
 prism('roof',0,[...curve(-a,a),[a,front],[-a,front]],h,h+.22,'R3-central-curved-roof');ribbon('curved-cornice',0,-a,a,h+.22,h+.52,0,.22);
 const access=[];
 for(const [i,cx]of e.doorCentersX.entries()){const side=i?'east':'west',fy=.04,lower=fy-e.totalRise,stepEnd=e.landingFrontZ,stepStart=stepEnd-e.stepRun;
  bx('porch-landing',1,cx-e.landingWidth/2,cx+e.landingWidth/2,stepEnd,e.doorWallZ+.15,-.60,fy,`R3-${side}-landing`);
  for(let n=0;n<e.steps;n++)bx('entrance-step',1,cx-e.landingWidth/2,cx+e.landingWidth/2,stepStart+e.stepRun*n/e.steps,stepStart+e.stepRun*(n+1)/e.steps,-.60,lower+e.totalRise*(n+1)/e.steps,`R3-${side}-step-${n+1}`);
  for(const s of [-1,1])bx('porch-post',1,cx+s*e.postSpacing/2-e.postWidth/2,cx+s*e.postSpacing/2+e.postWidth/2,e.postZ-e.postWidth/2,e.postZ+e.postWidth/2,fy,e.canopyHeight+.04);
  bx('porch-roof',1,cx-e.canopyWidth/2,cx+e.canopyWidth/2,e.canopyFrontZ,e.canopyBackZ,e.canopyHeight+.04,e.canopyHeight+.04+e.canopyThickness);
  bx('porch-trim',1,cx-e.canopyWidth/2-.03,cx+e.canopyWidth/2+.03,e.canopyFrontZ-.03,e.canopyBackZ,e.canopyHeight+.04+e.canopyThickness,e.canopyHeight+.04+e.canopyThickness+e.trimHeight);
  const wx=(i?1:-1)*48.4,ww=e.barredWindowWidth;bx('glazing',1,wx-ww/2,wx+ww/2,e.doorWallZ+.06,e.doorWallZ+.10,fy+.8,fy+.8+e.barredWindowHeight);
  for(let k=0;k<6;k++){const x=wx-ww/2+ww*k/5;bx('window-grille',1,x-.017,x+.017,e.doorWallZ-.05,e.doorWallZ-.015,fy+.8,fy+.8+e.barredWindowHeight);}
  for(const y of [fy+.8,fy+2.7])bx('window-grille',1,wx-ww/2,wx+ww/2,e.doorWallZ-.07,e.doorWallZ-.015,y-.025,y+.025);
  for(const sign of [-1,1])bx('frame',1,cx+sign*e.doorWidth/2-.025,cx+sign*e.doorWidth/2+.025,e.doorWallZ-.025,e.doorWallZ+th+.025,fy,fy+e.doorHeight);
  bx('frame',1,cx-e.doorWidth/2-.04,cx+e.doorWidth/2+.04,e.doorWallZ-.04,e.doorWallZ+.12,fy+e.doorHeight,fy+e.doorHeight+.07,`R3-${side}-door-head`);
  const x=f.position[0]+cx,z=f.position[2],Y=terrain.anchors['15'].floor;
  access.push({id:side,door:[x,Y+fy,z+e.doorWallZ],normal:copy(e.frontNormal),clearRoute:[[x,Y+fy,z+stepEnd+.1],[x,Y+fy,z+e.doorWallZ+.4],[f.position[0]+(i?46:-46),Y+fy,z-2.4],[f.position[0]+(i?46:-46),Y+fy,z]],apron:[[x,z+e.apron.startZ],[x,z+stepStart]],stepProbes:Array.from({length:e.steps},(_,n)=>[x,Y+lower+e.totalRise*(n+1)/e.steps,z+stepStart+e.stepRun*(n+.5)/e.steps]),stepStart,stepEnd});
 }
 // R3_GROUND_FOUNDATIONS: local apron lowering exposes the slab edge. Fill its
 // exact notched footprint downward; do not span the entrance recess or any bridge.
 for(const q of [...parts].filter(q=>q.owner==='15'&&q.level===1&&q.role==='slab')){
  const bottom=q.center[1]-q.size[1]/2,base=-.60;
  parts.push({...q,id:'R3-foundation-'+q.id,role:'foundation',center:[q.center[0],(bottom+base)/2,q.center[2]],size:[q.size[0],bottom-base,q.size[2]]});
 }
 const origins={15:[f.position[0],terrain.anchors['15'].floor,f.position[2]],25:[...layout.facilities.find(f=>f.id==='25').position],bridge:[0,terrain.anchors['25'].floor,0]};origins[25][1]=terrain.anchors['25'].floor;
 const worldParts=parts.map(q=>({...q,center:q.center.map((v,i)=>v+origins[q.owner][i])}));
 const result={...old,version:p.version,r3:p,parts,worldParts,access,retiredPorch:true};result.exportData=()=>({version:p.version,input:p,r2Input:r2,parts,worldParts,spaces:result.spaces,routes:result.routes,axis:result.axis,access,mainFloor:result.mainFloor,toiletFloor:result.toiletFloor,status:p.status});return result;
}
export function b01R3Checks(before,layout,m,p){const rows=[],put=(id,ok,detail=null)=>rows.push({id,passed:!!ok,detail}),ps=m.parts,e=p.entrances,world=(x,y,z)=>[73+x,m.mainFloor+y,224+z];
 put('R3_FACILITIES_UNMOVED',JSON.stringify(before.facilities)===JSON.stringify(layout.facilities));put('R3_ROADS_UNCHANGED',JSON.stringify(before.navigation)===JSON.stringify(layout.navigation));
 put('R3_AXIS',m.axis.length===4&&m.axis.every(a=>a.x===73));put('R3_FIVE_FLOORS',[1,2,3,4,5].every(l=>ps.some(q=>q.id===`R3-main-floor-${l}`)));
 put('R3_NO_OBSOLETE_PORCH',!ps.some(q=>q.id.startsWith('R2-porch')||q.owner==='15'&&q.role.startsWith('porch-')&&q.center[0]>49));put('R3_RETIRED_EAST_CLOSED',m.worldParts.some(q=>hitPart([123,5.2,224],[121,5.2,224],q)));
 put('R3_FRONT_DOOR_RECORDS',layout.entrances.filter(v=>v.id.startsWith('15-front-')).length===2&&!layout.entrances.some(v=>v.id==='15-east'));
 for(const [i,A]of m.access.entries()){const cx=e.doorCentersX[i],prefix='R3_'+A.id+'_';put(prefix+'NORMAL',JSON.stringify(A.normal)==='[0,0,-1]');put(prefix+'DOOR_RECESS',near(A.door[2],224+e.doorWallZ)&&e.doorWallZ>e.canopyFrontZ&&e.canopyFrontZ>e.forwardWallZ);
  const walls=ps.filter(q=>q.id.startsWith(`R3-${A.id}-forward-wall-L`));put(prefix+'CONTINUING_5F_WALL',walls.length===5&&walls.every(q=>near(q.center[2]-q.size[2]/2,e.forwardWallZ)&&q.size[1]>3));
  put(prefix+'POSTS',ps.filter(q=>q.role==='porch-post'&&Math.abs(q.center[0]-cx)<2).length===2);
  put(prefix+'CANOPY',ps.some(q=>q.role==='porch-roof'&&near(q.center[0],cx)));
  for(const [j,q]of A.stepProbes.entries())put(prefix+'STEP_'+j,hasR3Floor(m,...q));
  let supported=true,clear=true;for(let j=1;j<A.clearRoute.length;j++){const u=A.clearRoute[j-1],v=A.clearRoute[j],n=Math.ceil(Math.hypot(v[0]-u[0],v[2]-u[2])/.2);for(let k=0;k<=n;k++)if(!hasR3Floor(m,u[0]+(v[0]-u[0])*k/n,u[1],u[2]+(v[2]-u[2])*k/n))supported=false;for(const y of [.4,1.1,1.8])if(m.worldParts.some(q=>hitPart([u[0],u[1]+y,u[2]],[v[0],v[1]+y,v[2]],q)))clear=false;}put(prefix+'ROUTE_SUPPORT',supported);put(prefix+'ROUTE_CLEAR',clear);
  for(let l=2;l<=5;l++)put(prefix+'REAL_NOTCH_L'+l,!hasR3Floor(m,73+cx,m.mainFloor+(l-1)*3.8+.04,218));
 }
 put('R3_CENTRAL_ARC',[1,2,3,4,5].every(l=>ps.some(q=>q.role==='central-curved-wall'&&q.shape==='prism'&&q.level===l))&&p.central.sagitta>0&&p.central.sagitta<.8);
 put('R3_ARC_PLAN_GEOMETRY',ps.filter(q=>q.id.startsWith('R3-curve-floor')).length===5&&ps.filter(q=>q.id.startsWith('R3-curve-floor')).every(q=>{const pts=q.polygon.map(([x,z])=>[x+q.center[0],z+q.center[2]]);return near(Math.min(...pts.map(v=>v[1])),p.central.apexZ)&&pts.some(([x,z])=>near(x,-p.central.halfWidth)&&near(z,p.central.apexZ+p.central.sagitta));}));
 put('R3_NO_OLD_FLAT_FRONT',!ps.some(q=>q.role==='central-functional-front'));
 put('R3_MAIN_DOOR_OPEN',!m.worldParts.some(q=>hitPart([73,5.2,213],[73,5.2,224],q)));
 put('R3_TERRACE_SKY',!m.worldParts.some(q=>hitPart(world(18,12,4),world(18,30,4),q)));put('R3_TERRACE_FLOOR',hasR3Floor(m,...world(18,11.44,4)));
 put('R3_L5_CORRIDOR_COVERS_L4',m.worldParts.some(q=>q.role==='slab'&&hitPart(world(18,12,0),world(18,17,0),q)));
 for(const r of m.routes){let support=true,clear=true;for(let i=1;i<r.points.length;i++){const u=r.points[i-1],v=r.points[i],n=Math.ceil(Math.hypot(v[0]-u[0],v[2]-u[2]));for(let j=0;j<=n;j++)if(!hasR3Floor(m,u[0]+(v[0]-u[0])*j/n,u[1],u[2]+(v[2]-u[2])*j/n))support=false;for(const h of [.4,1.8])if(m.worldParts.some(q=>hitPart([u[0],u[1]+h,u[2]],[v[0],v[1]+h,v[2]],q)))clear=false;}put('R3_'+r.id+'_SUPPORT',support);put('R3_'+r.id+'_CLEAR',clear);}
 put('R3_UNDERPASS_CLEAR',!m.worldParts.some(q=>hitPart([6.5,5.2,216],[6.5,5.2,239],q)));put('R3_FOUNDATION_CONTINUOUS',ps.filter(q=>q.owner==='15'&&q.level===1&&q.role==='slab').every(q=>{const b=ps.find(v=>v.id==='R3-foundation-'+q.id);return b&&b.role==='foundation'&&near(b.center[1]-b.size[1]/2,-.60)&&near(b.center[1]+b.size[1]/2,q.center[1]-q.size[1]/2)&&near(b.center[0],q.center[0])&&near(b.center[2],q.center[2])&&near(b.size[0],q.size[0])&&near(b.size[2],q.size[2]);}));put('R3_PARTS_VALID_UNIQUE',new Set(ps.map(q=>q.id)).size===ps.length&&ps.every(q=>q.size.every(v=>v>0&&Number.isFinite(v))));return{passed:rows.every(r=>r.passed),results:rows};}
