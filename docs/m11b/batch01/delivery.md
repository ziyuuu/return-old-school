# M1.1-B 第一批交付

状态：IMPLEMENTED / REVIEW_PENDING。M1.1-A已获用户认可；本批单独待审。

工程结果：PASS。# tests 488；浏览器44/44；实际截图19张。

源码SHA：`0dcd9f94faf585f34c17616441f142063d45f38d`。Viewer SHA256：`e239e80bc285ef7161b77631aa805d6d1abccb46bd8d7644cd04433380571b34`。细项见`qa/m11b-b01/browser-report.json`及各射线记录。

交付：`artifacts/m11b-b01/`中的Viewer HTML、截图Review、Workspace ZIP、立面/连接图、二层平面图、回归清单和第三方许可。

复现：依次运行`npm ci`、全套node tests、`npm run build`、`node tools/m11b/export.mjs`、`python tools/m11b/capture.py`、`python tools/m11b/package.py`。

通过真实Chromium/软件WebGL2，不以DOM存在当作模型正确。手机只做viewport基础显示验证；当前自由校核相机不是物理角色。未完成全室内或其余建筑精化。

保留冻结占地、路网、楼层与P3/P4地坪。原照片不作为材质、不新增发布原图；审阅图均为本项目实际浏览器画面。
