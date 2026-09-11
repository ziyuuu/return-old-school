import fs from 'node:fs';
import {build} from '../../apps/campus/node_modules/esbuild/lib/main.js';
import {context,root} from './context.mjs';
const c=context(),out=root+'artifacts/m11b-b02/';fs.mkdirSync(out,{recursive:true});
const result=await build({entryPoints:[root+'apps/campus/src/main.ts'],bundle:true,format:'iife',target:'es2022',minify:true,write:false,outfile:'bundle.js',legalComments:'inline'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
const css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const html=fs.readFileSync(root+'apps/campus/index.html','utf8').replace('</head>',()=>`<style>${css}</style></head>`).replace('<script type="module" src="/src/main.ts"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(out+'Yali_M1_1_B_B02_Viewer.html',html);fs.copyFileSync(root+'apps/campus/node_modules/three/LICENSE',out+'THIRD_PARTY_NOTICES.txt');
fs.writeFileSync(out+'access-model.json',JSON.stringify({version:c.p.version,summary:c.model.summary,portals:c.model.portals,routes:c.model.routes},null,2));
// A single useful drawing from the very same spatial model; no manually moved doors.
const X=x=>58+(x+86)*5.65,Z=z=>96+(z-15)*5.65,pts=ps=>ps.map(p=>[X(p[0]),Z(p[2])].join(',')).join(' ');
const rect=(a,b,fill,stroke='#55685f')=>`<rect x="${X(a[0])}" y="${Z(a[1])}" width="${(b[0]-a[0])*5.65}" height="${(b[1]-a[1])*5.65}" fill="${fill}" stroke="${stroke}"/>`;
let body=rect([-66,24],[-24,66],'#e1e5df')+rect([-70,66],[-54,78],'#eee3cc');
body+=`<path d="M${X(0)},${Z(15)}V${Z(92)}" stroke="#bfc8be" stroke-width="40" fill="none"/>`;
body+=`<polyline points="${pts(c.model.routes.find(r=>r.id==='loop').points)}" fill="none" stroke="#95a99e" stroke-width="17" stroke-linejoin="round"/>`;
body+=`<line x1="${X(-66)}" y1="${Z(66)}" x2="${X(-54)}" y2="${Z(66)}" stroke="#855652" stroke-width="5"/>`;
for(const [id,color]of [['gym-main','#286d61'],['spectator','#ae742c'],['front-platform','#ae742c'],['music','#6868a1']])body+=`<polyline points="${pts(c.model.routes.find(r=>r.id===id).points)}" fill="none" stroke="${color}" stroke-width="3" marker-end="url(#arrow)"/>`;
for(const d of c.model.portals){const n=d.normal,k=Math.hypot(n[0],n[2]),x=d.center[0],z=d.center[2];body+=`<circle cx="${X(x)}" cy="${Z(z)}" r="5" fill="#fff" stroke="#233f38" stroke-width="2"/><path d="M${X(x)},${Z(z)} L${X(x+2.1*n[0]/k)},${Z(z+2.1*n[2]/k)}" stroke="#233f38" stroke-width="1.8" marker-end="url(#arrow)"/>`;}
const txt=(x,y,s,size=14)=>`<text x="${x}" y="${y}" font-size="${size}">${s}</text>`;
body+=txt(X(-54),Z(36),'03 体育馆',18)+txt(X(-62),Z(72),'24 音乐楼 · 四层',12)+txt(X(-6),Z(31),'主路',12)+txt(X(-21),Z(42),'前坪',12);
body+=txt(64,565,'平面｜圆点是真门洞；短箭头是门洞朝外法线；彩线是实际支撑路线。',14);
body+=txt(64,586,'+Z 向图下，不冒称地理北；共享边界为闭墙，绕馆道路走组团外缘。',13);
// stair section: horizontal axis is gym local v (towards rear), vertical uses scene datum.
const sx=v=>745+v*25,sy=y=>495-(y-3)*47;
body+=`<path d="M${sx(-.3)},${sy(3.64)}H${sx(14)}" stroke="#ccd2c8" stroke-width="1" fill="none"/>`;
const st=c.p.gym.stair,base=c.model.anchors['03'].floor+c.p.gym.floorOffset,rr=c.p.gym.galleryRise/st.steps;
for(let i=0;i<st.steps;i++)body+=`<rect x="${sx(st.startV+i*st.tread)}" y="${sy(base+(i+1)*rr)}" width="${st.tread*25+.04}" height="${(i+1)*rr*47}" fill="#b7c6b9" stroke="#5d7968" stroke-width=".5"/>`;
const end=st.startV+st.steps*st.tread;body+=`<rect x="${sx(end)}" y="${sy(base+c.p.gym.galleryRise)}" width="${st.landingDepth*25}" height="12.22" fill="#b7c6b9" stroke="#5d7968"/>`;
body+=txt(722,105,'左外梯剖面（同源参数）',19)+txt(722,136,'28级 × 0.15m；踏步0.33m；净宽3.00m',13)+txt(722,160,'起点 +3.64 → 梯顶 / 观赛廊 +7.84m',13)+txt(722,184,'顶平台3.00m深；侧门进入后可到前平台',13);
body+=txt(sx(0),sy(base)+24,'+3.64',12)+txt(sx(end)-13,sy(7.84)-13,'+7.84',12);
body+=txt(720,549,'体育馆正门：+X外法线，内退正墙真开口。',13)+txt(720,573,'音乐楼门：+Z外法线，沿用既有H入口。',13)+txt(720,597,'观赛门：左侧斜返墙，约+Z / 略+X。',13);
body+=txt(64,638,'馆前低台阶沿用：4级，共升0.60m；音乐楼门前同为4级。',14)+txt(64,663,'场景地坪 +3.00m；门厅实际落脚 +3.64m；体育馆屋盖最高 +22.80m。',14)+txt(64,688,'数值均为H工作值，零点是场景校门，不是测绘海拔；不构成法规或无障碍认证。',13);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="735" viewBox="0 0 1200 735"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#334c43"/></marker></defs><rect width="1200" height="735" fill="#f8f8f1"/><g font-family="system-ui,'Microsoft YaHei',sans-serif" fill="#273e36">${txt(58,43,'复原雅礼｜B02 入口与通路校核',25)}${txt(58,68,'A关系保留 · P结构照片对照 · H尺寸/缺图补全 · IMPLEMENTED / REVIEW_PENDING',13)}${body}</g></svg>`;
fs.writeFileSync(out+'Yali_M1_1_B_B02_Access.svg',svg);fs.mkdirSync(root+'docs/m11b/batch02',{recursive:true});fs.writeFileSync(root+'docs/m11b/batch02/access.svg',svg);
console.log('B02 standalone',Buffer.byteLength(html),'bytes; no runtime network assets. SVG derived from the same model.');
