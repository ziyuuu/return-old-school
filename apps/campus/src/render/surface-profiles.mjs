/** H surface choices within the original campus palette. Relief affects shading,
 * not the accepted structural or walking geometry.
 */
/** @type {Record<string, {label: string, feature: string, roughness: number,
 * metalness: number, bump: number, metres: number, lift: number, saturation: number,
 * sheen?: number, nativeUV?: boolean, clearcoat?: number, reflection?: number, opacity?: number}>} */
export const surfaceProfiles = {
  plaster: { label: '粉刷墙', feature: '细砂、柔和漫反射', roughness: .91, metalness: 0, bump: .004, metres: 1.2, lift: .60, saturation: .75 },
  concrete: { label: '混凝土', feature: '矿物骨料、浅孔隙', roughness: .83, metalness: 0, bump: .012, metres: 1.6, lift: .18, saturation: .24 },
  paving: { label: '石质铺地', feature: '错缝、细窄灰缝、块面色差', roughness: .78, metalness: 0, bump: .008, metres: 2.4, lift: .23, saturation: .40 },
  road: { label: '道路面层', feature: '细骨料、连续灰色路面', roughness: .94, metalness: 0, bump: .005, metres: 1.8, lift: .14, saturation: .28 },
  turf: { label: '草地', feature: '细叶颗粒、疏密变化', roughness: 1, metalness: 0, bump: .006, metres: 1.2, lift: .05, saturation: .94 },
  foliage: { label: '叶片', feature: '叶脉、蜡质柔光', roughness: .74, metalness: 0, bump: .001, metres: .3, lift: .04, saturation: .96, sheen: .12, nativeUV: true },
  soil: { label: '种植土', feature: '深暖褐、松散土粒', roughness: .98, metalness: 0, bump: .021, metres: .5, lift: -.15, saturation: .65 },
  bark: { label: '树皮', feature: '纵向纤维与浅裂纹', roughness: .95, metalness: 0, bump: .018, metres: .7, lift: -.06, saturation: .60 },
  stone: { label: '石材', feature: '细晶粒与矿物色差', roughness: .72, metalness: 0, bump: .014, metres: .9, lift: .30, saturation: .50 },
  sand: { label: '细砂', feature: '暖砂色、细颗粒', roughness: .97, metalness: 0, bump: .009, metres: .55, lift: .34, saturation: .72 },
  rubber: { label: '运动面层', feature: '细橡胶颗粒、低光泽', roughness: .86, metalness: 0, bump: .004, metres: .5, lift: .10, saturation: .94 },
  paint: { label: '色漆', feature: '连续色面、柔和漆膜高光', roughness: .44, metalness: 0, bump: .0004, metres: .4, lift: .13, saturation: .94, clearcoat: .25 },
  metal: { label: '金属', feature: '细拉丝、集中反射', roughness: .26, metalness: .86, bump: .0003, metres: .25, lift: .20, saturation: .15, reflection: 1.05 },
  'painted-metal': { label: '涂装金属', feature: '漆膜与金属边缘高光', roughness: .33, metalness: .28, bump: .0003, metres: .3, lift: .14, saturation: .70, clearcoat: .45, reflection: .85 },
  glass: { label: '玻璃', feature: '冷青玻璃、场景反射', roughness: .09, metalness: 0, bump: 0, metres: 1, lift: -.25, saturation: .82, clearcoat: .7, reflection: .95, opacity: .88 },
  water: { label: '水面', feature: '细波纹、天空与建筑倒影', roughness: .12, metalness: 0, bump: .026, metres: 3.2, lift: -.36, saturation: .90, clearcoat: .85, reflection: 1.1, opacity: .96 },
  fabric: { label: '织物', feature: '经纬细纹、柔和绒光', roughness: .97, metalness: 0, bump: .0014, metres: .22, lift: .07, saturation: .94, sheen: .5 },
};

export const defaultFinishes = [
  'plaster', 'turf', 'paving', 'rubber', 'glass', 'painted-metal', 'concrete', 'stone',
  'paint', 'paint', 'paint', 'paint', 'paint', 'foliage', 'plaster', 'metal', 'glass',
  'paint', 'fabric', 'paint', 'paint', 'paint',
];

