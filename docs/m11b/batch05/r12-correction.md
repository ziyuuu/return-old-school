# B05 R1.2 — 校园石、侧门围墙与树木修正

状态：IMPLEMENTED / REVIEW_PENDING；不登记 acceptance，不更新 main。

用户指示为A：校园石在门右侧建筑**前方**，由斜坡到平台；侧门小路双侧围墙延续至家属区三叉路。上传照片只做形态参照，拍摄年份未核，不复制现代标语、牌匾、墙上完整文字。精确米制尺寸、围墙高度与终点坐标仍为H。

原R1.1 Viewer和QA不覆盖。R1.2导出使用 `node tools/m11b-b05/export-r12.mjs`，新文件 `artifacts/m11b-b05/Yali_B05_R1_2_Viewer.html`、`viewer-manifest-r12.json`；新QA目录 `qa/m11b-b05/r12`。旧R1.1测试不能代表这次修正。验收记录以实际产生的报告为准。

## 实施

校园石从旧侧置工作点移到 `[-10.9,0.75,-4.5]`，在右门墩所在建筑前侧（建筑前沿z=-2，校门外为-z）。平台顶0.65m；侧坡从地面0.04m连续升至平台；四级短台阶与侧坡分开，不互相穿插。不再使用此前未上传草稿中会把平台放到门墩后方的z=3方案。记录旧锚点而不继续把它当不变量。

围墙沿累计路网 `side-gate → side-entry → side-branch → side-front-turn`，节点为 `[17,1.48] → [17,16] → [23,22] → [125,32]`。双侧内净宽3.2m、厚0.24m是H；共享转角交点连续接合，沿原地形落地。终点开放，添加短落脚面连接原B05家属区支路 `[129,32]`，形成可解释的三叉口，不新增通往主门的捷径。这是累计路网约束下的工作落位，不宣称三叉路经过实测。

树木保持57棵位置及前次体育馆视线修订，增加渐细枝干、细分冠簇和非球形轮廓。共享树冠detail=4不降低；新轮廓为B05 opt-in，不影响B01—B04默认树冠/爬藤。继续复用共享材质、色板、日光、反射和真实几何BVH。

标准v1.0；不使用照片贴图、不改变灯光或曝光、不减低树冠分段。新增叶团为H造型，不推定历史树种。原研究图不公开上传。

## 复现与校验范围

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11b/b05/*.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11b-b05/export-r12.mjs
export B05_VIEWER_FILE=artifacts/m11b-b05/Yali_B05_R1_2_Viewer.html
export B05_MANIFEST_FILE=artifacts/m11b-b05/viewer-manifest-r12.json
B05_GROUP=revision B05_PHASE=r12 B05_VIEWS=b05-stone,b05-gate-close,b05-lane,b05-fork,b05-tree,b02-photo-front,b05-overview,top,r3-axis node tools/m11b-b05/capture.mjs
B05_GROUP=checks B05_PHASE=r12 node tools/m11b-b05/capture.mjs
B05_GROUP=mobile B05_PHASE=r12 node tools/m11b-b05/capture.mjs
B05_GROUP=fallback B05_PHASE=r12 node tools/m11b-b05/capture.mjs
B05_MEASURE_VIEW=b05-stone B05_PHASE=r12 node tools/m11b-b05/measure-frame-pacing.mjs
```

本轮目标是新构件近中景、主门同框、完整侧路及三叉口、树木与体育馆视线、总览与正交、新入口与既有入口、窄屏及模拟对数深度回退。性能为真实软件GPU采样，不保证用户设备帧率。

用户原图SHA256（只公开哈希）：
- `IMG_5693.jpeg`: `9b2a44522d5081d45fd9f21a40c7dc076b2c9811ff1498ab77486a67ff2e42d6`
- `IMG_5694.jpeg`: `3691d3618605d15e70aaa9e82484aca07dc567ba065adc59eeb3c32412d21545`
- `IMG_5695.jpeg`: `0b62e7a79f07f0af51ff470af5421ee5a529e9f62151b6d7660afdb33302ea3a`
