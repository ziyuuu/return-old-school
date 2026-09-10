/** R2 architectural parts and checks. Units are authored metres, NOT surveyed dimensions.
 * The renderer and tests consume the same boxes; user relations and H dimensions stay separate.
 */
export function edgeWidth(layout,a,b){
 const widths=layout.navigation.edgeWidths||{};
 if(widths[`${a}|${b}`]||widths[`${b}|${a}`])return widths[`${a}|${b}`]||widths[`${b}|${a}`];
 return a==='gate'||a.startsWith('junction')&&b.startsWith('junction')?7:layout.navigation.defaultWidth||3;
}
export function structureParts(layout){
 const parts=[];
 const add=(id,owner,role,center,size)=>parts.push({id,owner,role,center,size});
 const t=layout.facilities.find(f=>f.id==='05'), c=layout.sports.canopy;
 if(c?.enabled){
  const [x,,z]=t.position,[w,,d]=t.size;
  add('05-roof','05','roof',[x,c.clearHeight+c.roofThickness/2,z],[w,c.roofThickness,d]);
  const bays=Math.ceil(d/c.bayLength);
  for(let i=0;i<=bays;i++){
   const zz=z-d/2+c.postWidth/2+(d-c.postWidth)*i/bays;
   for(const sign of [-1,1])add(`05-post-${i}-${sign}`,'05','column',[x+sign*(w/2-c.postWidth/2),c.clearHeight/2,zz],[c.postWidth,c.clearHeight,c.postWidth]);
   add(`05-beam-${i}`,'05','beam',[x,c.clearHeight-.10,zz],[w,.2,.14]);
  }
 }
 for(const bridge of layout.connections){
  const bottom=bridge.level===1?-.14:bridge.y-.14;
  add(bridge.id,'25','floor',[(bridge.xStart+bridge.xEnd)/2,bottom+.09,bridge.z],[bridge.xEnd-bridge.xStart,.18,bridge.width]);
 }
 const highest=layout.connections.at(-1);
 if(highest)for(const x of [highest.xStart+.38,highest.xEnd-.38])for(const sign of [-1,1])
  add(`25-column-${x}-${sign}`,'25','column',[x,(highest.y+.04)/2,highest.z+sign*(highest.width/2-.15)],[.24,highest.y+.04,.24]);
 for(const link of layout.buildingLinks||[]){
  for(let i=0;i<link.path.length-1;i++){
   const a=link.path[i],b=link.path[i+1],dx=b[0]-a[0],dz=b[2]-a[2];
   if(dx&&dz)throw new Error('R2 portico parts must be orthogonal: '+link.id);
   const size=dx?[Math.abs(dx),link.roofThickness,link.width]:[link.width,link.roofThickness,Math.abs(dz)];
   add(`${link.id}-roof-${i}`,'24','roof',[(a[0]+b[0])/2,link.clearHeight+link.roofThickness/2,(a[2]+b[2])/2],size);
   add(`${link.id}-floor-${i}`,'24','floor',[(a[0]+b[0])/2,-.05,(a[2]+b[2])/2],[size[0],.18,size[2]]);
  }
  // Only the two free bends need freestanding posts; attachment faces remain open.
  for(let i=1;i<link.path.length-1;i++){
   const p=link.path[i];
   add(`${link.id}-post-${i}`,'24','column',[p[0]-link.width/2+.12,link.clearHeight/2,p[2]],[.24,link.clearHeight,.24]);
  }
 }
 return parts;
}
/** Exact segment against an expanded rectangle (not 101-point sampling). */
export function segmentHitsRect(a,b,rect,r=0){
 if(!a||!b||!rect)return true;
 let t0=0,t1=1;
 for(const [axis,min,max] of [[0,rect.minX-r,rect.maxX+r],[2,rect.minZ-r,rect.maxZ+r]]){
  const start=a[axis],delta=b[axis]-start;
  if(Math.abs(delta)<1e-10){if(start<=min||start>=max)return false;continue;}
  let lo=(min-start)/delta,hi=(max-start)/delta;if(lo>hi)[lo,hi]=[hi,lo];
  t0=Math.max(t0,lo);t1=Math.min(t1,hi);if(t1<=t0)return false;
 }
 return t1>=0&&t0<=1;
}
export function revisionChecks(layout,{bounds,overlap}){
 const out=[];const put=(id,passed,detail)=>out.push({id,passed:Boolean(passed),detail});
 const get=id=>layout.facilities.find(f=>f.id===id),b=id=>bounds(get(id));
 const parts=structureParts(layout),n=layout.navigation;
 const t=b('05'),c=b('06'),main=get('15'),wc=get('25'),rear=layout.sports.rearTrack;
 const canopy=parts.find(p=>p.id==='05-roof');
 put('R2_CANOPY_FULL_LENGTH',canopy&&canopy.size[0]===get('05').size[0]&&canopy.size[2]===get('05').size[2]&&canopy.center[1]>n.headClearance,'05 has physical roof and columns, not a label');
 put('R2_POSTS_OUTSIDE_COURTS',parts.filter(p=>p.id.startsWith('05-post')).every(p=>p.center[0]+p.size[0]/2<=c.minX+1e-6),'All canopy posts remain inside05');
 put('R2_MIDPOINT_LINK',layout.connections.every(v=>Math.abs(v.z-main.position[2])<1e-6&&Math.abs(v.z-wc.position[2])<1e-6),'Both facing-wall midpoint z values match every link');
 put('R2_MIDPOINT_PORTALS',['15-link','25-link'].every(id=>Math.abs(layout.entrances.find(e=>e.id===id)?.position[2]-main.position[2])<1e-6),'Both corresponding openings at the bridge midpoint');
 put('R2_REAR_RUBBER_TRACK',rear?.kind==='rubber-straight'&&rear.position[2]>get('08').position[2]&&Math.abs(rear.position[2]-b('08').maxZ)<rear.size[2]/2,'08-REAR overlaps the field rear edge, before forecourt14');
 const rb=rear?bounds(rear):null,pit=b('23');
 put('R2_PIT_ON_REAR_RIGHT',rb&&pit.minX>=rb.minX&&pit.maxX<=rb.maxX&&pit.minZ>=rb.minZ&&pit.maxZ<=rb.maxZ&&get('23').position[0]>rear.position[0]+rear.size[0]*.25,'Unique23 in rightmost quarter of rear track, not old128/198');
 const knownEdges=new Set(n.edges.flatMap(([a,b])=>[`${a}|${b}`,`${b}|${a}`]));
 for(const [i,chain] of (n.requiredChains||[]).entries())put(`R2_REQUIRED_CHAIN_${i+1}`,chain.length>1&&chain.every((p,i)=>!i||knownEdges.has(`${chain[i-1]}|${p}`)),chain.join(' → '));
 put('R2_SIDE_GATE_BINDING',get('02').kind==='side-gate'&&get('02').position.every((v,i)=>v===n.nodes['side-gate'][i]),'02 moved from former unverified marker to the corrected route endpoint');
 put('R2_OLD_LIBRARY_DETOUR_REMOVED',!n.nodes['west-bottom']&&!n.nodes['west-main']&&!knownEdges.has('garden-entry|library-entry'),'Superseded western/southern detour removed, not drawn beneath new routes');
 put('R2_GAP_ROUTE_BETWEEN_BUILDINGS',n.nodes['gap-cross'][0]>b('25').maxX+n.clearance&&n.nodes['gap-cross'][0]<b('15').minX-n.clearance&&n.nodes['gap-cross'][2]===main.position[2],'Ground route passes between25 and15 at the bridge crossing');
 const blockers=parts.filter(p=>p.center[1]+p.size[1]/2>.2&&p.center[1]-p.size[1]/2<n.headClearance);
 const hits=[];
 for(const [a,b] of n.edges)for(const p of blockers){const r={minX:p.center[0]-p.size[0]/2,maxX:p.center[0]+p.size[0]/2,minZ:p.center[2]-p.size[2]/2,maxZ:p.center[2]+p.size[2]/2};if(segmentHitsRect(n.nodes[a],n.nodes[b],r,n.clearance))hits.push(`${a}/${b}:${p.id}`);}
 put('R2_ROUTES_CLEAR_STRUCTURES',!hits.length,hits.join(',')||'Roof / bridge underside / columns clear2.2m-high ground route envelopes');
 put('R2_GYM_ENLARGED',get('03').size[0]*get('03').size[2]>30*36,'42x42 working envelope; not a new measurement');
 // R3 replaces the R2 portico test with actual common-wall contact tests.
 put('R2_POOL_TOILET_SMALLER',get('26').size[0]*get('26').size[2]<6*4.5&&b('26').maxX<b('04').minX&&b('26').minZ>b('03').maxZ&&b('26').maxZ<t.minZ,'26 small historical working volume, left of pool and toward courts');
 put('R2_TOUR_USES_GRAPH',n.tourPath?.every((name,i)=>n.nodes[name]&&(!i||knownEdges.has(`${n.tourPath[i-1]}|${name}`))),'Tour traverses actual corrected edges rather than cutting between them');
 return out;
}
