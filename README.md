# 复原雅礼 · Return Old School

长沙雅礼中学东塘校区，2006—2010 年历史校园复原；面向校庆与校友回忆的非商业项目。独立校友创作，不代表学校官方。

2026-09-12 本地模型与渲染精化第二轮：**193.5 万 → 329.8 万三角面**，进一步加密曲面、倒角与叶片，建立 17 类独立材质、校园局部反射，并在原色板内优化色彩。[最新交付与对比](docs/render-refinement-r2-2026-09-12.md) · [首轮记录](docs/render-upgrade-2026-09-12.md)。工程检查已通过，效果待用户审阅。

## 当前状态：B01—B03 已认可，B04 已实现待审

后续模型统一遵循 [模型、材质与渲染标准 v1.0](docs/model-rendering-standard.md)，包括几何精度、17 类材质、色板、日光与深度、共享模块接入及验收清单。实施入口见 [AGENTS.md](AGENTS.md)。

**B01与B02：COMPLETE / ALUMNI_APPROVED。** [B02认可记录](docs/m11b/batch02/acceptance.md)及机器可读认可记录保持不变。

**B03 R2：COMPLETE / ALUMNI_APPROVED（2026-09-13）。** [第三批认可记录](docs/m11b/batch03/acceptance.md)。已认可面对食堂的“左打印／中楼梯／右小卖部”，以及左右对称弧梯、圆形中间平台与中央上行段。圆台与精确梯形仍是依据校友暂定记忆的H补全，不冒称原照片证明。继承main的R1.1台阶接缝、后门扇、蓝色告示区与手机相机修复。

**B04：IMPLEMENTED / REVIEW_PENDING。** 已深化 13 科学馆、17 长雅楼，并对 07／16／21 作证据边界内的保守深化；07医务室线索、16历史用途及21正式身份继续保留U/H。长雅楼正门直达道路保持不变，不恢复绿色绕路。离线 Viewer：`artifacts/m11b-b04/Yali_B04_R1_Viewer.html`，SHA256 `d8e2b969802cfefcaba9d27da496f26ef8e9d1d85eb2a8bc7681d243f3002eda`。[B04交付](docs/m11b/batch04/delivery.md) · [证据与H边界](docs/m11b/batch04/evidence.md) · [QA](qa/m11b-b04/README.md)。B04尚未登记 acceptance，等待用户明确审阅。

[第三批交付说明](docs/m11b/batch03/delivery.md) · [第三批照片及H边界](docs/m11b/batch03/evidence.md) · [同源入口图](docs/m11b/batch03/access.svg)。原建筑 QA 见 `qa/m11b-b03/browser-report.json`，后续精化 QA 见 `qa/render-upgrade/r2/report.json`；旧报告及 Viewer 的待审文字保留生成时状态，当前认可由 acceptance 记录确定。

导出 `node tools/m11b-b03/export.mjs`；检查 `node tools/m11b-b03/check.mjs`；实际浏览器/打包 `python tools/m11b-b03/capture.py` / `python tools/m11b-b03/package.py`。完整可接续Workspace与离线单文件Viewer、照片Review、SVG一起交付。照片不作场景材质，含原照的私下Review不公开提交。

## 第一批认可成果继续继承

**M1.1-B Batch01（最终交付 R3.1）：COMPLETE / ALUMNI_APPROVED。**

2026-09-11，用户明确确认：“第一批可以了。请落地吧。” 本次记录的是对已实现、已交付 R3.1 的认可，不是再次改模。后续批次直接继承这份建筑成果。

[第一批认可记录](docs/m11b/batch01/acceptance.md) · [机器可读状态](data/m11b/batch01/acceptance.json) · [开发计划及后续批次](docs/development-plan.md) · [R3.1 交付](docs/m11b/shutter-fix/delivery.md)

已认可内容：五层主教学楼及四楼后坪；中央轻弧广播站等功能体量；两端前伸主体墙与内退门廊；凹口内侧墙上的扩大卷帘开口，默认收起；加大的雨棚和外移柱列；连续厕所楼体、逐层连接桥及桥下通路；田径场—中央国旗—主教学楼—旧图书馆共轴。

“入口位于正面两端”指门廊所在区域；真正的卷帘门洞位于凹口内侧的侧返墙，不在门廊后墙。此前 R3 的后墙门洞解释已由 R3.1 取代。

## 交付与接续

已认可的模型源码：`8262ca7db79746ebce98210950e045eab11dfbe0`。
源码及工程 QA 归档：`fff81099cbc4cb93e1c53bd85244099e66c3813c`。
Viewer SHA256：`715bdcc2e9c50e680c1d0d1bd4011a29ba95d041fd5cb2a21b5e7b6c6d9c38f7`。

工程记录为 10 项定向测试、6 组实际 WebGL 检查和 8 张截图，见 [QA](qa/m11b-shutter-fix/browser-report.json)。QA 中的 REVIEW_PENDING 是截图生成时状态；后续认可由 acceptance.json 单独记录，不篡改历史报告、不把认可登记冒充重新测试。

M1.1-B共五批：B01/B02/B03已认可；B04已实现待审；之后为B05校门及体育生活附属建筑。建筑批次之后进入M1.1-C通行整合。

## 运行与定向验证

```bash
npm ci --prefix apps/campus
npm run dev --prefix apps/campus
npm run build --prefix apps/campus
```

按改动范围执行必要检查，不把每次小修扩大为全校园回归。以下为已认可B01侧门的历史复现入口，不是B02的必跑回归：

```bash
node --test tests/m11b/r3/shutter-fix.test.mjs
node tools/m11b/shutter-fix/export.mjs
python tools/m11b/shutter-fix/capture.py
python tools/m11b/shutter-fix/package.py
```

浏览器截图工具需要 Playwright/Chromium；沿用仓库既有环境。输出和完整复现说明见 R3.1 交付记录。此处命令用于重现，不表示本次认可登记重新运行了构建或 QA。

## 不变的项目原则

真实校园复原 > 建筑与环境精度 > 白天校园漫游 > 夜间覆盖层。当前不制作剧情、谜题、怪物或玩法。

M0 COMPLETE；M1.0 R4 COMPLETE / FROZEN；M1.1-A P3/P4 COMPLETE / ALUMNI_APPROVED。主侧门与独立道路、入口长坡、下沉运动区、抬高篮球场、三旗宽前坪、食堂下层小卖部以及体育馆/音乐楼关系继续保持。

沿用 Vanilla Three.js、TypeScript、Vite、WebGL2、程序化 Canvas Ramp LUT；不使用外部照片作为场景材质，无 bloom/vignette/DoF。不为建模方便重排校园。A/P 证据与 H 工作参数继续分开维护，资料空缺不作为反复停工的理由。

第一批完成范围为建筑外壳及相关入口/桥接几何，不含完整内部楼梯、完整内装或物理人物控制器。历史实施记录：[B01 初版](docs/m11b/batch01/delivery.md) · [R2](docs/m11b/batch01-r2/delivery.md) · [R3](docs/m11b/batch01-r3/delivery.md)。旧版说明不再代表当前入口构造或认可状态。
