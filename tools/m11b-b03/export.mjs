import fs from 'node:fs';import {build} from '../../apps/campus/node_modules/esbuild/lib/main.js';import {context,root} from './context.mjs';
const c=context(),m=c.model,out=root+'artifacts/m11b-b03/';fs.mkdirSync(out,{recursive:true});
const result=await build({entryPoints:[root+'apps/campus/src/main.ts'],bundle:true,format:'iife',target:'es2022',minify:true,write:false,outfile:'bundle.js',legalComments:'inline'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script'),css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const html=fs.readFileSync(root+'apps/campus/index.html','utf8').replace('</head>',()=>`<style>${css}</style></head>`).replace('<script type="module" src="/src/main.ts"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(out+'Yali_M1_1_B_B03_Viewer.html',html);fs.copyFileSync(root+'apps/campus/node_modules/three/LICENSE',out+'THIRD_PARTY_NOTICES.txt');fs.writeFileSync(out+'access-model.json',JSON.stringify({version:m.version,summary:m.summary,portals:m.portals,routes:m.routes},null,2));
const txt=(x,y,s,size=14)=>`<text x="${x}" y="${y}" font-size="${size}">${s}</text>`;
let body=txt(46,42,'复原雅礼｜B03 入口、上坡与后花园校核',27)+txt(46,70,'模型同源参数 · A关系 / P可见结构 / H尺寸补全 · +Z向图下，不冒称地理北',13);
function plan(x0,y0,minX,minZ,scale,ids,rids){
 const X=x=>x0+(x-minX)*scale,Z=z=>y0+(z-minZ)*scale;
 for(const id of ids){const f=c.layout.facilities.find(q=>q.id===id),[x,,z]=f.position,[w,,d]=f.size;body+=`<rect x="${X(x-w/2)}" y="${Z(z-d/2)}" width="${w*scale}" height="${d*scale}" fill="${id==='19'?'#d9e2cf':id==='12'?'#eee0ba':'#dee4dd'}" stroke="#77897e"/>`+txt(X(x-w/2)+6,Z(z-d/2)+17,id+' '+({15:'主教学楼',18:'旧图书馆',19:'后花园',11:'食堂',12:'下层小卖部'}[id]),13);}
 for(const r of m.routes.filter(r=>rids.includes(r.id))){body+=`<polyline points="${r.points.filter((q,i)=>i%3===0||i===r.points.length-1).map(q=>[X(q[0]),Z(q[2])]).join(' ')}" fill="none" stroke="${r.id.includes('spiral')?'#a87530':'#367769'}" stroke-width="2.5" stroke-linejoin="round" marker-end="url(#arrow)"/>`;}
 for(const d of m.portals.filter(d=>ids.includes(d.facility))){const x=d.center[0],z=d.center[2],n=d.normal;body+=`<circle cx="${X(x)}" cy="${Z(z)}" r="4" fill="#fff" stroke="#173e36" stroke-width="1.8"/><path d="M${X(x)},${Z(z)}L${X(x+n[0]*2.1)},${Z(z+n[2]*2.1)}" stroke="#173e36" marker-end="url(#arrow)"/>`;}
 return{X,Z};
}
const lib=plan(54,116,-1,215,4.5,['15','18','19'],['main-library','gap-library','library-garden','garden-around','garden-spiral']);
body+=`<path d="M${lib.X(58.5+4.4)},${lib.Z(262.2)} A19.8 19.8 0 0 1 ${lib.X(58.5-4.4)},${lib.Z(262.2)}" fill="none" stroke="#a87530" stroke-width="8" opacity=".5"/>`;
body+=txt(49,485,'主楼后门/桥下两路会合 → 上坡 → 3级低台阶 → 内退正门',14)+txt(49,509,'后门 → 3级下行 → 后花园；弧梯 → 二层平台 → 真门洞',14)+txt(49,533,'西侧外部步道可绕馆到花园，不要求穿过馆内。',13);
plan(760,118,131,132,5.2,['11','12'],['canteen','shop','canteen-perimeter']);
body+=txt(752,420,'下层 +3.24m：绕建筑柱列进入小卖部真门洞。',14)+txt(752,445,'上层 +6.84m：20级宽梯 → 落脚平台 → 内退入口。',14)+txt(752,470,'外缘步道为H局部补全；不改现有路网节点与宽度。',13)+txt(752,495,'圈点为真门洞；短箭头为朝外法线。',13);
// Longitudinal profile follows the actual front route, not a decorative grade arrow.
const xs=z=>60+(z-232.8)*18,ys=y=>741-(y-3.49)*34;
const route=m.routes.find(q=>q.id==='main-library').points;
body+=txt(49,578,'上坡纵剖（标高=场景工作值，非测绘海拔）',19);
body+=`<polyline points="${route.map(q=>[xs(q[2]),ys(q[1])]).join(' ')}" fill="none" stroke="#367769" stroke-width="3"/>`;
body+=txt(58,772,'主楼后门 +3.49',13)+txt(235,733,'前场 +4.69',13)+txt(342,701,'门厅 +5.14',13)+txt(58,628,'局部道路升高1.20m；原主楼后坪与其它建筑锚点不抬高。',13);
const st=m.stairPoints.filter(q=>q[2]>=262.19);const xst=i=>760+i*11,yst=y=>753-(y-5.14)*32;
body+=txt(752,578,'宽弧梯展开剖面（H）',19);
body+=`<polyline points="${st.map((q,i)=>[xst(i),yst(q[1])]).join(' ')}" fill="none" stroke="#a87530" stroke-width="3"/>`;
body+=txt(752,620,'26级 × 0.146m；半圈；内径4.40m开敞井',13)+txt(752,777,'起点 +5.14 → 二层平台/门厅 +8.94m',13);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1270" height="820" viewBox="0 0 1270 820"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#254a40"/></marker></defs><rect width="1270" height="820" fill="#f7f8f0"/><g fill="#283e35" font-family="system-ui,'Microsoft YaHei',sans-serif">${body}</g></svg>`;
fs.writeFileSync(out+'Yali_M1_1_B_B03_Access.svg',svg);fs.writeFileSync(root+'docs/m11b/batch03/access.svg',svg);console.log('B03 self-contained Viewer:',Buffer.byteLength(html),'bytes');
