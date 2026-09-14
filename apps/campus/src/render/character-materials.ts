import * as THREE from 'three';
import { surfaceMaterial, cloneSurfaceMaterial } from './materials';

/** Additive character palette; no mutation of a campus material, exposure or light.
 * Blue/white/red implement the user's approved uniform sheet. Exact dyes are H.
 * All surfaces reuse the shared physical factory and its procedural map banks.
 */
export const CHARACTER_PALETTE = {
  blue: '#315fa2', blueFold: '#2b548e', white: '#eeeae0', red: '#b84646',
  skin: '#d6a47c', skinShade: '#be865f', hair: '#302e2c', hairLight: '#45413e',
  eye: '#382a24', eyeWhite: '#f2e9dc', lip: '#a56454', sole: '#d5d4cc', shoe: '#797e80',
};
export function createCharacterMaterials(mats: THREE.MeshPhysicalMaterial[]) {
  const owned: THREE.MeshPhysicalMaterial[] = [];
  const make = (row:number, role:string, roughness:number) => {
    const m = cloneSurfaceMaterial(surfaceMaterial(mats[row], role, 'student-surface'));
    // Skinning requires material UVs attached to the garment, not projected world UVs.
    // This is local to a cloned character surface; shared campus UVs remain unchanged.
    m.onBeforeCompile = () => {};
    m.customProgramCacheKey = () => 'c2-r2-native-character-surface';
    m.color.set(0xffffff); m.vertexColors = true; m.roughness = roughness;
    m.metalness = 0; m.clearcoat = 0; m.transparent = false; m.opacity = 1;
    m.depthWrite = true; m.side = THREE.FrontSide;
    m.userData = {...m.userData, role, nativeUV: true, character: true,
      evidence: 'A uniform colour relationships / H exact colour and surface'};
    owned.push(m); return m;
  };
  const cloth = make(21, 'cloth', .97); cloth.bumpScale = .00025;
  const skin = make(7, 'notice', .83); skin.bumpMap = null; skin.sheen = 0;
  const hair = make(16, 'cloth', .91); hair.bumpScale = .00005; hair.sheen = .12;
  const detail = make(14, 'cloth', .86); detail.bumpMap = null; detail.sheen = 0;
  const shoe = make(6, 'court-surface', .91); shoe.bumpScale = .00012;
  return { cloth, skin, hair, detail, shoe, dispose: () => owned.forEach(m => m.dispose()) };
}
