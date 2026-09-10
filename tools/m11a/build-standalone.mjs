import {build} from '../../apps/campus/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=path.join(root,'artifacts/m11a');fs.mkdirSync(out,{recursive:true});
const result=await build({entryPoints:[path.join(root,'apps/campus/src/main.ts')],bundle:true,format:'iife',target:'es2022',minify:true,write:false,outfile:'bundle.js',legalComments:'inline'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');const css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
let html=fs.readFileSync(path.join(root,'apps/campus/index.html'),'utf8').replace('</head>',()=>`<style>${css}</style></head>`).replace('<script type="module" src="/src/main.ts"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(path.join(out,'Yali_M1_1_A_Viewer.html'),html);fs.writeFileSync(path.join(out,'THIRD_PARTY_NOTICES.txt'),fs.readFileSync(path.join(root,'apps/campus/node_modules/three/LICENSE'),'utf8'));console.log('M1.1-A standalone bytes',Buffer.byteLength(html));
