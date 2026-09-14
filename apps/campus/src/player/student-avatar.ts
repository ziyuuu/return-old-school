import * as THREE from 'three';
import {surfaceMaterial} from '../render/materials';
import {STUDENT_PROFILE,locomotionParams} from './student-avatar-profile.mjs';

/** Evidence-bounded C2 student reconstruction. No emblem, class mark or portrait. */
export function createStudentAvatar(mats:THREE.MeshPhysicalMaterial[]){
  const root=new THREE.Group();root.name='C2-student-avatar';root.userData={player:true,evidence:STUDENT_PROFILE.evidence,uniform:STUDENT_PROFILE.uniform};
  const mat=(row:number,role='avatar-cloth')=>surfaceMaterial(mats[row],role,'capsule');
  const offWhite=mat(14),red=mat(17),navy=mat(6),skin=mat(14,'avatar-neutral'),hair=mat(6,'avatar-neutral'),shoe=mat(6);
  const part=(name:string,g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(g,m);mesh.name='C2-'+name;mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData={player:true,role:'student-avatar',surfaceResolved:true,evidence:'H geometry within C2 evidence boundary'};parent.add(mesh);return mesh;};
  const capsule=(r:number,l:number)=>new THREE.CapsuleGeometry(r,Math.max(0,l-2*r),12,48);
  const hips=part('hips',capsule(.16,.30),navy,root,0,.83,0);hips.scale.z=.76;
  const torso=new THREE.Group();torso.position.set(0,.88,0);root.add(torso);
  const profile=[[0,0],[.16,0],[.185,.055],[.205,.28],[.215,.43],[.165,.50],[0,.51]].map(([x,y])=>new THREE.Vector2(x,y));
  const jacket=part('oversized-jacket',new THREE.LatheGeometry(profile,48),offWhite,torso,0,0,0);jacket.scale.z=.70;
  for(const s of[-1,1]){const panel=part('jacket-side-'+s,new THREE.BoxGeometry(.045,.37,.018),red,torso,s*.176,.245,.126);panel.rotation.z=-s*.055;}
  part('collar',new THREE.TorusGeometry(.075,.018,16,48,Math.PI),red,torso,0,.49,.02).rotation.x=Math.PI/2;
  part('neck',new THREE.CylinderGeometry(.047,.052,.095,48),skin,root,0,1.405,0);
  const head=part('head',capsule(.108,.275),skin,root,0,1.59,0);head.scale.z=.93;
  const hairCap=part('hair',new THREE.SphereGeometry(.112,48,24,0,Math.PI*2,0,Math.PI*.58),hair,root,0,1.625,-.002);hairCap.scale.set(1.03,1,.96);
  const face=part('face-direction',new THREE.SphereGeometry(.072,32,16),skin,head,0,-.012,.058);face.scale.set(1,1.10,.32);
  const arms:THREE.Group[]=[],legs:THREE.Group[]=[],knees:THREE.Group[]=[];
  for(const s of[-1,1]){
    const arm=new THREE.Group();arm.position.set(s*.238,1.30,0);root.add(arm);arms.push(arm);
    part('upper-arm-'+s,capsule(.068,.32),offWhite,arm,0,-.13,0);part('sleeve-stripe-'+s,new THREE.BoxGeometry(.025,.27,.018),red,arm,s*.048,-.13,.058);
    part('forearm-'+s,capsule(.052,.275),offWhite,arm,0,-.385,.018);part('hand-'+s,capsule(.043,.115),skin,arm,0,-.565,.028);
    const leg=new THREE.Group();leg.position.set(s*.101,.82,0);root.add(leg);legs.push(leg);
    part('thigh-'+s,capsule(.082,.40),navy,leg,0,-.18,0);const knee=new THREE.Group();knee.position.set(0,-.38,0);leg.add(knee);knees.push(knee);
    part('shin-'+s,capsule(.062,.37),navy,knee,0,-.17,0);part('trouser-stripe-'+s,new THREE.BoxGeometry(.018,.31,.018),red,knee,s*.054,-.17,.03);
    const foot=part('shoe-'+s,new THREE.SphereGeometry(1,32,16),shoe,knee,0,-.414,.055);foot.scale.set(.071,.061,.14);
  }
  const n=64,pix=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const d=Math.hypot((x+.5)/n*2-1,(y+.5)/n*2-1),i=(y*n+x)*4;pix[i+3]=Math.round(Math.pow(Math.max(0,1-d),1.7)*80);}
  const tex=new THREE.DataTexture(pix,n,n);tex.needsUpdate=true;const shadowMaterial=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.82});const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.86,.64),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;root.add(shadow);
  let blend=0,time=0,state='idle';
  return {root,profile:STUDENT_PROFILE,
    update(feet:number[],heading:number,speed:number,travel:number,grounded:boolean,hide:boolean,dt:number){root.position.fromArray(feet);root.rotation.y=heading;root.visible=!hide;time+=dt;const p=locomotionParams(speed,grounded);state=p.state;blend=THREE.MathUtils.damp(blend,state==='idle'?0:1,10,dt);const phase=travel*p.cadence,amp=p.stride*blend;legs[0].rotation.x=Math.sin(phase)*amp;legs[1].rotation.x=-Math.sin(phase)*amp;arms[0].rotation.x=-Math.sin(phase)*amp*.76;arms[1].rotation.x=Math.sin(phase)*amp*.76;knees[0].rotation.x=Math.max(0,-Math.sin(phase))*.42*blend;knees[1].rotation.x=Math.max(0,Math.sin(phase))*.42*blend;torso.position.y=.88+(state==='idle'?Math.sin(time*2.1)*STUDENT_PROFILE.animation.idleBreath:Math.abs(Math.sin(phase))*-.012*blend);torso.rotation.x=state==='run'?.07:0;shadow.visible=grounded;},
    state(){return {finalStudent:true,animation:state,evidence:STUDENT_PROFILE.evidence,uniform:STUDENT_PROFILE.uniform};},
    dispose(){root.traverse((o:any)=>{if(o.isMesh)o.geometry.dispose();});tex.dispose();shadowMaterial.dispose();root.removeFromParent();}
  };
}
