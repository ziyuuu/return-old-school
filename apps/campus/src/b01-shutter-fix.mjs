import {
  applyB01R3Layout as baseLayout,
  adaptB01R3Terrain,
  buildB01R3Model as baseModel,
  hitPart, hasR3Floor,
} from './b01-r3-core.mjs';
export {adaptB01R3Terrain};

/** The porch still faces the forecourt. Only its inner side-wall opening turns inward. */
export function applyB01R3Layout(base, p) {
  const layout = baseLayout(base, p);
  const f = layout.facilities.find(v => v.id === '15');
  for (const [i, side] of ['west', 'east'].entries()) {
    const sign = i ? 1 : -1;
    const door = layout.entrances.find(v => v.id === '15-front-' + side);
    Object.assign(door, {
      position: [f.position[0] + sign * p.entrances.returnX, 0, f.position[2] + p.entrances.sideShutter.centerZ],
      facing: [sign, 0, 0], // Outward normal; movement INTO the building has the opposite sign.
      entryDirection: [-sign, 0, 0], kind: 'roll-up-shutter', defaultState: 'open',
      status: 'A side-wall open shutter / H opening and canopy dimensions',
    });
  }
  layout.b01r3.newDoors = layout.entrances.filter(v => v.id.startsWith('15-front-'));
  return layout;
}

/** Small local replacement over the published R3 model. Upper floors, arc and bridges are untouched. */
export function buildB01R3Model(layout, terrain, r2, p) {
  const model = baseModel(layout, terrain, r2, p), e = p.entrances, s = e.sideShutter;
  const f = layout.facilities.find(v => v.id === '15');
  const fy = 0.04, th = r2.main.wallThickness, ceil = r2.main.storyHeight - 0.14;
  const z0 = s.centerZ - e.doorWidth / 2, z1 = s.centerZ + e.doorWidth / 2;
  let parts = model.parts.filter(q => {
    if (q.owner !== '15' || q.level !== 1) return true;
    if (q.role === 'recess-front' || /^R3-(west|east)-forward-wall-L1$/.test(q.id)) return false;
    // Retire the old back-wall door jambs, but keep its adjacent barred window.
    if (q.role === 'frame' && Math.abs(q.center[2] - e.doorWallZ) < 0.3 && Math.abs(q.center[0]) > 44.5) return false;
    return true;
  });
  const box = (id, role, x0, x1, a, b, y0, y1, component) => {
    if (!(x1 > x0 && b > a && y1 > y0)) throw new Error('Invalid entrance part: ' + id);
    parts.push({id, role, owner: '15', level: 1, shape: 'box',
      size: [x1-x0, y1-y0, b-a], center: [(x0+x1)/2, (y0+y1)/2, (a+b)/2],
      ...(component ? {component} : {})});
  };
  for (const [i, side] of ['west', 'east'].entries()) {
    const sign = i ? 1 : -1, wx = sign * e.returnX;
    const a = sign < 0 ? -49 : e.returnX, b = sign < 0 ? -e.returnX : 49;
    const windowX = sign*48.4, w0 = windowX - e.barredWindowWidth/2, w1 = windowX + e.barredWindowWidth/2;
    // The recess BACK is solid; the only retained hole there is the historical barred window.
    const xs = [a, w0, w1, b], ys = [fy, fy+.8, fy+.8+e.barredWindowHeight, ceil];
    for(let u=1;u<xs.length;u++) for(let v=1;v<ys.length;v++) {
      if(u===2 && v===2) continue;
      box(`R31-${side}-back-${u}-${v}`, 'recess-front', xs[u-1],xs[u],e.doorWallZ,e.doorWallZ+th,ys[v-1],ys[v]);
    }
    // Full-height side wall cut into two piers and a lintel, leaving a real open portal.
    box(`R31-${side}-front-pier`, 'continuing-body-wall',wx-th/2,wx+th/2,e.forwardWallZ,z0,fy,ceil);
    box(`R31-${side}-rear-pier`, 'continuing-body-wall',wx-th/2,wx+th/2,z1,e.doorWallZ+th,fy,ceil);
    box(`R31-${side}-lintel`, 'continuing-body-wall',wx-th/2,wx+th/2,z0,z1,fy+e.doorHeight,ceil);
    // Landing overlaps the wall cut; no raised sill or floor gap under the roller guides.
    box(`R31-${side}-threshold`, 'porch-landing',wx-.20,wx+.20,z0,z1,-.60,fy);
    const outer = wx + sign*th/2, xa = Math.min(outer,outer+sign*s.boxDepth), xb=Math.max(outer,outer+sign*s.boxDepth);
    box(`R31-${side}-roller-hood`, 'frame',xa,xb,z0-.045,z1+.045,fy+e.doorHeight+.015,fy+e.doorHeight+s.boxHeight,'shutter-hood');
    for(const [j,z] of [z0,z1].entries()) {
      box(`R31-${side}-guide-${j}`, 'frame',wx-th/2-.02,wx+th/2+.02,z-s.guideWidth/2,z+s.guideWidth/2,fy,fy+e.doorHeight,'shutter-guide');
    }
    // Three narrow folded slat edges above the clear height distinguish a raised roller, not swing doors.
    for(let k=0;k<3;k++) {
      const x=outer+sign*(s.boxDepth+.005), y=fy+e.doorHeight+.035+k*.052;
      box(`R31-${side}-rolled-slat-${k}`, 'frame',x-.012,x+.012,z0+.025,z1-.025,y,y+.024,'raised-shutter-slat');
    }
  }
  const origin = owner => owner==='15' ? [f.position[0],model.mainFloor,f.position[2]] : owner==='bridge' ? [0,model.toiletFloor,0] : [layout.facilities.find(v=>v.id===owner).position[0],model.toiletFloor,layout.facilities.find(v=>v.id===owner).position[2]];
  model.parts = parts;
  model.worldParts = parts.map(q=>({...q,center:q.center.map((v,i)=>v+origin(q.owner)[i])}));
  model.access = model.access.map((old,i)=>{
    const sign=i?1:-1, cx=e.doorCentersX[i], X=f.position[0], Z=f.position[2], Y=model.mainFloor+fy;
    const W=(x,z)=>[X+sign*x,Y,Z+z];
    return {...old,normal:[sign,0,0],entryDirection:[-sign,0,0],door:W(e.returnX,s.centerZ),width:e.doorWidth,height:e.doorHeight,shutter:'open',
      // Continue all the way to the middle corridor, not merely 0.5m behind the opening.
      clearRoute:[W(Math.abs(cx),e.landingFrontZ+.55),W(Math.abs(cx),s.centerZ),W(e.returnX-.75,s.centerZ),W(e.returnX-.75,-2.4),W(46,-2.4),W(46,0)],
    };
  });
  model.version=p.version;model.shutterFix=true;
  model.exportData=()=>({version:p.version,input:p,mainFloor:model.mainFloor,toiletFloor:model.toiletFloor,parts:model.parts,worldParts:model.worldParts,routes:model.routes,spaces:model.spaces,axis:model.axis,access:model.access,status:p.status});
  return model;
}

