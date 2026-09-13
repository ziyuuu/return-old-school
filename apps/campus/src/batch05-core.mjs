import {courtRects} from './layout-core.mjs';
/** B05 world-space part catalogue. One source drives meshes, BVH, support rays and evidence.
 * No independent terrain or replacement road graph. Every metric here is explicitly H.
 */
export function buildB05Model(layout, terrain, p, site) {
  if(p.surveyVerified!==false || p.measured!==null) throw Error('B05 cannot promote hypotheses to measurements');
  const parts=[],portals=[],routes=[],fixtures=[],trees=[],hoops=[],goals=[],blocks=[],retiredNames=[];
  const get=id=>layout.facilities.find(f=>f.id===id),fy=id=>terrain.anchors[id].floor;
  let owner='01',seq=0;
  function add(name,role,shape,data,row=6,evidence='H'){const q={id:`B05-${owner}-${name}`,owner,role,shape,row,evidence,...data};parts.push(q);return q;}
  function box(name,role,x0,x1,y0,y1,z0,z1,row=6,evidence='H'){
    if([x1-x0,y1-y0,z1-z0].some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid '+owner+'/'+name);
    return add(name,role,'box',{center:[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],size:[x1-x0,y1-y0,z1-z0]},row,evidence);
  }
  const rod=(name,role,a,b,radius=.04,row=6,evidence='H',segments=48)=>add(name,role,'rod',{a,b,radius,segments},row,evidence);
  function poly(name,role,points,y0,y1,row=6,evidence='H'){return add(name,role,'plan',{points,y0,y1},row,evidence);}
  function slab(name,x0,x1,z0,z1,y,row=6){box(name,'floor',x0,x1,y-.14,y,z0,z1,row);}
  function curve(name,role,points,r=.025,row=6,closed=false,segments=48){return add(name,role,'tube',{points,radius:r,closed,segments},row);}
  function label(name,text,position,normal,width,height,row=15,basis='P visible name / H typeface') {fixtures.push({id:`B05-${owner}-${name}`,owner,text,position,normal,width,height,row,basis});}
  function portal(id,center,normal,width,height){portals.push({id,facility:owner,center,normal,width,height,floor:center[1]});}
  function groundPoints(points,offset=.04){const out=[];for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.4));for(let j=k===1?0:1;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;out.push([x,terrain.groundHeight(x,z)+offset,z]);}}return out;}
  function route(id,label,points){routes.push({id,label,facility:owner,points});}
  function paving(name,points,width){
    // Sample each edge of the visible ribbon against the inherited ground, not a flat proxy.
    for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/.45));if(len<.001)continue;
      for(let i=0;i<n;i++){const vs=[];for(const[t,s]of[[i/n,-1],[i/n,1],[(i+1)/n,1],[(i+1)/n,-1]]){const x=a[0]+dx*t+s*dz/len*width/2,z=a[1]+dz*t-s*dx/len*width/2;vs.push([x,terrain.groundHeight(x,z)+.04,z]);}add(name+'-'+k+'-'+i,'paving','prism',{points:vs,offset:[0,-.12,0]},2);}
    }
  }
  function paintLine(name,points,width=.055,row=8){add(name,'line-paint','ribbon',{points,width},row);}
  function rectLine(name,x0,x1,z0,z1,y,width=.055){paintLine(name,[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],[x0,y,z0]],width);}
  function circleLine(name,x,z,y,r,start=0,end=Math.PI*2){paintLine(name,Array.from({length:193},(_,i)=>[x+r*Math.cos(start+(end-start)*i/192),y,z+r*Math.sin(start+(end-start)*i/192)]));}
  function stoneRail(name,a,b,y,height=.86){
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),n=Math.max(1,Math.round(length/.38));
    rod(name+'-top','stone-balustrade',[a[0],y+height,a[1]],[b[0],y+height,b[1]],.075,8);
    rod(name+'-base','stone-balustrade',[a[0],y+.17,a[1]],[b[0],y+.17,b[1]],.064,8);
    for(let i=0;i<=n;i++){const x=a[0]+dx*i/n,z=a[1]+dz*i/n;add(name+'-baluster'+i,'stone-balustrade','baluster',{center:[x,y+.18,z],height:height-.20,radius:.060},8);}
  }
  // 01 photographed asymmetric gate. Observer-right is world -X, not the side-gate +X.
  owner='01';const G=p.gate;
  box('right-tower','wall',-13,-8.8,0,G.height,-2,2,14,'P broad observer-right tower / H metric');
  box('left-pier','column',10.6,13,0,G.lintelBottom,-1.8,1.8,14,'P slender observer-left pier / H metric');
  box('lintel','beam',-13,13,G.lintelBottom,G.lintelTop,-2,2,14,'P broad light lintel');
  box('warm-inset','paint-trim',-8.8,10.6,5.39,5.63,-2.028,-2.002,17,'P warm narrow band');
  box('tower-cap','cornice',-13,-8.8,6.52,6.64,-2.016,2.016,17);
  for(const x of [-8.99,10.61])box('vertical-recess'+x,'paint-trim',x,x+.19,.16,4.90,-1.91,-1.84,17,'P vertical red inset; modern banners omitted');
  // Fine construction joints on the name fascia, not artificial tessellation of all walls.
  for(let x=-8.4;x<10.5;x+=1.25)box('fascia-joint'+x,'joint',x,x+.008,5.65,6.28,-2.009,-2.003,6);
  label('name','雅  礼  中  学',[1,5.92,-2.035],[0,0,-1],8.8,.66,15);
  add('school-medallion','medallion','ring',{center:[-10.9,4.6,-2.035],normal:[0,0,1],radius:.52,tube:.024},12,'P circular medallion / H simplified border');
  label('medallion-name','雅礼',[-10.9,4.6,-2.063],[0,0,-1],.78,.36,12);
  // Retractable gate folded at the left pier; the 7m main road remains wholly open.
  for(let i=0;i<10;i++){const x=9.00+i*.12;rod('fold-v'+i,'gate-rail',[x,.12,-.72],[x,1.53,-.72],.025,15);if(i<9){rod('fold-xa'+i,'gate-rail',[x,.2,-.72],[x+.12,1.45,-.72],.020,15);rod('fold-xb'+i,'gate-rail',[x,1.45,-.72],[x+.12,.2,-.72],.020,15);}}
  slab('gate-apron',-21,22,-5,2,.04,2);
  portal('main-gate',[0,.04,0],[0,0,-1],7.0,4.9);
  route('main-gate','门外 → 正门净空 → 已认可长坡',groundPoints([[0,-4],[0,2],[0,44]]));
  // Small glazed duty bay, tucked beside the large pier, not a new campus building.
  if(G.guardBay){
    const x0=-8.7,x1=-5.6,z0=-.1,z1=3.4,y=.1;
    slab('guard-floor',x0,x1,z0,z1,y);box('guard-roof','canopy',x0,x1,3.05,3.22,z0,z1,6);
    box('guard-back','wall',x0,x0+.18,y,3.05,z0,z1,14);
    for(const z of [z0,z1]){box('guard-sill'+z,'wall',x0,x1,y,.72,z-.06,z+.06,14);box('guard-glass'+z,'window',x0+.15,x1-.08,.72,2.91,z-.035,z+.035,4);for(let x=x0+.12;x<x1;x+=.72)box('guard-frame'+z+x,'window-frame',x-.027,x+.027,.70,3.05,z-.055,z+.055,6);}
    const opening=[.63,1.97];for(const[a,b]of[[z0,opening[0]],[opening[1],z1]]){box('guard-return'+a,'wall',x1-.10,x1+.10,y,.7,a,b,14);box('guard-sideglass'+a,'window',x1-.03,x1+.03,.70,2.90,a,b,4);}
    box('guard-head','door-frame',x1-.08,x1+.08,2.75,3.05,z0,z1,6);for(const z of opening)box('guard-jamb'+z,'door-frame',x1-.06,x1+.06,y,2.75,z-.035,z+.035,6);
    portal('gate-duty',[x1,y,1.3],[1,0,0],1.23,2.60);
    paving('guard-apron',[[0,1.3],[-5.4,1.3]],1.7);slab('guard-threshold',-5.9,-5.25,.45,2.15,y,2);
    route('gate-duty','主门内 → 侧置值班小门厅H',[[0,.04,1.3],[-5.25,.1,1.3],[-6.6,.1,1.3]]);
  }
  owner='02';const S=get('02'),[sx,,sz]=S.position;
  for(const sign of [-1,1]){box('pier'+sign,'column',sx+sign*1.87-.13,sx+sign*1.87+.13,0,2.90,sz-.45,sz+.45,14);box('wing'+sign,'wall',sx+sign*2.3-.27,sx+sign*2.3+.27,0,2.5,sz-.45,sz+.45,14);}
  box('header','beam',sx-2,sx+2,2.78,3.0,sz-.45,sz+.45,6);
  // Open metal leaf lies along the passage, not across it.
  for(let z=sz+.65;z<sz+2.4;z+=.16)rod('leaf'+z,'gate-rail',[sx+1.60,.14,z],[sx+1.60,2.47,z],.017,5);
  for(const y of [.18,1.35,2.45])rod('leaf-bar'+y,'gate-rail',[sx+1.6,y,sz+.6],[sx+1.6,y,sz+2.4],.026,5);
  portal('side-gate',[sx,.04,sz],[0,0,-1],3.1,2.70);
  route('side-gate','独立侧门 → 独立侧路，不内并主门',groundPoints([[sx,-4],[sx,sz],[sx,16]]));
  owner='27';const [rx,,rz]=get('27').position;
  slab('stone-paving',rx-2.9,rx+2.9,rz-3.1,rz+2.6,.10,2);
  box('stone-base','stone-plaque',rx-1.28,rx+1.28,0,.10,rz-1,rz+1,7);
  add('standing-stone','boulder','rock',{center:[rx,.10,rz],size:p.stone.size},7,'P irregular upright form; A map-left relation; H shape and metric');
  label('stone-name',p.stone.text,[rx,1.25,rz-.687],[0,0,-1],1.3,1.35,12,'P visible English inscription on S03-015; H lettering geometry');
  box('rear-soil','planter-soil',rx-3,rx+3,.1,.21,rz+2.25,rz+3.05,11);box('rear-kerb','stone-plaque',rx-3,rx+3,.04,.26,rz+2.15,rz+2.27,8);
  for(let x=rx-2.7;x<=rx+2.7;x+=.55)add('hedge'+x,'foliage','leaf',{center:[x,.39,rz+2.65],size:[.43,.27,.35]},13);
  route('stone-front','门外铺面 → 校园石正面阅读区（位置H受A左右关系约束）',[[0,.04,-4],[rx,.04,-4],[rx,.10,rz-1.42]]);
  route('stone-side','校名石侧面绕行空间',[[rx-2.1,.1,rz-2.5],[rx-2.1,.1,rz+1.7],[rx+2.1,.1,rz+1.7]]);
  // Basketball court markings and equipment, retaining every inherited rectangle and grade.
  owner='06';const C=get('06'),[cx,,cz]=C.position,[cw,,cd]=C.size,Y=p.courts.surfaceY;
  box('court-surface','court-surface',cx-cw/2,cx+cw/2,Y-.08,Y,cz-cd/2,cz+cd/2,1,'A court footprint/top retained');
  const courts=courtRects(layout);
  for(const c of courts){
    const x=(c.minX+c.maxX)/2,z=(c.minZ+c.maxZ)/2;
    rectLine(c.id+'-lines',c.minX,c.maxX,c.minZ,c.maxZ,Y+.006);paintLine(c.id+'-centre',[[c.minX,Y+.006,z],[c.maxX,Y+.006,z]]);circleLine(c.id+'-circle',x,z,Y+.006,1.8);
    for(const sign of [1,-1]){
      const end=sign>0?c.minZ:c.maxZ;
      poly(c.id+'-key'+sign,'court-surface',[[x-2.45,end],[x+2.45,end],[x+2.45,end+sign*5.8],[x-2.45,end+sign*5.8]],Y+.001,Y+.003,3);
      rectLine(c.id+'-keylines'+sign,x-2.45,x+2.45,Math.min(end,end+sign*5.8),Math.max(end,end+sign*5.8),Y+.008);circleLine(c.id+'-free'+sign,x,end+sign*5.8,Y+.008,1.8);
      const id=c.id+'-'+(sign>0?'near':'far'),rimZ=end+sign*1.70,boardZ=end+sign*1.24,postZ=end+sign*.16,baseZ=end+sign*.10;
      hoops.push({id,owner:'06',court:c.id,position:[x,Y,rimZ],normal:[0,0,sign],base:[x,Y,baseZ],rimHeight:p.courts.rimHeight,evidence:'P structural family / H exact placement and 12-count'});
      box(id+'-base','base-paint',x-.66,x+.66,Y,Y+.22,baseZ-p.courts.baseLength/2,baseZ+p.courts.baseLength/2,5);
      for(const off of [-.37,.37]){
        rod(id+'-post'+off,'basket-rail',[x+off,Y+.22,postZ],[x+off,Y+2.8,postZ],.065,5);
        rod(id+'-cantilever'+off,'basket-rail',[x+off,Y+2.8,postZ],[x+off,Y+3.78,boardZ],.053,5);
        rod(id+'-brace'+off,'basket-rail',[x+off,Y+.34,postZ-sign*.48],[x+off,Y+2.65,postZ],.038,5);
        rod(id+'-boardbrace'+off,'basket-rail',[x+off,Y+3.15,postZ+sign*.65],[x+off,Y+3.15,boardZ],.035,5);
      }
      const bw=p.courts.backboardWidth,bottom=Y+2.90,top=bottom+p.courts.backboardHeight;
      box(id+'-board','window',x-bw/2,x+bw/2,bottom,top,boardZ-.028,boardZ+.028,4,'P backboard / H glazing');
      for(const a of [x-bw/2,x+bw/2])box(id+'-board-v'+a,'basket-frame',a-.024,a+.024,bottom,top,boardZ-.040,boardZ+.040,10);
      for(const a of [bottom,top])box(id+'-board-h'+a,'basket-frame',x-bw/2,x+bw/2,a-.025,a+.025,boardZ-.040,boardZ+.040,10);
      for(const a of [x-.30,x+.30])box(id+'-target-v'+a,'basket-frame',a-.015,a+.015,Y+3.02,Y+3.47,boardZ-.044,boardZ+.044,10);
      for(const a of [Y+3.02,Y+3.47])box(id+'-target-h'+a,'basket-frame',x-.30,x+.30,a-.015,a+.015,boardZ-.045,boardZ+.045,10);
      add(id+'-rim','basket-ring','ring',{center:[x,Y+p.courts.rimHeight,rimZ],normal:[0,1,0],radius:.225,tube:.017},17);
      rod(id+'-neck','basket-rail',[x,Y+3.05,boardZ],[x,Y+3.05,rimZ-.225*sign],.024,17);
      for(let j=0;j<12;j++){
        const pts=[];for(let k=0;k<=6;k++){const a=j*Math.PI/6+(k%2)*.15,rad=.225-.085*k/6;pts.push([x+Math.cos(a)*rad,Y+3.03-k*.065,rimZ+Math.sin(a)*rad]);}
        curve(id+'-net'+j,'net-fabric',pts,.004,8,false,8);
      }
    }
  }
  const fenceSegments=[];
  function fence(name,a,b){
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/p.courts.postSpacing),base=Y+.005,top=base+p.courts.fenceHeight;
    fenceSegments.push({id:name,a,b,base,top});
    for(let j=0;j<=n;j++){const x=a[0]+dx*j/n,z=a[1]+dz*j/n;rod(name+'-post'+j,'fence-rail',[x,base,z],[x,top+.045,z],.040,9);}
    for(const h of [.18,2.0,p.courts.fenceHeight])rod(name+'-bar'+h,'fence-rail',[a[0],base+h,a[1]],[b[0],base+h,b[1]],.030,9);
    const hN=Math.ceil(p.courts.fenceHeight/p.courts.meshPitch),wN=Math.ceil(len/p.courts.meshPitch);
    for(let i=1;i<wN;i++){const x=a[0]+dx*i/wN,z=a[1]+dz*i/wN;rod(name+'-wire-v'+i,'fence-rail',[x,base+.2,z],[x,top-.04,z],p.courts.wireRadius,9,'H wire mesh spacing',p.courts.wireSegments);}
    for(let i=1;i<hN;i++){const y=base+p.courts.fenceHeight*i/hN;rod(name+'-wire-h'+i,'fence-rail',[a[0],y,a[1]],[b[0],y,b[1]],p.courts.wireRadius,9,'H wire mesh spacing',p.courts.wireSegments);}
  }
  const bounds=[cx-cw/2,cz-cd/2,cx+cw/2,cz+cd/2],west=bounds[0],east=bounds[2];
  fence('north',[west,bounds[1]],[east,bounds[1]]);fence('south',[west,bounds[3]],[east,bounds[3]]);
  fence('east-a',[east,bounds[1]],[east,118]);fence('east-b',[east,122],[east,bounds[3]]);
  fence('west-a',[west,bounds[1]],[west,118.5]);fence('west-b',[west,121.5],[west,bounds[3]]);
  portal('court-east',[east,Y,120],[1,0,0],3.75,3.0);portal('court-track',[west,Y,120],[-1,0,0],2.75,3.0);
  route('court-east','主路 → 原东坡 → 围网4m缺口 → 六场中央横向间隔',groundPoints([[0,120],[-5.5,120],[-10,120],[-37.5,120]]));
  const trackPoints=[[-37.5,Y,120],[-64.96,Y,120],[-65.14,Y,120],[-65.47,Y-.15,120],[-65.69,3.04,120],[-68.5,3.04,120]];
  route('court-track','篮球场 → 原两级台阶 → 风雨直跑道',trackPoints);
  retiredNames.push('P04-court-open-fence');
  // 05 open sided shelter within the accepted shared edge; transverse access stays open.
  owner='05';const T=get('05'),[tx,,tz]=T.position,[tw,,td]=T.size,ty=fy('05'),x0=tx-tw/2,x1=tx+tw/2,z0=tz-td/2,z1=tz+td/2;
  box('track-surface','track-surface',x0,x1,ty-.04,ty+.04,z0,z1,3);
  for(let i=1;i<6;i++)paintLine('track-lane'+i,[[x0+tw*i/6,ty+.048,z0],[x0+tw*i/6,ty+.048,z1]],.045);
  for(const z of p.coveredTrack.columnZ){
    for(const x of [x0+.24,x1-.24]){box('column'+x+z,'column',x-.11,x+.11,ty,ty+p.coveredTrack.eaveHeight,z-.11,z+.11,6);rod('brace'+x+z,'track-rail',[x,ty+2.8,z],[tx,ty+p.coveredTrack.ridgeHeight-.12,z],.037,5);}
    rod('truss-lower'+z,'track-rail',[x0+.24,ty+3.35,z],[x1-.24,ty+3.35,z],.038,5);
  }
  for(const [a,b,ya,yb]of[[x0,tx,ty+p.coveredTrack.eaveHeight,ty+p.coveredTrack.ridgeHeight],[tx,x1,ty+p.coveredTrack.ridgeHeight,ty+p.coveredTrack.eaveHeight]]){
    add('roof-slope'+a,'metal-roof','prism',{points:[[a,ya,z0],[b,yb,z0],[b,yb,z1],[a,ya,z1]],offset:[0,-.13,0]},5,'H complete unseen canopy profile');
    rod('eave'+a,'track-rail',[a,ya-.06,z0],[a,ya-.06,z1],.054,5);
  }
  route('covered-track','风雨直跑道纵向净空，柱列不截断中间横路',[[tx,ty+.04,z0+.7],[tx,ty+.04,z1-.7]]);
  portal('track-crossing',[x0,ty+.04,120],[-1,0,0],3.0,3.0);
  // 08 original stadium shape preserved; improve curved lane paint, not the plan.
  owner='08';const F=get('08'),[fx,,fz]=F.position,[fw,,fd]=F.size,gy=fy('08');
  add('stadium','track-surface','stadium',{center:[fx,gy+.04,fz],width:fw,length:fd,scale:[1,1]},3,'A retained footprint; H smooth curve');
  add('infield','turf','stadium',{center:[fx,gy+.044,fz],width:fw,length:fd,scale:[.86,.88]},1);
  for(let j=1;j<=p.field.laneCount;j++){const pts=stadiumPoints(fw,fd,192).map(([x,z])=>[fx+x*(1-.14*j/p.field.laneCount),gy+.051,fz+z*(1-.12*j/p.field.laneCount)]);paintLine('lane'+j,[...pts,pts[0]],.052);}
  const pw=fw*.62,pl=fd*.64,py=gy+.055;
  rectLine('pitch',fx-pw/2,fx+pw/2,fz-pl/2,fz+pl/2,py);paintLine('half',[[fx-pw/2,py,fz],[fx+pw/2,py,fz]]);circleLine('centre-circle',fx,fz,py,8.0);
  for(const s of [-1,1]){
    const end=fz+s*pl/2,inward=-s,back=end+s*p.field.goalDepth,id='goal-'+(s<0?'near':'far'),w=p.field.goalWidth,h=p.field.goalHeight;
    rectLine('penalty'+s,fx-16.5,fx+16.5,Math.min(end,end+inward*14),Math.max(end,end+inward*14),py);rectLine('goal-area'+s,fx-8.9,fx+8.9,Math.min(end,end+inward*4.9),Math.max(end,end+inward*4.9),py);
    for(const x of [fx-w/2,fx+w/2]){rod(id+'-post'+x,'goal-rail',[x,gy+.045,end],[x,gy+.045+h,end],.060,8,'P white goal frame / H sizes');rod(id+'-stay'+x,'goal-rail',[x,gy+.045+h,end],[x,gy+.09,back],.023,8);rod(id+'-foot'+x,'goal-rail',[x,gy+.09,end],[x,gy+.09,back],.022,8);}
    rod(id+'-bar','goal-rail',[fx-w/2,gy+.045+h,end],[fx+w/2,gy+.045+h,end],.060,8);rod(id+'-rear','goal-rail',[fx-w/2,gy+.09,back],[fx+w/2,gy+.09,back],.022,8);
    // Physical net threads, open between each strand, no alpha rectangle blocking the goal mouth.
    const nx=Math.ceil(w/p.field.netPitch),ny=Math.ceil(h/p.field.netPitch);
    for(let j=0;j<=nx;j++){const x=fx-w/2+w*j/nx;rod(id+'-net-v'+j,'net-fabric',[x,gy+.09,back],[x,gy+.045+h,end],.004,8,'H net detail',8);}
    for(let j=1;j<ny;j++){const t=j/ny,y=gy+.09+(h-.045)*t,z=back+(end-back)*t;rod(id+'-net-h'+j,'net-fabric',[fx-w/2,y,z],[fx+w/2,y,z],.004,8,'H net detail',8);}
    goals.push({id,center:[fx,gy+.045,end],normal:[0,0,inward],width:w,height:h,depth:p.field.goalDepth,evidence:'P C01/C02 white goal family; H numeric alignment with retained pitch'});
  }
  route('field-infield','现有内场中线通行，不跨球门网',[[fx-20,gy+.044,fz],[fx+20,gy+.044,fz]]);
  // 10 photographed central high portico with lower side wings, not an auditorium box.
  owner='10';const R=get('10'),[x,,z]=R.position,[rw,,rd]=R.size,deck=p.rostrum.deckY;
  box('podium','podium',x-rw/2,x+rw/2,fy('10'),deck-.06,z-rd/2,z+rd/2,14);
  slab('stage-paving',x-rw/2,x+rw/2,z-rd/2,z+rd/2,deck,8);
  for(const zz of [z-4,z+4])for(const xx of [x-2.70,x+2.70]){
    box('central-column'+xx+zz,'column',xx-.22,xx+.22,deck,7.95,zz-.22,zz+.22,17,'P warm portico columns / H spacing');
    box('column-base'+xx+zz,'column',xx-.31,xx+.31,deck,deck+.50,zz-.31,zz+.31,8);
    box('capital'+xx+zz,'cornice',xx-.32,xx+.32,7.68,7.96,zz-.32,zz+.32,8);
  }
  for(const [a,b]of[[z-rd/2,z-4.5],[z+4.5,z+rd/2]]){
    box('wing-roof'+a,'roof',x-rw/2,x+rw/2,6.22,p.rostrum.sideRoofY,a,b,8);
    for(const zz of [a+.28,b-.28])for(const xx of [x-2.65,x+2.65])box('wing-column'+xx+zz,'column',xx-.13,xx+.13,deck,6.22,zz-.13,zz+.13,8);
  }
  for(let i=0;i<3;i++)box('portico-cornice'+i,'cornice',x-3.1-i*.12,x+3.1+i*.12,7.95+i*.14,8.09+i*.14,z-4.9-i*.12,z+4.9+i*.12,8);
  box('portico-roof','roof',x-3.34,x+3.34,8.37,8.48,z-5.14,z+5.14,8);
  stoneRail('stage-back',[x-rw/2+.1,z-rd/2],[x-rw/2+.1,z-4],deck,.82);stoneRail('stage-back2',[x-rw/2+.1,z+4],[x-rw/2+.1,z+rd/2],deck,.82);
  // Keep the exact P03 upper deck connection. Add an explicit H lower-side flight.
  const steps=[],start=z+rd/2+p.rostrum.stairCount*p.rostrum.tread;
  slab('lower-stair-landing',x-1.25,x+1.25,start,start+.8,fy('10')+.04,2);
  for(let i=0;i<p.rostrum.stairCount;i++){const zz=start-i*p.rostrum.tread,top=fy('10')+.04+(deck-fy('10')-.04)*(i+1)/p.rostrum.stairCount;box('field-step'+i,'step',x-1.25,x+1.25,fy('10'),top,zz-p.rostrum.tread-.003,zz+.003,8);steps.push([x,top,zz-p.rostrum.tread/2]);}
  for(const sign of [-1,1]){const xx=x+sign*1.27;rod('stair-rail'+sign,'railing',[xx,fy('10')+1.05,start],[xx,deck+1.05,z+rd/2],.036,6);for(const i of [0,3,7])rod('stair-post'+sign+i,'railing',[xx,steps[i][1],steps[i][2]],[xx,steps[i][1]+1.02,steps[i][2]],.03,6);}
  route('rostrum-upper','主路 → 原P03上层接入台 → 主席台', [...groundPoints([[0,z],[11.6,z]]),[12.15,deck,z],[x,deck,z]]);
  route('rostrum-lower','操场下层 → 八级H侧梯 → 主席台',[[28,1.844,start+.45],[x,fy('10')+.04,start+.45],...steps,[x,deck,z+rd/2-.6]]);
  // 14 KEEP P04 three poles, plinth and stairs; add source-backed stone balustrades only.
  owner='14';const flags=site.forecourt.flag,[ax,az]=flags.center,ay=terrain.groundHeight(ax,az)+.04+flags.platformRise;
  const [aw,ad]=[flags.platformWidth,flags.platformDepth];
  stoneRail('flags-back',[ax-aw/2+.22,az-ad/2+.14],[ax+aw/2-.22,az-ad/2+.14],ay,.82);
  for(const sign of [-1,1]){
    const xx=ax+sign*(aw/2-.18);stoneRail('flags-side'+sign,[xx,az-ad/2+.14],[xx,az+ad/2-.1],ay,.82);
    stoneRail('flags-front'+sign,[xx,az+ad/2-.1],[ax+sign*3.8,az+ad/2-.1],ay,.82);
    for(const zz of [az-ad/2+.1,az+ad/2-.08]){box('flag-post'+sign+zz,'stone-plaque',xx-.14,xx+.14,ay,ay+1.02,zz-.14,zz+.14,8);box('flag-cap'+sign+zz,'cornice',xx-.18,xx+.18,ay+.99,ay+1.09,zz-.18,zz+.18,8);}
  }
  for(const off of [-flags.poleSpacing,0,flags.poleSpacing]){add('flag-collar'+off,'flagpole-ring','ring',{center:[ax+off,ay+.23,az],normal:[0,1,0],radius:.12,tube:.024},15);}
  const flagSteps=Array.from({length:flags.steps},(_,i)=>[ax,terrain.groundHeight(ax,az)+.04+flags.platformRise*(i+1)/flags.steps,az+ad/2+flags.tread*(flags.steps-i-.5)]);
  route('flag-platform','前坪 → 保留三阶 → 三旗杆基座（数量/主轴不变）',[[ax,terrain.groundHeight(ax,196)+.04,196],...flagSteps,[ax,ay,az+.65]]);
  // 20 / 26 / 28: true wall apertures with minimum vestibules; no room-by-room residential interiors.
  function shell(id,centre,size,front,floors,style='flat',row=14){
    const [xx,yy,zz]=centre,[w,h,d]=size,side=front!== '-Z',W=side?d:w,D=side?w:d,sign=front==='+X'?1:-1;
    const P=(u,y,v)=>side?[xx-sign*v,yy+y,zz+u]:[xx-u,yy+y,zz+v];
    function B(name,role,u0,u1,y0,y1,v0,v1,r=row){const a=P(u0,y0,v0),b=P(u1,y1,v1);return box(id+name,role,Math.min(a[0],b[0]),Math.max(a[0],b[0]),a[1],b[1],Math.min(a[2],b[2]),Math.max(a[2],b[2]),r);}
    function wall(name,a,b,y0,y1,v,holes,r=row){const xs=[...new Set([a,b,...holes.flatMap(q=>q.slice(0,2))].filter(q=>q>=a&&q<=b))].sort((a,b)=>a-b),ys=[...new Set([y0,y1,...holes.flatMap(q=>q.slice(2))].filter(q=>q>=y0&&q<=y1))].sort((a,b)=>a-b);
      for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){const u=(xs[i-1]+xs[i])/2,y=(ys[j-1]+ys[j])/2;if(!holes.some(q=>u>q[0]&&u<q[1]&&y>q[2]&&y<q[3]))B(name+i+'-'+j,'wall',xs[i-1],xs[i],ys[j-1],ys[j],v-.11,v+.11,r);}}
    function window(name,q,v){const[a,b,c,e]=q;B(name+'glass','window',a+.04,b-.04,c+.04,e-.04,v-.025,v+.025,4);for(const u of[a,b,(a+b)/2])B(name+'v'+u,'window-frame',u-.027,u+.027,c,e,v-.062,v+.062,6);for(const y of[c,e])B(name+'h'+y,'window-frame',a,b,y-.027,y+.027,v-.062,v+.062,6);B(name+'sill','window-sill',a-.06,b+.06,c-.055,c+.005,v-.17,v+.12,6);}
    const floor=.04,storey=h/floors,face=-D/2+.11,entryWidth=owner==='26'?1.40:owner==='28'?1.90:1.90,entryHeight=Math.min(2.65,storey-.33);
    B('floor','floor',-W/2,W/2,-.11,floor,-D/2,D/2,6);
    const bays=Math.max(1,Math.floor(W/4.1)),centres=Array.from({length:bays},(_,i)=>-W/2+W*(i+.5)/bays);
    for(let f=0;f<floors;f++){
      const y=floor+f*storey,yt=Math.min(h-.22,y+storey),wh=Math.min(1.65,storey-1.05),hs=centres.filter(u=>f>0||Math.abs(u)>2.2).map(u=>[u-.91,u+.91,y+.86,y+.86+wh]);
      wall('front'+f,-W/2,W/2,y,yt,face,[...hs,...(f===0?[[-entryWidth/2,entryWidth/2,floor,floor+entryHeight]]:[])]);
      hs.forEach((q,i)=>window('frontW'+f+'-'+i,q,face));
      const rear=centres.map(u=>[Math.max(-W/2+.27,u-.78),Math.min(W/2-.27,u+.78),y+.92,y+.92+wh-.1]);wall('rear'+f,-W/2,W/2,y,yt,D/2-.11,rear);rear.forEach((q,i)=>window('rearW'+f+'-'+i,q,D/2-.11));
      for(const u of[-W/2+.10,W/2-.10])B('endwall'+u+'-'+f,'wall',u-.10,u+.10,y,yt,-D/2,D/2,row);
      if(f>0)B('floor'+f,'floor',-W/2,W/2,y-.16,y,-D/2,D/2,6);
      if(style==='recess'&&f>0){ // Shallow window-bay safety rails; not an invented accessible balcony.
        for(const dy of[.20,1.05]){const a=P(-W*.3,y+dy,face-.035),b=P(W*.3,y+dy,face-.035);rod(id+'window-rail'+f+dy,'railing',a,b,.026,5);}
        for(const u of[-W*.3,W*.3])B('recess-jamb'+f+u,'window-frame',u-.035,u+.035,y+.18,y+1.11,face-.07,face-.015,5);
      }
      if(style==='stair-band')for(const u of[-1.30,1.30])B('stair-strip'+f+'-'+u,'paint-trim',u-.085,u+.085,y,yt,face-.145,face-.12,17); // paired piers never cover windows/door
    }
    if(owner!=='28')B('flat-roof','roof',-W/2,W/2,h-.22,h,-D/2,D/2,6);
    // Low perimeter curb stays inside the inherited envelope, never increases a block height.
    for(const v of owner==='28'?[]:[-D/2+.13,D/2-.13])B('roof-curb'+v,'parapet',-W/2,W/2,h-.10,h,v-.10,v+.10,row);
    for(const u of[-entryWidth/2,entryWidth/2])B('door-jamb'+u,'door-frame',u-.035,u+.035,floor,floor+entryHeight,face-.06,face+.06,6);
    B('door-head','door-frame',-entryWidth/2,entryWidth/2,floor+entryHeight-.03,floor+entryHeight+.035,face-.06,face+.06,6);
    B('entry-canopy','canopy',-1.40,1.40,floor+entryHeight+.06,floor+entryHeight+.22,face-.85,face+.20,6);
    for(const u of[-1.50,1.50])B('vestibule-side'+u,'wall',u-.08,u+.08,floor,Math.min(h-.22,3),face+.10,face+2.8,row);
    B('vestibule-back','wall',-1.58,1.58,floor,Math.min(h-.22,3),face+2.72,face+2.88,row);
    B('threshold','floor',-1.42,1.42,floor-.14,floor,face-.9,face+.3,2);
    const entryPoint=P(0,floor,face),normal=side?[sign,0,0]:[0,0,-1];portal(id+'-entry',entryPoint,normal,entryWidth-.10,entryHeight-.07);
    return {entry:entryPoint,normal,inside:P(0,floor,face+1.65),outside:P(0,floor,face-.75)};
  }
  owner='28';const aux=get('28'),[ux,,uz]=aux.position,A=shell('aux', [ux,fy('28'),uz],aux.size,'+X',1,'flat',14);
  // A single long low roof with sloping cap, not three invented buildings/room uses.
  add('low-roof','metal-roof','prism',{points:[[ux-3,fy('28')+3.28,uz-12],[ux+3,fy('28')+3.10,uz-12],[ux+3,fy('28')+3.10,uz+12],[ux-3,fy('28')+3.28,uz+12]],offset:[0,-.08,0]},5);
  paving('aux-path',[[-72,120],[-75,120],[-75,uz],[-77,uz]],2.0);
  route('sports-auxiliary','风雨跑道横向开口 → 单层体育辅助用房门厅',[[ -68.5,3.04,120],...groundPoints([[-72,120],[-75,120],[-75,uz]]),A.outside,A.inside]);
  owner='26';const toilet=get('26'),[wx,,wz]=toilet.position,U=shell('pool-wc',[wx,fy('26'),wz],toilet.size,'+X',1,'flat',14);
  paving('pool-wc-path',[[-54,80],[-58.8,80]],1.7);route('pool-toilet','泳池西侧现有空隙 → 单层26公共入口',[...groundPoints([[-54,80],[-58.2,80]]),U.outside,U.inside]);
  owner='20';const residential=get('20'),rc=residential.position;
  for(const[i,b]of layout.contextBlocks.entries()){
    const centre=[rc[0]+b.localPosition[0],fy('20'),rc[2]+b.localPosition[2]],front=b.localPosition[0]<0?'+X':'-X';
    const e=shell(b.id,centre,b.size,front,p.residential.floorCounts[i],p.residential.styles[i],i%2?0:14);
    blocks.push({id:b.id,centre,size:[...b.size],floors:p.residential.floorCounts[i],style:p.residential.styles[i],entry:e.entry,evidence:'H outer shell, no unit identity/private plan'});
    const start=[171,e.entry[2]],end=[e.outside[0],e.outside[2]];paving('public-entry'+i,[start,end],2.0);route('public-'+b.id,'生活区H公共过道 → '+b.id+'外壳门厅',[...groundPoints([start,end]),e.inside]);
  }
  const residentialPath=[[129,32],[136,20],[171,20],[171,116]];paving('residential-spine',residentialPath,2.0);route('residential-spine','既有东侧路 → 六体量间的H公共过道',groundPoints(residentialPath));
  // 04 pool water kept in the same rectangle. Coping, ladder handles and lane ropes.
  owner='04';const P=get('04'),[px,,pz]=P.position,[ww,,dd]=P.size,water=fy('04')+.15;
  box('water','pool-surface',px-ww/2,px+ww/2,water-.05,water,pz-dd/2,pz+dd/2,4);
  for(const z of[pz-dd/2-.16,pz+dd/2+.16])box('coping-z'+z,'stone-plaque',px-ww/2-.32,px+ww/2+.32,fy('04'),water+.12,z-.16,z+.16,8);
  for(const x of[px-ww/2-.16,px+ww/2+.16])box('coping-x'+x,'stone-plaque',x-.16,x+.16,fy('04'),water+.12,pz-dd/2,pz+dd/2,8);
  for(let i=1;i<5;i++)rod('lane-rope'+i,'net-fabric',[px-ww/2+.10,water+.025,pz-dd/2+dd*i/5],[px+ww/2-.10,water+.025,pz-dd/2+dd*i/5],.025,8,'H five-lane division',16);
  for(const z of[pz-2.8,pz-2.25])curve('ladder'+z,'pool-rail',[[px+ww/2+.26,water+.08,z],[px+ww/2+.26,water+.67,z],[px+ww/2+.10,water+.90,z],[px+ww/2-.2,water+.94,z],[px+ww/2-.38,water+.72,z],[px+ww/2-.38,water-1.25,z]],.035,15);
  for(let i=0;i<4;i++)rod('ladder-step'+i,'pool-rail',[px+ww/2-.38,water-.12-i*.28,pz-2.8],[px+ww/2-.38,water-.12-i*.28,pz-2.25],.026,15);
  // 23 retained sand surface/anchor; add thin perimeter and takeoff edge, not another pit.
  owner='23';const pit=get('23'),[bx,,bz]=pit.position,[bw,,bd]=pit.size,by=fy('23')+.07;
  for(const zz of[bz-bd/2,bz+bd/2])box('pit-border'+zz,'stone-plaque',bx-bw/2,bx+bw/2,by-.04,by+.035,zz-.075,zz+.075,6);
  for(const xx of[bx-bw/2,bx+bw/2])box('pit-end'+xx,'stone-plaque',xx-.075,xx+.075,by-.04,by+.035,bz-bd/2,bz+bd/2,6);
  // Major planted spatial structure only. Explicit constrained rows, no random scatter.
  owner='09';
  function tree(id,x,z,r,h,drooping=false){const y=terrain.groundHeight(x,z),stem=p.vegetation.minimumClearStem;
    trees.push({id,x,z,ground:y,radius:r,height:h,drooping,evidence:'P row/landmark context; H individual coordinate, species and metric'});
    rod(id+'-trunk','tree-trunk',[x,y,z],[x+.12,y+h*.60,z-.08],.24,11);
    for(let k=0;k<4;k++){const a=k*Math.PI/2+.45,xx=x+Math.cos(a)*r*.53,zz=z+Math.sin(a)*r*.53;rod(id+'-branch'+k,'tree-trunk',[x,y+stem+.35,z],[xx,y+h*.70,zz],.090,11);add(id+'-crown'+k,'crown','leaf',{center:[xx,y+h*.72+(k%2)*.22,zz],size:[r*.69,h*.25,r*.69]},k%2?1:13);}
    add(id+'-crown-top','crown','leaf',{center:[x,y+h*.86,z],size:[r*.66,h*.16,r*.64]},1);
    if(drooping)for(let k=0;k<12;k++){const a=k*Math.PI/6;add(id+'-drooping'+k,'crown','leaf',{center:[x+Math.cos(a)*r*.72,y+stem+1.4,z+Math.sin(a)*r*.72],size:[.46,1.45,.47]},13);}
  }
  const mainZ=[28,42,58,74,88,142,160,180,199];for(const s of[-1,1])mainZ.forEach((z,i)=>tree('avenue-'+s+'-'+i,s*7,z,3.4+(i%3)*.35,7.4+(i%2)*.6));
  [51,69,84,92,136,153,174].forEach((z,i)=>tree('field-west-'+i,21.4,z,3.7,8.5));
  [49,69,89,109,135,149].forEach((z,i)=>tree('field-east-'+i,124.8,z,4.0,8.6));
  [38,55,74,93,109].forEach((x,i)=>tree('field-near-'+i,x,37,4.3,8.8));
  [35,48,62,89,105,117].forEach((x,i)=>tree('field-rear-'+i,x,189.5,3.7,7.8));tree('flag-drooping-H',54,189.8,4.4,8.7,true);
  [[-8,94],[-8,109],[-8,136],[-8,151],[-74.5,88],[-74.5,102],[-74.5,138],[-74.5,151]].forEach(([x,z],i)=>tree('court-row-'+i,x,z,3.3,8.0));
  [[-20,5],[-7,13],[8,14],[136,52],[136,74],[136,106]].forEach(([x,z],i)=>tree('node-'+i,x,z,3.2,7.6));
  for(const[a,b]of[[30,66],[85,118]]){
    box('rear-bed'+a,'planter-soil',a,b,3.30,3.48,188.8,190.7,11);for(const z of[188.8,190.7])box('rear-kerb'+a+z,'stone-plaque',a,b,3.28,3.53,z-.06,z+.06,8);
    for(let x=a+.5;x<b;x+=1.1)add('rear-hedge'+x,'foliage','leaf',{center:[x,3.69,190.2],size:[.68,.3,.39]},13);
  }
  return {version:p.version,status:p.status,standard:p.standard,parts,portals,routes,fixtures,trees,hoops,goals,blocks,courts,fenceSegments,retiredNames,replaceRoots:p.replaceRoots,
    invariants:{base:p.baseCommit,terrainUnchanged:true,roadGraphUnchanged:true,stoneAnchor:[...get('27').position],flagCenter:[ax,az],flagCount:flags.count,unlocated22:get('22').position},
    limits:['No measured coordinates or species; new metrics H.','Full scene rays are geometric review, not a character controller.','22 is intentionally unlocated; 20 blocks are not verified dwelling identities.']};
}
export function stadiumPoints(width,length,segments=192){const r=width/2,a=length/2-r,pts=[];for(let i=0;i<=segments/2;i++){const t=Math.PI+Math.PI*i/(segments/2);pts.push([r*Math.cos(t),-a+r*Math.sin(t)]);}for(let i=0;i<=segments/2;i++){const t=Math.PI*i/(segments/2);pts.push([r*Math.cos(t),a+r*Math.sin(t)]);}return pts;}
