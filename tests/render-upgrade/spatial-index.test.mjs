import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../apps/campus/node_modules/three/build/three.module.js';
import { detailBox } from '../../apps/campus/src/render/detail-geometry.mjs';
import { installSpatialIndex } from '../../apps/campus/src/render/spatial-index.mjs';

test('BVH keeps actual high-detail intersections, transforms and triangle order', () => {
  const scene = new THREE.Scene(), geometry = detailBox([.4, 3, .4], 'column');
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial(), 2);
  mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 1.5, 0));
  mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(2, 1.5, 0));
  scene.add(mesh); scene.updateMatrixWorld(true);
  const rays = Array.from({ length: 31 }, (_, i) => new THREE.Raycaster(new THREE.Vector3(-.3 + i / 10, 1.2, -2), new THREE.Vector3(0, 0, 1), 0, 5));
  const hits = () => rays.map(r => r.intersectObjects(scene.children).map(h => [h.instanceId, h.distance, ...h.point.toArray()]));
  const before = hits(), positions = [...geometry.attributes.position.array], indices = geometry.index ? [...geometry.index.array] : null;
  const info = installSpatialIndex(scene);
  assert.equal(info.indexedGeometries, 1); assert.deepEqual(hits(), before);
  assert.deepEqual([...geometry.attributes.position.array], positions);
  if (indices) assert.deepEqual([...geometry.index.array], indices);
});
