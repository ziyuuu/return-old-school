import * as THREE from 'three';
import { cloneSurfaceMaterial } from './materials';
import { surfaceProfiles } from './surface-profiles.mjs';

/** Static local reflection probes capture this campus, without photograph maps.
 * A probe is an approximation: it does not provide ray-traced, parallax-correct
 * reflections or indirect light bounces. Diffuse sky lighting remains separate.
 */
export function installCampusReflections(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const started = performance.now();
  const locations: Record<string, [number, number, number]> = {
    teaching: [73, 8, 194], gym: [-15, 7, 48], library: [73, 8, 239], garden: [73, 7, 274],
    eastTeaching: [139, 8, 212], longya: [129, 9, 242], westTeaching: [-23, 7, 188],
  };
  const objects: { mesh: THREE.Mesh; key: string; material: THREE.MeshPhysicalMaterial }[] = [];
  const hidden: THREE.Object3D[] = [];
  scene.traverseVisible((object: any) => {
    if (!object.isMesh || Array.isArray(object.material)) return;
    const finish = object.material.userData.finish;
    if (!surfaceProfiles[finish]?.reflection) return;
    const owner = object.userData.facility;
    const key = ['13', '21'].includes(owner) ? 'eastTeaching' : owner === '17' ? 'longya' : ['07', '16'].includes(owner) ? 'westTeaching' :
      ['03', '24', '04'].includes(owner) ? 'gym' : owner === '18' ? 'library' : owner === '19' ? 'garden' : 'teaching';
    objects.push({ mesh: object, key, material: object.material });
    if (finish === 'glass' || finish === 'water') hidden.push(object);
  });
  const generator = new THREE.PMREMGenerator(renderer), targets = new Map<string, THREE.WebGLRenderTarget>();
  const resolution = Math.min(256, renderer.capabilities.maxCubemapSize);
  try {
    hidden.forEach(o => { o.visible = false; });
    for (const [key, position] of Object.entries(locations)) {
      const cube = new THREE.WebGLCubeRenderTarget(resolution, { type: THREE.HalfFloatType });
      const camera = new THREE.CubeCamera(.3, 700, cube); camera.position.set(...position);
      try { camera.update(renderer, scene); targets.set(key, generator.fromCubemap(cube.texture)); }
      finally { cube.dispose(); }
    }
  } finally {
    hidden.forEach(o => { o.visible = true; }); generator.dispose();
    renderer.shadowMap.needsUpdate = true;
  }
  const copies = new Map<string, WeakMap<THREE.Material, THREE.MeshPhysicalMaterial>>();
  for (const { mesh, key, material } of objects) {
    if (!copies.has(key)) copies.set(key, new WeakMap());
    const cache = copies.get(key)!;
    let copy = cache.get(material);
    if (!copy) {
      copy = cloneSurfaceMaterial(material);
      copy.envMap = targets.get(key)!.texture;
      copy.envMapIntensity = surfaceProfiles[material.userData.finish].reflection ?? 1;
      copy.userData.reflectionProbe = key;
      copy.needsUpdate = true; cache.set(material, copy);
    }
    mesh.material = copy;
  }
  return { probes: targets.size, resolution, reflectiveMeshes: objects.length,
    buildMs: Math.round(performance.now() - started), method: 'static local campus cubemaps', locations };
}
