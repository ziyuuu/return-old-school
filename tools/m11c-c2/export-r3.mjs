import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from '../../apps/campus/node_modules/esbuild/lib/main.js';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=path.resolve(root,process.env.C2_ARTIFACT_DIR||'artifacts/m11c-c2/r3');
await fs.mkdir(out,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const files=[];
for(const item of [
 {name:'Yali_C2_R3_Viewer.html',entry:'apps/campus/src/main.ts',template:'apps/campus/index.html',tag:'/src/main.ts',label:'复原雅礼 · C2 R3 校服学生漫游'},
 {name:'Yali_C2_R3_Character.html',entry:'apps/campus/src/player/avatar-studio.ts',template:'apps/campus/avatar-r3.html',tag:'/src/player/avatar-studio.ts',label:'复原雅礼 · C2 R3 人物模型工坊'},
]){
 const r=await build({entryPoints:[path.join(root,item.entry)],bundle:true,metafile:true,absWorkingDir:root,format:'iife',target:'es2022',minify:true,write:false,outfile:'bundle.js',legalComments:'inline'});
 const js=r.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script'),css=r.outputFiles.find(f=>f.path.endsWith('.css'))?.text??'';
 let html=await fs.readFile(path.join(root,item.template),'utf8');
 html=html.replace(/<title>.*?<\/title>/,`<title>${item.label}</title>`).replace('</head>',`<style>${css}</style></head>`).replace(`<script type="module" src="${item.tag}"></script>`,()=>`<script>${js}</script>`);
 if(html.includes('type="module"'))throw Error('Unbundled module');
 await fs.writeFile(path.join(out,item.name),html);
 const sources={};for(const f of [...Object.keys(r.metafile.inputs).filter(f=>!f.includes('node_modules')),item.template,'apps/campus/package-lock.json'].sort())sources[f]=digest(await fs.readFile(path.resolve(root,f)));
 const manifest={file:item.name,sha256:digest(html),bytes:Buffer.byteLength(html),version:'C2.R3',status:'IMPLEMENTED / REVIEW_PENDING',standard:'1.0 + mobile-r12; R3 user-directed planar character amendment',gitHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sources};
 await fs.writeFile(path.join(out,item.name.replace('.html','.manifest.json')),JSON.stringify(manifest,null,2)+'\n');files.push({file:item.name,sha256:manifest.sha256,bytes:manifest.bytes});console.log(files.at(-1));
}
await fs.writeFile(path.join(out,'files.json'),JSON.stringify(files,null,2)+'\n');

// Notices travel with every offline distribution; no external font/photo files.
await fs.copyFile(path.join(root,'artifacts/m11c-c2/THIRD_PARTY_NOTICES.txt'),path.join(out,'THIRD_PARTY_NOTICES.txt'));
await fs.copyFile(path.join(root,'artifacts/m11c-c1/APACHE-2.0.txt'),path.join(out,'APACHE-2.0.txt'));
