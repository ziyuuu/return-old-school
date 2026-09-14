# C2 R1｜学生形象与基础动画交付

**IMPLEMENTED / REVIEW_PENDING**。继承C1 R1.2手机优化和全部已认可校园模型；不登记acceptance、不合并main。

Viewer：`artifacts/m11c-c2/Yali_C2_R1_Viewer.html`，SHA256 `fe6c65aff7c796af3cd646a2d8f54ed8f909c44f531921af0773f0622be6a5c0`。

实现：证据有界的偏大尺码秋季校服学生工作重建；idle / walk / run / air 四态。未阻挡时动画使用稳定的水平运动速度，真实阻挡时回落到实际位移速度，避免Rapier接地tick抖动造成走路瞬时回idle。第三/第一人称、坡速、碰撞、相机与手机流畅档沿用C1 R1.2。无校徽、班级、个人脸或外部人物纹理。

节点测试34/34；实际Chromium 7项检查、4张实际WebGL截图通过。桌面视觉QA使用720×480可逆流畅档、手机390×844流畅档，均为完整校园几何；精确剪裁、色值、发型和体型仍为H；C3尚未开始。
