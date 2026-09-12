import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Small, physically sized edge radii. Wall partitions and walking surfaces stay
 * exact: rounding their artificial subdivisions would invent seams or step gaps.
 */
export function bevelProfile(size, role) {
  const metal = /frame|rail|louvre|mullion/.test(role);
  const concrete = /column|post|cornice|sill|beam|canopy|porch-roof|porch-trim|seat-edge|parapet|^roof$/.test(role);
  const joinery = /door-leaf|door-frame|open-door|trim/.test(role);
  if (!metal && !concrete && !joinery) return null;
  const shortest = Math.min(...size);
  const radius = Math.min(metal ? .008 : joinery ? .006 : .035, shortest * (metal ? .14 : .08));
  if (radius < .0002) return null;
  return { radius, segments: metal || joinery ? 3 : 4 };
}

export function detailBox(size, role) {
  const profile = bevelProfile(size, role);
  const geometry = profile ? new RoundedBoxGeometry(...size, profile.segments, profile.radius) : new THREE.BoxGeometry(...size);
  geometry.userData.detail = profile ? { kind: 'physical-bevel', ...profile, envelope: [...size] } : { kind: 'exact-box' };
  return geometry;
}

/** Dimension-aware instances keep the bevel radius in metres. Scaling a rounded
 * unit cube would stretch its corners on long mullions and give the wrong shape.
 * The same CPU geometry is used for rendering, picking, shadows and access rays.
 */
export function addDetailedBoxInstances(parent, parts, materialForPart, owner, prefix) {
  const buckets = new Map();
  for (const part of parts) {
    const profile = bevelProfile(part.size, part.role);
    const key = part.role + '|' + part.row + (profile ? '|' + part.size.join(',') : '');
    const list = buckets.get(key) ?? []; list.push(part); buckets.set(key, list);
  }
  const matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion(), unit = new THREE.Vector3(1, 1, 1);
  let serial = 0;
  for (const list of buckets.values()) {
    const first = list[0], profile = bevelProfile(first.size, first.role);
    const geometry = profile ? detailBox(first.size, first.role) : new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.InstancedMesh(geometry, materialForPart(first), list.length);
    list.forEach((p, i) => { matrix.compose(new THREE.Vector3(...p.center), rotation, profile ? unit : new THREE.Vector3(...p.size)); mesh.setMatrixAt(i, matrix); });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    mesh.name = `${prefix}-${owner}-${first.role}-detail-${serial++}`;
    mesh.userData = { facility: owner, role: first.role, batch: prefix, partIds: list.map(p => p.id), geometryDetail: profile ? 'physical-bevel' : 'exact-box' };
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
  }
}
