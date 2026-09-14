# C2 R2｜学生角色实装交付

**IMPLEMENTED / REVIEW_PENDING**。C2 R1错误校服/人偶已被用户否定；R2采用用户确认的白领、蓝身、胸袖上白下红和左胸YL。不登记acceptance、不合并main。

## 文件与操作

校园离线文件：`artifacts/m11c-c2/r2/Yali_C2_R2_Viewer.html`。独立人物工坊：`artifacts/m11c-c2/r2/Yali_C2_R2_Character.html`。GLB：`artifacts/m11c-c2/r2/Yali_Student_C2_R2.glb`，含Idle/Walk/Run动画。工坊和校园使用同一蒙皮代码，不存在截图专用高模。

桌面WASD/方向键移动、Shift跑、拖动观察、V第一/第三人称、Esc暂停；手机左摇杆、右侧观察、跑步按钮。帮助里可换流畅/清晰档。工坊可切正/侧/背/面部及站立/行走/跑步，并导出GLB。

## 规范、证据和边界

遵循v1.0 + mobile-r12，角色UV和集中颜色的局部偏离详见[设计](design.md)。[证据记录](../../../data/m11c/c2/evidence.json)把用户A确认与精确H参数分开；生成设定图不是历史照片。人物为通用虚构学生。模型、姿态和动画可审阅，不把程序化造型冒称照片级一致。

C1控制/碰撞/手机优化及已认可校园保留；人物5个蒙皮材质批次。接地影是近似，C3全校园通行尚未开始。软件GPU和模拟触屏不等于实体手机流畅性验收；工坊60帧样本只代表角色及共同日光/地面，不冒充全校园FPS。

## 复现

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/*.test.mjs tests/m11c/c2/*.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c2/export-r2.mjs
GROUP=studio node tools/m11c-c2/release-capture.mjs
GROUP=campus node tools/m11c-c2/release-capture.mjs
GROUP=mobile node tools/m11c-c2/release-capture.mjs
```

需要已安装Playwright/Chromium；PLAYWRIGHT_MODULE可指定模块目录。本轮报告在`qa/m11c-c2/r2/release/report.json`；性能、错误、截图和受测SHA均绑定本轮产物，旧报告不替代本轮测试。

## 受测产物

单元测试43/43；浏览器19项检查，15张截图。

- `Yali_C2_R2_Character.html` SHA256 `3659af70db42d0558cff476552b49b332dc941a8e03fac1e71a1f80091605040`
- `Yali_C2_R2_Viewer.html` SHA256 `c662495d23a448ae28cdefee97f5649b0bdf8976707cd69e55be31c7829bfa1e`
- GLB SHA256 `2a0bbc6292233bdf0d39642c56469525b6b47f29fa23b2d0f13d3b3dce660634`

## GLB导出修复与受测来源

初次人物工坊检查在GLB程序纹理转换处失败，原失败记录保留。修复仅作用于导出副本，保留运行材质、贴图数据、骨骼与姿势；校园Viewer逐字节不变。校园/手机报告来自34820454140，人物工坊来自本次恢复运行。实际图像人工复核与用户认可以独立记录为准。
