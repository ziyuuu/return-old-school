import * as THREE from 'three';
import { surfaceMaterial, cloneSurfaceMaterial } from './materials';

/** R3 character-only palette and matte response, approved reference relationships.
 * Exact dyes remain H. Campus material bank, lighting, exposure and maps are untouched.
 */
export const CHARACTER_PALETTE = {
  blue: '#527598', blueFold: '#466582', white: '#e5dfd4', red: '#ad615d',
  skin: '#cfb298', skinShade: '#a99179', hair: '#38332e', hairLight: '#38352f',
  eye: '#302d28', eyeWhite: '#e5dfd4', lip: '#a18b76', sole: '#cfcec5', shoe: '#8b918f', zip: '#98a4ab',
};
export function createCharacterMaterials(mats: THREE.MeshPhysicalMaterial[]) {
  const owned: THREE.MeshPhysicalMaterial[] = [];
  const make = (row: number, role: string) => {
    const m = cloneSurfaceMaterial(surfaceMaterial(mats[row], role, 'student-surface'));
    m.onBeforeCompile = () => {};
    m.customProgramCacheKey = () => 'c2-r3-authored-planar-matte';
    m.color.set(0xffffff); m.vertexColors = true;
    // Authored polygon normals survive triangulation and GLB export.
    m.flatShading = false;
    m.roughness = 1; m.metalness = 0; m.clearcoat = 0; m.sheen = 0;
    m.specularIntensity = 0; m.envMapIntensity = .20;
    m.map = null; m.roughnessMap = null; m.bumpMap = null; m.normalMap = null;
    m.bumpScale = 0; m.transparent = false; m.opacity = 1; m.depthWrite = true;
    m.side = THREE.FrontSide;
    m.userData = { ...m.userData, role, nativeUV: true, character: true,
      style: 'authored-planar-matte', evidence: 'A reference style and uniform / H exact palette and form' };
    owned.push(m); return m;
  };
  return { cloth: make(21, 'cloth'), skin: make(7, 'notice'), hair: make(16, 'cloth'),
    detail: make(14, 'cloth'), shoe: make(6, 'court-surface'),
    dispose: () => owned.forEach(m => m.dispose()) };
}
