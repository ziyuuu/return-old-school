import * as THREE from 'three';
import { createCharacterMaterials, CHARACTER_PALETTE } from '../render/character-materials';
import { STUDENT_PROFILE, locomotionParams } from './student-avatar-profile.mjs';
import { createStudentRig } from './student-rig.mjs';

/** Replaces only the render adapter; C1 capsule, world and input stay untouched. */
export function createStudentAvatar(mats: THREE.MeshPhysicalMaterial[]) {
  const materials = createCharacterMaterials(mats);
  const rig = createStudentRig(materials, CHARACTER_PALETTE), root = rig.root;
  root.userData = {...root.userData, evidence:STUDENT_PROFILE.evidence, uniform:STUDENT_PROFILE.uniform};
  const n=64,pix=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
    const d=Math.hypot((x+.5)/n*2-1,(y+.5)/n*2-1);
    pix[(y*n+x)*4+3]=Math.round(Math.pow(Math.max(0,1-d),1.7)*80);
  }
  const tex=new THREE.DataTexture(pix,n,n);tex.needsUpdate=true;
  const shadowMaterial=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.82});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.70,.54),shadowMaterial);
  shadow.name='C2-contact-shadow';shadow.rotation.x=-Math.PI/2;shadow.position.y=.016;shadow.userData.player=true;root.add(shadow);
  let time=0,phase=0,previousTravel:number|null=null,blend=0,state='idle';
  return {root,profile:STUDENT_PROFILE,animationClips:rig.animationClips,
    update(feet:number[],heading:number,speed:number,travel:number,grounded:boolean,hide:boolean,dt:number) {
      root.position.fromArray(feet);root.rotation.y=heading;root.visible=!hide;
      const delta=previousTravel===null?0:Math.max(0,Math.min(1,travel-previousTravel));previousTravel=travel;
      const p=locomotionParams(speed,grounded);state=p.state;
      time+=dt;phase=(phase+delta*p.cadence)%(Math.PI*2);
      blend=THREE.MathUtils.damp(blend,state==='idle'?0:1,12,Math.max(0,dt));
      // Deterministic drives render immediately even when the host asks for dt=0.
      if(dt===0&&delta>0)blend=state==='idle'?0:1;
      rig.pose(phase,speed,grounded,time,blend);shadow.visible=grounded;
    },
    state(){return {finalStudent:true,artVersion:'C2.R2',animation:state,phase,
      evidence:STUDENT_PROFILE.evidence,uniform:STUDENT_PROFILE.uniform,
      geometry:{triangles:rig.stats.triangles,vertices:rig.stats.vertices,geometryBytes:rig.stats.geometryBytes,
        drawMeshes:rig.stats.drawMeshes,bones:rig.stats.bones}};},
    dispose(){rig.dispose();shadow.geometry.dispose();tex.dispose();shadowMaterial.dispose();materials.dispose();}
  };
}
