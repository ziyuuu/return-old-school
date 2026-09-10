import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {build} from '../../apps/campus/node_modules/esbuild/lib/main.js';
import {applyPatch02} from '../../apps/campus/src/patch02-core.mjs';
import {buildPatch03Model} from '../../apps/campus/src/patch03-core.mjs';
import {buildPatch04Model} from '../../apps/campus/src/patch04-core.mjs';
import {buildBatch01Model,batch01Checks} from '../../apps/campus/src/batch01-core.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),load=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const patch=applyPatch02(load('data/m10/campus-layout.json'),load('data/m11a/terrain-input.json'),load('data/m11a/patch02/input.json'));
const p3=buildPatch03Model(patch.layout,patch.terrain,load('data/m11a/patch03/input.json')),p4=buildPatch04Model(p3,load('data/m11a/patch04/input.json'));
const b=buildBatch01Model(patch.layout,p4,load('data/m11b/batch01/input.json')),out=path.join(root,'artifacts/m11b-b01');fs.mkdirSync(out,{recursive:true});
const json=(p,v)=>fs.writeFileSync(path.join(root,p),JSON.stringify(v,null,2));
json('data/m11b/batch01/resolved-shell.json',b.exportData());json('data/m11b/batch01/regression-results.json',batch01Checks(patch.layout,b));
json('data/m11a/patch03/resolved-terrain.json',{...p3.exportData(),alumniReview:'APPROVED'});json('data/m11a/patch04/resolved-terrain.json',p4.exportData());
const files=[...fs.readdirSync(path.join(root,'apps/campus/src')).map(x=>'apps/campus/src/'+x),'apps/campus/index.html','data/m11b/batch01/input.json','data/m11a/patch03/input.json','data/m11a/patch04/input.json'];
const fingerprint=crypto.createHash('sha256');for(const p of files.sort())fingerprint.update(p).update(fs.readFileSync(path.join(root,p)));const sha=fingerprint.digest('hex');
const result=await build({entryPoints:[path.join(root,'apps/campus/src/main.ts')],bundle:true,format:'iife',target:'es2022',minify:true,write:false,outfile:'bundle.js',legalComments:'inline'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script'),css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
let html=fs.readFileSync(path.join(root,'apps/campus/index.html'),'utf8');html=html.replace('</head>',`<meta name="source-fingerprint" content="${sha}"><style>${css}</style></head>`).replace('<script type="module" src="/src/main.ts"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(path.join(out,'Yali_M1_1_B_Batch01_Viewer.html'),html);
fs.writeFileSync(path.join(out,'THIRD_PARTY_NOTICES.txt'),'Three.js r180 (MIT). No external scene photographs or font files.\n\n'+fs.readFileSync(path.join(root,'apps/campus/node_modules/three/LICENSE'),'utf8'));
json('qa/m11b-b01/build-manifest.json',{version:b.version,sourceFingerprint:sha,parts:b.parts.length,routes:b.routes.length,bytes:Buffer.byteLength(html),baseline:'baseline/m1.0-r4',alumniReview:'REVIEW_PENDING',input:'data/m11b/batch01/input.json'});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const start=(w,h,title)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#f7f6ed"/><style>text{font-family:Arial,'Noto Sans CJK SC',sans-serif;fill:#294642}.title{font-size:25px;font-weight:700}.sub{font-size:13px}.small{font-size:11px}</style><text x="44" y="48" class="title">${title}</text>`;
let svg=start(1100,650,'复原雅礼 / M1.1-B 第一批 · 旧主楼立面');svg+='<text x="44" y="77" class="sub">由实际外壳参数投影 · 四层旧楼、成组窗洞、四楼后坪退台 · 尺寸采用项目工作参数</text>';
for(const [name,baseY,front]of [['操场侧立面',290,true],['后侧立面 / 四楼退台',570,false]]){
 svg+=`<text x="44" y="${baseY-175}" class="sub">${name}</text>`;
 const ps=b.parts.filter(p=>p.owner==='15'&&p.shape==='box'&&(front?p.center[2]<-4.5:p.center[2]>1.4));ps.sort((a,c)=>front?c.center[2]-a.center[2]:a.center[2]-c.center[2]);
 for(const p of ps){const x=550+(p.center[0]-p.size[0]/2)*9,y=baseY-(p.center[1]+p.size[1]/2)*9;const fill=p.role==='glazing'?'#526f70':p.role==='frame'?'#abb6ac':p.role.includes('guard')?'#a6b1a3':'#dddccf';svg+=`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(p.size[0]*9).toFixed(2)}" height="${Math.max(.4,p.size[1]*9).toFixed(2)}" fill="${fill}" stroke="#88968a" stroke-width=".25"/>`;}
 svg+=`<path d="M520 ${baseY-147}a30 19 0 0 1 60 0Z" fill="#a0ada5" stroke="#6a8077"/><line x1="70" x2="1030" y1="${baseY}" y2="${baseY}" stroke="#47655a"/><text x="85" y="${baseY+24}" class="small">15 旧主教学楼 · 98 × 14 工作占地保持 · 门、窗、外廊为实际几何</text>`;
}
svg+='<text x="44" y="623" class="small">浅色旧楼外壳；未套用后来橘红色新主楼。后坪范围与小圆顶尺寸为工作补全，可局部调整。</text></svg>';fs.writeFileSync(path.join(out,'Yali_M1_1_B_Batch01_Elevations.svg'),svg);
svg=start(1100,1140,'复原雅礼 / 四层通行关系校核');svg+='<text x="44" y="78" class="sub">每层均为：主楼外廊 → 西侧回廊 → 连接桥 → 厕所前廊 → 两端门；桥下道路保持</text>';
for(let l=1;l<=4;l++){
 const yy=130+(l-1)*250,xx=x=>105+(x+13)*7,zz=z=>yy+35+(z-216)*7;
 svg+=`<text x="44" y="${yy}" class="sub">${l}F · 楼面 +${(b.mainFloor+(l-1)*3.8+.04).toFixed(2)} m</text>`;
 for(const [x,z,w,d,title]of [[-13,216.8,6,14.4,'25 连续厕所'],[-7,222.95,27,2.1,'逐层桥'],[20,217,98,14,'15 主楼']])svg+=`<rect x="${xx(x)}" y="${zz(z)}" width="${w*7}" height="${d*7}" fill="#e4e5d7" stroke="#748a7b"/><text x="${xx(x)+5}" y="${zz(z)+18}" class="small">${title}</text>`;
 for(const route of b.routes.filter(r=>r.level===l))svg+=`<polyline points="${route.points.map(p=>xx(p[0])+','+zz(p[2])).join(' ')}" fill="none" stroke="#b3773b" stroke-width="2.5"/>`;
 svg+=`<path d="M${xx(6.5)} ${zz(215)}V${zz(233)}" stroke="#5c8391" stroke-dasharray="4 4"/><text x="${xx(7.5)}" y="${zz(235)}" class="small">桥下地面道路（非本层）</text>`;
}
svg+='<text x="44" y="1120" class="small">楼层与所有冻结端点不变。两端A/B不指定历史男女端次序；完整室内及人物控制器不属于本批。</text></svg>';fs.writeFileSync(path.join(out,'Yali_M1_1_B_Batch01_Connections.svg'),svg);
console.log(JSON.stringify({sourceFingerprint:sha,parts:b.parts.length,routes:b.routes.length,bytes:Buffer.byteLength(html)}));
