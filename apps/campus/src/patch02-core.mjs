/** Owner-authorized overlay. Never mutate the frozen R4 or first M1.1-A inputs. */
import {edgeWidth} from './revision-core.mjs';
import {buildTerrainModel} from './terrain-core.mjs';
const clone=x=>structuredClone(x);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const key=(a,b)=>[a,b].sort().join('|');
export function applyPatch02(base,terrainBase,p){
 const l=clone(base),t=clone(terrainBase),n=l.navigation;
 l.version=p.version;l.baselineVersion=base.version;
 const gym=l.facilities.find(f=>f.id==='03');gym.size[1]=p.gym.height;
 gym.note+=' Patch02: 正门+X朝主路；前坪、绕馆路、左梯观赛层。馆高及剖面参数H，未实测。';
 gym.evidence.reference+='；USER-P02-91565a27/dfbc1933';
 const entry=l.entrances.find(e=>e.id==='03-front');entry.position=[-24,0,45];entry.facing=[1,0,0];entry.status='A朝主路/P前坪/H门位及尺寸';entry.width=p.gym.doorWidth;
 // The former "door approach" is a through-road on the north, not the gym front door.
 const old=n.nodes['gym-entry'];n.nodes['gym-loop-north']=old;
 n.nodes['gym-loop-west-north']=[p.loop.westX,0,p.loop.northZ];
 n.nodes['gym-loop-west-south']=[p.loop.westX,0,p.loop.southZ];
 n.nodes['gym-main-junction']=[0,0,45];n.nodes['gym-forecourt']=[-11,0,45];
 n.nodes['gym-entry']=[...p.gym.entryStart.slice(0,1),0,p.gym.entryStart[1]];
 n.edges=n.edges.filter(([a,b])=>key(a,b)!==key('junction-gym','gym-entry')&&key(a,b)!==key('junction-gym','junction-sports'));
 const add=(a,b,w)=>{n.edges.push([a,b]);n.edgeWidths[a+'|'+b]=w;};
 add('junction-gym','gym-loop-north',3);add('gym-loop-north','gym-loop-west-north',p.loop.width);
 add('gym-loop-west-north','gym-loop-west-south',p.loop.width);add('gym-loop-west-south','music-approach',p.loop.width);
 add('junction-gym','gym-main-junction',7);add('gym-main-junction','junction-sports',7);
 add('gym-main-junction','gym-forecourt',4);add('gym-forecourt','gym-entry',4);
 delete n.edgeWidths['junction-gym|junction-sports'];
 n.removedEdges.push(['junction-gym','gym-entry']);
 n.mainRoadChain.splice(n.mainRoadChain.indexOf('junction-gym')+1,0,'gym-main-junction');
 n.requiredChains.push([...p.loop.cycle],['gym-main-junction','gym-forecourt','gym-entry']);
 n.tourPath=n.tourPath.flatMap((id,i,arr)=>{
  if(id==='gym-entry')return ['gym-loop-north'];
  const next=arr[i+1];if(key(id,next??'')===key('junction-gym','junction-sports'))return [id,'gym-main-junction'];return [id];
 });
 l.patch02={issues:p.issues,exception:'gym front + connected local loop only; baseline branch immutable',loop:p.loop.cycle,measured:null};
 t.version=p.version;t.sportsDatum=p.entrance.interiorOffset;
 t.gradeKnots=t.gradeKnots.map(([z,y])=>[z,z>=p.entrance.endZ?y+p.entrance.interiorOffset:y]);
 t.gradeBasis='A入口需加陡；H20m上升1.00m（5%），内场共同平移0.80m，既有内部高差不扩大。';
 for(const z of t.zones)z.height+=p.entrance.interiorOffset;
 t.entrySlopeEvidence={...t.entrySlopeEvidence,numerical_rise_H_m:p.entrance.rise,numerical_run_H_m:p.entrance.run,ownerCorrection:'USER-P02',measured:null};
 t.stairs=t.stairs.map(s=>s.id==='ST-GYM'?{...s,start:p.gym.entryStart,end:p.gym.entryEnd,width:p.gym.entryWidth,steps:p.gym.entrySteps,rise:p.gym.entryRise,basis:'A正门朝主路/P前坪及台阶/H4级及全部数值'}:s);
 t.forecourts=[{id:'GYM-FORECOURT',facilityId:'03',bounds:p.gym.forecourtBounds,row:2,basis:'A前坪/P照片；H边界'}];
 return {layout:l,terrain:t};
}
export function galleryParts(p){
 const s=p.gym.spectatorStair,h=p.gym.galleryHeight;
 return Array.from({length:s.steps},(_,i)=>({id:`P02-GYM-SPECTATOR-STEP-${i+1}`,u:s.u,v:s.startV+(i+.5)*s.tread,width:s.width,depth:s.tread,base:.04,top:.04+h*(i+1)/s.steps}));
}
export function galleryRoute(p){
 const s=p.gym.spectatorStair,end=s.startV+s.steps*s.tread;
 const points=[{u:s.u,v:.5,y:.04}];
 for(const step of galleryParts(p))points.push({u:step.u,v:step.v,y:step.top});
 points.push({u:s.u,v:end+1,y:p.gym.galleryHeight+.04},{u:-13.8,v:end+1,y:p.gym.galleryHeight+.04},{u:-13.8,v:17,y:p.gym.galleryHeight+.04});
 return points;
}
// Local architectural axes: u=right when facing the front, v=depth toward the rear.
export const gymLocal=(u,y,v)=>[21-v,y,-u];
export const gymWorld=(u,y,v,dy=0)=>[-24-v,y+dy,45-u];
export function patch02Checks(l,t,p,base){
 const r=[],put=(id,passed,detail)=>r.push({id,passed:!!passed,detail});
 const model=buildTerrainModel(l,t),a=base.facilities.find(f=>f.id==='03'),g=l.facilities.find(f=>f.id==='03'),entr=l.entrances.find(e=>e.id==='03-front');
 put('P02_IDS_AND_UNLOCATED',eq(l.facilities.map(f=>[f.id,!!f.position]),base.facilities.map(f=>[f.id,!!f.position])),'No missing site invented');
 put('P02_ALL_XZ_PRESERVED',l.facilities.every((f,i)=>eq(f.position,base.facilities[i].position)&&eq(f.size?[f.size[0],f.size[2]]:null,base.facilities[i].size?[base.facilities[i].size[0],base.facilities[i].size[2]]:null)),'All28 identities/27 positions and footprints unchanged');
 put('P02_ONLY_GYM_HEIGHT',l.facilities.every((f,i)=>f.id==='03'||eq(f.size,base.facilities[i].size))&&g.size[1]===p.gym.height,'Only03 working height changed');
 const allowedNodes=new Set(['gym-entry']);
 put('P02_OTHER_NODES_UNCHANGED',Object.entries(base.navigation.nodes).every(([id,x])=>allowedNodes.has(id)||eq(x,l.navigation.nodes[id])),'Only old gym-entry semantic/position replaced');
 const removed=new Set([key('junction-gym','gym-entry'),key('junction-gym','junction-sports')]);const edges=new Set(l.navigation.edges.map(([a,b])=>key(a,b)));
 put('P02_OLD_EDGES_WIDTHS_PRESERVED',base.navigation.edges.every(([a,b])=>removed.has(key(a,b))||(edges.has(key(a,b))&&edgeWidth(base,a,b)===edgeWidth(l,a,b))),'Only gym dead end and one split main segment replaced');
 put('P02_NO_OLD_ENTRY_SPUR',!edges.has(key('junction-gym','gym-entry')),'North spur now loop, not doorway');
 put('P02_FRONT_FACES_MAIN',eq(entr.facing,[1,0,0])&&eq(entr.position,[-24,0,45]),'Main-road facade +X');
 put('P02_FORECOURT_SPACE',t.forecourts?.some(f=>f.id==='GYM-FORECOURT'&&eq(f.bounds,p.gym.forecourtBounds)),'Open space between road and front');
 put('P02_LOOP_CLOSED',p.loop.cycle[0]===p.loop.cycle.at(-1)&&p.loop.cycle.slice(1).every((b,i)=>edges.has(key(p.loop.cycle[i],b))),'Closed route uses main-road east edge; no crossing attached music block');
 put('P02_NO_SHARED_WALL_ROAD',eq(l.buildingContacts,base.buildingContacts),'No loop through03/24 contact');
 put('P02_FROZEN_MAIN_TOILET',eq(l.connections,base.connections)&&eq(l.toilet25,base.toilet25),'Every R4 floor/door preserved');
 put('P02_FORBIDDEN_ROUTES',base.navigation.forbiddenEdges.every(([a,b])=>!edges.has(key(a,b))),'No shortcut or deleted green road');
 put('P02_ENTRANCE_5_PERCENT',Math.abs(model.groundHeight(0,24)-model.groundHeight(0,4)-1)<.000001,'H1.00m rise /20m, no exaggeration');
 put('P02_SPORTS_FLAT',model.pads.filter(x=>['04','05','06','08','23','28'].includes(x.id)).every(x=>Math.abs(x.height-.8)<1e-9),'Relative sport platform .8m');
 put('P02_PAIRED_FLOORS',model.anchors['03'].floor===model.anchors['24'].floor&&model.anchors['15'].floor===model.anchors['25'].floor,'Contact pairs rise together');
 const s=p.gym.spectatorStair;const parts=galleryParts(p);
 put('P02_SPECTATOR_LEFT',s.u<0&&gymWorld(s.u,0,0)[2]>g.position[2],'Left to viewer at main road, +Z in plan');
 put('P02_SPECTATOR_LEVEL',s.rise===p.gym.galleryHeight&&s.steps===28&&Math.abs(parts.at(-1).top-.04-p.gym.galleryHeight)<1e-9,'H4.2m gallery');
 put('P02_STAIR_DIMENSIONS',s.rise/s.steps<=.18&&s.tread>=.28&&s.width>=2.4,'Working dimensions, not regulatory certification');
 put('P02_FACADE_LEVEL_ORDER',0<p.gym.lobbyDoorHeight&&p.gym.lobbyDoorHeight<p.gym.galleryHeight&&p.gym.galleryHeight<p.gym.windowSill&&p.gym.windowHead<p.gym.signBottom&&p.gym.signBottom<p.gym.signTop&&p.gym.signTop<p.gym.height,'Lobby, gallery, recess, upper shell distinct');
 put('P02_NOT_SURVEYED',p.surveyVerified===false&&p.measured===null&&t.surveyVerified===false,'All exact dimensions H');
 for(const pr of model.profiles)put('P02_GRADE_'+pr.from+'_'+pr.to,pr.maxSlope<=t.maxRoadGrade,pr.maxSlope);
 return {passed:r.every(x=>x.passed),results:r};
}
