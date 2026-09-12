import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from '../../apps/campus/node_modules/three/build/three.module.js';
import { resolveFinish, surfacePixels, surfaceProfiles } from '../../apps/campus/src/render/surface-profiles.mjs';
import { foliageGeometry } from '../../apps/campus/src/render/foliage-geometry.mjs';

test('shared palette rows distinguish leaves from soil, water from glass and floors from metal', () => {
  assert.equal(resolveFinish(1, 'planting', 'leaf'), 'foliage');
  assert.equal(resolveFinish(1, 'planting', 'box'), 'soil');
  assert.equal(resolveFinish(4, 'window'), 'glass');
  assert.equal(resolveFinish(14, 'window-grille'), 'painted-metal');
  assert.equal(resolveFinish(6, 'window-frame'), 'metal');
  assert.equal(resolveFinish(14, 'window-sill'), 'concrete');
  assert.equal(resolveFinish(15, 'spandrel'), 'concrete');
  assert.equal(resolveFinish(14, 'porch-post'), 'concrete');
  assert.equal(resolveFinish(4, 'basin'), 'water');
  assert.equal(resolveFinish(15, 'floor'), 'concrete');
  assert.equal(resolveFinish(15, 'frame'), 'metal');
  assert.equal(resolveFinish(13, 'wall'), 'paint');
  assert.equal(resolveFinish(1, 'court-surface'), 'rubber');
});

test('surface maps are reproducible and families have distinct albedo and relief patterns', () => {
  const hashes = new Set();
  for (const finish of Object.keys(surfaceProfiles)) {
    const a = surfacePixels(finish), b = surfacePixels(finish);
    assert.deepEqual(a, b);
    const hash = createHash('sha256').update(a.colour).update(a.detail).digest('hex');
    assert.ok(!hashes.has(hash), 'Duplicate surface recipe: ' + finish);
    hashes.add(hash);
    assert.equal(a.colour.length, 256 * 256 * 4);
  }
  assert.throws(() => surfacePixels('missing'), /Unknown surface/);
});

test('brushing has a direction while fabric has two crossing thread directions', () => {
  const metal = surfacePixels('metal').detail, cloth = surfacePixels('fabric').detail, stride = 256 * 4;
  for (let x = 0; x < 256; x++) assert.equal(metal[x * 4], metal[stride * 29 + x * 4]);
  assert.notEqual(cloth[0], cloth[4]);
  assert.notEqual(cloth[0], cloth[stride]);
  assert.ok(surfaceProfiles.glass.roughness < surfaceProfiles.metal.roughness);
  assert.ok(surfaceProfiles.metal.roughness < surfaceProfiles.concrete.roughness);
});

test('ivy has a thin lobed mesh with leaf UVs inside its inherited coverage envelope', () => {
  const size = [.31, .27, .08], geometry = foliageGeometry({ id: 'B03-18-ivy-left-1', size });
  assert.ok(geometry.index.count / 3 > 320);
  const bounds = geometry.boundingBox;
  for (let i = 0; i < 3; i++) {
    assert.ok(bounds.min.getComponent(i) >= -size[i] - 1e-6);
    assert.ok(bounds.max.getComponent(i) <= size[i] + 1e-6);
  }
  assert.ok(bounds.max.z - bounds.min.z < size[2] * .5);
  assert.equal(geometry.attributes.uv.count, geometry.attributes.position.count);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const front = new THREE.Raycaster(new THREE.Vector3(.005, .01, -1), new THREE.Vector3(0, 0, 1)).intersectObject(mesh);
  const back = new THREE.Raycaster(new THREE.Vector3(.005, .01, 1), new THREE.Vector3(0, 0, -1)).intersectObject(mesh);
  assert.ok(front.length && back.length, 'Both leaf sides must remain real surfaces');
});
