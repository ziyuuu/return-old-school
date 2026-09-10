/** R3 assertions. Numeric targets are authored hypotheses, not measurements. */
import {segmentHitsRect} from './revision-core.mjs';
const EPS=1e-6;
export function r3Checks(l,{bounds,overlap}){
 const result=[],put=(id,ok,detail)=>result.push({id,passed:Boolean(ok),detail});
 const f=id=>l.facilities.find(v=>v.id===id),b=id=>bounds(f(id)),n=l.navigation;
 const edges=new Set(n.edges.flatMap(([a,b])=>[`${a}|${b}`,`${b}|${a}`]));
 const neighbours=id=>n.edges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
 put('R3_STONE_LEFT',b('27').maxX<b('01').minX,'27 is map-left (-X), not street-photo right');
 put('R3_SIDE_GATE_AT_ENTRANCE',b('02').minX>b('01').maxX&&Math.abs(f('02').position[2]-f('01').position[2])<5,'02 is the former map-right stone position, not the field rear');
 put('R3_NO_ENTRY_SHORTCUT',(n.forbiddenEdges||[]).length>=3&&n.forbiddenEdges.every(([a,b])=>!edges.has(`${a}|${b}`))&&neighbours('side-gate').length===1,'No direct main-to-side shortcut; independent entrance is degree1');
 const mainBand={minX:-3.5,maxX:3.5,minZ:0,maxZ:40};
 const chain=n.entranceIsolation?.sideChain||[];
 put('R3_SIDE_PAVING_SEPARATE',chain.length>=5&&chain.slice(1).every((p,i)=>!segmentHitsRect(n.nodes[chain[i]],n.nodes[p],mainBand,1.2)),'Side paving footprint does not enter main-road band at the entrance');
 const front=l.entrances.find(v=>v.id==='17-front'),target=n.nodes['longya-entry'],prev=n.nodes['east-bottom'];
 put('R3_LONGYA_SHIFTED_LEFT',f('17').position[0]<165&&f('17').position[0]===129,'R3 chosen X129, previously165;H');
 put('R3_LONGYA_DOOR_ALIGNMENT',front&&Math.abs(front.position[0]-f('17').position[0])<EPS&&Math.abs(front.position[2]-b('17').minZ)<EPS&&front.facing[2]===-1&&Math.abs(target[0]-front.position[0])<EPS&&Math.abs(prev[0]-target[0])<EPS&&target[2]<front.position[2]&&front.position[2]-target[2]<=2.5&&edges.has('east-bottom|longya-entry'),'Longitudinal approach aims at a north-front opening, not south bypass');
 const fam=f('20'),gap=b('11').minZ-b('20').maxZ;
 put('R3_FAMILY_AREA_ENLARGED',fam.size[0]*fam.size[2]>54*58,'Larger envelope than54x58R2');
 put('R3_FAMILY_CANTEEN_GAP',gap>0&&gap<=18,'R4 right/up shift replaces R3 exact7H; keep positive gap<=18H, not old45');
 const blocks=(l.contextBlocks||[]).map(p=>({id:p.id,position:p.localPosition.map((x,i)=>x+fam.position[i]),size:p.size}));
 const ext=blocks.map(bounds),env=b('20');
 put('R3_CONTEXT_COMPONENTS_CONTAINED',blocks.length===6&&ext.every(v=>v.minX>=env.minX-EPS&&v.maxX<=env.maxX+EPS&&v.minZ>=env.minZ-EPS&&v.maxZ<=env.maxZ+EPS),'SixH blocks fit the envelope; not six historical verified buildings');
 put('R3_CONTEXT_REAL_MASS_REACHES_CANTEEN',ext.length>0&&b('11').minZ-Math.max(...ext.map(v=>v.maxZ))<=18,'Actual building masses, not a baseplate, narrow the canteen gap');
 put('R3_CONTEXT_BLOCKS_DISJOINT',ext.every((a,i)=>ext.slice(i+1).every(b=>!overlap(a,b))),'No residential subvolume penetration');
 const c=l.buildingContacts?.find(v=>v.id==='03-24-CONTACT'),g=b('03'),m=b('24');
 const a=Math.max(g.minX,m.minX),z=Math.min(g.maxX,m.maxX);
 put('R3_GYM_MUSIC_ABUT',Math.abs(g.maxZ-m.minZ)<EPS&&z-a>1&&!overlap(g,m),'Positive-length common edge, zero gap, no overlapping footprints');
 put('R3_SHARED_CONTACT_DATA',c&&c.kind==='shared-wall'&&c.from==='03'&&c.to==='24'&&c.axis==='z'&&Math.abs(c.coordinate-g.maxZ)<EPS&&Math.abs(c.coordinate-m.minZ)<EPS&&Math.abs(c.span[0]-a)<EPS&&Math.abs(c.span[1]-z)<EPS,'Contact span derived from both current building bounds');
 put('R3_NO_EXTERNAL_GYM_LINK',(l.buildingLinks||[]).length===0,'No03-24-LINK portico/stair/roof geometry');
 const p1=l.entrances.find(e=>e.id==='03-music'),p2=l.entrances.find(e=>e.id==='24-gym');
 put('R3_SHARED_PORTALS',c&&p1&&p2&&p1.position.every((v,i)=>Math.abs(v-p2.position[i])<EPS&&Math.abs(v-c.portalCenter[i])<EPS)&&p1.facing[2]===1&&p2.facing[2]===-1&&p1.position[0]-c.portalWidth/2>a&&p1.position[0]+c.portalWidth/2<z,'Opposing openings at the same common-wall location; interior access detailsH');
 put('R3_THRESHOLDS_CURRENT',['17-front-threshold','24-front-threshold'].every(id=>{const t=l.thresholds?.find(v=>v.id===id),e=l.entrances.find(v=>v.id===id.replace('-threshold',''));return t&&e&&t.end.every((v,i)=>Math.abs(v-e.position[i])<EPS)}),'Doorstep geometry follows current entrance data');
 return result;
}