/** Semantics take precedence over a palette row shared by unrelated materials. */
export function resolveFinish(row, role = '', shape = '') {
  // B05 exact semantic additions; inherited role resolution below stays unchanged.
  if (['boulder','stone-plaque','stone-balustrade'].includes(role)) return 'stone';
  if (['metal-roof','medallion'].includes(role)) return 'painted-metal';
  if (role === 'line-paint') return 'paint';
  if (shape === 'leaf' || /foliage|ivy|crown/.test(role)) return 'foliage';
  if (/tree-trunk|bark/.test(role)) return 'bark';
  if (/planter-soil|planting|^soil$/.test(role)) return 'soil';
  if (/grass|turf/.test(role)) return 'turf';
  if (/sand/.test(role)) return 'sand';
  if (/basin|water|pool-surface/.test(role)) return 'water';
  if (/^(glazing|window|glass|window-pane)$/.test(role)) return 'glass';
  if (/cloth|fabric|flag-surface/.test(role)) return 'fabric';
  if (/frame|rail|grille|mullion|louvre|roller|flagpole|ring|emblem/.test(role)) {
    return [6, 15, 16].includes(row) ? 'metal' : 'painted-metal';
  }
  if (/open-door|door-leaf|notice|dado/.test(role)) return 'paint';
  if (/road/.test(role)) return 'road';
  if (/paving|forecourt-surface/.test(role)) return 'paving';
  if (/court-surface|track-surface/.test(role)) return 'rubber';
  if (/floor|slab|step|landing|foundation|podium|column|post|beam|support|cornice|sill|spandrel|canopy|parapet|seat-edge|^roof$/.test(role)) return 'concrete';
  if (/wall/.test(role) && row === 13) return 'paint';
  return defaultFinishes[row] ?? 'plaster';
}

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => x * x * (3 - 2 * x);
const mod = (x, n) => ((x % n) + n) % n;
function hash(x, y, seed = 0) {
  let h = Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263) ^ Math.imul(seed + 1, 1274126177);
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967295;
}
/** Periodic value noise prevents seams in locally generated repeating maps. */
function noise(u, v, cells, seed) {
  const x = u * cells, y = v * cells, ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
  const a = hash(mod(ix, cells), mod(iy, cells), seed), b = hash(mod(ix + 1, cells), mod(iy, cells), seed);
  const c = hash(mod(ix, cells), mod(iy + 1, cells), seed), d = hash(mod(ix + 1, cells), mod(iy + 1, cells), seed);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

/** Linear albedo multipliers plus packed height (R) and roughness (G).
 * Families have different spatial structures, not just different random seeds.
 */
export function surfacePixels(finish, n = 256) {
  if (!surfaceProfiles[finish]) throw new Error('Unknown surface: ' + finish);
  const colour = new Uint8Array(n * n * 4), detail = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n, grain = hash(x, y, 31), fine = noise(u, v, 64, 17), coarse = noise(u, v, 8, 3);
    let albedo = 1, height = .5, roughness = 1;
    switch (finish) {
      case 'plaster':
        albedo = .958 + coarse * .027 + grain * .015;
        height = .45 + grain * .08 + noise(u, v, 16, 7) * .07;
        roughness = .95 + fine * .05; break;
      case 'concrete': {
        const pore = grain > .977 ? .22 : 0;
        albedo = .86 + coarse * .095 + fine * .035 - pore * .22;
        height = .38 + fine * .18 + grain * .06 - pore;
        roughness = .83 + coarse * .13; break;
      }
      case 'paving': {
        const row = Math.floor(v * 8), a = u * 4 + row % 2 * .5, col = Math.floor(a), fx = a - col, fy = v * 8 - row;
        const edge = Math.min(fx, 1 - fx, fy * .5, (1 - fy) * .5), grout = 1 - smooth(clamp(edge / .019));
        const tile = hash(col % 4, row, 91);
        albedo = (.87 + tile * .095 + fine * .018) * (1 - grout * .17);
        height = .65 - grout * .40 + fine * .03;
        roughness = .79 + tile * .12 + grout * .09; break;
      }
      case 'road':
        albedo = .925 + coarse * .038 + fine * .025; height = .42 + grain * .16 + fine * .05;
        roughness = .93 + coarse * .06; break;
      case 'turf': {
        const blades = Math.pow(Math.abs(Math.sin(u * Math.PI * 192 + fine * 3)), 10);
        albedo = .82 + coarse * .11 + grain * .045 + blades * .02; height = .35 + fine * .19 + blades * .12;
        roughness = .96 + grain * .04; break;
      }
      case 'foliage': {
        const vein = Math.exp(-Math.abs(u - .5) * 120);
        const branches = Math.exp(-Math.abs(Math.sin((v + Math.abs(u - .5) * .75) * Math.PI * 12)) * 24) * (1 - Math.abs(u - .5) * 1.8);
        albedo = .82 + coarse * .10 + fine * .035 + vein * .07 + branches * .035;
        height = .38 + vein * .27 + branches * .10 + fine * .045; roughness = .74 + coarse * .20; break;
      }
      case 'soil':
        albedo = .76 + coarse * .14 + grain * .09; height = .25 + noise(u, v, 32, 5) * .40 + grain * .08;
        roughness = .94 + grain * .06; break;
      case 'bark': {
        const ridge = .5 + .5 * Math.sin(u * Math.PI * 24 + noise(u, v, 4, 5) * 2.2);
        albedo = .71 + ridge * .17 + coarse * .085 + grain * .025; height = .22 + ridge * .40 + fine * .09;
        roughness = .86 + coarse * .13; break;
      }
      case 'stone': {
        const fleck = grain > .97 ? .07 : grain < .03 ? -.05 : 0;
        albedo = .85 + noise(u, v, 16, 11) * .10 + fleck; height = .40 + fine * .15 + fleck;
        roughness = .72 + fine * .22; break;
      }
      case 'sand':
        albedo = .86 + coarse * .08 + grain * .06; height = .35 + fine * .16 + grain * .15;
        roughness = .91 + grain * .09; break;
      case 'rubber':
        albedo = .93 + grain * .05 + coarse * .02; height = .35 + grain * .26;
        roughness = .90 + grain * .10; break;
      case 'paint':
        albedo = .984 + coarse * .016; height = .47 + fine * .045;
        roughness = .86 + coarse * .13; break;
      case 'metal': {
        const brush = hash(x, 0, 82);
        albedo = .975 + brush * .025; height = .47 + brush * .055;
        roughness = .69 + brush * .24 + fine * .06; break;
      }
      case 'painted-metal':
        albedo = .985 + coarse * .015; height = .47 + grain * .045;
        roughness = .82 + coarse * .16; break;
      case 'glass':
        albedo = .994 + coarse * .006; height = .5;
        roughness = .80 + noise(u, v, 4, 9) * .17; break;
      case 'water': {
        const wave = Math.sin(2 * Math.PI * (u * 5 + v * 3) + Math.sin(v * 2 * Math.PI) * .65);
        const ripple = Math.sin(2 * Math.PI * (u * 11 - v * 8)) * .18;
        albedo = .95 + wave * .012 + coarse * .025; height = .5 + wave * .19 + ripple;
        roughness = .77 + coarse * .15; break;
      }
      case 'fabric': {
        const warp = Math.cos(u * Math.PI * 128), weft = Math.cos(v * Math.PI * 128);
        albedo = .94 + (warp * weft + 1) * .023; height = .5 + warp * weft * .21;
        roughness = .94 + (warp + weft + 2) * .015; break;
      }
    }
    const i = (y * n + x) * 4, a = Math.round(clamp(albedo) * 255);
    colour.set([a, a, a, 255], i);
    detail.set([Math.round(clamp(height) * 255), Math.round(clamp(roughness) * 255), 0, 255], i);
  }
  return { colour, detail, size: n };
}
