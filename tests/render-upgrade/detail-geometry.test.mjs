import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../apps/campus/node_modules/three/build/three.module.js';
import { bevelProfile, detailBox, addDetailedBoxInstances } from '../../apps/campus/src/render/detail-geometry.mjs';

test('detailed frame and column geometry adds actual faces within the original envelope', () => {
  for (const [size, role] of [[[.06, 3, .1], 'frame'], [[.4, 8, .4], 'column'], [[8, .2, .4], 'cornice']]) {
    const geometry = detailBox(size, role); geometry.computeBoundingBox();
    assert.ok((geometry.index?.count ?? geometry.attributes.position.count) / 3 >= 300);
    const { min, max } = geometry.boundingBox;
    for (let i = 0; i < 3; i++) {
      assert.ok(Math.abs(min.getComponent(i) + size[i] / 2) < 1e-6);
      assert.ok(Math.abs(max.getComponent(i) - size[i] / 2) < 1e-6);
    }
    assert.ok(bevelProfile(size, role).radius <= Math.min(...size) * .15);
  }
});
test('walking surfaces and wall partitions stay exact and do not get artificial seams', () => {
  for (const role of ['floor', 'slab', 'step', 'entrance-step', 'wall', 'corridor-wall', 'paving']) {
    assert.equal(bevelProfile([4, .2, 3], role), null);
    assert.equal(detailBox([4, .2, 3], role).index.count / 3, 12);
  }
});
test('dimension-aware instances preserve placement and physical radius without stretching', () => {
  const parts = [
    { id: 'a', role: 'frame', row: 6, size: [.06, 2, .1], center: [0, 1, 0] },
    { id: 'b', role: 'frame', row: 6, size: [.06, 2, .1], center: [1, 1, 0] },
    { id: 'c', role: 'frame', row: 6, size: [.06, 4, .1], center: [2, 2, 0] },
  ];
  const group = new THREE.Group();
  addDetailedBoxInstances(group, parts, () => new THREE.MeshStandardMaterial(), '18', 'test');
  assert.equal(group.children.length, 2); assert.equal(group.children[0].count, 2);
  assert.deepEqual(group.children.flatMap(o => o.userData.partIds), ['a', 'b', 'c']);
  for (const mesh of group.children) {
    assert.equal(mesh.geometry.parameters.radius, .008);
    const matrix = new THREE.Matrix4(); mesh.getMatrixAt(0, matrix);
    const scale = new THREE.Vector3(); matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
    assert.deepEqual(scale.toArray(), [1, 1, 1]);
  }
});
test('raycasting uses the real refined surface and preserves an open doorway', () => {
  const group = new THREE.Group(), material = new THREE.MeshStandardMaterial();
  const parts = [-1, 1].map((s, i) => ({ id: 'jamb' + i, role: 'frame', size: [.1, 2.4, .15], center: [s, 1.2, 0], row: 6 }));
  addDetailedBoxInstances(group, parts, () => material, '18', 'test'); group.updateMatrixWorld(true);
  const cast = x => new THREE.Raycaster(new THREE.Vector3(x, 1.2, -1), new THREE.Vector3(0, 0, 1), 0, 2).intersectObjects(group.children);
  assert.equal(cast(0).length, 0); assert.ok(cast(1).length > 0);
});
