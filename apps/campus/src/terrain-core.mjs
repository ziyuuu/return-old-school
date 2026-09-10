/** M1.1-A reversible relative ground model. All elevations are H hypotheses, not survey data. */
import { edgeWidth } from './revision-core.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function horizontalSnapshot(l){
 return {groundBounds:l.ground.bounds,facilities:l.facilities.map(f=>({id:f.id,kind:f.kind,position:f.position?[f.position[0],f.position[2]]:null,size:f.size?[f.size[0],f.size[2]]:null,rotation:f.rotation??null,floors:f.floors??null})),navigation:{nodes:Object.fromEntries(Object.entries(l.navigation.nodes).map(([id,p])=>[id,[p[0],p[2]]])),edges:l.navigation.edges,edgeWidths:l.navigation.edges.map(([a,b])=>[a,b,edgeWidth(l,a,b)]),forbidden:l.navigation.forbiddenEdges,required:l.navigation.requiredChains},bridges:l.connections.map(c=>({id:c.id,level:c.level,xStart:c.xStart,xEnd:c.xEnd,z:c.z,width:c.width})),contact:l.buildingContacts};
}
export function rectOf(f,margin=0){const [x,,z]=f.position,[w,,d]=f.size;return [x-w/2-margin,z-d/2-margin,x+w/2+margin,z+d/2+margin];}
export function distanceToRect(x,z,b){return Math.hypot(Math.max(b[0]-x,0,x-b[2]),Math.max(b[1]-z,0,z-b[3]));}
export function inside(x,z,b){return x>=b[0]-1e-8&&x<=b[2]+1e-8&&z>=b[1]-1e-8&&z<=b[3]+1e-8;}
export function linearKnots(knots,z){if(z<=knots[0][0])return knots[0][1];for(let i=1;i<knots.length;i++){const[a,ha]=knots[i-1],[b,hb]=knots[i];if(z<=b)return ha+(hb-ha)*(z-a)/(b-a);}return knots.at(-1)[1];}
export function buildTerrainModel(l,spec){
 if(spec.surveyVerified!==false)throw new Error('M1.1-A must not relabel H elevations as surveyed');
 const initial=(x,z)=>{let y=linearKnots(spec.gradeKnots,z);for(const v of spec.zones){const dist=distanceToRect(x,z,v.bounds);const weight=1-smooth(dist/v.blend);y+=(v.height-y)*weight;}return y;};
 const noPad=new Set(['route','subspace','unlocated','garden']);
 const pads=l.facilities.filter(f=>f.position&&f.size&&!noPad.has(f.kind)).map(f=>({id:f.id,bounds:rectOf(f),height:Math.round(initial(f.position[0],f.position[2])*1000)/1000,blend:3}));
 const groundHeight=(x,z)=>{let y=initial(x,z);for(const p of pads){const d=distanceToRect(x,z,p.bounds);y+=(p.height-y)*(1-smooth(d/p.blend));}return y;};
 const anchors=Object.fromEntries(l.facilities.map(f=>[f.id,f.position?{site:initial(f.position[0],f.position[2]),floor:(pads.find(p=>p.id===f.id)?.height??initial(f.position[0],f.position[2]))+(spec.entryRises[f.id]??0),rise:spec.entryRises[f.id]??0,measured:null,evidence:spec.entryRiseBasis[f.id]??['H中性场地基准']}:null]));
 anchors['24'].site=anchors['03'].site;anchors['24'].floor=anchors['03'].floor;
 anchors['25'].site=anchors['15'].site;anchors['25'].floor=anchors['15'].floor;
 anchors['12']={...anchors['11'],evidence:['R4食堂下层子空间随11整体垂直适配']};
 const stairs=spec.stairs.map(s=>({...s,base:anchors[s.facilityId].floor-s.rise,top:anchors[s.facilityId].floor,length:Math.hypot(s.end[0]-s.start[0],s.end[1]-s.start[1]),measured:null}));
 function stairCoordinate(s,x,z){const dx=s.end[0]-s.start[0],dz=s.end[1]-s.start[1],dxp=x-s.start[0],dzp=z-s.start[1];return {t:(dxp*dx+dzp*dz)/(s.length*s.length),side:(dxp*dz-dzp*dx)/s.length};}
 function walkHeight(x,z){for(const s of stairs){const {t,side}=stairCoordinate(s,x,z);if(t>=-1e-8&&t<=1+1e-8&&Math.abs(side)<=s.width/2+1e-8)return s.base+spec.roadSurfaceOffset+(t<=1e-8?0:Math.ceil(clamp(t)*s.steps-1e-8))*s.rise/s.steps;}return groundHeight(x,z)+spec.roadSurfaceOffset;}
 function stairParts(s){const n=s.steps;return Array.from({length:n},(_,i)=>{const t0=i/n,t1=(i+1)/n,dx=s.end[0]-s.start[0],dz=s.end[1]-s.start[1],height=(i+1)*s.rise/n;return {id:s.id+'-step-'+(i+1),center:[s.start[0]+dx*(t0+t1)/2,s.base+spec.roadSurfaceOffset+height/2,s.start[1]+dz*(t0+t1)/2],size:[s.width,height,s.length/n],yaw:Math.atan2(dx,dz),top:s.base+spec.roadSurfaceOffset+height};});}
 function profile(a,b,spacing=spec.sampleSpacing){const p=l.navigation.nodes[a],q=l.navigation.nodes[b],length=Math.hypot(q[0]-p[0],q[2]-p[2]),count=Math.max(1,Math.ceil(length/spacing));return Array.from({length:count+1},(_,i)=>{const t=i/count,x=p[0]+(q[0]-p[0])*t,z=p[2]+(q[2]-p[2])*t;return {distance:length*t,x,z,y:groundHeight(x,z)+spec.roadSurfaceOffset};});}
 const profiles=l.navigation.edges.map(([a,b])=>{const samples=profile(a,b);let maxSlope=0;for(let i=1;i<samples.length;i++)maxSlope=Math.max(maxSlope,Math.abs((samples[i].y-samples[i-1].y)/(samples[i].distance-samples[i-1].distance)));return {from:a,to:b,width:edgeWidth(l,a,b),samples,maxSlope};});
 const exportData=()=>({version:spec.version,baseline:l.version,datum:spec.datum,surveyVerified:false,anchors,pads,stairs,profiles,unlocated:l.facilities.filter(f=>!f.position).map(f=>f.id),horizontal:horizontalSnapshot(l),note:'R4 horizontal coordinates/topology retained; vertical H overlay only. No survey or physical-character certification.'});
 return {spec,anchors,pads,stairs,groundHeight,walkHeight,stairParts,stairCoordinate,profile,profiles,exportData};
}
export function terrainChecks(l,spec,reference=l){
 const t=buildTerrainModel(l,spec),r=[],put=(id,ok,detail)=>r.push({id,passed:!!ok,detail});
 put('BASELINE_XZ_TOPOLOGY',JSON.stringify(horizontalSnapshot(l))===JSON.stringify(horizontalSnapshot(reference)),'All28 IDs,27 XZ locations, footprints, widths and edges unchanged');
 put('RELATIVE_NOT_SURVEYED',spec.datum.absoluteElevation===null&&spec.surveyVerified===false,'No altitude/control net claim');
 put('GATE_DATUM',Math.abs(t.groundHeight(0,0))<1e-8,'Relative0m at main gate');
 put('ENTRY_ASCENDS',t.groundHeight(0,24)>t.groundHeight(0,4)+.1,'R source text confirms uphill; H rise and length');
 put('MUSIC_GYM_LEVEL',t.anchors['03'].floor===t.anchors['24'].floor,'Direct contact without vertical disconnection');
 put('MAIN_TOILET_LEVEL',t.anchors['15'].floor===t.anchors['25'].floor,'Every bridge and floor translated by the same offset');
 put('SUBSPACE_LEVEL',t.anchors['12'].floor===t.anchors['11'].floor,'Canteen subspace follows its owner');
 for(const id of ['04','05','06','08','23','28'])put('SPORT_FLAT_'+id,t.anchors[id].floor===0,'Flat sports pads, not rolling terrain');
 for(const p of t.profiles)put('ROAD_GRADE_'+p.from+'_'+p.to,p.maxSlope<=spec.maxRoadGrade,p.maxSlope);
 for(const s of t.stairs){put('STEP_START_'+s.id,Math.abs(s.base-t.groundHeight(s.start[0],s.start[1]))<.005,'Bottom matches existing approach grade');put('STEP_RISE_'+s.id,s.rise===t.anchors[s.facilityId].rise,'Rise matches independent building entry parameter');put('STEP_MATCH_'+s.id,Math.abs(s.base+s.rise-t.anchors[s.facilityId].floor)<1e-8,'Top matches building floor');put('STEP_GEOMETRY_'+s.id,Number.isInteger(s.steps)&&s.steps>0&&s.rise/s.steps<=.18&&s.length/s.steps>=.27,'Working step geometry, not statutory compliance');}
 put('NO_NEW_ROUTE_TO_GARDEN',!l.navigation.nodes['garden-entry'],'Unknown access stays unresolved, not fabricated');
 put('NO_MISSING_FACILITY_FILL',t.anchors['22']===null,'Unlocated22 retained');
 put('EXAGGERATION_1',spec.display.exaggeration===1,'No hidden vertical exaggeration');
 return {passed:r.every(v=>v.passed),results:r};
}
