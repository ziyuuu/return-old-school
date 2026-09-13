import * as THREE from 'three';
import {surfaceMaterial} from '../render/materials';

/** A visibly provisional, articulated scale mannequin. No school emblem, uniform
 * claim or historic identity. All colours and surfaces use the campus material bank. */
export function createScaleAvatar(mats:THREE.MeshPhysicalMaterial[]) {
  const root=new THREE.Group();root.name='C1-scale-avatar';root.userData={player:true,evidence:'C1 proportion mannequin; not historic uniform'};
  const cloth=surfaceMaterial(mats[14],'avatar-cloth','capsule');
  const trousers=surfaceMaterial(mats[6],'avatar-cloth','capsule');
  const neutral=surfaceMaterial(mats[14],'avatar-neutral','capsule');
  const shoes=surfaceMaterial(mats[6],'avatar-cloth','capsule');
  const part=(name:string,geometry:THREE.BufferGeometry,material:THREE.MeshPhysicalMaterial,parent:THREE.Object3D,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.name='C1-'+name;mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=false;
    mesh.userData={player:true,role:'avatar-reference',surfaceResolved:true,evidence:'H visualization, not a collision body'};parent.add(mesh);return mesh;
  };
  const capsule=(radius:number,length:number)=>new THREE.CapsuleGeometry(radius,Math.max(0,length-2*radius),12,48);
  const pelvis=part('hips',capsule(.155,.29),trousers,root,0,.84,0);pelvis.scale.z=.7;
  const torsoProfile=[[0,0],[.135,0],[.155,.055],[.17,.30],[.185,.41],[.14,.46],[0,.47]].map(([x,y])=>new THREE.Vector2(x,y));
  const torso=part('torso',new THREE.LatheGeometry(torsoProfile,48),cloth,root,0,.89,0);torso.scale.z=.65;
  part('neck',new THREE.CylinderGeometry(.048,.052,.10,48),neutral,root,0,1.38,0);
  const head=part('head',capsule(.105,.27),neutral,root,0,1.575,0);head.scale.z=.91;
  // Neutral flattened face plane distinguishes front/back without a portrait.
  part('face-direction',new THREE.SphereGeometry(.073,48,24),neutral,head,0,-.01,.056).scale.set(1,1.12,.37);
  const arms:THREE.Group[]=[],legs:THREE.Group[]=[],knees:THREE.Group[]=[];
  for(const sign of[-1,1]){
    const arm=new THREE.Group();arm.position.set(sign*.222,1.29,0);root.add(arm);arms.push(arm);
    part('upper-arm-'+sign,capsule(.064,.30),cloth,arm,0,-.115,0);
    part('forearm-'+sign,capsule(.049,.26),cloth,arm,0,-.362,.018);
    part('hand-'+sign,capsule(.044,.12),neutral,arm,0,-.526,.028);
    const leg=new THREE.Group();leg.position.set(sign*.096,.82,0);root.add(leg);legs.push(leg);
    part('thigh-'+sign,capsule(.078,.39),trousers,leg,0,-.175,0);
    const knee=new THREE.Group();knee.position.set(0,-.37,0);leg.add(knee);knees.push(knee);
    part('shin-'+sign,capsule(.059,.35),trousers,knee,0,-.164,0);
    const foot=part('shoe-'+sign,new THREE.SphereGeometry(1,48,24),shoes,knee,0,-.39,.047);foot.scale.set(.068,.059,.133);
  }
  // Contact-only shadow. Static sun maps are not re-rendered every animation tick.
  // The body is not baked into the static probe/shadow captures.
  const n=64,pixels=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const d=Math.hypot((x+0.5)/n*2-1,(y+0.5)/n*2-1),i=(y*n+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;pixels[i+3]=Math.round(Math.pow(Math.max(0,1-d),1.7)*90);}
  const tex=new THREE.DataTexture(pixels,n,n);tex.needsUpdate=true;
  const shadowMaterial=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,opacity:.85});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.9,.68),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.name='C1-contact-shadow';shadow.userData={player:true,collision:'none'};
  root.add(shadow);
  let pose=0;
  return {root,
    update(feet:number[],heading:number,speed:number,travel:number,grounded:boolean,hide:boolean,dt:number){
      root.position.fromArray(feet);root.rotation.y=heading;root.visible=!hide;
      pose=THREE.MathUtils.damp(pose,grounded?Math.min(1,speed/1.7):0,12,dt);
      const phase=travel*6.1,amplitude=.42*pose;
      legs[0].rotation.x=Math.sin(phase)*amplitude;legs[1].rotation.x=-Math.sin(phase)*amplitude;
      arms[0].rotation.x=-Math.sin(phase)*amplitude*.8;arms[1].rotation.x=Math.sin(phase)*amplitude*.8;
      knees[0].rotation.x=Math.max(0,-Math.sin(phase))*.34*pose;knees[1].rotation.x=Math.max(0,Math.sin(phase))*.34*pose;
      shadow.visible=grounded;shadow.position.y=.018;
    },
    dispose(){root.traverse((o:any)=>{if(o.isMesh)o.geometry.dispose();});tex.dispose();shadowMaterial.dispose();root.removeFromParent();}
  };
}
