/** Patch03: independent vertical engineering model. Every dimension is H, never surveyed. */
import {buildTerrainModel, horizontalSnapshot, inside, linearKnots} from './terrain-core.mjs';
import {edgeWidth} from './revision-core.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
export function buildPatch03Model(layout,previousSpec,input){
 if(input.surveyVerified!==false)throw Error('Patch03 dimensions must remain H');
 const spec=structuredClone(previousSpec),p=input;
 spec.version=p.version;spec.datum=p.datum;spec.sportsDatum=3;spec.maxRoadGrade=p.maxRoadGrade;
 spec.gradeKnots=[...p.entrance.knots,[80,3],[160,3.1],[214,3.45],[291,3.45]];
 for(const z of spec.zones)z.height+=2.2;
 const fieldZone=spec.zones.find(z=>z.id==='FIELD');
 if(fieldZone){fieldZone.bounds=[12,40,123,190];fieldZone.height=p.field.upper;fieldZone.blend=5;}
 // Existing zone IDs can differ across baseline exports. This explicit zone is an overlay, not a layout edit.
 spec.zones.push({id:'P03-UPPER-FIELD-RIM',bounds:[12,40,123,190],height:p.field.upper,blend:5});
 const raw=buildTerrainModel(layout,spec),ramp=p.access.find(a=>a.kind==='ramp');
 function upperHeight(x,z){
  const center=linearKnots(spec.gradeKnots,z),rawY=raw.groundHeight(x,z);
  // Protect the frozen 7m main road across its entire width; blend outside its shoulders.
  const w=clamp((Math.abs(x)-5)/12);
  let y=center+(rawY-center)*w;
  if(x<=-4&&x>=-24&&z>=12&&z<=86){const blend=clamp((z-12)/6)*clamp((86-z)/6);const approach=center+(p.gym.forecourt-center)*clamp((-x-4)/16);y+=(approach-y)*blend;}
  return y;
 }
 function pitContains(x,z){return inside(x,z,p.field.bounds)||inside(x,z,p.field.rostrumBay);}
 function rampHeight(x,z){return ramp.top-ramp.rise*clamp((z-ramp.start[1])/ramp.run);}
 function lowerHeight(x,z){return p.field.lower+(p.field.playingSurfaceTilt??0)*(z-114);}
 function region(x,z){return inside(x,z,ramp.bounds)?'ramp':pitContains(x,z)?'pit':'upper';}
 function tileHeight(kind,x,z){return kind==='pit'?lowerHeight(x,z):kind==='ramp'?rampHeight(x,z):upperHeight(x,z);}
 function groundHeight(x,z){return tileHeight(region(x,z),x,z);}
 const anchors=structuredClone(raw.anchors);
 for(const id of ['08','23'])anchors[id]={site:p.field.lower,floor:p.field.lower,rise:0,measured:null,evidence:['A/P below perimeter; H exact elevation']};
 anchors['10']={site:p.field.rostrumBase,floor:p.field.rostrumBase,rise:0,measured:null,evidence:['P raised stage; H stage top and side bay']};
 // Testable overrides are deliberately public data; validation must reject mismatched contacts.
 if(p.gym.forecourt!==3){anchors['03'].floor=p.gym.forecourt+.6;anchors['03'].site=p.gym.forecourt;}
 anchors['03'].floor=p.gym.floor;anchors['24'].floor=p.gym.musicFloor??p.gym.floor;
 if(p.debugAnchorOverrides)for(const [id,floor]of Object.entries(p.debugAnchorOverrides))anchors[id].floor=floor;
 const stairs=raw.stairs.map(s=>({...s,base:anchors[s.facilityId].floor-s.rise,top:anchors[s.facilityId].floor}));
 for(const a of p.access.filter(a=>a.kind==='stairs'))stairs.push({...a,facilityId:'08',length:Math.hypot(a.end[0]-a.start[0],a.end[1]-a.start[1]),measured:null});
 const {stairCoordinate,stairParts}=raw;
 function walkHeight(x,z){for(const s of stairs){const {t,side}=stairCoordinate(s,x,z);if(t>=-1e-8&&t<=1+1e-8&&Math.abs(side)<=s.width/2+1e-8)return s.base+spec.roadSurfaceOffset+(t<=1e-8?0:Math.ceil(clamp(t)*s.steps-1e-8))*s.rise/s.steps;}
 return groundHeight(x,z)+spec.roadSurfaceOffset;}
 const profiles=layout.navigation.edges.map(([from,to])=>{const a=layout.navigation.nodes[from],b=layout.navigation.nodes[to],length=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.ceil(length/.5),samples=Array.from({length:n+1},(_,i)=>{const x=a[0]+(b[0]-a[0])*i/n,z=a[2]+(b[2]-a[2])*i/n;return{distance:length*i/n,x,z,y:groundHeight(x,z)+.04};});let maxSlope=0;for(let i=1;i<samples.length;i++)maxSlope=Math.max(maxSlope,Math.abs(samples[i].y-samples[i-1].y)/(length/n));return{from,to,width:edgeWidth(layout,from,to),samples,maxSlope};});
 const gb=layout.ground.bounds,cutx=[gb[0],gb[2]],cutz=[gb[1],gb[3]];
 for(const b of [p.field.bounds,p.field.rostrumBay,ramp.bounds]){cutx.push(b[0],b[2]);cutz.push(b[1],b[3]);}
 const xs=[...new Set(cutx)].sort((a,b)=>a-b),zs=[...new Set(cutz)].sort((a,b)=>a-b),tiles=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const b=[xs[i],zs[j],xs[i+1],zs[j+1]];tiles.push({bounds:b,kind:region((b[0]+b[2])/2,(b[1]+b[3])/2)});}
 function boundaryTop(x,z){if(Math.abs(x-p.field.bounds[2])<.01&&z>=ramp.bounds[1]&&z<=ramp.bounds[3])return rampHeight(x,z);return upperHeight(x,z);}
 function openingAt(x,z){return p.barrier.openings.some(o=>o.side==='rear'?Math.abs(z-o.axis)<.13&&x>=o.from&&x<=o.to:Math.abs(x-o.axis)<.13&&z>=o.from&&z<=o.to);}
 const [x0,z0,x1,z1]=p.field.bounds,[bx,bz,,bz1]=p.field.rostrumBay;
 const boundary=[[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0,bz1],[bx,bz1],[bx,bz],[x0,bz]];
 const exportData=()=>({version:p.version,status:'IMPLEMENTED / REVIEW_PENDING',surveyVerified:false,measured:null,datum:p.datum,input:p,anchors,stairs,profiles,tiles,boundary,horizontal:horizontalSnapshot(layout),elevations:[{id:'perimeter',y:3},{id:'gym-forecourt',y:p.gym.forecourt},{id:'gym-floor',y:anchors['03'].floor},{id:'track',y:p.field.lower},{id:'football',y:p.field.lower},{id:'rostrum-top',y:anchors['10'].floor+layout.facilities.find(f=>f.id==='10').size[1]},{id:'rear-track',y:anchors['08'].floor},{id:'sandpit',y:anchors['23'].floor}].map(v=>({...v,grade:'H',measured:null})),note:'Relative terrain datums; rendered road/playing-surface finish offset +0.04m. Every number remains H. Current X/Z including P02 exception retained.'});
 return{spec,p,anchors,stairs,stairCoordinate,stairParts,profiles,pads:raw.pads,groundHeight,upperHeight,lowerHeight,rampHeight,walkHeight,region,tileHeight,tiles,boundary,boundaryTop,openingAt,exportData};
}
export function patch03Checks(layout,previousSpec,p,reference=layout){
 const m=buildPatch03Model(layout,previousSpec,p),results=[],put=(id,v,detail)=>results.push({id,passed:!!v,detail});
 put('P03-H-NOT-SURVEYED',p.surveyVerified===false&&p.measured===null&&p.datum.absoluteElevation===null,'All numeric values H');
 put('P03-XZ-FROZEN',JSON.stringify(horizontalSnapshot(layout))===JSON.stringify(horizontalSnapshot(reference)),'No facility X/Z, road width/topology or bridge change');
 const k=p.entrance.knots,start=p.entrance.startZ,end=p.entrance.endZ,rise=m.groundHeight(0,end)-m.groundHeight(0,start);
 put('P03-LONGER',end-start>=36&&p.entrance.run===end-start,'At least36m; P02 only20m');
 put('P03-STEEPER',rise/(end-start)>=.065&&rise>=2.4,'Mean gradient exceeds old5% materially');
 put('P03-PROFILE-CONSISTENT',Math.abs(rise-p.entrance.rise)<1e-7&&Math.abs(rise/(end-start)-p.entrance.averageGrade)<1e-7&&k.every((v,i)=>!i||v[1]>=k[i-1][1]),'Derived from rendered height function');
 put('P03-GATE-ZERO',Math.abs(m.groundHeight(0,0))<1e-8,'Relative main gate zero');
 put('P03-FIELD-DEPRESSED',m.upperHeight(25,80)-m.groundHeight(73,114)>=.8&&Math.abs(p.field.upper-p.field.lower-p.field.depression)<1e-8,'Substantial lower sports plane');
 put('P03-GYM-APRON-HELD',p.gym.forecourt===p.field.upper&&Math.abs(m.groundHeight(-20.5,45)-p.gym.forecourt)<.005&&Math.abs(p.gym.floor-p.gym.forecourt-.6)<1e-8,'Forecourt3, floor3.6 independent of field');
 put('P03-GYM-MUSIC-LEVEL',m.anchors['03'].floor===m.anchors['24'].floor,'Shared wall not offset');
 put('P03-TOILET-LEVEL',m.anchors['15'].floor===m.anchors['25'].floor,'All original floor connections translate together');
 const samples=[[73,50],[73,175],[30,114],[116,114],[73,183.5],[108,183.5]];
 put('P03-SPORTS-PLANAR',samples.every(([x,z])=>Math.abs(m.groundHeight(x,z)-p.field.lower)<1e-6),'Track football rear track and sandpit same datum');
 put('P03-ROSTRUM-LEVEL',Math.abs(m.anchors['10'].floor+layout.facilities.find(f=>f.id==='10').size[1]-p.field.rostrumTop)<1e-8,'Independent stage body has upper circulation top');
 put('P03-OPENINGS',[[25,60],[82,188],[121,168],[14,110]].every(([x,z])=>m.openingAt(x,z)),'Four true barrier gaps, not arrows');
 for(const a of p.access.filter(a=>a.kind==='stairs')){const s=m.stairs.find(s=>s.id===a.id),parts=m.stairParts(s);put('P03-STEP-SUPPORT-'+a.id,Math.abs(a.base-p.field.lower)<1e-8&&Math.abs(a.top-p.field.upper)<1e-8&&Math.abs(parts.at(-1).top-(a.top+.04))<1e-8,'Stair solids from lower base to upper landing');put('P03-STEP-SIZE-'+a.id,a.steps>0&&a.rise/a.steps<=.18&&s.length/a.steps>=.27,'H riser/tread, not compliance certification');}
 const ramp=p.access.find(a=>a.kind==='ramp');put('P03-RAMP-CONTINUOUS',Math.abs(m.rampHeight(...ramp.start)-p.field.upper)<1e-8&&Math.abs(m.rampHeight(...ramp.end)-p.field.lower)<1e-8&&ramp.rise/ramp.run<=.08334,'Supported eighteen-metre ramp');
 for(const r of m.profiles)put('P03-ROAD-'+r.from+'--'+r.to,r.maxSlope<=p.maxRoadGrade,r.maxSlope);
 put('P03-UNKNOWN22',m.anchors['22']===null,'No invented facility location');
 return{passed:results.every(r=>r.passed),results};
}
