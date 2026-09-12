import * as THREE from 'three';
import { defaultFinishes, resolveFinish, surfaceProfiles, surfacePixels } from './surface-profiles.mjs';

type CampusMaterial = THREE.MeshPhysicalMaterial;
type Bank = { colours: THREE.Color[][]; maps: Map<string, { map: THREE.DataTexture; detail: THREE.DataTexture }>;
  materials: Map<string, CampusMaterial>; anisotropy: number; id: number };
const banks = new Map<number, Bank>();
const sidedMaterials = new WeakMap<THREE.Material, Map<number, CampusMaterial>>();

/** Every finish stays in the historic Canvas shadow / middle / light palette. */
function surfaceColour(bank: Bank, row: number, finish: string) {
  const p = surfaceProfiles[finish], colourRow = finish === 'soil' || finish === 'bark' ? 11 : finish === 'sand' ? 7 : row;
  const family = bank.colours[colourRow], c = family[1].clone();
  c.lerp(family[p.lift >= 0 ? 2 : 0], Math.abs(p.lift));
  const hsl = { h: 0, s: 0, l: 0 }; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * p.saturation, hsl.l);
  if (finish === 'glass' || finish === 'water') { c.r *= .91; c.b *= 1.05; }
  return c;
}

function surfaceMaps(bank: Bank, finish: string) {
  if (bank.maps.has(finish)) return bank.maps.get(finish)!;
  const pixels = surfacePixels(finish);
  const texture = (data: Uint8Array) => {
    const t = new THREE.DataTexture(data, pixels.size, pixels.size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = bank.anisotropy; t.needsUpdate = true;
    // Linear multipliers / packed surface data, not sRGB photographs.
    t.colorSpace = THREE.NoColorSpace; return t;
  };
  const maps = { map: texture(pixels.colour), detail: texture(pixels.detail) };
  bank.maps.set(finish, maps); return maps;
}

function worldSurfaceUV(material: CampusMaterial, metres: number) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uSurfaceMetres = { value: metres };
    shader.vertexShader = 'uniform float uSurfaceMetres;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', [
      '#include <project_vertex>',
      'vec4 surfacePosition = vec4(transformed, 1.0);',
      '#ifdef USE_INSTANCING',
      '  surfacePosition = instanceMatrix * surfacePosition;',
      '#endif',
      'surfacePosition = modelMatrix * surfacePosition;',
      'vec3 surfaceNormal = abs(inverseTransformDirection(transformedNormal, viewMatrix));',
      'vec2 surfaceUV = surfaceNormal.y >= max(surfaceNormal.x, surfaceNormal.z) ? surfacePosition.xz :',
      '  (surfaceNormal.x > surfaceNormal.z ? surfacePosition.zy : surfacePosition.xy);',
      'surfaceUV /= uSurfaceMetres;',
      '#ifdef USE_MAP',
      '  vMapUv = surfaceUV;',
      '#endif',
      '#ifdef USE_BUMPMAP',
      '  vBumpMapUv = surfaceUV;',
      '#endif',
      '#ifdef USE_ROUGHNESSMAP',
      '  vRoughnessMapUv = surfaceUV;',
      '#endif',
    ].join('\n'));
  };
  material.customProgramCacheKey = () => 'campus-surface-r2-world';
}

function makeMaterial(bank: Bank, row: number, finish: string) {
  const key = row + ':' + finish;
  if (bank.materials.has(key)) return bank.materials.get(key)!;
  const p = surfaceProfiles[finish], color = surfaceColour(bank, row, finish);
  const material = new THREE.MeshPhysicalMaterial({ color, roughness: p.roughness, metalness: p.metalness });
  material.name = 'campus-' + row + '-' + finish;
  material.userData = { paletteRow: row, finish, materialBank: bank.id, feature: p.feature, evidence: 'H visual surface choice within original palette' };
  material.shadowSide = THREE.BackSide; material.clipShadows = true; material.forceSinglePass = true;
  material.clearcoat = p.clearcoat ?? 0; material.clearcoatRoughness = finish === 'glass' || finish === 'water' ? .10 : .28;
  material.sheen = p.sheen ?? 0; material.sheenRoughness = .76; material.sheenColor.copy(color).lerp(new THREE.Color('#dce7ca'), .20);
  if (p.opacity) { material.transparent = true; material.opacity = p.opacity; material.depthWrite = false; }
  if (finish === 'water') material.ior = 1.333;
  if (finish === 'glass') material.ior = 1.52;
  const textures = surfaceMaps(bank, finish);
  material.map = textures.map; material.roughnessMap = textures.detail;
  material.bumpScale = p.bump;
  if (p.bump) material.bumpMap = textures.detail;
  if (!p.nativeUV) worldSurfaceUV(material, p.metres);
  bank.materials.set(key, material); return material;
}

