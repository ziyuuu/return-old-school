import * as THREE from 'three';

/** C2 R3: authored planar forms, not decimation of the rejected round R2 model.
 * Metres, +Y up, +Z forward. The established rig applies its .89 body-width scale.
 * Each polygon carries one intentional normal; coplanar triangles never form noise.
 */
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function solid(vertices, faces) {
  const positions = [], normals = [], uv = [];
  for (const face of faces) {
    const points = face.map(i => new THREE.Vector3(...vertices[i]));
    // Newell normal is stable for deliberately broad, very slightly folded panels.
    const normal = new THREE.Vector3();
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length];
      normal.x += (a.y - b.y) * (a.z + b.z);
      normal.y += (a.z - b.z) * (a.x + b.x);
      normal.z += (a.x - b.x) * (a.y + b.y);
    });
    if (normal.lengthSq() < 1e-16) continue;
    normal.normalize();
    for (let k = 1; k < face.length - 1; k++) {
      for (const p of [points[0], points[k], points[k + 1]]) {
        positions.push(...p.toArray()); normals.push(...normal.toArray()); uv.push(p.x, p.y);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Closed polygonal loft; profile rows are [y, halfWidth, halfDepth, x, z]. */
function loft(rows, segments = 12, options = {}) {
  const vertices = [], faces = [], power = options.power ?? 1;
  rows.forEach(([y, rx, rz, cx = 0, cz = 0], i) => {
    for (let j = 0; j < segments; j++) {
      const t = j * TAU / segments, a = Math.sin(t), b = Math.cos(t);
      const x = cx + rx * Math.sign(a) * Math.pow(Math.abs(a), power);
      let z = cz + rz * Math.sign(b) * Math.pow(Math.abs(b), power);
      if (options.face && b > .45) z = cz + rz; // broad, flat facial plane
      let yy = y;
      if (options.folds) yy += (options.folds[i] ?? 0) * Math.sin(t + .65);
      if (options.shoulder && i === rows.length - 1) yy -= options.shoulder * .57 * (x - cx);
      vertices.push([x, yy, z]);
      if (i) {
        const a0 = (i - 1) * segments + j, a1 = (i - 1) * segments + (j + 1) % segments;
        const b0 = i * segments + j, b1 = i * segments + (j + 1) % segments;
        faces.push([a0, a1, b1, b0]);
      }
    }
  });
  faces.push(Array.from({ length: segments }, (_, j) => segments - 1 - j));
  faces.push(Array.from({ length: segments }, (_, j) => (rows.length - 1) * segments + j));
  return solid(vertices, faces);
}

/** Convex shallow appliqué, front towards +Z. No floating eyelashes or hair cards. */
function patch(points, depth = .001) {
  let front = points.map(p => [...p]);
  if (THREE.ShapeUtils.area(front.map(p => new THREE.Vector2(p[0], p[1]))) < 0) front.reverse();
  const n = front.length, vertices = [...front, ...front.map(([x, y, z]) => [x, y, z - depth])];
  // The Y outline is concave, so use an actual 2D triangulation for the front/back.
  const triangles = THREE.ShapeUtils.triangulateShape(front.map(p => new THREE.Vector2(p[0], p[1])), []);
  const faces = triangles.flatMap(([a, b, c]) => [[a, b, c], [c + n, b + n, a + n]]);
  for (let i = 0; i < n; i++) faces.push([i, i + n, (i + 1) % n + n, (i + 1) % n]);
  return solid(vertices, faces);
}

function ribbon(points, halfWidth = .001) {
  const v = [], f = [];
  points.forEach(([x, y, z]) => { v.push([x - halfWidth, y, z], [x + halfWidth, y, z]); });
  for (let i = 0; i < points.length - 1; i++) f.push([i * 2, i * 2 + 1, i * 2 + 3, i * 2 + 2]);
  return solid(v, f);
}

function paintBands(g, C) {
  const a = g.attributes.position, values = [];
  for (let i = 0; i < a.count; i += 3) {
    const y = (a.getY(i) + a.getY(i + 1) + a.getY(i + 2)) / 3;
    const color = new THREE.Color(y >= 1.224 || y < 1.153 ? C.blue : y >= 1.189 ? C.white : C.red);
    for (let j = 0; j < 3; j++) values.push(...color.toArray());
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(values, 3));
  return g;
}

/** Same actual parts are consumed by campus, studio and GLB export. */
export function createPlanarStudentParts(C) {
  const parts = [];
  const add = (name, geometry, material, color, bone = 1, weightFn = null) =>
    parts.push({ name, geometry, material, color, bone, weightFn });
  const torsoWeight = (_x, y) => { const t = smooth(.89, 1.075, y); return [0, 1 - t, 1, t]; };
  const torso = [
    [.852, .197, .109], [.881, .206, .118], [.925, .203, .124],
    [1.020, .207, .126], [1.153, .216, .128], [1.189, .219, .129], [1.224, .222, .129],
    [1.285, .218, .118], [1.327, .199, .098], [1.365, .139, .065], [1.382, .055, .046],
  ];
  add('blue-jacket-with-white-over-red-sewn-bands', paintBands(loft(torso, 12, { power: .65 }), C), 'cloth', null, 1, torsoWeight);
  add('angular-waist-hem', loft([[.841, .193, .106], [.856, .198, .111], [.873, .203, .115]], 12, { power: .65 }), 'cloth', C.blueFold, 0);
  add('planar-neck', loft([[1.367, .042, .036], [1.452, .039, .037]], 8), 'skin', C.skin, 2);
  add('white-back-collar', loft([[1.367, .066, .052], [1.403, .048, .041]], 10), 'cloth', C.white, 1);
  for (const s of [-1, 1]) {
    add('white-folded-collar-' + s, patch([
      [s * .008, 1.383, .054], [s * .043, 1.408, .040], [s * .101, 1.359, .080],
      [s * .070, 1.325, .120], [s * .021, 1.362, .080],
    ], .003), 'cloth', C.white, 1);
    add('diagonal-pocket-' + s, patch([
      [s * .149, .943, .099], [s * .161, .943, .094],
      [s * .171, 1.010, .091], [s * .163, 1.014, .098],
    ]), 'cloth', C.blueFold, 1, torsoWeight);
  }
  add('quiet-zipper-seam', ribbon([[0, .877, .121], [0, .925, .128], [0, 1.224, .132], [0, 1.285, .121], [0, 1.375, .063]], .0008), 'detail', C.zip ?? '#98a4ab', 1, torsoWeight);
  add('small-red-zipper-pull', patch([[-.004, 1.324, .104], [.004, 1.324, .104], [.004, 1.309, .111], [-.004, 1.309, .111]], .002), 'detail', C.red, 1);
  const Y = [[-.016, .040], [-.006, .040], [-.001, .026], [.006, .040], [.016, .040], [.005, .019], [.005, 0], [-.005, 0], [-.005, .019]];
  const L = [[.009, .027], [.018, .027], [.018, .006], [.032, .006], [.032, 0], [.009, 0]];
  for (const [name, letter] of [['Y', Y], ['L', L]]) {
    add('YL-left-chest-' + name, patch(letter.map(([x, y]) => [x + .111, y + 1.252, .119 - y * .13]), .0008), 'cloth', C.white, 1);
  }

  for (const s of [1, -1]) {
    const upper = s > 0 ? 3 : 6, elbow = upper + 1, hand = upper + 2;
    const sleeve = [
      [.789, .040, .038, s * .300, .012], [.818, .055, .049, s * .300, .008],
      [.878, .064, .058, s * .296, .005], [1.001, .071, .064, s * .282, 0],
      [1.039, .075, .068, s * .278, 0], [1.088, .077, .071, s * .270, 0],
      [1.153, .080, .073, s * .260, 0], [1.189, .081, .074, s * .255, 0],
      [1.224, .082, .075, s * .250, 0], [1.275, .079, .072, s * .242, 0],
      [1.324, .077, .071, s * .207, 0],
    ];
    const armWeight = (x, y) => {
      if (y > 1.29) { const t = smooth(1.29, 1.37, y) * (1 - smooth(.13, .27, Math.abs(x))); return [upper, 1 - t, 1, t]; }
      const t = smooth(1.001, 1.088, y); return [elbow, 1 - t, upper, t];
    };
    add('continuous-sleeve-' + s, paintBands(loft(sleeve, 10, { shoulder: s }), C), 'cloth', null, upper, armWeight);
    add('simple-cuff-' + s, loft([[.775, .039, .038, s * .3, .012], [.796, .043, .041, s * .3, .012]], 8), 'cloth', C.blueFold, elbow);
    add('planar-palm-' + s, loft([[.708, .026, .013, s * .302, .025], [.744, .032, .018, s * .301, .016], [.780, .027, .015, s * .30, .012]], 6, { power: .65 }), 'skin', C.skin, hand);
    for (let f = 0; f < 4; f++) {
      const x = s * (.281 + f * .014), length = [.037, .047, .044, .034][f];
      add('simplified-finger-' + s + '-' + f, loft([
        [.720 - length, .0045, .005, x, .031], [.723 - length, .006, .006, x, .032],
        [.703, .006, .007, x, .030], [.728, .0068, .008, x, .022],
      ].sort((a, b) => a[0] - b[0]), 5), 'skin', C.skin, hand);
    }
    add('planar-thumb-' + s, loft([[.716, .006, .007, s * .267, .039], [.738, .009, .009, s * .267, .031], [.757, .010, .010, s * .280, .020]], 5), 'skin', C.skin, hand);
    const hip = s > 0 ? 9 : 12, knee = hip + 1, ankle = hip + 2;
    const trouser = [
      [.095, .077, .074, s * .106, .023], [.130, .092, .083, s * .106, .004],
      [.184, .083, .076, s * .112, -.005], [.343, .084, .078, s * .106, -.002],
      [.442, .088, .083, s * .105, .002], [.485, .090, .085, s * .104, .003],
      [.542, .094, .089, s * .103, .003], [.718, .107, .102, s * .107, 0],
      [.826, .114, .104, s * .100, 0], [.915, .102, .089, s * .096, 0],
    ];
    add('continuous-loose-trouser-' + s, loft(trouser, 10, { power: .76, folds: [0, .012, -.016, .006, -.017, .011, .012, -.008, 0, 0] }), 'cloth', C.blue, hip,
      (_x, y) => { const t = smooth(.43, .54, y); return [knee, 1 - t, hip, t]; });
    // Proper closed shoe lasts: a flat grounded sole and a single sloping upper.
    const outline = [[-.047, -.080], [.047, -.080], [.069, -.053], [.073, .132], [.049, .187], [-.049, .187], [-.073, .132], [-.069, -.053]];
    const shoeMesh = (sole = false) => {
      const v = [], f = [];
      for (let level = 0; level < 2; level++) for (const [x, z] of outline) {
        let y, xx = x, zz = z;
        if (sole) { y = level ? .034 : .005; }
        else { y = level ? .090 - .025 * clamp((z - .025) / .16) : .033; if (level) { xx *= .79; zz = (z - .012) * .88 + .012; } }
        v.push([s * .105 + xx, y, zz]);
      }
      f.push([7, 6, 5, 4, 3, 2, 1, 0]); f.push([8, 9, 10, 11, 12, 13, 14, 15]);
      for (let i = 0; i < 8; i++) f.push([i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8]);
      // Outline above is CCW in XZ, therefore reverse for +Y outward top.
      return solid(v, f.map(a => [...a].reverse()));
    };
    add('grounded-flat-sole-' + s, shoeMesh(true), 'shoe', C.sole, ankle);
    add('angular-sneaker-upper-' + s, shoeMesh(false), 'shoe', C.white, ankle);
    add('simple-shoe-instep-' + s, solid([
      [s * .105 - .030, .091, -.015], [s * .105 + .030, .091, -.015],
      [s * .105 + .026, .084, .083], [s * .105 - .026, .084, .083],
    ], [[0, 3, 2, 1]]), 'shoe', C.shoe, ankle);
  }

  const head = [
    [1.444, .025, .044, 0, .010], [1.458, .052, .059, 0, .005], [1.487, .080, .076],
    [1.525, .094, .084], [1.563, .098, .086], [1.604, .098, .087],
    [1.646, .085, .078, 0, -.006], [1.681, .047, .047, 0, -.008], [1.693, .009, .013, 0, -.008],
  ];
  add('planar-head-with-tapered-jaw', loft(head, 12, { face: true }), 'skin', C.skin, 2);
  for (const s of [-1, 1]) {
    add('planar-ear-' + s, solid([
      [s * .094, 1.560, .006], [s * .113, 1.553, .002], [s * .116, 1.527, .006],
      [s * .103, 1.515, .012], [s * .094, 1.526, .019], [s * .107, 1.537, .020],
      [s * .103, 1.537, -.012],
    ], (s > 0 ? [[0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 4, 5], [4, 0, 5], [1, 0, 6], [2, 1, 6], [3, 2, 6], [4, 3, 6], [0, 4, 6]] : [[0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 4, 5], [4, 0, 5], [1, 0, 6], [2, 1, 6], [3, 2, 6], [4, 3, 6], [0, 4, 6]].map(a => [...a].reverse()))), 'skin', C.skin, 2);
    const x = s * .042;
    add('small-rectangular-eye-' + s, patch([[x - .0057, 1.561, .0878], [x + .0057, 1.561, .0878], [x + .0057, 1.544, .0873], [x - .0057, 1.544, .0873]], .0008), 'detail', C.eye, 2);
    add('straight-eyebrow-' + s, patch([[x - .016, 1.582, .089], [x + .016, 1.580, .089], [x + .016, 1.577, .089], [x - .016, 1.579, .089]], .0006), 'hair', C.hair, 2);
  }
  add('small-wedge-nose', solid([
    [-.005, 1.548, .087], [.005, 1.548, .087], [-.009, 1.516, .084], [.009, 1.516, .084], [0, 1.520, .108],
  ], [[0, 2, 4], [0, 4, 1], [1, 4, 3], [2, 3, 4]]), 'skin', C.skin, 2);
  add('quiet-mouth-mark', patch([[-.011, 1.4885, .0785], [.011, 1.4885, .0785], [.011, 1.4875, .0785], [-.011, 1.4875, .0785]], .0005), 'detail', C.lip, 2);

  // One joined angular cap with integrated fringe. No rounded tubes or glossy locks.
  const vertices = [], faces = [], n = 24;
  for (let level = 0; level < 4; level++) {
    for (let j = 0; j < n; j++) {
      const theta = TAU * j / n, co = Math.cos(theta), si = Math.sin(theta);
      let y, rx, rz;
      if (level === 0) {
        const front = co > .24;
        y = front ? 1.589 + [.007, -.007, .010, -.011, .005, -.004][j % 6] : 1.552 + .017 * co;
        rx = .103; rz = .100;
      } else if (level === 1) { y = 1.641 + .009 * Math.sin(theta * 2 + .4); rx = .111; rz = .104; }
      else if (level === 2) { y = 1.696 + .007 * Math.cos(theta + .6); rx = .073; rz = .071; }
      else { y = 1.716 + .003 * Math.sin(theta); rx = .016; rz = .015; }
      // The face is planar: the fringe must also cover its temple corners.
      // An elliptical fringe would cut into the head and leave a central black V.
      const frontZ = level < 2 && co > .24 ? .097 + .008 * co : -.008 + rz * co;
      vertices.push([rx * si + (level > 1 ? -.008 : 0), y, frontZ]);
      if (level) {
        const a = (level - 1) * n + j, b = (level - 1) * n + (j + 1) % n;
        const c = level * n + (j + 1) % n, d = level * n + j;
        // Preserve broad side panels, split a few crown planes for a natural part.
        if (level === 2 && j % 3 === 0) faces.push([a, b, d], [b, c, d]); else faces.push([a, b, c, d]);
      }
    }
  }
  faces.push(Array.from({ length: n }, (_, j) => 3 * n + j));
  faces.push(Array.from({ length: n }, (_, j) => n - j - 1));
  add('connected-angular-hair-and-fringe', solid(vertices, faces), 'hair', C.hair, 2);
  return parts;
}
