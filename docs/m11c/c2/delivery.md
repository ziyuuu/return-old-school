# C2 R1｜学生形象与基础动画交付

**IMPLEMENTED / REVIEW_PENDING**。继承C1 R1.2手机优化和全部已认可校园模型；不登记acceptance、不合并main。

Viewer：`artifacts/m11c-c2/Yali_C2_R1_Viewer.html`。最终 SHA256 以本轮重新导出的 `viewer-manifest.json` 为准。

实现：证据有界的偏大尺码秋季校服学生工作重建；idle / walk / run / air 四态。未阻挡时动画使用稳定的水平运动速度，真实阻挡时回落到实际位移速度，避免Rapier接地tick抖动造成走路瞬时回idle。第三/第一人称、坡速、碰撞、相机与手机流畅档沿用C1 R1.2。无校徽、班级、个人脸或外部人物纹理。

本轮还修正第三人称美术可读性：继续使用共享校园色板，但改用深红、暖米白、深藏蓝和暖中性色，并把肩部、侧条和背面细条做到默认背后相机也能读取；精确染色、剪裁、发型和体型仍为H。

最终测试和 Chromium WebGL 结果由本轮 C2 art-review 流水线重新绑定同一 Viewer 后写入 QA；C3尚未开始。
