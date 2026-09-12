# M1.1-B B03｜图书馆、后花园、上坡与食堂小卖部

版本：**R1.1 审阅版**。状态：**IMPLEMENTED / REVIEW_PENDING**。B01与B02继续 **COMPLETE / ALUMNI_APPROVED**。实现不等于校友认可，工程检查结果以实际QA为准。

本批替换18、19、11、12旧生成器，接入默认完整校园Viewer。18为旧图书馆的入口及窗带外壳，新增最小前后门厅；19完成照片可见的宽弧梯、二层平台真入口及后花园局部曲线边缘/石铺地。用户明确的上坡关系以局部地形适配实现。11完成上下层实体入口和宽梯；12保持食堂下层真开口和最小内部进深。

主要路径：主楼后门/15—25桥下→上坡→图书馆低台阶→内退正门→门厅；门厅→后门→低台阶→后花园；花园→宽弧梯→二层平台→短门厅。西侧也可绕馆到花园。食堂从已有道路分别通向上层宽梯入口、下层小卖部及外缘通路。

## 参数与范围

主楼后方地面+3.49m保留；图书馆前场+4.69m；图书馆门厅+5.14m；二层平台+8.94m。食堂下层+3.24m、上层入口+6.84m。全部数值是H工作标高，不是测量海拔。图书馆/食堂三层沿用原H包络，不作为照片确定事实。

参数 `data/m11b/batch03/input.json`，照片登记 `evidence.json`，实现 `apps/campus/src/batch03-core.mjs` / `batch03-scene.ts`。同源校核图 [access.svg](access.svg)。证据及局部坡面例外见 [evidence.md](evidence.md)。

不包含整栋内装、阅览室书架、厨房/货架/商品、全楼内部交通、物理人物控制器。原道路节点/宽度、全部设施平面位置、主轴、B01卷帘侧门、B02贴馆音乐楼、P3/P4运动区及原冻结档案不变。

## 复现与交付

`npm ci --prefix apps/campus`；`npm run build --prefix apps/campus`；`node tools/m11b-b03/check.mjs`；`node tools/m11b-b03/export.mjs`；`python tools/m11b-b03/capture.py`；实际通过后 `python tools/m11b-b03/package.py`。

输出 `artifacts/m11b-b03/Yali_M1_1_B_B03_Viewer.html`、`Review.html`、`Workspace.zip`、`Access.svg`（相同B03前缀）。单HTML场景自包含；照片只用于私下审阅，不提交公开仓库或用作场景材质。

## R1.1 实际检查归档

8组定向几何检查、14组真实Chromium检查通过；8条路线、5处完整门洞；17张实际截图（含390×844手机viewport）。file://单HTML打开无外部资源请求及JavaScript/WebGL错误。不是物理手机测试或人物控制器。

受测源码 `dda251c41efd31ffb540a652cb179da286e27c23`；Viewer SHA256 `f693ae0ab778dab6390e6c992b29fd9be42d5cc3d85a907d093daedea2e442a1`。工程通过，本批仍 IMPLEMENTED / REVIEW_PENDING。
