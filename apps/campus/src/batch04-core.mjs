/** B04 has no independent site model. All anchors/roads come from cumulative B03.
 * u = observer-right, v = into building, y = above retained anchor. Every metric is H.
 * Exact same parts feed rendering, picking, BVH and access diagnostics.
 */
const configs=p=>[p.science,p.longya,p.office,p.museum,p.information];
const axes={ '-Z': [[-1,0,0],[0,0,1]], '-X': [[0,0,1],[1,0,0]], '+X': [[0,0,-1],[-1,0,0]] };
function orient(front,u,y,v){const [U,V]=axes[front];return [U[0]*u+V[0]*v,y,U[2]*u+V[2]*v];}
export function applyB04Layout(base,p){
  if(p.surveyVerified!==false||p.measured!==null)throw Error('B04 metric values must stay H');
  const l=structuredClone(base);
  for(const c of configs(p)){
    const f=l.facilities.find(q=>q.id===c.owner);f.note=c.basis;
    // Only the unapproved H floor count of16 changes. Envelope/XZ never move.
    f.floors=c.floors;f.evidence.unknowns+='; B04: all hidden faces/metrics H; no dated survey';
    const e=c.entry,a=orient(c.front,e.u,0,e.v),V=axes[c.front][1];
    const id={'07':'07-front','13':'13-front','16':'16-east','17':'17-front','21':'21-west'}[c.owner];
    const entry={id,facilityId:c.owner,position:a.map((n,i)=>n+f.position[i]),facing:V.map(n=>-n),width:e.width,height:e.height,status:'B04 P/H exterior; H exact open portal and minimal vestibule',evidence:'H metric / see batch04 evidence'};
    const ix=l.entrances.findIndex(q=>q.id===id);if(ix<0)l.entrances.push(entry);else l.entrances[ix]={...l.entrances[ix],...entry};
  }
  l.batch04={version:p.version,status:p.status,standard:p.standard,owners:p.scope,terrainUnchanged:true,roadTopologyUnchanged:true};
  return l;
}
export function buildB04Model(layout,terrain,p){
  const parts=[],portals=[],routes=[],summaries=[],fixtures=[];
  for(const C of configs(p)){
    const owner=C.owner,F=layout.facilities.find(f=>f.id===owner),anchor=terrain.anchors[owner];
    if(!F?.position||!anchor)throw Error('Missing effective B04 facility '+owner);
    const [W,D]=C.front==='-Z'?[F.size[0],F.size[2]]:[F.size[2],F.size[0]],H=F.size[1],fy=p.common.floorOffset+(C.rise??0),t=p.common.wall;
    const P=(u,y,v)=>orient(C.front,u,y,v),world=(u,y,v)=>P(u,y,v).map((n,i)=>n+(i===1?anchor.floor:F.position[i]));
    function add(name,role,shape,data,row=14,evidence='H'){const part={id:`B04-${owner}-${name}`,owner,role,shape,row,evidence,...data};parts.push(part);return part;}
    function box(name,role,u0,u1,y0,y1,v0,v1,row=14,evidence='H'){
      const a=P(u0,y0,v0),b=P(u1,y1,v1),size=a.map((n,i)=>Math.abs(b[i]-n));
      if(size.some(n=>!Number.isFinite(n)||n<1e-6))throw Error('Invalid B04 box '+owner+' '+name);
      return add(name,role,'box',{center:a.map((n,i)=>(n+b[i])/2),size},row,evidence);
    }
    function profile(name,role,outline,holes,v0,v1,row=14,evidence='H'){
      return add(name,role,'profile',{outline,holes,v0,v1,front:C.front},row,evidence);
    }
    function plan(name,role,outline,y0,y1,row=6,evidence='H'){
      return add(name,role,'plan',{points:outline.map(([u,v])=>{const q=P(u,0,v);return [q[0],q[2]];}),y0,y1},row,evidence);
    }
    function rod(name,role,a,b,radius=.035,row=6,evidence='H'){
      return add(name,role,'rod',{a:P(...a),b:P(...b),radius},row,evidence);
    }
    // A rectangular wall is tessellated ONLY around real apertures, not for a triangle quota.
    function panel(name,a,b,y0,y1,holes,v,row=14,depth=t,role='wall'){
      const xs=[...new Set([a,b,...holes.flatMap(h=>[h[0],h[1]])].filter(x=>x>=a&&x<=b))].sort((a,b)=>a-b);
      const ys=[...new Set([y0,y1,...holes.flatMap(h=>[h[2],h[3]])].filter(y=>y>=y0&&y<=y1))].sort((a,b)=>a-b);
      for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){
        const u=(xs[i-1]+xs[i])/2,y=(ys[j-1]+ys[j])/2;
        if(!holes.some(h=>u>h[0]&&u<h[1]&&y>h[2]&&y<h[3]))box(name+'-'+i+'-'+j,role,xs[i-1],xs[i],ys[j-1],ys[j],v-depth/2,v+depth/2,row);
      }
    }
    function frame(name,a,b,y0,y1,v,glass=true,row=6){
      for(const u of [a,b])box(name+'j'+u,'window-frame',u-.045,u+.045,y0,y1,v-.105,v+.105,row);
      box(name+'head','window-frame',a,b,y1-.045,y1+.045,v-.105,v+.105,row);
      if(glass){
        box(name+'pane','window',a+.05,b-.05,y0+.05,y1-.05,v-.025,v+.025,4);
        box(name+'sill','window-sill',a-.08,b+.08,y0-.075,y0+.015,v-.17,v+.11,6);
        const n=Math.max(2,Math.round((b-a)/.95));
        for(let i=1;i<n;i++){const u=a+(b-a)*i/n;box(name+'m'+i,'window-mullion',u-.03,u+.03,y0,y1,v-.08,v+.08,row);}
        box(name+'transom','window-frame',a,b,y1-.60,y1-.55,v-.08,v+.08,row);
      }
    }
    function door(name,e,level=fy,arched=false){
      if(!arched)frame(name,e.u-e.width/2,e.u+e.width/2,level,level+e.height,e.v,false,6);
      const V=axes[C.front][1];
      portals.push({id:name,facility:owner,center:world(e.u,level,e.v),normal:V.map(n=>-n),width:e.width-.12,height:e.height-.08,floor:anchor.floor+level,arched});
      if(!arched)for(const sign of [-1,1]){
        const u=e.u+sign*(e.width/2+.04);
        // Open leaves parked outside the clear aperture; no bottom frame across floor.
        box(name+'open'+sign,'open-door',u-.033,u+.033,level+.06,level+e.height-.06,e.v+.20,e.v+1.25,owner==='13'?5:20);
      }
    }
    function side(name,u,v0,v1,y0,y1,holes=[],row=14){
      // Use the same aperture-partition algorithm for side walls, then swap U/V.
      const start=parts.length;panel(name,v0,v1,y0,y1,holes,u,row);
      for(const q of parts.slice(start)){
        const un=undo(q.center);q.center=P(un[2],un[1],un[0]);q.size=C.front==='-Z'?[q.size[2],q.size[1],q.size[0]]:[q.size[2],q.size[1],q.size[0]];
      }
    }
    function undo(q){const[U,V]=axes[C.front];return [q[0]*U[0]+q[2]*U[2],q[1],q[0]*V[0]+q[2]*V[2]];}
    function sideFrame(name,u,a,b,y0,y1){
      const start=parts.length;frame(name,a,b,y0,y1,u);
      for(const q of parts.slice(start)){const un=undo(q.center);q.center=P(un[2],un[1],un[0]);[q.size[0],q.size[2]]=[q.size[2],q.size[0]];}
    }
    function slab(name,level,u0=-W/2,u1=W/2,v0=-D/2,v1=D/2){box(name,'floor',u0,u1,level-.20,level,v0,v1,6);}
    function roof(height=H){box('roof','roof',-W/2,W/2,height-.22,height,-D/2,D/2,6);for(const v of [-D/2+.10,D/2-.10])box('parapet'+v,'parapet',-W/2,W/2,height,height+.24,v-.10,v+.10,14);}
    function route(id,label,points){routes.push({id,label,facility:owner,points});}
    function groundPath(points){const out=[];for(let k=1;k<points.length;k++){
      const a=points[k-1],b=points[k],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.45));
      for(let j=k===1?0:1;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;out.push([x,terrain.groundHeight(x,z)+.04,z]);}
    }return out;}
    // Small ramps are explicit visible support, not invisible passability proxies.
    function landingRamp(name,u0,u1,v0,v1,startY,endY){
      const pts=[P(u0,startY,v0),P(u1,startY,v0),P(u1,endY,v1),P(u0,endY,v1)];
      add(name,'paving','prism',{points:pts,offset:[0,-.16,0]},2);
    }
    function lobby(e,width=5,depth=4){
      for(const u of [e.u-width/2,e.u+width/2])side('lobby-side'+u,u,e.v+.15,e.v+depth,fy,fy+3.40,[],14);
      panel('lobby-back',e.u-width/2,e.u+width/2,fy,fy+3.40,[],e.v+depth,14,.18);
    }
    const front=-D/2;
    if(owner==='13'){
      const T=C.tower,e=C.entry,can=C.canopy,st=C.steps;
      slab('raised-ground',fy);
      for(let i=0;i<st.count;i++){
        const va=st.startV+(st.endV-st.startV)*i/st.count,vb=st.startV+(st.endV-st.startV)*(i+1)/st.count;
        box('entrance-step'+i,'step',-st.width/2,st.width/2,.02,.04+C.rise*(i+1)/st.count,va-.006,vb+.006,6,'P low steps / H count, dimensions');
      }
      // Low glazed lobby is visually distinct from the taller blank wall and glass stair bay.
      const openings=[[e.u-e.width/2,e.u+e.width/2,fy,fy+e.height],[-7.25,-5.45,fy+.18,fy+2.85],[-.85,.6,fy+.18,fy+2.85]];
      panel('entry-front',-8,1.3,fy,fy+3.58,openings,e.v,17);
      for(const [i,h]of openings.slice(1).entries())frame('entrance-sideglass'+i,...h,e.v);
      door('science-main',e);
      panel('name-wall',1.3,T.u0,fy,fy+3.58,[],e.v,14);
      side('entry-return-left',-7.88,front,e.v,fy,fy+3.58);
      box('canopy-core','canopy',can.u0,can.u1,fy+can.bottom,fy+can.bottom+can.thickness,can.frontV,can.rearV,6,'P horizontal canopy / H profile');
      box('canopy-warm-fascia','fascia',can.u0,can.u1,fy+can.bottom+.08,fy+can.bottom+can.thickness+.14,can.frontV-.055,can.frontV+.065,17,'P warm facing / H material');
      box('upper-front-wall','wall',-8,T.u0,fy+3.58,H-.24,front+.65,front+.89,14,'H unseen upper front');
      box('tower-colour-pier','wall',T.u0-.50,T.u0,fy,H-.14,front+.40,front+.68,17,'P vertical warm pier / H metric');
      // Windows in long elevations are conservative H and actually cut out of the walls.
      for(let f=0;f<C.floors;f++){
        const y=fy+f*C.storey,top=Math.min(H-.24,y+C.storey),holes=C.sideWindowCentersV.map(v=>[v-1.50,v+1.50,y+.93,y+2.95]);
        for(const u of [-W/2+.12,W/2-.12]){
          const hs=u>0?holes.filter(h=>h[0]>T.rearV):holes;
          side('long-wall'+u+'L'+f,u,front,D/2,y,top,hs);hs.forEach((h,i)=>sideFrame('side-window'+u+'L'+f+'-'+i,u,...h));
        }
        const rearH=[[-6.8,-3.5,y+.95,y+2.85],[.2,3.5,y+.95,y+2.85]];panel('rear'+f,-W/2,W/2,y,top,rearH,D/2-.12);rearH.forEach((h,i)=>frame('rearW'+f+'-'+i,...h,D/2-.12));
        if(f>0){slab('floor-main'+f,y,-W/2,T.u0,front,D/2);slab('floor-rear'+f,y,T.u0,W/2,T.rearV,D/2);}
        const ty=y+.04,th=top-.05,holesFront=f===0?[[C.secondary.u-C.secondary.width/2,C.secondary.u+C.secondary.width/2,fy,fy+C.secondary.height]]:[];
        panel('tower-pane'+f,T.u0,T.u1,ty,th,holesFront,C.secondary.v,4,.055,'window');
        for(const u of [T.u0,T.u0+1.20,T.u1])if(f!==0||u<C.secondary.u-C.secondary.width/2||u>C.secondary.u+C.secondary.width/2)box('tower-mullion'+f+'-'+u,'window-mullion',u-.045,u+.045,y,top,C.secondary.v-.10,C.secondary.v+.10,6);
        box('tower-transom'+f,'window-frame',T.u0,T.u1,top-.06,top+.03,C.secondary.v-.10,C.secondary.v+.10,6);
        {const j=parts.length;side('tower-sidepane'+f,T.u1,C.secondary.v,T.rearV,ty,th,[],4);parts.slice(j).forEach(q=>q.role='window');} // true glazed side, no opaque backing
        for(let v=C.secondary.v;v<T.rearV;v+=1.20){const start=parts.length;box('tower-side-mullion'+f+'-'+v,'window-mullion',v-.04,v+.04,y,top,T.u1-.07,T.u1+.07,6);const q=parts[start],un=undo(q.center);q.center=P(un[2],un[1],un[0]);[q.size[0],q.size[2]]=[q.size[2],q.size[0]];}
      }
      door('science-glass-bay',C.secondary);
      box('glass-bay-canopy','canopy',T.u0,T.u1,fy+3.18,fy+3.34,front-.78,front+.6,6);
      // Entry bay minimum internal flight to one real landing, not finished laboratories.
      const S=C.stair,end=S.startV+S.steps*S.tread;
      for(let i=0;i<S.steps;i++)box('internal-stair'+i,'step',S.u-S.width/2,S.u+S.width/2,fy,fy+C.storey*(i+1)/S.steps,S.startV+i*S.tread-.006,S.startV+(i+1)*S.tread+.006,6);
      slab('stair-receiving-landing',fy+C.storey,T.u0,T.u1,end-.008,T.rearV+.20);
      for(const sign of [-1,1]){const u=S.u+sign*S.width/2;rod('stair-rail'+sign,'railing',[u,fy+1.04,S.startV],[u,fy+C.storey+1.04,end]);for(let i=0;i<=S.steps;i+=3)rod('stair-post'+sign+'-'+i,'railing',[u,fy+C.storey*i/S.steps,S.startV+i*S.tread],[u,fy+C.storey*i/S.steps+1.04,S.startV+i*S.tread]);}
      roof(H); // common roof factory; no opaque front wall behind tower glazing
      const stepPts=u=>Array.from({length:st.count},(_,i)=>world(u,.04+C.rise*(i+1)/st.count,st.startV+(st.endV-st.startV)*(i+.5)/st.count));
      route('science-main','既有东前路—三低阶—科学馆内退门洞—门厅',[...groundPath([[129,208],[144,199],[144,F.position[2]+e.u]]),...stepPts(e.u),world(e.u,fy,-19.98),world(e.u,fy,e.v-.50),world(e.u,fy,e.v+.60),world(e.u,fy,e.v+2.8)]);
      const q=C.secondary;
      route('science-bay','门前低阶—玻璃侧厅开口—楼梯起步',[...groundPath([[144,199],[144,F.position[2]+q.u]]),...stepPts(q.u),world(q.u,fy,-19.99),world(q.u,fy,q.v+.60),world(q.u,fy,S.startV-.10)]);
      route('science-stair','玻璃侧厅—首段楼梯—首层上方落脚面',[world(S.u,fy,S.startV-.10),...Array.from({length:S.steps},(_,i)=>world(S.u,fy+C.storey*(i+1)/S.steps,S.startV+(i+.5)*S.tread)),world(S.u,fy+C.storey,end+.20)]);
      fixtures.push({owner,text:'科学馆',position:P(2.6,fy+1.95,e.v-.14),normal:axes[C.front][1].map(n=>-n),basis:'P visible name; H generic programmatic type, not historical calligraphy'});
    } else if(owner==='17'){
      const e=C.entry,T=C.tower,st=terrain.stairs.find(s=>s.facilityId===owner);if(!st)throw Error('Inherited ST-LONGYA missing');
      const v0=st.start[1]-F.position[2],v1=st.end[1]-F.position[2],floor=fy;
      for(let i=0;i<st.steps;i++){
        const va=v0+(v1-v0)*i/st.steps-.006,vb=v0+(v1-v0)*(i+1)/st.steps+.006,half=(C.steps.lowerWidth+(C.steps.upperWidth-C.steps.lowerWidth)*(i+1)/st.steps)/2;
        plan('front-splayed-step'+i,'step',[[-half+.50,va], [half-.50,va],[half,vb],[ -half,vb]],fy-st.rise-.04,fy-st.rise+(i+1)*st.rise/st.steps,6,'P splayed low steps / H six inherited risers and new widths');
      }
      // Front landing is continuous with the retained foundation; no raised threshold.
      for(let f=0;f<C.floors;f++){
        const y=fy+f*C.storey,top=y+C.storey;
        for(const [a,b,height,tag]of [[-W/2,-T.halfWidth,C.wings.leftHeight,'L'],[T.halfWidth,W/2,C.wings.rightHeight,'R']]){
          const hi=Math.min(top,height),hs=C.wingWindowsU.filter(u=>u>a&&u<b).map(u=>[u-1.24,u+1.24,y+.78,Math.min(y+2.75,hi-.24)]);
          panel('wing'+tag+f,a,b,y,hi,hs,C.wings.frontV,14);hs.forEach((h,i)=>frame('wingW'+tag+f+'-'+i,...h,C.wings.frontV, true,6));
          box('wing-belt'+tag+f,'cornice',a,b,hi-.09,hi+.04,C.wings.frontV-.16,C.wings.frontV+.12,6);
        }
        const backH=[-18,-11,-4,4,11,18].map(u=>[u-1.7,u+1.7,y+.85,Math.min(y+2.9,H-.40)]);
        panel('rear'+f,-W/2,W/2,y,Math.min(top,H-.22),backH,D/2-.12);backH.forEach((h,i)=>frame('backW'+f+'-'+i,...h,D/2-.12));
        for(const u of [-W/2+.12,W/2-.12]){const hs=[[-4.5,-1.5,y+.9,y+2.8],[2.1,5.4,y+.9,y+2.8]];side('end'+u+'-'+f,u,C.wings.frontV,D/2,y,Math.min(top,C.wings.leftHeight),hs);hs.forEach((h,i)=>sideFrame('endW'+u+'-'+f+'-'+i,u,...h));}
        if(f>0)slab('floor'+f,y,-W/2,W/2,C.wings.frontV,D/2);
      }
      panel('lower-core',-T.halfWidth,T.halfWidth,fy,fy+C.storey,[[e.u-e.width/2,e.u+e.width/2,fy,fy+e.height]],e.v);door('longya-main',e);lobby(e,5.3,4.4);
      // Tall faceted glass polygon, not a blue rectangle pasted on a filled box.
      const contour=[[-T.halfWidth,T.returnV],[-T.flatHalfWidth,T.frontV],[T.flatHalfWidth,T.frontV],[T.halfWidth,T.returnV]];
      for(let f=1;f<C.floors;f++){
        const y=fy+f*C.storey,top=fy+(f+1)*C.storey-.12;
        const cs=f===1?[[-T.halfWidth,T.returnV],[T.halfWidth,T.returnV]]:contour;
        for(let i=1;i<cs.length;i++){
          const a=cs[i-1],b=cs[i];
          add('tower-glass'+f+'-'+i,'window','prism',{points:[P(a[0],y+.18,a[1]),P(b[0],y+.18,b[1]),P(b[0],top-.16,b[1]),P(a[0],top-.16,a[1])],offset:P(0,0,.045)},4,'P faceted central glazing / H dimensions');
          const n=Math.max(2,Math.round(Math.hypot(a[0]-b[0],a[1]-b[1])/1.0));
          for(let j=0;j<=n;j++){const u=a[0]+(b[0]-a[0])*j/n,v=a[1]+(b[1]-a[1])*j/n;box('tower-mullion'+f+'-'+i+'-'+j,'window-mullion',u-.045,u+.045,y+.12,top,v-.055,v+.055,6);}
          rod('tower-transom'+f+'-'+i,'window-frame',[a[0],top-.64,a[1]-.015],[b[0],top-.64,b[1]-.015],.035,6);
        }
        if(f>=2)plan('faceted-cornice'+f,'cornice',[...contour,[T.halfWidth,T.returnV+.30],[-T.halfWidth,T.returnV+.30]],y-.13,y+.10,6,'P faceted bands / H metric');
      }
      for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i];add('tower-head-spandrel'+i,'wall','prism',{points:[P(a[0],fy+C.floors*C.storey-.12,a[1]),P(b[0],fy+C.floors*C.storey-.12,b[1]),P(b[0],H,b[1]),P(a[0],H,a[1])],offset:P(0,0,.20)},14);}
      for(const [a,b,height]of [[-W/2,-T.halfWidth,C.wings.leftHeight],[T.halfWidth,W/2,C.wings.rightHeight]]){box('wing-roof'+a,'roof',a,b,height-.18,height,C.wings.frontV,D/2,6);box('wing-roof-edge'+a,'parapet',a,b,height,height+.21,C.wings.frontV-.08,C.wings.frontV+.16,14);}
      plan('tower-roof','roof',[...contour,[T.halfWidth,D/2],[-T.halfWidth,D/2]],H-.18,H,6);
      for(const u of [-T.halfWidth,T.halfWidth])box('tower-side-pier'+u,'wall',u-.12,u+.12,fy,H,C.wings.frontV,T.returnV+.22,14);
      const K=C.canopy,curve=Array.from({length:p.common.curveSegments+1},(_,i)=>{const a=Math.PI*i/p.common.curveSegments;return [-K.halfWidth*Math.cos(a),K.rearV-(K.rearV-K.frontV)*Math.sin(a)];});
      plan('rounded-canopy','canopy',curve,fy+K.bottom,fy+K.bottom+K.thickness,17,'P rounded canopy / H ellipse');
      for(const u of [-2.75,2.75])box('canopy-post'+u,'column',u-.19,u+.19,fy,fy+K.bottom,-9.6,-9.22,17,'P two warm columns / H section');
      // Sparse photograph-side ivy, high enough not to occupy entrance or path.
      for(let i=0;i<68;i++){const u=8.0+(i%9)*.56,y=fy+1.5+Math.floor(i/9)*.46;add('ivy-right-'+i,'foliage','leaf',{center:P(u,y,C.wings.frontV-.20),size:[.20,.24,.07]},13,'P right-front ivy / H leaves');}
      const stairPoints=Array.from({length:st.steps},(_,i)=>world(0,fy-st.rise+(i+1)*st.rise/st.steps,v0+(v1-v0)*(i+.5)/st.steps));
      route('longya-direct','保留直达道路—六级外展台阶—正门—最小门厅',[...groundPath([[129,239],[129,246.78]]),...stairPoints,world(0,fy,-8.85),world(0,fy,-8.35),world(0,fy,-6.0)]);
    } else if(owner==='16'){
      const e=C.entry,A=C.arch,top=fy+C.eaves,ridge=fy+C.ridge;
      const arch=[[-A.radius,fy],[A.radius,fy],[A.radius,fy+A.spring]];
      for(let i=1;i<=96;i++){const a=i*Math.PI/96;arch.push([A.radius*Math.cos(a),fy+A.spring+A.radius*Math.sin(a)]);}arch.push([-A.radius,fy]);
      const windows=[[-5.55,-2.25,fy+1.1,fy+3.55],[2.25,5.55,fy+1.1,fy+3.55]],holes=[arch,...windows.map(([a,b,c,d])=>[[a,c],[b,c],[b,d],[a,d]])];
      profile('arched-front','wall',[[-W/2,fy],[W/2,fy],[W/2,top],[-W/2,top]],holes,front,front+.24,0,'P arch and single low façade / H proportions');
      for(const [i,h]of windows.entries())frame('large-frontW'+i,...h,front-.035,true,6);
      door('museum-east',e,fy,true);
      for(const u of [-W/2+.22,-1.74,1.74,W/2-.22])box('facade-pilaster'+u,'column',u-.18,u+.18,fy,top-.08,front-.24,front+.08,6);
      for(const y of [top-.23,top-.06,top+.13])box('gable-cornice'+y,'cornice',-W/2-.2,W/2+.2,y,y+.12,front-.32,front+.14,6);
      // Curved arch surround is a real hollow band. No solid box spans the opening.
      const outer=Array.from({length:97},(_,i)=>{const a=i*Math.PI/96;return [(A.radius+.20)*Math.cos(a),fy+A.spring+(A.radius+.20)*Math.sin(a)];});
      const inner=Array.from({length:97},(_,i)=>{const a=Math.PI-i*Math.PI/96;return [A.radius*Math.cos(a),fy+A.spring+A.radius*Math.sin(a)];});
      profile('arch-surround','cornice',[...outer,...inner],[],front-.24,front-.04,6,'P curved surround / H section');
      for(const u of [-A.radius-.10,A.radius+.10])box('arch-jamb'+u,'column',u-.10,u+.10,fy,fy+A.spring,front-.24,front-.04,6);
      profile('front-pediment','wall',[[-W/2,top],[W/2,top],[0,ridge-.12]],[],front,front+.24,0,'P gable / H exact pitch');
      profile('back-pediment','wall',[[-W/2,top],[W/2,top],[0,ridge-.12]],[],D/2-.24,D/2,14);
      for(const sign of [-1,1]){
        const pts=[P(0,ridge,front-.22),P(sign*(W/2+.22),top-.04,front-.22),P(sign*(W/2+.22),top-.04,D/2+.22),P(0,ridge,D/2+.22)];
        add('roof-slope'+sign,'roof','prism',{points:pts,offset:[0,-.16,0]},6,'P pitched silhouette / H rear roof');
        rod('gable-rake'+sign,'cornice',[0,ridge+.04,front-.29],[sign*(W/2+.20),top+.02,front-.29],.09,6);
        // Simplified paired scroll only; no fabricated exact historic ornament or date.
        const n=48;for(let j=0;j<n;j++){const a=j/n*2*Math.PI,b=(j+1)/n*2*Math.PI,ra=.12+.33*j/n,rb=.12+.33*(j+1)/n;rod('H-scroll'+sign+'-'+j,'cornice',[sign*(1.1+ra*Math.cos(a)),top+.75+ra*Math.sin(a),front-.075],[sign*(1.1+rb*Math.cos(b)),top+.75+rb*Math.sin(b),front-.075],.042,6,'H abstract substitute for obscured relief');}
        const hs=C.sideWindowCentersV.map(v=>[v-1.65,v+1.65,fy+1.25,fy+3.55]);side('hall-side'+sign,sign*(W/2-.12),front,D/2,fy,top,hs);hs.forEach((h,i)=>sideFrame('hall-sideW'+sign+'-'+i,sign*(W/2-.12),...h));
      }
      panel('hall-back',-W/2,W/2,fy,top,[],D/2-.12);lobby(e,5.3,4.5);
      const start=-16.8,end=-14.98,startW=world(0,0,start),startY=terrain.groundHeight(startW[0],startW[2])+.04-anchor.floor;
      landingRamp('short-front-ramp',-1.62,1.62,start,end,startY,fy);
      for(const u of [-1.79,1.79])box('ramp-low-curb'+u,'seat-edge',u-.10,u+.10,fy-.03,fy+.17,start,front+.05,6);
      route('museum-east','既有博物馆方向路—短坡—拱口—最小门厅',[...groundPath([[0,202],[-27.2,202]]),world(0,fy,-14.75),world(0,fy,-12.1)]);
    } else {
      // Two unverified buildings share primitives, not a single copied façade.
      const office=owner==='07',e=C.entry,frontV=office?C.frontV:front,windowU=office?C.windowCentersU:[-6.2,4.7];
      for(let f=0;f<C.floors;f++){
        const y=fy+f*C.storey,top=Math.min(y+C.storey,H-.22),hs=windowU.map(u=>[u-(office?1.20:1.9),u+(office?1.20:1.9),y+.90,Math.min(y+2.80,top-.20)]);
        if(f===0){const left=office?-2.4:e.u-e.width/2,right=office?2.4:e.u+e.width/2;panel('frontL'+f,-W/2,left,y,top,hs,frontV);panel('frontR'+f,right,W/2,y,top,hs,frontV);
          if(office){side('porch-left',left,frontV,e.v,fy,fy+3.35);side('porch-right',right,frontV,e.v,fy,fy+3.35);panel('porch-recess',left,right,fy,top,[[e.u-e.width/2,e.u+e.width/2,fy,fy+e.height]],e.v);}
          else panel('front-lintel',left,right,y,top,[[left,right,fy,fy+e.height]],frontV);
          door(office?'office-main':'information-west',e);lobby(e,office?5.2:5.4,office?4.0:4.5);
        }else{
          if(!office)hs.push([e.u-1.2,e.u+1.2,y+.5,y+3.1]);panel('front'+f,-W/2,W/2,y,top,hs,frontV);
        }
        hs.forEach((h,i)=>frame('frontW'+f+'-'+i,...h,frontV));
        const sideVs=office?[-4.1,2.0]:C.sideWindowCentersV;
        for(const sign of [-1,1]){const wh=sideVs.map(v=>[v-(office?1.35:1.72),v+(office?1.35:1.72),y+.95,Math.min(y+2.85,top-.2)]),u=sign*(W/2-.12);side('long-side'+f+'-'+sign,u,front,D/2,y,top,wh);wh.forEach((h,i)=>sideFrame('sideW'+f+'-'+sign+'-'+i,u,...h));}
        const bh=(office?[-17,-10,-3,4,11,18]:[-5.8,0,5.8]).map(u=>[u-1.2,u+1.2,y+.95,y+2.75]);panel('back'+f,-W/2,W/2,y,top,bh,D/2-.12);bh.forEach((h,i)=>frame('backW'+f+'-'+i,...h,D/2-.12));
        if(f>0)slab('floor'+f,y);
        box('front-belt'+f,'cornice',-W/2,W/2,top-.07,top+.05,frontV-.16,frontV+.10,6);
      }
      roof();
      box('small-entry-canopy','canopy',e.u-2.25,e.u+2.25,fy+3.08,fy+3.28,front-.75,e.v+.30,6);
      if(office){for(const u of [-2.65,2.65])box('central-vertical-pier'+u,'column',u-.12,u+.12,fy,H,front-.20,front+.15,6);}
      else{for(const u of [e.u-1.50,e.u+1.50])box('vertical-stair-band'+u,'wall',u-.18,u+.18,fy+3.40,H-.16,front-.28,front+.14,5);}
      const s=office?-10.5:-22.8,q=world(e.u,0,s),sy=terrain.groundHeight(q[0],q[2])+.04-anchor.floor;
      landingRamp('entry-supported-link',e.u-1.60,e.u+1.60,s,e.v+.04,sy,fy);
      const mainPath=office?[[0,158],[-45,159.5]]:[[129,224],[143.2,224]];
      route(office?'office-entry':'information-entry',office?'既有办公楼支路—内退门洞—门厅（医务室位置U）':'既有东西横路—西侧真门洞—工作名21落脚面',[...groundPath(mainPath),world(e.u,fy,e.v+.35),world(e.u,fy,e.v+2.8)]);
    }
    summaries.push({owner,name:F.name,front:C.front,footprint:[F.size[0],F.size[2]],anchor:anchor.floor,floors:C.floors,groundFloor:anchor.floor+fy,metricEvidence:'H',identity:['07','16','21'].includes(owner)?'U / source label only':'source-attributed',basis:C.basis});
  }
  const ids=parts.map(q=>q.id);if(new Set(ids).size!==ids.length)throw Error('Duplicate B04 part IDs');
  return {version:p.version,status:p.status,standard:p.standard,parts,portals,routes,fixtures,summaries,terrainUnchanged:true};
}
