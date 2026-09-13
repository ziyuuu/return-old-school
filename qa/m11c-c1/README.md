# C1 R1｜真实浏览器与控制器QA

**IMPLEMENTED / REVIEW_PENDING**。受测源码`65284ef8aece3d191b967dd7dbfa87715789a369`；Viewer `artifacts/m11c-c1/Yali_C1_R1_Viewer.html`，3,872,519字节，SHA256 `96d2404bd56a9cf766a452f586bb4b6141957605c8266a710af9e9513e0737dc`。本页是已完成证据归档，不是一次新浏览器测试；原报告/截图逐字节复制，摘要验证哈希。

构建通过；14项控制器/继承测试＋9项共享渲染测试＝23/23。7组Chromium会话、69项检查、26张真实图。六组来自运行34769723661，移动端来自真实触摸复测34770237456，全部绑定同一个Viewer。原主运行整体failure不改写；其移动端合成事件测试错误保留于[历史](history/README.md)。

[机器报告](final-summary.json) · [截图审阅](review.html) · [不变性校验](r1/preservation.json)

## 验证范围

真实W/Shift输入、触屏摇杆移动/释放/取消、暂停/失焦清键、视角切换与回到起点；侧墙阻挡及球体扫掠相机回缩。主门长坡、围墙侧路到家属区三叉路、石台坡道、石台四级台阶、篮球场门口和体育馆入口六条代表路线通过。同一个Rapier胶囊按固定模拟时间执行，不把脚本时间当设备实际速度，不代替C3全校园连续走测。

390×844重新加载，文档宽390，阴影2048。六个既有机位、顶视/主轴正交和模拟EXT_clip_control缺失后的实际对数回退均检查。有效组JS/WebGL错误0，外网请求0；完整受测Viewer，非另建低面数场景。

## 美术与性能边界

v1.0共享色板、材质、日光、反射、深度和校园几何不改；与已认可base`c6dcf6ed2bc7a976cd7994402305b80ef0fb6127`逐文件核对。无照片贴图、bloom、暗角、景深，不降可见校园精度。比例人形弧面48段，复用共享表面；接地影是程序化近似，不是真实动态太阳投影。

审阅模式8,144,396可见三角面；加人形后8,180,590，增加36,194。含人形几何缓冲258,442,292字节，不含物理/WASM内存；这不是单帧提交面数。

**未作真实设备性能验收。** 151.0.7922.34 / SwiftShader软件GPU，1280×840，主门第三人称静止，8帧预热后60帧间隔：中位20982.50ms、P95 41964.90ms。环境极慢，不可称为流畅或手机达标。同期idle控制器CPU中位0.90ms，不可替代总帧耗时；移动/切换碰撞区域和实际硬件仍须另测。原60条数据保留。

## 操作

打开离线HTML，加载后默认在主校门第三人称漫游。WASD／方向键移动，Shift跑步，拖动观察，滚轮调远近，V切换第一／第三人称，Esc暂停，R返回本次起点。触屏使用左摇杆、右侧拖动和跑步切换按钮。

“暂停／帮助”中可选主校门、侧门围墙小路、篮球场东入口、校名石坡脚、体育馆前坪五个起点，也可切回建筑审阅。失焦/页面隐藏暂停并清除输入。没有跳跃、游泳或任务玩法。

## 复现

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/controller.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c1/export.mjs
npm install --prefix /tmp/c1-browser --save-exact playwright@1.62.0
/tmp/c1-browser/node_modules/.bin/playwright install --with-deps chromium
export PLAYWRIGHT_MODULE=/tmp/c1-browser/node_modules/playwright
for group in input lane terrain mobile review fallback performance; do
  C1_GROUP=$group C1_PHASE=reproduction node tools/m11c-c1/capture.mjs
done
```

独立phase不覆盖归档。导出可重现Viewer字节，manifest的生成时间/HEAD会随导出改变；逐运行源文件哈希用于核对。Linux中文使用系统字体，不分发字体文件。
