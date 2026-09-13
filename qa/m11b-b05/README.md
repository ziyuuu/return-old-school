# B05 R1.1｜实际浏览器 QA

**工程检查通过 / IMPLEMENTED / REVIEW_PENDING**。用户认可尚未登记。

受测源码：`6d19950e1eea1422621b92394b2553e90c889f84`。受测 Viewer：`artifacts/m11b-b05/Yali_B05_R1_1_Viewer.html`，979,803 字节，SHA256：`d9e91cad8a2cf49af997da14e4a4ba97066f6115c01517473c049c22815b5e4e`。原始截图和通行报告来自同次最终实际浏览器运行，性能组由三个独立浏览器会话各60帧汇总，保留逐帧原始数据；B04基线8图明确绑定原B04哈希，不混入本批测试。

## 结果

生产构建通过；几何/材质/真实门洞/BVH定向测试19/19。B05 21条路线、14处门洞通过；旧B02/B03/B04入口通过。所有最终组JS/GL错误0，外部请求0。保留截图恢复警告，见 [机器报告](final-summary.json) 和每组 report.json。初始窄屏390×844重新加载，2048阴影，无横向溢出；EXT_clip_control缺失模拟实际走对数深度并覆盖近景、顶视/主轴。

本批35张实际浏览器图，另8张本次重拍B04同机位基线。查看 [离线截图审阅页](review.html) 或 [视觉核查记录](../../docs/m11b/batch05/visual-review.json)。早期升旗台窄屏机位已修正；修复前跑道/树木画面和不完整性能会话保存在 history/before-closeout，不作为最终通过记录。先前泳池机位和题字比例问题见证据及视觉修订说明。

| 全场景统计 | B04原Viewer（本次重拍） | B05受测Viewer |
|---|---:|---:|
| 可见模型三角面 | 4,823,310 | 7,715,728 |
| 唯一几何缓冲字节 | 141,739,340 | 216,452,648 |
| 网格对象 | 1796 | 1975 |
| 材质实例 | 76 | 101 |

全场景三角面不等于当前一帧提交面数。参数目录含9698构件、12个H篮架、2球门、57棵H定位主树和6个保留居住体量。原认可源码/参数逐文件校验见 [preservation.json](final-r1.1/preservation.json)。

## 实测成本，不是用户硬件FPS

**软件渲染性能限制：本次SwiftShader会话非常慢，近景及全景可达到数秒至数十秒一个帧间隔。采样完成不表示流畅性通过；尚无真实用户GPU或手机的性能验收。**

151.0.7922.34 / ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)。1280×840，预热8帧，每机位60个连续渲染帧间隔，使用原renderFrame回调与requestAnimationFrame循环。全模型、桌面4096阴影、材质和探针保持，不逐帧强制readPixels制造串行额外开销。该时间包含浏览器调度及软件GPU等待，不是GPU-only计时，也不与旧readPixels/gl.finish会话混算；不能据此承诺用户硬件帧率。三个机位各自使用独立Chromium会话，保留60条原始时间/绘制统计；runner硬件个体差异未受控，不作跨runner速度提升结论。

| 机位 | 样本 | 中位ms | P95 ms | 绘制调用 | 单帧提交三角面 |
|---|---:|---:|---:|---:|---:|
| b05-gate-close | 60 | 23758.95 | 46889.20 | 1931 | 7,607,326 |
| b05-hoop | 60 | 6109.90 | 12271.10 | 469 | 2,904,474 |
| b05-overview | 60 | 26727.15 | 53536.40 | 1981 | 7,715,740 |

## 真实通行范围

在完整可见场景和BVH上对路径侧向±0.34m、中心、三个身体高度采样；每0.6m以内校验地面和1.9m净空，门洞3×3网格。未引入人物物理控制器。

| B05路线 | 失败数 |
|---|---:|
| main-gate | 0 |
| gate-duty | 0 |
| side-gate | 0 |
| stone-front | 0 |
| stone-side | 0 |
| court-east | 0 |
| court-track | 0 |
| covered-track | 0 |
| field-infield | 0 |
| rostrum-upper | 0 |
| rostrum-lower | 0 |
| flag-platform | 0 |
| sports-auxiliary | 0 |
| pool-toilet | 0 |
| public-20-B1 | 0 |
| public-20-B2 | 0 |
| public-20-B3 | 0 |
| public-20-B4 | 0 |
| public-20-B5 | 0 |
| public-20-B6 | 0 |
| residential-spine | 0 |

完整逐样本数据见 [checks/report.json](final-r1.1/checks/report.json)，没有用飞行相机能穿墙代替通行结论。

## 复现

```bash
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11b/b05/model.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11b-b05/export.mjs
# Playwright安装在外部目录，避免修改应用锁文件
npm install --prefix /tmp/yali-b05-browser playwright@1.62.0
/tmp/yali-b05-browser/node_modules/.bin/playwright install --with-deps chromium
export PLAYWRIGHT_MODULE=/tmp/yali-b05-browser/node_modules/playwright
# 新phase不覆盖本次归档；逐组也可在独立runner并行
for group in gate courts field residential checks regression mobile fallback baseline; do
  B05_GROUP=$group B05_PHASE=reproduction node tools/m11b-b05/capture.mjs
done
for view in b05-gate-close b05-hoop b05-overview; do
  B05_MEASURE_VIEW=$view B05_PHASE=reproduction node tools/m11b-b05/measure-frame-pacing.mjs
done
```

Linux图中文字需系统CJK字体，但本仓库及审阅包不分发字体。
