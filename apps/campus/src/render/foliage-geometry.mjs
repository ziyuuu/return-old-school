import * as THREE from 'three';

/** Thin lobed ivy within the previous leaf envelope. Crown clusters retain the
 * established simplified volumes. Leaf veins follow native UV coordinates.
 */
export function foliageGeometry(part) {
  if (!part.id.includes('ivy-')) {
    const geometry = new THREE.IcosahedronGeometry(1, 4);
    geometry.scale(...part.size); return geometry;
  }
  const control = [[0, 1], [.30, .44], [.78, .61], [.59, .08], [1, -.12],
    [.46, -.49], [.15, -.78], [0, -1], [-.15, -.78], [-.46, -.49],
    [-1, -.12], [-.59, .08], [-.78, .61], [-.30, .44]];
  const curve = new THREE.CatmullRomCurve3(control.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  const segments = 60, rings = 4, outline = Array.from({ length: segments }, (_, i) => curve.getPoint(i / segments));
  const sx = Math.max(...outline.map(p => Math.abs(p.x))), sy = Math.max(...outline.map(p => Math.abs(p.y)));
  outline.forEach(p => { p.x /= sx; p.y /= sy; });
  const positions = [], uv = [], indices = [];
  for (const side of [-1, 1]) {
    const start = positions.length / 3;
    positions.push(0, 0, (-.18 + side * .025) * part.size[2]); uv.push(.5, .5);
    for (let ring = 1; ring <= rings; ring++) {
      const r = ring / rings;
      for (let i = 0; i < segments; i++) {
        const x = outline[i].x * r, y = outline[i].y * r;
        const z = -.18 * (1 - r * r) + .06 * Math.sin(i / segments * Math.PI * 2) * r * (1 - r) + side * .025 * (1 - r);
        positions.push(x * part.size[0], y * part.size[1], z * part.size[2]);
        uv.push(x * .5 + .5, y * .5 + .5);
      }
    }
    const triangle = (a, b, c) => side === -1 ? indices.push(start + a, start + b, start + c) : indices.push(start + a, start + c, start + b);
    for (let i = 0; i < segments; i++) triangle(0, 1 + i, 1 + (i + 1) % segments);
    for (let ring = 1; ring < rings; ring++) for (let i = 0; i < segments; i++) {
      const a = 1 + (ring - 1) * segments + i, b = 1 + (ring - 1) * segments + (i + 1) % segments;
      triangle(a, a + segments, b); triangle(b, a + segments, b + segments);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData.detail = { kind: 'lobed-ivy-leaf', segments, rings, evidence: 'H leaf morphology' };
  return geometry;
}
