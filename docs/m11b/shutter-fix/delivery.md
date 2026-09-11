# R3.1 侧墙卷帘门修复

IMPLEMENTED / REVIEW_PENDING；工程验证PASS。

实际开口移到两处凹口内侧返墙，后墙原门洞封回；卷帘收起，保留卷盒、导轨和收拢叶片，不装关闭门板。门洞H工作值2.65×2.80m；雨棚4.50×3.35m，柱列向前1.01m并外展；三级台阶与局部门前平台适配。主楼五层、中央轻弧、后坪、桥与主轴不变。

10项定向测试；6组实际WebGL检查；8张截图。手机为viewport检查，不是物理手机实机。内部楼梯/完整内装不在本轮。

源码 `8262ca7db79746ebce98210950e045eab11dfbe0`；Viewer SHA256 `715bdcc2e9c50e680c1d0d1bd4011a29ba95d041fd5cb2a21b5e7b6c6d9c38f7`。

复现：npm ci --prefix apps/campus；node --test tests/m11b/r3/shutter-fix.test.mjs；npm run build --prefix apps/campus；node tools/m11b/shutter-fix/export.mjs；python tools/m11b/shutter-fix/capture.py；python tools/m11b/shutter-fix/package.py。
