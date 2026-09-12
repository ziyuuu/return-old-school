import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../../', import.meta.url));
const phase = process.argv[2] || 'after';
const visualOnly = process.argv.includes('--visual-only');
const viewerURL = process.env.VIEWER_URL || 'http://127.0.0.1:5173/';
const selectedViews = process.env.CAPTURE_VIEWS?.split(',').map(v => v.trim()).filter(Boolean);
const views = selectedViews?.length ? selectedViews : ['overview', 'r3-overview', 'b02-photo-front', 'b03-photo-library', 'b03-garden', 'b03-canteen'];
const forceLogDepth = process.env.CAPTURE_FORCE_LOG_DEPTH === '1';
const out = path.join(root, 'qa/render-upgrade', phase);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' }),
  args: ['--no-first-run', '--disable-background-timer-throttling'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 840 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
const report = { phase, validation: visualOnly ? 'visual-only' : 'full', generatedAt: new Date().toISOString(), browser: await browser.version(), errors, requestedViews: views, forceLogDepth, views: [], source: { url: viewerURL } };
if (viewerURL.startsWith('file:')) report.source.sha256 = createHash('sha256').update(await fs.readFile(new URL(viewerURL))).digest('hex');
try {
  if (forceLogDepth) await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function(name) { return name === 'EXT_clip_control' ? null : original.call(this, name); };
  });
  await page.goto(viewerURL + '?clean=1&diagnostics=1', { timeout: 120000 });
  await page.waitForFunction(() => window.__YALI_RENDER_RAW__ && window.__YALI_B03__?.ready);
  await page.waitForTimeout(1200);
  report.scene = await page.evaluate(() => {
    const { scene, renderer } = window.__YALI_RENDER_RAW__;
    const rows = [], geometries = new Set(), materials = new Set(), finishes = new Set(), samples = new Map();
    let bytes = 0;
    scene.traverseVisible(o => {
      if (!o.isMesh) return;
      const g = o.geometry, count = o.isInstancedMesh ? o.count : 1;
      rows.push({ name: o.name, role: o.userData.role, type: g.type, triangles: (g.index?.count ?? g.attributes.position.count) / 3 * count, instances: count });
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        materials.add(m.uuid);
        if (m.userData.finish) {
          finishes.add(m.userData.finish);
          const key = m.userData.finish + ':' + m.userData.paletteRow;
          if (!samples.has(key)) samples.set(key, { finish: m.userData.finish, row: m.userData.paletteRow, colour: '#' + m.color.getHexString(),
            roughness: m.roughness, metalness: m.metalness, bump: m.bumpScale, clearcoat: m.clearcoat, opacity: m.opacity,
            reflectionProbe: m.userData.reflectionProbe, feature: m.userData.feature });
        }
      }
      if (!geometries.has(g.uuid)) {
        geometries.add(g.uuid);
        bytes += Object.values(g.attributes).reduce((n, a) => n + a.array.byteLength, 0) + (g.index?.array.byteLength || 0);
      }
    });
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { meshes: rows.length, triangles: rows.reduce((n, r) => n + r.triangles, 0), geometryBytes: bytes,
      geometries: geometries.size, materials: materials.size, finishes: [...finishes].sort(), materialSamples: [...samples.values()], largest: rows.sort((a, b) => b.triangles - a.triangles).slice(0, 20),
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
  });
  console.log('SCENE', JSON.stringify({ triangles: report.scene.triangles, meshes: report.scene.meshes, geometryBytes: report.scene.geometryBytes,
    materials: report.scene.materials, finishes: report.scene.finishes, gpu: report.scene.gpu }));
  for (const view of views) {
    await page.evaluate(v => window.__YALI_B03__.setView(v), view);
    await page.waitForTimeout(650);
    const measurement = await page.evaluate(async () => {
      const samples = [];
      let last = await new Promise(requestAnimationFrame);
      for (let i = 0; i < 60; i++) { const t = await new Promise(requestAnimationFrame); samples.push(t - last); last = t; }
      samples.sort((a, b) => a - b);
      return { ...window.__YALI_B03__.getState(), frameMsMedian: samples[30], frameMsP95: samples[57],
        lighting: window.__YALI_RENDER__?.state(), programs: window.__YALI_RENDER_RAW__.renderer.info.programs.length };
    });
    await page.screenshot({ path: path.join(out, view + '.png'), timeout: 120000 });
    report.views.push({ requestedView: view, file: view + '.png', ...measurement });
    console.log('VIEW', view, JSON.stringify(measurement));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.body.classList.remove('clean'); window.__YALI_B03__.setView('b03-library'); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'mobile.png') });
  report.mobile = await page.evaluate(() => ({ ...window.__YALI_B03__.getState(), noOverflow: document.documentElement.scrollWidth <= 390 }));
  if (phase !== 'before' && !visualOnly) {
    const accessStarted = Date.now();
    report.access = await page.evaluate(() => ({ b02: window.__YALI_B02__.checkAccess(), b03: window.__YALI_B03__.checkAccess(),
      flags: window.__YALI_B01__.countFlags(), roots: window.__YALI_M11A__.getRoots() }));
    report.accessDurationMs = Date.now() - accessStarted;
    report.invariants = await page.evaluate(() => {
      const a=window.__YALI_R3__, roots=window.__YALI_M11A__.getRoots();
      return {axis:[roots['08'][0],roots['15'][0],roots['18'][0]],mainFloor:roots['15'][1],
        shutters:a.model.access.every((d,i)=>{const s=i?1:-1,[x,y,z]=d.door;return a.probe([x+s*.5,y+1.5,z],[x-s*.5,y+1.5,z]).length===0;})};
    });
    console.log('ACCESS', JSON.stringify({ b02: report.access.b02.routes.map(r => [r.id, r.failures]), b03: report.access.b03.passed }));
  }
  report.passed = errors.length === 0 && report.views.length === views.length && report.views.every(v => v.view === v.requestedView && !v.contextLost && !v.glError && v.triangles > 0) && report.mobile.noOverflow &&
    (phase==='before'||visualOnly||report.access.b03.passed&&report.access.b02.routes.every(r=>r.failures===0)&&report.access.b02.doors.every(d=>d.bad.length===0)&&
      report.access.b02.sharedWallBlocked&&report.access.flags===3&&report.invariants.shutters&&report.invariants.mainFloor===3.45&&report.invariants.axis.every(x=>x===73));
} finally {
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
if (!report.passed) throw new Error('Render capture failed; inspect report.json.');