export function createCampusMaterials(ramps: string[][], renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = ramps.length;
  const ctx = canvas.getContext('2d')!;
  ramps.forEach((row, y) => row.forEach((colour, j) => {
    ctx.fillStyle = colour; const starts = [0, 95, 182], ends = [95, 182, 256];
    ctx.fillRect(starts[j], y, ends[j] - starts[j], 1);
  }));
  const colours = ramps.map((_, row) => [48, 140, 220].map(x => {
    const [r, g, b] = ctx.getImageData(x, row, 1, 1).data;
    return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
  }));
  const bank: Bank = { colours, maps: new Map(), materials: new Map(),
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()), id: banks.size };
  banks.set(bank.id, bank);
  return ramps.map((_, row) => makeMaterial(bank, row, defaultFinishes[row] ?? 'plaster'));
}

export function surfaceMaterial(base: THREE.MeshStandardMaterial, role: string, shape = '') {
  const bank = banks.get(base.userData.materialBank);
  if (!bank) return base as CampusMaterial;
  return makeMaterial(bank, base.userData.paletteRow, resolveFinish(base.userData.paletteRow, role, shape));
}

export function cloneSurfaceMaterial(base: THREE.Material) {
  const material = base.clone();
  material.onBeforeCompile = base.onBeforeCompile; material.customProgramCacheKey = base.customProgramCacheKey;
  return material as CampusMaterial;
}

/** Complete semantics for legacy site builders that only supplied a palette row. */
export function finishCampusSurfaces(scene: THREE.Scene, layout: any) {
  const kinds = new Map(layout.facilities.map((f: any) => [f.id, f.kind]));
  let assigned = 0;
  scene.traverse((object: any) => {
    if (!object.isMesh || Array.isArray(object.material) || object.material.userData.materialBank === undefined) return;
    let role = object.userData.role ?? '', shape = object.userData.surfaceShape ?? '';
    const kind = kinds.get(object.userData.facility), name = object.name;
    if (/M11A-road|M11A-joint/.test(name) && !/edge/.test(name)) role = 'road';
    else if (/P03-ground|M11A-site-surface/.test(name)) role = 'turf';
    else if (/P04-flagpole/.test(name)) role = 'flagpole';
    else if (/cloth/.test(name)) role = 'flag-surface';
    else if (/P04-teaching-forecourt|FORECOURT/.test(name)) role = 'forecourt-surface';
    else if (kind === 'pool' && object.material.userData.paletteRow === 4) role = 'pool-surface';
    else if (kind === 'sandpit') role = 'sand';
    else if (kind === 'courts' && object.material.userData.paletteRow === 1) role = 'court-surface';
    else if (kind === 'field') role = object.material.userData.paletteRow === 3 ? 'track-surface' : 'turf';
    if (object.userData.surfaceResolved) return;
    if (!role && !shape) return;
    const previous = object.material, desired = surfaceMaterial(previous, role, shape);
    if (previous.side !== desired.side) {
      if (!sidedMaterials.has(desired)) sidedMaterials.set(desired, new Map());
      const copies = sidedMaterials.get(desired)!;
      if (!copies.has(previous.side)) { const copy = cloneSurfaceMaterial(desired); copy.side = previous.side; copies.set(previous.side, copy); }
      object.material = copies.get(previous.side)!;
    }
    else object.material = desired;
    object.userData.surfaceRole = role;
    if (['glass', 'water'].includes(object.material.userData.finish)) object.castShadow = false;
    assigned++;
  });
  return { assigned, families: Object.keys(surfaceProfiles).length };
}
