# C1 R1.2 · 手机优化实际QA

**IMPLEMENTED / REVIEW_PENDING**。不是实体手机性能验收，不登记完整acceptance。用户R1.1控制功能确认单独保留。

受测Viewer `artifacts/m11c-c1/Yali_C1_R1_2_Viewer.html`，SHA256 `def040892c538ef00ddb006f8de1dcabfbead3658822800ec14c6723f09d2477`，运行源码 `50586c208bde2eba6f8d6f0b781eb76cc888002b`。构建/30项定向测试通过；7组真实Chromium、92项检查、28张截图。旧R1/R1.1结果不是本轮测试。相同软件GPU/browser的完整新旧对比另有2张WebGL原始画布图；它们的尺寸等于各自绘图缓冲，不能误称为CSS尺寸截图。

## 几何与画质

完整可见模型仍为8,180,590三角面。校园唯一几何缓冲在同一初始化过程中 `257,660,944` → `134,883,032`字节（减少47.65%）；含比例人形总计 `135,664,380`字节。统计不包含纹理、浏览器或WASM总内存。全属性逐位相等索引复用，不减面，不重排已认可建筑/植被/门洞。

390×844、DPR3重新加载默认绘图缓冲390×844、阴影1024；帮助中切“完整清晰”验证恢复1.5像素比/2048阴影，再切流畅通过。文字DOM不降分辨率。慢帧时可逐档降至0.75。静态校园世界矩阵/6m阴影焦点迟滞、精确碰撞体复用；手柄、坡速、滑墙、台阶、桥下/入口相机行为不放宽。

## 同机成本比较（不是手机FPS）

同一runner、同一Chromium进程、相同390×844/DPR3，两份精确离线HTML分别8帧预热+60次普通renderFrame与gl.finish同步完成；完整样本在[报告](benchmark/report.json)。新旧默认栅格预算不同，测量包含这一差异。脚本路线CPU时间是相同Rapier胶囊的固定模拟任务，不是玩家实际走完所需时间。

| 版本 | 样本 | 同步绘制中位ms | P95 ms | 同一路线脚本CPU ms |
|---|---:|---:|---:|---:|
| R1.1 | 60 | 17.25 | 16045.10 | 1066.10 |
| R1.2 | 60 | 17.60 | 12970.50 | 903.40 |

不能把这些数值倒数换算为用户手机帧率，也不能保证所有手机无卡顿；仍需实体设备复测。首次比较被软件合成器截图超时中断，原始失败文件保留于history；重做完整新旧两会话后才生成比较，不跨runner拼接样本。最终Viewer不因改截图工具而改变。

## 复现

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/*.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c1/export-r12.mjs
# Playwright置于应用外，不改应用锁文件；Linux使用系统CJK字体，不分发字体
npm install --prefix /tmp/c1-browser --save-exact playwright@1.62.0
/tmp/c1-browser/node_modules/.bin/playwright install --with-deps chromium
export PLAYWRIGHT_MODULE=/tmp/c1-browser/node_modules/playwright
C1_GROUP=mobile C1_PHASE=reproduction-r12 node tools/m11c-c1/capture-r12.mjs
# input/lane/terrain/review/fallback/fix按同样命令分组
# benchmark-mobile当前输出到mobile-r12/benchmark；先在临时Git worktree运行，避免覆盖归档
node tools/m11c-c1/benchmark-mobile.mjs
```

[实际截图](review.html) · [机器摘要](summary.json) · [实现/标准偏离](../../../docs/m11c/c1/mobile-performance.md)。历史报告保留原貌。
