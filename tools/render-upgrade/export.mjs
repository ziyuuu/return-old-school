import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from '../../apps/campus/node_modules/esbuild/lib/main.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = process.argv.includes('--baseline');
// Keep the historical comparison stable after this upgrade is committed.
const baselineCommit = '6e8238548cf9a2afd3d91c263b4ee9a47ed9f264';
const output = path.join(root, 'artifacts/render-upgrade');
await fs.mkdir(output, { recursive: true });
const original = file => execFileSync('git', ['show', baselineCommit + ':' + file], { cwd: root, encoding: 'utf8', windowsHide: true });
const result = await build({
  entryPoints: [path.join(root, 'apps/campus/src/main.ts')], bundle: true, format: 'iife', target: 'es2022',
  minify: true, write: false, metafile: true, outfile: 'bundle.js', legalComments: 'inline',
  plugins: baseline ? [{ name: 'original-source', setup(b) {
    b.onLoad({ filter: /\.(ts|mjs|json|css)$/ }, args => {
      const relative = path.relative(root, args.path).replaceAll('\\', '/');
      if (!relative.startsWith('apps/campus/src/') && !relative.startsWith('data/')) return;
      let contents = original(relative);
      if (relative === 'apps/campus/src/main.ts') contents += "\nif(new URLSearchParams(location.search).get('diagnostics')==='1')Object.assign(window,{__YALI_RENDER_RAW__:{scene,renderer,camera:()=>active}});";
      return { contents, loader: path.extname(args.path).slice(1) === 'mjs' ? 'js' : path.extname(args.path).slice(1) };
    });
  } }] : [],
});
const js = result.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = result.outputFiles.find(f => f.path.endsWith('.css')).text;
const template = baseline ? original('apps/campus/index.html') : await fs.readFile(path.join(root, 'apps/campus/index.html'), 'utf8');
const html = template.replace('</head>', `<style>${css}</style></head>`).replace('<script type="module" src="/src/main.ts"></script>', () => `<script>${js}</script>`);
const name = baseline ? 'Yali_Render_Before.html' : 'Yali_Material_Detail_R2_Viewer.html';
await fs.writeFile(path.join(output, name), html);
const sha = createHash('sha256').update(html).digest('hex');
await fs.writeFile(path.join(output, name + '.json'), JSON.stringify({ file: name, sha256: sha, bytes: Buffer.byteLength(html),
  generatedAt: new Date().toISOString(), baseline, baseCommit: baseline ? baselineCommit : execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  source: baseline ? 'base commit' : 'current working tree including this rendering upgrade' }, null, 2));
const licenses = await Promise.all(['three/LICENSE', 'three-mesh-bvh/LICENSE'].map(async f => f + '\n' + await fs.readFile(path.join(root, 'apps/campus/node_modules', f), 'utf8')));
await fs.writeFile(path.join(output, 'THIRD_PARTY_NOTICES.txt'), licenses.join('\n\n'));
console.log(name, Buffer.byteLength(html), 'bytes', sha);
