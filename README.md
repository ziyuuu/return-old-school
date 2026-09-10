# 复原雅礼 · Return Old School

长沙雅礼中学东塘校区，2006—2010历史校园复原。服务校庆和校友回忆，非商业项目。

## 当前：M1.1-B 第一批第二轮（B01 R2）

**五层旧主教学楼＋连续厕所与逐层桥＋四节点校园主轴。新画面 REVIEW_PENDING。**

主楼按校友明确剖面重组：一至三层为教室—中走廊—教室；四层为教室—有顶走廊—露天大坪；五层为教室—走廊。中央前凸为广播站等功能区，不是中央楼梯；两侧楼梯间正面实墙。教学楼侧门补方柱、平顶门罩及内退门洞。侧门平台先沿用已认可地坪，局部外台阶高差尚未展开。完整内部梯段、家具和人物控制器不在本批。

田径场—中央国旗—主教学楼—旧图书馆同轴。该校友新确认驱动的布局例外见 **#28**：以田径场既有X73为工作轴，仅15、18、旗台及有关门前/后门节点横向适配；无关道路、宽度、运动区位置不变。五层厕所和第五层桥为沿“每层相连”原则的H延伸。

[本轮方案](docs/m11b/batch01-r2/plan.md) · [新证据登记](data/m11b/batch01-r2/evidence-manifest.json) · [工程交付记录](docs/m11b/batch01-r2/delivery.md) · [实际浏览器QA](qa/m11b-b01-r2/browser-report.json) · [开发计划](docs/development-plan.md)

## 运行与复现

```bash
npm ci --prefix apps/campus
npm run dev --prefix apps/campus
```

```bash
node --test tests/m10/*.test.mjs tests/m11a/*.test.mjs tests/m11a/patch02/*.test.mjs tests/m11b/*.test.mjs tests/m11b/r2/*.test.mjs
npm run build --prefix apps/campus
node tools/m11b/r2/export.mjs
python tools/m11b/r2/capture.py
python tools/m11b/r2/package.py
```

浏览器QA使用Playwright Chromium（安装 `python -m pip install playwright==1.62.0`、`python -m playwright install chromium`）。通过状态只来自当次`browser-report.json`，不沿用第一轮QA冒充新版本验证。工作流把单元日志、WebGL射线、桌面/手机尺寸截图、源码SHA和Viewer摘要一并归档。交付文件在`artifacts/m11b-b01-r2/`；Viewer单HTML离线运行，Review只使用实际截图。

第一次集成由带旧源码摘要校验的`tools/m11b/r2/integrate.py`执行；其后正常使用已提交的可读main.ts，无需再回放任何旧seed包。R2改动数据独立保留，原版构造与488项测试不删除。

## 已认可基底与历史边界

M0 COMPLETE；M1.0 R4 COMPLETE/FROZEN；M1.1-A（P3/P4）COMPLETE/ALUMNI_APPROVED。入口42m长坡、田径场下沉、篮球场抬高、三旗宽前坪和食堂下层小卖部继承。体育馆正门/前坪/左外梯、音乐楼贴体及环路保留。

`data/m10`、`baseline/m1.0-r4`、旧P3/P4数据不覆写；R2明确区别“归档冻结文件”与“经#28授权例外形成的有效布局”，不声称所有有效X/Z完全未变。

第一轮B01已验证源和19张截图保留于`21e907cb5399078f9068aed51477dd650022dc44`及`qa/m11b-b01`，不是当前R2五层结果。

Vanilla Three.js / TypeScript / Vite / WebGL2；程序化Canvas Ramp LUT；无外部校园照片材质、bloom、vignette或DoF。A/P决定关系和可见构造，H补全工作参数；不以资料空缺反复阻断制作。未把现代橘红色新主楼混入旧楼。

下一批为体育馆＋音乐楼外壳深化；之后其他建筑、实际通行与环境精化。夜间与玩法不在当前范围。项目为独立校友创作，不代表学校官方。
