# 复原雅礼 · Return Old School

长沙雅礼中学东塘校区，主要时代2006—2010年。独立校友非商业复原，不代表学校官方。

## 当前状态

**B01—B05：COMPLETE / ALUMNI_APPROVED。** B03为建筑R2，B05为R1.2。旧Viewer/QA的待审文字是历史状态，认可以各批acceptance为准。**C1 R1：IMPLEMENTED / REVIEW_PENDING**，可见比例人形已能操控漫游，等待审阅；不是C2最终学生形象，也不是C3全校园通行验收。

[C1离线漫游](artifacts/m11c-c1/Yali_C1_R1_Viewer.html) · [交付/操作](docs/m11c/c1/delivery.md) · [真实截图](qa/m11c-c1/review.html) · [QA](qa/m11c-c1/README.md) · [开发计划](docs/development-plan.md)

Viewer SHA256：`96d2404bd56a9cf766a452f586bb4b6141957605c8266a710af9e9513e0737dc`。

## 已认可校园

[B01 R3.1](docs/m11b/batch01/acceptance.md)：主楼/卷帘侧门/厕所连桥；[B02](docs/m11b/batch02/acceptance.md)：体育馆/贴体音乐楼；[B03 R2](docs/m11b/batch03/acceptance.md)：图书馆/后花园双弧梯/圆台/上坡及食堂左打印/中楼梯/右小卖部；[B04 R1](docs/m11b/batch04/acceptance.md)：科学馆/长雅楼及07/16/21；[B05 R1.2](docs/m11b/batch05/acceptance.md)：校门石前置坡台、侧路围墙、运动设施、生活外壳和主要植被。

H/U位置、尺寸、身份、树种和年代未因认可变成测绘事实。C1不重排上述建筑、路网、高差或植物。

## 操作

打开离线HTML，加载后默认在主校门第三人称漫游。WASD／方向键移动，Shift跑步，拖动观察，滚轮调远近，V切换第一／第三人称，Esc暂停，R返回本次起点。触屏使用左摇杆、右侧拖动和跑步切换按钮。

“暂停／帮助”中可选主校门、侧门围墙小路、篮球场东入口、校名石坡脚、体育馆前坪五个起点，也可切回建筑审阅。失焦/页面隐藏暂停并清除输入。没有跳跃、游泳或任务玩法。

## 开发与规范

```sh
npm ci --prefix apps/campus
npm run dev --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/controller.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c1/export.mjs
```

[统一标准v1.0](docs/model-rendering-standard.md) · [AGENTS.md](AGENTS.md)。Three.js/TypeScript/Vite及共享色板/材质/天空/日光/反射/BVH继续沿用。Rapier兼容包/WASM嵌入离线文件。无照片贴图、bloom、暗角、景深，不擅自减面。

软件GPU数据不等于真实设备流畅性通过。C2制作学生形象，C3整合全校园通行，M1.1-D复核空间体验，M1.2完善必要室内/生活细部。不制作剧情、怪物或战斗。历史产物和认可记录均保留，不以旧待审页误判当前状态。
