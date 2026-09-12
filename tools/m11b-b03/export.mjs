import fs from 'node:fs';import {build} from '../../apps/campus/node_modules/esbuild/lib/main.js';import {context,root} from './context.mjs';
const c=context(),m=c.model,out=root+'artifacts/m11b-b03/';fs.mkdirSync(out,{recursive:true});
const result=await build({entryPoints:[root+'apps/campus/src/main.ts'],bundle:true,format:'iife',target:'es2022',minify:true,write:false,outfile:'bundle.js',legalComments:'inline'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script'),css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const html=fs.readFileSync(root+'apps/campus/index.html','utf8').replace('</head>',()=>`<style>${css}</style></head>`).replace('<script type="module" src="/src/main.ts"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(out+'Yali_M1_1_B_B03_Viewer.html',html);fs.copyFileSync(root+'apps/campus/node_modules/three/LICENSE',out+'THIRD_PARTY_NOTICES.txt');
fs.writeFileSync(out+'access-model.json',JSON.stringify({version:m.version,summary:m.summary,portals:m.portals,routes:m.routes,stairPlan:m.stairPlan,frontage:m.frontage},null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),txt=(x,y,s,size=14)=>`<text x="${x}" y="${y}" font-size="${size}">${esc(s)}</text>`;
let body=txt(38,40,'B03 R2｜入口与双梯校核',26)+txt(38,67,'A：食堂正面顺序与双梯对称；H：圆平台、梯段尺寸与标高。图面+Z向下，非地理北。',13);
function plan(x0,y0,minX,minZ,scale,ids,routeIds){
 const X=x=>x0+(x-minX)*scale,Z=z=>y0+(z-minZ)*scale;
 for(const id of ids){const f=c.layout.facilities.find(q=>q.id===id),[x,,z]=f.position,[w,,d]=f.size;body+=`<rect x="${X(x-w/2)}" y="${Z(z-d/2)}" width="${w*scale}" height="${d*scale}" fill="${id==='19'?'#e5ebdb':'#dde3dd'}" stroke="#849589"/>`+txt(X(x-w/2)+5,Z(z-d/2)+15,id+' '+({15:'主教学楼',18:'图书馆',19:'后花园',11:'食堂'}[id]??''),12);}
 if(ids.includes('19')){const f=c.layout.facilities.find(q=>q.id==='19');for(const p of m.parts.filter(q=>q.owner==='19'&&(q.role==='step'||q.id.endsWith('roundPlatform')))){const points=p.points.map(q=>[X(q[0]+f.position[0]),Z(q[1]+f.position[2])]);body+=`<polygon points="${points.join(' ')}" fill="#e7d6b4" stroke="#9c8051" stroke-width=".5"/>`;}}
 if(ids.includes('11')){for(const [label,k]of [['打印',m.frontage.printing],['小卖部',m.frontage.shop]]){const [a,b,d,e]=k.bounds;body+=`<rect x="${X(a)}" y="${Z(b)}" width="${(d-a)*scale}" height="${(e-b)*scale}" fill="#e9dbb7" stroke="#ab975f"/>`+txt(X(a)+5,Z((b+e)/2),label,12);}const st=m.frontage.stair;body+=`<rect x="${X(st.startX)}" y="${Z(st.centerZ-st.width/2)}" width="${(st.endX-st.startX)*scale}" height="${st.width*scale}" fill="#aabbb0"/>`;}
 for(const r of m.routes.filter(q=>routeIds.includes(q.id)))body+=`<polyline points="${r.points.map(q=>[X(q[0]),Z(q[2])]).join(' ')}" fill="none" stroke="${r.id.includes('spiral')?'#a47635':'#27685c'}" stroke-width="1.9" marker-end="url(#arrow)"/>`;
 for(const d of m.portals.filter(q=>ids.includes(q.facility)||(ids.includes('11')&&q.facility==='12'))){const [x,,z]=d.center,n=d.normal;body+=`<circle cx="${X(x)}" cy="${Z(z)}" r="3.6" fill="#fff" stroke="#225448"/><path d="M${X(x)},${Z(z)}L${X(x+n[0]*2)},${Z(z+n[2]*2)}" stroke="#225448" marker-end="url(#arrow)"/>`;}
 return {X,Z};
}
plan(46,105,0,215,4.4,['15','18','19'],['main-library','gap-library','garden-around','garden-spiral','garden-spiral-left']);
plan(710,120,130,131,6.2,['11'],['canteen','shop','printing','canteen-perimeter']);
body+=txt(44,432,'两侧弧梯对称上行 → 可站立圆平台（H） → 中央回梯 → 二层真开口',13)+txt(44,455,'护栏只在未通行的圆弧边缘；左右抵达口与上梯口均留空。',13)+txt(44,478,'旧后门、前门和主楼后方爬升不变；西侧通路绕开新双梯。',13);
body+=txt(710,365,'面对食堂（从−X看向+X）：左打印｜中楼梯｜右小卖部',13)+txt(710,391,'箭头为门洞朝外法线；打印和小卖部均有独立真开口。',13)+txt(710,417,'食堂与校园道路不移动；12的子空间登记随右移更新。',13)+txt(710,444,'不是人物控制器或无障碍认证；以实际三角网格检查为准。',12);
body+=txt(44,531,'主楼后方 → 图书馆纵剖',20);
const up=m.routes.find(r=>r.id==='main-library').points;body+=`<polyline points="${up.map(q=>[55+(q[2]-232.8)*20,708-(q[1]-3.49)*65]).join(' ')}" fill="none" stroke="#27685c" stroke-width="3"/>`;
body+=txt(50,756,'主楼后方 +3.49 → 前场 +4.69 → 馆内 +5.14 m（H工作标高）',13)+txt(50,562,'保留1.20m局部爬升，不抬高已认可主楼后坪。',13);
body+=txt(710,531,'双梯展开剖面（左右同源镜像）',20);
const st=m.stairPoints;let distance=0;const dist=st.map((q,i)=>{if(i)distance+=Math.hypot(q[0]-st[i-1][0],q[2]-st[i-1][2]);return distance;});body+=`<polyline points="${st.map((q,i)=>[720+dist[i]/distance*455,720-(q[1]-m.summary.gardenGround)*31]).join(' ')}" fill="none" stroke="#a47635" stroke-width="3"/>`;
body+=txt(710,562,`每侧${c.p.spiral.lowerStepsPerSide}级 → 圆平台 → 中央${c.p.spiral.upperSteps}级（尺寸H）`,13)+txt(710,756,`花园 +${m.summary.gardenGround.toFixed(2)} → 圆台 +${m.summary.roundPlatformLevel.toFixed(2)} → 上层 +${m.summary.libraryUpper.toFixed(2)} m`,13);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1270" height="800" viewBox="0 0 1270 800"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#285849"/></marker></defs><rect width="1270" height="800" fill="#f7f8f0"/><g fill="#283e35" font-family="system-ui,'Microsoft YaHei',sans-serif">${body}</g></svg>`;
fs.writeFileSync(out+'Yali_M1_1_B_B03_Access.svg',svg);fs.writeFileSync(root+'docs/m11b/batch03/access.svg',svg);console.log('B03 R2 self-contained Viewer:',Buffer.byteLength(html),'bytes');
