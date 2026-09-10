import fs from 'node:fs';
import {applyPatch02,patch02Checks} from '../../../apps/campus/src/patch02-core.mjs';
import {buildTerrainModel} from '../../../apps/campus/src/terrain-core.mjs';
const root=new URL('../../../',import.meta.url),read=s=>JSON.parse(fs.readFileSync(new URL(s,root))),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
const base=read('data/m10/campus-layout.json'),p=read('data/m11a/patch02/input.json'),{layout:l,terrain:t}=applyPatch02(base,read('data/m11a/terrain-input.json'),p),model=buildTerrainModel(l,t);
write('data/m11a/patch02/effective-layout.json',JSON.stringify(l,null,2));write('data/m11a/patch02/resolved-terrain.json',JSON.stringify(model.exportData(),null,2));
write('data/m11a/patch02/regression-results.json',JSON.stringify(patch02Checks(l,t,p,base),null,2));
const esc=s=>String(s).replace(/[&<>]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[x]));
let shapes='';
for(const[a,b]of l.navigation.edges){const u=l.navigation.nodes[a],v=l.navigation.nodes[b];shapes+=`<path d="M${u[0]},${u[2]} L${v[0]},${v[2]}" stroke="#d4cebb" stroke-width="${l.navigation.edgeWidths[a+'|'+b]??3}" fill="none"/>`;}
const fc=p.gym.forecourtBounds;shapes+=`<rect x="${fc[0]}" y="${fc[1]}" width="${fc[2]-fc[0]}" height="${fc[3]-fc[1]}" fill="#eee2c8" stroke="#ae8c56" stroke-width=".4"/>`;
for(const f of l.facilities){if(!f.position||!f.size||['route','subspace','marker'].includes(f.kind))continue;const[x,,z]=f.position,[w,,d]=f.size;shapes+=`<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="${f.id==='03'?'#99b9b4':['08','06'].includes(f.id)?'#b4c8ab':'#e1e5d9'}" stroke="#6b8680" stroke-width=".45"/><text x="${x}" y="${z}" text-anchor="middle" font-size="3.4" fill="#244c45">${f.id}</text>`;}
shapes+=`<polyline points="${p.loop.cycle.map(id=>{const q=l.navigation.nodes[id];return q[0]+','+q[2];}).join(' ')}" fill="none" stroke="#237c91" stroke-width="1" stroke-dasharray="2 1"/>`;
shapes+='<path d="M-35 45 L-24 45 L-29 42 M-24 45 L-29 48" stroke="#a45238" stroke-width=".8" fill="none"/>';
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="1100" viewBox="0 0 1150 1100"><rect width="1150" height="1100" fill="#faf9f4"/><g font-family="sans-serif"><text x="40" y="46" font-size="28" fill="#244c45">复原雅礼 · M1.1-A Patch02 工作总平面</text><text x="40" y="77" font-size="15">蓝色虚线＝闭合绕馆通路（东侧借用主路）；米制数值为H推定，不是测绘图。</text><g transform="translate(338,135) scale(2.82)">${shapes}</g><text x="40" y="1010" font-size="16">全部设施的水平位置和占地沿用R4；仅体育馆正门/局部环路为本次授权例外。</text><text x="40" y="1040" font-size="14">03体育馆　04泳池　05棚跑道　06六片球场　24音乐楼　26池畔厕所　25主楼厕所</text><text x="40" y="1070" font-size="14">本图直接来自有效布局数据；侧后环路精确线形仍为推定，不能据此确认行车或消防条件。</text></g></svg>`;
write('docs/m11a/patch02/masterplan.svg',svg);
const levels=[['首层',0],['观赛层',4.2],['窗带下缘',5.3],['窗带上缘',8.5],['五环板下缘',10.4],['五环板顶缘',18],['侧折面最高',19.2]];
let lines='';for(const[name,h]of levels){const y=590-h*24;lines+=`<path d="M120 ${y} H790" stroke="#bac9c3"/><text x="808" y="${y+5}" font-size="15">${esc(name)} ${h.toFixed(2)}m [H]</text>`;}
svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="780"><rect width="1080" height="780" fill="#faf9f4"/><g font-family="sans-serif" fill="#244c45"><text x="36" y="42" font-size="25">体育馆竖向工作方案 · 非测绘立面</text><text x="36" y="73" font-size="15">竖向值相对体育馆首层工作基准；图为参数示意，不代替实机模型。</text>${lines}<path d="M180 590 V330 L230 129 L655 306 V590Z" fill="#d5dfd2" opacity=".65" stroke="#52756d"/><path d="M225 590 L460 489 H650" stroke="#738581" stroke-width="8" fill="none"/><text x="200" y="627" font-size="16">左侧外楼梯：28级 × 0.15m；踏面0.33m；到达4.20m观赛平台</text><text x="36" y="680" font-size="17">门内坡道：4–24工作米区间上升1.00m，纵坡5%。原方案为1%。</text><text x="36" y="719" font-size="15">门朝主路、前坪、外梯与观赛层来自用户确认；精确高度/厚度/级数均可替换。</text></g></svg>`;
write('docs/m11a/patch02/height-study.svg',svg);
console.log('Exported current Patch02 layout, terrain, masterplan and height study.');
