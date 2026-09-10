# B01 R3 交付

状态：IMPLEMENTED / REVIEW_PENDING。工程：PASS。

源码：`f372d318086934377803b85adeec8a4e4b4ffbc7`；Viewer SHA256：`cab19d834d73e871e69232a43de58be199d60a3b4a98ceb02e151b6a5840a2ea`。

单元回归688；浏览器26/26；实际截图19。

#29：两端正面入口取代东山墙门廊；相邻五层主体墙超过一层门罩；中央采用水平浅弧，墙面、楼板、檐口一致。R2五层剖面、四楼后坪、厕所逐层连接与四节点共轴保留。新增两处H局部前坪衔接三级台阶，P3/P4数据不改。

细部工作值：入口墙相对原正面后退2m；主体局部前伸2m；主体墙比门罩前伸1.7m；3级台阶共0.45m；中央8.8m宽浅弧矢高0.35m，中央最前点不变。

范围：建筑外壳和入口几何，不含完整内部楼梯、内装或物理人物。图书馆只继承R2定位，不提前完成图书馆精模。原照片/校友文字是证据，生成图不作为证据。

复现：npm ci --prefix apps/campus；node --test tests/m10/*.test.mjs tests/m11a/*.test.mjs tests/m11a/patch02/*.test.mjs tests/m11b/*.test.mjs tests/m11b/r2/*.test.mjs tests/m11b/r3/*.test.mjs；npm run build --prefix apps/campus；node tools/m11b/r3/export.mjs；python tools/m11b/r3/capture.py；python tools/m11b/r3/package.py。
