import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast, SAH } from 'three-mesh-bvh';

/** Index the actual high-detail triangles; preserve index order for diagnostics.
 * InstancedMesh's internal Mesh raycast also uses this acceleration.
 */
export function installSpatialIndex(scene) {
  const started = performance.now(), geometries = new Set();
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
  scene.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry;
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    if (geometries.has(geometry) || (geometry.index?.count ?? geometry.attributes.position.count) < 384) return;
    if (!geometry.boundsTree) {
      geometry.boundsTree = new MeshBVH(geometry, { indirect: true, strategy: SAH, targetLeafSize: 12 });
      geometry.addEventListener('dispose', () => { geometry.boundsTree = undefined; });
    }
    geometries.add(geometry);
  });
  return { indexedGeometries: geometries.size, buildMs: Math.round(performance.now() - started), method: 'BVH over rendered triangles' };
}
