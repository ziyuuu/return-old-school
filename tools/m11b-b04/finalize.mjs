/** Publish metadata only after real full-browser QA. Never register alumni acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {context} from './context.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);};
const sha=p=>createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const report=json('qa/m11b-b04/final/report.json'),manifest=json('artifacts/m11b-b04/viewer-manifest.json'),viewer='artifacts/m11b-b04/Yali_B04_R1_Viewer.html';
if(!report.passed||report.mode!=='full'||report.views.length<26||report.viewerSHA256!==sha(viewer)||manifest.sha256!==sha(viewer))throw Error('Cannot publish incomplete or mismatched QA');
const tap=read('qa/m11b-b04/final/tests.tap');if(!/^# fail 0$/m.test(tap))throw Error('Tests did not pass');
const unitCount=Number(tap.match(/^# tests (\d+)$/m)[1]),r=report.access;
const b02=report.inheritedAccess.b02,b03=report.inheritedAccess.b03;
const samples=report.views.filter(v=>v.performance),perf=samples.map(v=>`| ${v.file} | ${v.viewport.width}×${v.viewport.height} | ${v.performance.samples} | ${v.performance.medianMs.toFixed(1)} | ${v.performance.p95Ms.toFixed(1)} | ${v.calls} | ${v.triangles.toLocaleString('en-US')} |`).join('\n');
const supports=r.routes.reduce((n,x)=>n+x.supports,0),clearances=r.routes.reduce((n,x)=>n+x.clearances,0);
const c=context();write('data/m11b/batch04/access.json',JSON.stringify({version:c.model.version,units:'H metres relative to main gate datum',terrainChanged:false,portals:c.model.portals,routes:c.model.routes,summaries:c.model.summaries},null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const X=x=>80+(x+80)*3.3,Y=z=>80+(z-135)*3.3;
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="640" viewBox="0 0 1100 640"><rect width="1100" height="640" fill="#f6f5ef"/><g font-family="sans-serif" fill="#303b3a"><text x="36" y="32" font-size="22">B04 · 入口与累计布局 / H 米制坐标</text><text x="36" y="55" font-size="13">仅示意实际受测路径，不新增主路，不代表人物控制器或法定无障碍认证；上方为较小 Z。</text>';
for(const f of c.layout.facilities.filter(f=>['07','13','16','17','21','15','18','11','12','19','25'].includes(f.id))){const[x,,z]=f.position,[w,,d]=f.size;svg+=`<rect x="${X(x-w/2)}" y="${Y(z-d/2)}" width="${w*3.3}" height="${d*3.3}" fill="${['07','13','16','17','21'].includes(f.id)?'#d6dfdc':'#e5e3db'}" stroke="#929b98"/><text x="${X(x)}" y="${Y(z)}" text-anchor="middle" font-size="12">${esc(f.id+' '+f.name)}</text>`;}
const colors=['#ad644d','#86714a','#658287','#506f9a','#75804e','#9a6f86','#678f78'];
c.model.routes.forEach((q,i)=>{const pts=q.points.map(p=>`${X(p[0])},${Y(p[2])}`).join(' '),e=q.points.at(-1);svg+=`<polyline points="${pts}" fill="none" stroke="${colors[i%7]}" stroke-width="2.3"/><circle cx="${X(e[0])}" cy="${Y(e[2])}" r="3" fill="${colors[i%7]}"/><text x="38" y="${560+i*10}" font-size="10">${i+1}. ${esc(q.id+' / '+q.label)}</text>`;});svg+='</g></svg>';write('docs/m11b/batch04/access.svg',svg);
const old=json('qa/render-upgrade/r2/report.json');
const oldTriangles=old.scene.triangles,oldBytes=old.scene.geometryBytes;
const body=`# B04 R1 · 实际交付与审阅入口

**IMPLEMENTED / REVIEW_PENDING**。用户未认可B04，不创建acceptance文件。统一标准 **v1.0**；B01 R3.1、B02和B03建筑R2继续按既有acceptance认可。共同渲染R2不是B03建筑版本号。

## 产物与来源

- [离线单文件 Viewer](../../../artifacts/m11b-b04/Yali_B04_R1_Viewer.html)（下载HTML后直接打开；不需要网络/CDN）。
- [实际浏览器 QA](../../../qa/m11b-b04/final/report.json) · [截图目录](../../../qa/m11b-b04/final/) · [清单与源文件哈希](../../../artifacts/m11b-b04/viewer-manifest.json)。
- [证据及H边界](evidence.md) · [逐张来源核对](../../../data/m11b/batch04/evidence.json) · [入口路线图](access.svg) · [实际受测路线点](../../../data/m11b/batch04/access.json)。

继承main：\`f8ece5fcade5c64332cc7fb34ac707b1d3aad8fc\`。受测源码提交：\`${report.sourceCommit}\`；manifest另外记录所有实际打包输入及锁文件SHA256。最终归档提交仅增加相同产物、实测报告和文档，不据文档提交号重新声称测试过代码。

Viewer：**${manifest.bytes.toLocaleString('en-US')} bytes**；SHA256：\`${manifest.sha256}\`。

## 已实施内容

13科学馆：低阶、暖色横向雨篷、内退金属框玻璃门、铭牌墙、右侧高玻璃体、实际侧后窗洞、门厅及可接地的首段梯/落脚面。短梯位置为H，不用035室内照冒充精确定位。

17长雅楼：折面玻璃中央体、分层翼部、双柱弧形雨篷、外展六级台阶、真实正门及最小门厅；保留原直达道路和0.90米入口高差，不恢复绿色绕路。

07保守三层内退门厅、16低层山墙拱口及大窗、21保守四层竖窗带/成对侧窗按各自证据边界实施，不复制同一带窗盒子。07医务室具体位置、16旧用途、21正式身份不编造。

仅替换B04所属旧占位及17旧门前重复台阶/平台；B01—B03源码/参数、有效位置、道路和地形保持。B03左右弧梯、开放圆台、中央上梯、局部坡面、食堂左打印/中楼梯/右小卖部均继承。

## 本批实际验证

类型检查/Vite生产构建通过；**${unitCount}项**定向几何、语义、尺寸、实际孔洞及BVH测试通过。门洞试验使用完整可见场景真实三角面，不是空代理场景。

B04 **${r.routes.length}条路线、${r.doors.length}个门洞**，支撑采样${supports}次、身体/净空检查${clearances}次，路线与门洞失败均0；门洞各3宽×3高。B02 ${b02.routes.length}条路线与${b02.doors.length}个门洞、B03 ${b03.routes.length}条路线与${b03.doors.length}个门洞本次重跑通过；主轴X=73、主楼基底3.45m、三旗和卷帘侧门不变量通过。

**${report.views.length}张真实Chromium截图**：13个B04近/中/全景与邻楼同框，六个旧固定机位，顶视/主轴正交，390×844新上下文初载与科学馆窄屏，以及模拟扩展缺失后的长雅/顶视/主轴对数深度回退。不是调整既有桌面视口冒充移动初载。

JS/控制台错误${report.errors.length}；额外HTTP外部请求${report.externalRequests.length}；受测各机位WebGL错误0，无上下文丢失；390×844无横向溢出，初载阴影2048。常规深度模式见原始报告；回退明确为隐藏EXT_clip_control后实际走对数深度，不声称测试了真实旧GPU。

## 实际统计与性能

浏览器${report.environment.browser}；GPU：${report.scene.gpu}。${report.environment.launch}。桌面初始化${report.initializationMs}ms，移动新上下文初始化${report.mobile.initializationMs}ms；含场景/真实BVH/7个静态反射探针，不是纯网络耗时。

可见模型三角面 **${report.scene.visibleModelTriangles.toLocaleString('en-US')}**；几何缓冲 **${report.scene.geometryBytes.toLocaleString('en-US')} bytes**；可见网格${report.scene.meshes}，几何对象${report.scene.geometries}，材质${report.scene.materials}。相对既有R2历史模型统计增加${(report.scene.visibleModelTriangles-oldTriangles).toLocaleString('en-US')}三角面、${(report.scene.geometryBytes-oldBytes).toLocaleString('en-US')}bytes；这些历史值仅用于几何规模比较，不作跨设备耗时对比。

每项在该机位预热8帧后采样60帧。帧间隔包含软件GPU调度；不是GPU计时查询，也不代表实体手机性能。不保证60 FPS。

| 机位截图 | 视口 | 帧数 | 中位ms | P95 ms | 稳态draw calls | 本帧提交三角面 |
|---|---|---:|---:|---:|---:|---:|
${perf}

反射：旧4个位置保持；新增eastTeaching给13/21、longya给17、westTeaching给07/16，共7个256采样探针。共享材质、日光、天空、深度继续统一；无照片纹理、bloom、暗角或景深。

## 标准偏离及限制

无独立楼栋材质/照明标准，无减面或平墙凑细分。模型标准无主动偏离。由于当前交互容器DNS和浏览器导航受限，Git网络操作与实际file://离线浏览器测试在授权GitHub Actions的干净环境执行，下载原始结果后人工查看；本地生产构建/单元检查另有记录。Node22使用兼容的\`node --test\`，不使用该版本不支持的\`--test-isolation=none\`。

模型识别仍受H包络与未知立面限制；原照拍摄日期不确定，文章2018年发表不是历史尺寸证明。完整装修、B05、人物碰撞/正式玩法均未实施。自由相机可穿墙，路线检查不等同完整人物控制器或无障碍认证。

## 复现

\`\`\`bash
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11b/b04/model.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11b-b04/export.mjs
# 安装在仓库外，避免改动项目锁文件；CI固定Playwright 1.62.0。
npm install --prefix /tmp/yali-b04-qa playwright@1.62.0
/tmp/yali-b04-qa/node_modules/.bin/playwright install --with-deps chromium
PLAYWRIGHT_MODULE=/tmp/yali-b04-qa/node_modules/playwright B04_QA_PHASE=recheck node tools/m11b-b04/capture.mjs
\`\`\`

重测使用新phase，不覆盖final或历史QA。导出后哈希改变则旧报告不能视为该产物测试。请审阅本批外观/入口；只有用户明确认可后另行登记B04 acceptance。
`;
write('docs/m11b/batch04/delivery.md',body);
write('qa/m11b-b04/README.md',`# B04 实际QA\n\n最终机器报告：[final/report.json](final/report.json)；[生产构建](final/build.log)；[${unitCount}项定向测试](final/tests.tap)。\n\n受测Viewer SHA256：\`${manifest.sha256}\`。\n\n状态IMPLEMENTED / REVIEW_PENDING，不代替用户认可。实际截图及每张SHA在报告中；人工审图记录见[visual-review.md](visual-review.md)。更早执行失败或迭代记录不是final测试。\n`);
const files=[viewer,'artifacts/m11b-b04/viewer-manifest.json','artifacts/m11b-b04/THIRD_PARTY_NOTICES.txt','qa/m11b-b04/final/report.json',...report.views.map(v=>'qa/m11b-b04/final/'+v.file)];
write('artifacts/m11b-b04/SHA256SUMS.txt',files.map(f=>`${sha(f)}  ${f}`).join('\n')+'\n');
console.log('Final metadata written:',unitCount,'unit checks',report.views.length,'screenshots',manifest.sha256);

// Update only current-state paragraphs; leave accepted records and historical QA untouched.
let readme=read('README.md');
readme=readme.replace('## 当前状态：B01—B03 已认可，下一批 B04','## 当前状态：B01—B03 已认可；B04 已实施，待审阅');
readme=readme.replace('[最新交付与对比](docs/render-refinement-r2-2026-09-12.md)','[共同渲染R2历史交付与对比](docs/render-refinement-r2-2026-09-12.md)');
const block='\n**B04 R1：IMPLEMENTED / REVIEW_PENDING。** 13科学馆、17长雅楼优先深化；07/16/21保留U/H身份边界并完成可审阅外壳、真门洞与最小门厅。\n\n[本批交付](docs/m11b/batch04/delivery.md) · [B04离线Viewer](artifacts/m11b-b04/Yali_B04_R1_Viewer.html) · [实际QA与截图](qa/m11b-b04/README.md) · [证据与H](docs/m11b/batch04/evidence.md) · [入口路线](docs/m11b/batch04/access.svg)。Viewer SHA256：`'+manifest.sha256+'`。源码位于`codex/b04-development`审阅分支；本批发布不表示main合并或用户认可。\n';
if(!readme.includes('**B04 R1：'))readme=readme.replace('## 当前状态：B01—B03 已认可；B04 已实施，待审阅','## 当前状态：B01—B03 已认可；B04 已实施，待审阅\n'+block);
readme=readme.replace('M1.1-B共五批：B01/B02/B03已认可；下一批为B04科学馆＋长雅楼等，之后为B05校门及体育生活附属建筑。','M1.1-B共五批：B01/B02/B03已认可；B04科学馆＋长雅楼等已实施待审，B05校门及体育生活附属建筑尚未开始。');
write('README.md',readme);
let plan=read('docs/development-plan.md');
plan=plan.replace('B01—B03已认可 / 下一批 B04','B01—B03已认可 / B04 IMPLEMENTED · REVIEW_PENDING');
plan=plan.replace('下一批按 [B04新线程提示词](m11b/batch04/start-next-thread.md) 从 Git 最新源码接续；本线程未实施 B04/B05。','B04按 [启动任务书](m11b/batch04/start-next-thread.md) 从Git最新main接续，已实际实现并完成独立Viewer/几何/BVH/浏览器检查，等待用户认可；B05未开始。见 [B04交付](m11b/batch04/delivery.md)。');
plan=plan.replace('| M1.1-B 第四批 B04 | PLANNED / NOT STARTED |','| M1.1-B 第四批 B04 | IMPLEMENTED / REVIEW_PENDING |');
plan=plan.replace('**M1.1-B共五批：B01/B02/B03已认可，之后还有B04/B05两批。**','**M1.1-B共五批：B01/B02/B03已认可，B04已实施待审，B05未开始。**');
plan=plan.replace('## 第四批 B04：科学馆、长雅楼及其余教学办公建筑','## 第四批 B04：科学馆、长雅楼及其余教学办公建筑（已实施待审）');
const note='\n\n实际交付：13内退门厅/高玻璃体/短梯；17折面中央体/弧形雨篷/直达六阶；07保守门厅、16低层山墙真拱、21工作名外壳。'+unitCount+'项定向测试、7路线6门洞及'+report.views.length+'张实际截图通过；共享反射新增归属，因此完成六旧机位、正交及深度回退。未修改B01—B03 acceptance；所有米制参数仍H。[交付与复现](m11b/batch04/delivery.md) / [证据](m11b/batch04/evidence.md)。\n';
if(!plan.includes('实际交付：13内退'))plan=plan.replace('## 第五批 B05：校门、体育与生活附属建筑，补齐校园外壳',note+'\n## 第五批 B05：校门、体育与生活附属建筑，补齐校园外壳');
write('docs/development-plan.md',plan);
