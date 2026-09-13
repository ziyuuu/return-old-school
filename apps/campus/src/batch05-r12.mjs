/** User-directed B05 correction. Catalogue geometry is also used by support/BVH tests.
 * Relative front/side placement and continuous enclosure are A; all metric values H.
 */
export function reviseB05R12(model, layout, terrain) {
  const basis='A user correction 2026-09-13 / IMG_5693–5695; dimensions and hidden construction H';
  const add=(owner,name,role,shape,data,row=6,evidence=basis)=>{
    const p={id:`B05-${owner}-r12-${name}`,owner,role,shape,row,evidence,...data};model.parts.push(p);return p;
  };
  const box=(owner,name,role,x0,x1,y0,y1,z0,z1,row=6)=>add(owner,name,role,'box',{center:[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],size:[x1-x0,y1-y0,z1-z0]},row);
  const prism=(owner,name,role,points,offset,row=6)=>add(owner,name,role,'prism',{points,offset},row);
  const ground=(x,z)=>terrain.groundHeight(x,z)+.04;
  const route=(id,label,points)=>model.routes.push({id,label,facility:'27',points});
  // Remove the old free-standing roadside arrangement, not the gate/building itself.
  model.parts=model.parts.filter(p=>p.owner!=='27');
  model.fixtures=model.fixtures.filter(p=>p.owner!=='27');
  model.routes=model.routes.filter(p=>!['stone-front','stone-side'].includes(p.id));
  const deck=.65, stone=[-10.9,deck+.10,-4.50];
  box('27','platform','floor',-16,-7.2,.02,deck,-7.2,-2.15,7);
  // A separate side ramp: it does not overlap the steps or run through the pier.
  prism('27','ramp','floor',[[-8.9,.04,-12],[-7.3,.04,-12],[-7.3,deck,-7.2],[-8.9,deck,-7.2]],[0,-.15,0],2);
  for(let i=0;i<4;i++)box('27','step'+i,'floor',-14.0,-11.6,.01,.04+(deck-.04)*(i+1)/4,-9.0+i*.45,-9.0+(i+1)*.45,7);
  box('27','stone-base','stone-plaque',stone[0]-1.2,stone[0]+1.2,deck,stone[1],stone[2]-.94,stone[2]+.94,7);
  add('27','standing-stone','boulder','rock',{center:stone,size:[2.2,2.5,1.7]},7);
  model.fixtures.push({id:'B05-27-r12-stone-name',owner:'27',text:'YALI\nMIDDLE\nSCHOOL\n1906',position:[stone[0],stone[1]+1.15,stone[2]-.69],normal:[0,0,-1],width:1.3,height:1.35,row:12,basis:'P previously visible inscription; H lettering, not photograph texture'});
  box('27','rear-bed','planter-soil',-15.8,-7.4,deck,deck+.13,-3.0,-2.35,11);
  box('27','rear-bed-front','stone-plaque',-15.8,-7.4,deck,deck+.22,-3.12,-3.0,8);
  box('27','left-bed','planter-soil',-15.8,-15.15,deck,deck+.13,-6.9,-3.12,11);
  box('27','left-bed-edge','stone-plaque',-15.15,-15.03,deck,deck+.22,-6.9,-3.12,8);
  for(let i=0;i<13;i++)add('27','hedge'+i,'foliage','leaf',{center:[-15.4+i*.61,deck+.4,-2.67],size:[.47,.36,.29],crownProfile:'lobed',seed:i},13);
  for(let i=0;i<5;i++)add('27','side-hedge'+i,'foliage','leaf',{center:[-15.48,deck+.4,-6.55+i*.70],size:[.29,.36,.49],crownProfile:'lobed',seed:i+20},13);
  const rampSamples=Array.from({length:17},(_,i)=>[-8.1,.04+(deck-.04)*i/16,-12+4.8*i/16]);
  route('stone-front','门外 → 侧坡 → 右侧建筑前方平台 → 石前阅读区',[[0,.04,-12],...rampSamples,[-8.1,deck,-6.4],[-10.9,deck,-6.4]]);
  route('stone-side','短台阶 → 平台石前落脚面',[[-12.8,.04,-9.5],...Array.from({length:4},(_,i)=>[-12.8,.04+(deck-.04)*(i+1)/4,-9+(i+.5)*.45]),[-12.8,deck,-6.4],[-10.9,deck,-6.4]]);
  model.invariants.stoneAnchorBefore=[...model.invariants.stoneAnchor];
  model.invariants.stoneAnchor=[...stone];
  model.spatialCorrections={stone:{anchor:stone,platformTop:deck,frontOf:'01 observer-right tower at x=-13…-8.8, z=-2…2',basis},lane:{}};

  // Follow the inherited side-road nodes, and terminate at a genuine open fork
  // joining the already modelled residential spur. No new main-road shortcut.
  const n=layout.navigation.nodes;
  const path=['side-gate','side-entry','side-branch','side-front-turn'].map(k=>[n[k][0],n[k][2]]);
  path[0]=[path[0][0],path[0][1]+.48];
  const half=1.60,thickness=.24;
  const normals=path.slice(1).map((b,i)=>{const a=path[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return [dz/l,-dx/l];});
  const offset=(i,d)=>{
    const a=normals[Math.max(0,i-1)],b=normals[Math.min(normals.length-1,i)];
    const q=[a[0]+b[0],a[1]+b[1]],l=Math.hypot(...q),u=[q[0]/l,q[1]/l],s=d/(u[0]*b[0]+u[1]*b[1]);
    return [path[i][0]+u[0]*s,path[i][1]+u[1]*s];
  };
  const sides=[];
  for(const sign of[-1,1]){
    const inner=path.map((_,i)=>offset(i,sign*half)),outer=path.map((_,i)=>offset(i,sign*(half+thickness)));
    const h=sign<0?3.15:2.82,row=sign<0?6:14;
    sides.push({side:sign,inner,outer,height:h});
    for(let k=1;k<path.length;k++){
      const a=inner[k-1],b=inner[k],c=outer[k-1],d=outer[k],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);
      const at=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
      for(let j=0;j<steps;j++){
        const outline=[at(a,b,j/steps),at(a,b,(j+1)/steps),at(c,d,(j+1)/steps),at(c,d,j/steps)];
        const lower=outline.map(([x,z])=>[x,ground(x,z)-.20,z]);
        prism('02',`lane-${sign}-${k}-${j}`,'wall',lower,[0,h+.2,0],row);
        prism('02',`coping-${sign}-${k}-${j}`,'stone-plaque',lower.map(([x,y,z])=>[x,y+h+.2,z]),[0,.10,0],8);
        prism('02',`plinth-${sign}-${k}-${j}`,'wall',lower,[0,.46,0],6);
      }
    }
  }
  const rampPath=points=>{const out=[];for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.4);for(let j=k===1?0:1;j<=steps;j++){const t=j/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;out.push([x,ground(x,z),z]);}}return out;};
  const side=model.routes.find(r=>r.id==='side-gate');
  side.points=rampPath([[17,-4],...path]);side.label='独立侧门 → 连续双侧围墙 → 家属区三叉路';
  const fork=[path.at(-1),[129,32]];
  // Close the small H gap between the inherited side lane and B05 residential spur.
  prism('02','fork-landing','floor',[[123.4,ground(123.4,30.4),30.4],[130.2,ground(130.2,30.4),30.4],[130.2,ground(130.2,33.6),33.6],[123.4,ground(123.4,33.6),33.6]],[0,-.12,0],2);
  model.routes.push({id:'side-residential-fork',label:'围墙尽端三叉路 → 既有家属区公共支路',facility:'02',points:rampPath(fork)});
  model.spatialCorrections.lane={centerline:path,sides,fork:fork[0],residentialConnection:fork[1],basis:'A continuous enclosure to fork; H exact walls/branch coordinates follow existing roadwork'};

  // Increase silhouette and branching detail; never lower shared detail=4.
  // Only B05 crowns opt in. B01–B04 vegetation and the shared default stay identical.
  const crowns=model.parts.filter(p=>p.owner==='09'&&p.role==='crown');
  for(const p of crowns){
    p.crownProfile='lobed';p.seed=[...p.id].reduce((n,c)=>n+c.charCodeAt(0),0);
    if(p.id.includes('drooping'))continue;
    for(let k=0;k<3;k++){
      const a=k*Math.PI*2/3+(p.seed%23)*.19;
      add('09',p.id+'-leaf-tip'+k,'crown','leaf',{
        center:[p.center[0]+Math.cos(a)*p.size[0]*.54,p.center[1]+Math.sin(a*2)*p.size[1]*.40,p.center[2]+Math.sin(a)*p.size[2]*.54],
        size:p.size.map(v=>v*.30),crownProfile:'lobed',seed:p.seed+k
      },k%2?1:13,'H deterministic foliage tuft within the previous crown envelope');
    }
  }
  for(const p of model.parts.filter(p=>p.owner==='09'&&p.role==='tree-trunk'))p.radiusTop=p.id.includes('-trunk')?p.radius*.67:p.radius*.50;
  model.version='M1.1-B.B05.R1.2';
  return model;
}
