/** Accepted M1.1-A local site overlay. The R4 facility and road records are read-only. */
const inside=(x,z,b)=>x>=b[0]-1e-8&&x<=b[2]+1e-8&&z>=b[1]-1e-8&&z<=b[3]+1e-8;
const clamp=n=>Math.max(0,Math.min(1,n));
export function buildPatch04Model(base,p){
 const c=p.courts,r=c.ramp,rb=[r.end[0],r.start[1]-r.width/2,r.start[0],r.start[1]+r.width/2];
 const anchors=structuredClone(base.anchors);anchors['06']={...anchors['06'],floor:c.top,site:c.top,rise:0};
 function rampHeight(x,z){const t=clamp((x-r.start[0])/(r.end[0]-r.start[0]));return base.groundHeight(r.start[0],z)*(1-t)+c.top*t;}
 function region(x,z){return inside(x,z,c.bounds)?'court':inside(x,z,rb)?'court-ramp':base.region(x,z);}
 function tileHeight(kind,x,z){return kind==='court'?c.top+c.tilt*(z-120):kind==='court-ramp'?rampHeight(x,z):base.tileHeight(kind,x,z);}
 function groundHeight(x,z){return tileHeight(region(x,z),x,z);}
 const stairs=[...base.stairs,{...c.stairs}],xs=[],zs=[];
 for(const t of [...base.tiles,{bounds:c.bounds},{bounds:rb}]){xs.push(t.bounds[0],t.bounds[2]);zs.push(t.bounds[1],t.bounds[3]);}
 const ux=[...new Set(xs)].sort((a,b)=>a-b),uz=[...new Set(zs)].sort((a,b)=>a-b),tiles=[];
 for(let i=1;i<ux.length;i++)for(let j=1;j<uz.length;j++){const b=[ux[i-1],uz[j-1],ux[i],uz[j]];tiles.push({bounds:b,kind:region((b[0]+b[2])/2,(b[1]+b[3])/2)});}
 function walkHeight(x,z){for(const s of stairs){const q=base.stairCoordinate(s,x,z);if(q.t>=0&&q.t<=1&&Math.abs(q.side)<=s.width/2)return s.base+.04+Math.ceil(q.t*s.steps-1e-8)*s.rise/s.steps;}return groundHeight(x,z)+.04;}
 const exportData=()=>({...base.exportData(),version:p.version,alumniReview:'APPROVED',patch04:p,anchors,stairs,tiles});
 return {...base,p04:p,anchors,stairs,tiles,region,tileHeight,groundHeight,walkHeight,courtRampHeight:rampHeight,exportData};
}
export function patch04Checks(layout,m,p){
 const r=[],put=(id,passed)=>r.push({id,passed:!!passed});
 put('P04-RAISED',p.courts.lift===.3&&m.anchors['06'].floor-m.anchors['05'].floor>.29);
 put('P04-PLANAR',p.courts.tilt===0&&[[ -64,90],[-12,150],[-40,120]].every(([x,z])=>Math.abs(m.groundHeight(x,z)-3.3)<1e-6));
 put('P04-05-28-UNCHANGED',m.anchors['05'].floor===3&&m.anchors['28'].floor===3);
 put('P04-TWO-ENTRIES',p.courts.openings.length===2&&p.courts.openings.every(o=>o.to-o.from>=3));
 put('P04-THREE-FLAGS',p.forecourt.flag.count===3&&p.forecourt.flag.poleHeights.length===3);
 put('P04-FLAGS-NEAR-FIELD',p.forecourt.flag.center[1]<p.forecourt.flag.oldCenter[1]);
 put('P04-WIDE-FORECOURT',p.forecourt.pavingBounds[3]===217&&p.forecourt.pavingBounds[3]-p.forecourt.pavingBounds[1]>=25);
 const f=layout.facilities.find(f=>f.id==='12');
 put('P04-SHOP-PARENT',f.parent==='11'&&p.shop.parent==='11'&&!p.shop.newDetachedBuilding);
 put('P04-SHOP-LEVEL',m.anchors['12'].floor===m.anchors['11'].floor);
 put('P04-SHOP-OPEN',!p.shop.closedDoor&&p.shop.doorWidth>=2&&p.shop.recessDepth>=2);
 return{passed:r.every(x=>x.passed),results:r};
}