function routeClear(model, route) {
  for(let i=1;i<route.length;i++) {
    const a=route[i-1], b=route[i], dx=b[0]-a[0], dz=b[2]-a[2], len=Math.hypot(dx,dz);
    const nx=-dz/len, nz=dx/len, steps=Math.ceil(len/.35);
    for(const d of [-.4,0,.4]) {
      for(let j=0;j<=steps;j++) if(!hasR3Floor(model,a[0]+dx*j/steps+nx*d,a[1],a[2]+dz*j/steps+nz*d))return false;
      for(const h of [.35,1.1,1.85]) if(model.worldParts.some(q=>hitPart([a[0]+nx*d,a[1]+h,a[2]+nz*d],[b[0]+nx*d,b[1]+h,b[2]+nz*d],q)))return false;
    }
  }
  return true;
}

/** Focused checks only; the archived full suites remain available separately. */
export function b01R3Checks(before,layout,m,p) {
  const results=[],put=(id,ok)=>results.push({id,passed:!!ok}),e=p.entrances,s=e.sideShutter;
  put('ENTRANCE_LAYOUT_AND_MAIN_AXIS',JSON.stringify(before.facilities)===JSON.stringify(layout.facilities)&&JSON.stringify(before.navigation)===JSON.stringify(layout.navigation)&&m.axis.every(v=>v.x===73));
  for(const [i,A] of m.access.entries()) {
    const sign=i?1:-1, x=73+sign*e.returnX, y=m.mainFloor+1.4, z=224+s.centerZ;
    put(A.id+'_SIDE_OPEN_ROLLER', A.width>1.85&&A.height>2.7&&A.normal[0]===sign&&A.shutter==='open'&&!m.worldParts.some(q=>hitPart([x+sign*.4,y,z],[x-sign*.4,y,z],q))&&m.parts.filter(q=>q.component==='shutter-hood'&&Math.sign(q.center[0])===sign).length===1);
    put(A.id+'_CANOPY_POSTS_AND_SOLID_BACK',e.canopyWidth>3.8&&e.canopyFrontZ< -7.3&&m.parts.filter(q=>q.role==='porch-post'&&Math.sign(q.center[0])===sign&&q.center[2]<-7.03).length===2&&m.worldParts.some(q=>hitPart([73+e.doorCentersX[i],y,218.7],[73+e.doorCentersX[i],y,219.5],q)));
    put(A.id+'_STEPS_TO_INDOOR_CORRIDOR',routeClear(m,A.clearRoute)&&A.stepProbes.every(q=>[-1.6,0,1.6].every(d=>hasR3Floor(m,q[0]+d,q[1],q[2]))));
  }
  put('FIVE_FLOORS_BRIDGES_AND_OPEN_TERRACE',m.routes.length===10&&m.routes.every(r=>routeClear(m,r.points))&&m.parts.filter(q=>q.owner==='25'&&q.role==='slab').length===5&&!m.worldParts.some(q=>hitPart([91,m.mainFloor+12,228],[91,m.mainFloor+30,228],q)));
  return {passed:results.every(v=>v.passed),results};
}
