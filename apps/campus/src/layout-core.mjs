/** Render-independent geometry helpers. Coordinates are design hypotheses, never site measurements. */
export const EPSILON = 1e-6;
export function footprint(f) {
  if (!f.position || !f.size) return null;
  const [x, , z] = f.position, [w, , d] = f.size;
  const a = f.yaw || 0, c = Math.cos(a), s = Math.sin(a);
  return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v]) => [x+u*c+v*s,z-u*s+v*c]);
}
export function bounds(f) {
  const p = footprint(f);
  if (!p) return null;
  return { minX: Math.min(...p.map(v=>v[0])), maxX: Math.max(...p.map(v=>v[0])), minZ: Math.min(...p.map(v=>v[1])), maxZ: Math.max(...p.map(v=>v[1])) };
}
export function courtRects(layout) {
  const f=layout.facilities.find(v=>v.id===layout.sports.courtsId), b=bounds(f), q=layout.sports;
  if (!b) throw new Error('Courts are not positioned');
  return Array.from({length:q.rows*q.columns},(_,i)=>{
    const row=Math.floor(i/q.columns), col=i%q.columns;
    const x=b.minX+q.margin+col*(q.courtWidth+q.gap), z=b.minZ+q.margin+row*(q.courtLength+q.gap);
    return { id:`06-C${row+1}${col+1}`, row, col, minX:x, minZ:z, maxX:x+q.courtWidth, maxZ:z+q.courtLength };
  });
}
export function overlap(a,b,tolerance=EPSILON) {
  return Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX)>tolerance && Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ)>tolerance;
}
/** Right-handed transform: Three (X right,Y up,Z inward) -> Blender (X right,Y outward,Z up). */
export const toBlender = ([x,y,z]) => [x,-z,y];
export const fromBlender = ([x,y,z]) => [x,z,-y];
export function checkLayout(layout) {
  const results=[];
  const check=(id,passed,detail)=>results.push({id,passed:Boolean(passed),detail});
  const get=id=>layout.facilities.find(f=>f.id===id);
  const b=id=>bounds(get(id));
  check('IDs',new Set(layout.facilities.map(f=>f.id)).size===28&&layout.facilities.length===28,'28 stable semantic facility IDs, not 28 separate buildings');
  check('NOT_SURVEYED',layout.metricPolicy.surveyVerified===false&&!layout.metricPolicy.globalPixelScaleUsed,'Working metre coordinates; no whole-campus glyph rescaling');
  check('UNLOCATED',get('22').position===null&&get('22').size===null,'22 stays unlocated, not placed at origin or guessed silently');
  const t=b('05'), c=b('06'), a=b('28'), m=b('24'), p=b('04'), wc=b('26'), gym=b('03'), main=b('15'), twc=b('25');
  check('SIX_COURTS',layout.sports.rows===2&&layout.sports.columns===3&&courtRects(layout).length===6,'3 columns x 2 rows');
  check('DIRECT_EDGE',Math.abs(t.maxX-c.minX)<EPSILON&&Math.abs(t.minZ-c.minZ)<EPSILON&&Math.abs(t.maxZ-c.maxZ)<EPSILON,'05 east boundary = 06 west boundary; shared full working extent');
  check('PARALLEL',get('05').yaw===get('06').yaw,'05 and 06 use identical orientation');
  check('TRACK_BETWEEN',a.maxX<t.minX&&t.maxX<=c.minX+EPSILON,'28 | 05 | 06 image-left to image-right');
  check('AUX_1F',get('28').floors===1&&get('28').evidence.floorCount==='A','Alumnus: low single-storey auxiliary group');
  check('MUSIC_4F',get('24').floors===4&&get('24').evidence.floorCount==='A'&&!overlap(m,a),'Alumnus: detached four-storey music building');
  check('MUSIC_BEHIND',m.minZ>gym.maxZ,'Behind +Z under explicitly H gym orientation');
  check('END_ROW',get('24').position[2]===get('04').position[2]&&get('26').position[2]===get('04').position[2]&&m.maxZ<t.minZ,'24,26,04 at same end of 28/05/06 bands');
  check('POOL_TOILET_LEFT',wc.maxX<p.minX,'26 image-left of pool04; no copied25 internal plan');
  check('MAIN_TOILET_LEFT',twc.maxX<main.minX,'25 image-left of15');
  check('EACH_LEVEL',layout.connections.length===get('15').floors&&layout.connections.every((v,i)=>v.level===i+1&&Math.abs(v.y-i*3.8)<EPSILON&&v.from==='15'&&v.to==='25'),'One bridge for each working15 level');
  check('BRIDGE_ENDPOINTS',layout.connections.every(v=>Math.abs(v.xStart-twc.maxX)<EPSILON&&Math.abs(v.xEnd-main.minX)<EPSILON),'Bridge endpoints meet both footprints');
  check('DOOR_FACES_MAIN',layout.entrances.find(v=>v.facilityId==='25').facing[0]===1,'25 entrance faces +X toward15');
  check('ROSTRUM_LEFT',b('10').maxX<b('08').minX,'10 image-left of08');
  check('SANDPIT_NEAR_FLAG',Math.hypot(get('23').position[0]-b('14').maxX,get('23').position[2]-get('14').position[2])<15,'H proximity check only, not measured sandpit coordinates');
  const solids=layout.facilities.filter(f=>f.position&&f.size[1]>1&&!f.parent&&f.kind!=='stone');
  const collisions=[];
  for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++)if(overlap(bounds(solids[i]),bounds(solids[j])))collisions.push(`${solids[i].id}/${solids[j].id}`);
  check('NO_MAIN_VOLUME_OVERLAPS',collisions.length===0,collisions.join(',')||'Independent building proxies do not overlap; subspace12 is intentionally contained');
  check('CANTEEN_SUBSPACE',get('12').parent==='11'&&['minX','minZ'].every(k=>b('12')[k]>=b('11')[k])&&['maxX','maxZ'].every(k=>b('12')[k]<=b('11')[k]),'12 is inside lower part of11, not another freestanding building');
  const routeHits=[];
  for(const [s,e] of layout.navigation.edges){
    const A=layout.navigation.nodes[s],B=layout.navigation.nodes[e];
    for(let i=0;i<=100;i++){
      const x=A[0]+(B[0]-A[0])*i/100,z=A[2]+(B[2]-A[2])*i/100,r=layout.navigation.clearance;
      for(const f of solids.filter(v=>v.kind!=='gate'))if(overlap({minX:x-r,maxX:x+r,minZ:z-r,maxZ:z+r},bounds(f))){routeHits.push(`${s}->${e}:${f.id}`); break;}
    }
  }
  check('EXTERIOR_ROUTES_CLEAR',routeHits.length===0,[...new Set(routeHits)].join(',')||'Centreline sampled at 101 positions/edge with 0.6m clearance against current proxies; not physics validation');
  const seen=new Set(['gate']);let changed=true;
  while(changed){changed=false;for(const [s,e] of layout.navigation.edges)if(seen.has(s)!==seen.has(e)){seen.add(s);seen.add(e);changed=true;}}
  check('ROUTE_GRAPH_CONNECTED',seen.size===Object.keys(layout.navigation.nodes).length,'All review route nodes reachable from gate');
  return {passed:results.every(r=>r.passed),results,counts:{registered:layout.facilities.length,located:layout.facilities.filter(v=>v.position).length,courts:6,bridges:layout.connections.length},limits:['These tests check internal consistency, not historic or measured accuracy.']};
}
