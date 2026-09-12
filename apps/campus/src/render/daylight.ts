import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

/** One physical sun plus a procedural HDR sky. Environment light is an
 * approximation of outdoor indirect light, not ray-traced global illumination.
 */
export function installDaylight(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.07;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const direction = new THREE.Vector3(145, 260, -215).normalize();
  const sun = new THREE.DirectionalLight('#fff0d9', 4.2); sun.name = 'campus-sun'; sun.castShadow = true;
  const resolution = Math.min(innerWidth < 700 ? 2048 : 4096, renderer.capabilities.maxTextureSize);
  sun.shadow.mapSize.set(resolution, resolution);
  sun.shadow.camera.near = 30; sun.shadow.camera.far = 720;
  scene.add(sun, sun.target);

  const sky = new Sky(); sky.scale.setScalar(450);
  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 2; uniforms.rayleigh.value = 1.25;
  uniforms.mieCoefficient.value = .005; uniforms.mieDirectionalG.value = .8;
  uniforms.sunPosition.value.copy(direction);
  const skyScene = new THREE.Scene(); skyScene.add(sky);
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(skyScene, .035, .1, 1000);
  scene.environment = environment.texture; scene.environmentIntensity = .20;
  scene.background = environment.texture; scene.backgroundBlurriness = .30; scene.backgroundIntensity = .86;
  sky.geometry.dispose(); sky.material.dispose(); generator.dispose();

  let revision = 0, previous = '', extent = 250;
  function invalidate() { revision++; sun.shadow.needsUpdate = true; renderer.shadowMap.needsUpdate = true; }
  function focus(target: THREE.Vector3, distance: number) {
    // Large campus views and flight use full coverage. Close views concentrate texels.
    const wide = !Number.isFinite(distance) || distance > 230;
    extent = wide ? 250 : Math.max(26, Math.min(180, Math.ceil((distance * .7 + 18) / 4) * 4));
    const centre = wide ? new THREE.Vector3(45, 0, 135) : target.clone();
    // Stable focus buckets avoid re-rendering a static shadow on every damping tick.
    centre.multiplyScalar(2).round().multiplyScalar(.5);
    const key = centre.toArray().join(',') + ':' + extent;
    if (key === previous) return; previous = key;
    sun.target.position.copy(centre); sun.position.copy(centre).addScaledVector(direction, 365);
    Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent });
    // Offset grows with world metres per texel; this prevents grazing roof/ground
    // acne in wide views without pushing close-up contact shadows off the steps.
    const texel = extent * 2 / resolution;
    sun.shadow.normalBias = Math.max(.025, texel * .9);
    // Shadow depth comparisons reverse too; keeping a negative bias would create
    // self-shadow bands on the broad context ground with EXT_clip_control.
    sun.shadow.bias = (renderer.capabilities.reversedDepthBuffer ? 1 : -1) * Math.max(.000035, texel / 720);
    sun.shadow.camera.updateProjectionMatrix(); sun.target.updateMatrixWorld(); sun.updateMatrixWorld(); invalidate();
  }
  focus(new THREE.Vector3(45, 0, 135), Infinity);
  return { sun, focus, invalidate,
    state: () => ({ pipeline: 'PBR / AgX / procedural sky PMREM', reversedDepthBuffer: renderer.capabilities.reversedDepthBuffer, logarithmicDepthBuffer: renderer.capabilities.logarithmicDepthBuffer, shadowResolution: resolution, shadowExtent: extent,
      shadowRevision: revision, shadowAutoUpdate: renderer.shadowMap.autoUpdate, sunIntensity: sun.intensity,
      environmentIntensity: scene.environmentIntensity, exposure: renderer.toneMappingExposure }),
    dispose: () => { environment.dispose(); sun.shadow.dispose(); sun.removeFromParent(); sun.target.removeFromParent(); },
  };
}
