# C2 R2｜学生角色实装交付

**IMPLEMENTED / REVIEW_PENDING**。工程、发布和本轮实际截图复核已完成；用户尚未认可实装，不登记acceptance、不合并main。C2 R1错误校服/人偶已被否定；R2采用用户确认的白领、蓝身、胸袖上白下红和左胸YL。

## 文件与操作

[校园离线Viewer](../../../artifacts/m11c-c2/r2-final/Yali_C2_R2_Viewer.html) · [人物模型工坊](../../../artifacts/m11c-c2/r2-final/Yali_C2_R2_Character.html) · [带动画GLB](../../../artifacts/m11c-c2/r2-final/Yali_Student_C2_R2.glb)

工坊和校园使用同一蒙皮模型。工坊可切正/侧/背/面部及站立/行走/跑步，并导出GLB；适合先核看实际人物，而非概念图。校园版桌面WASD/方向键移动、Shift跑、拖动观察、V第一/第三人称、Esc暂停；手机左摇杆、右侧观察、跑步按钮。帮助里可换流畅/清晰档。

## 本轮完成及实际验证

已实际应用80个朝外袖冠封口三角面，消除截图中的肩部透空；未改变原有轮廓、5蒙皮批次、C1控制器、校园几何或共享日光。旧R2文件及旧QA在原路径保留。

生产构建通过，单元测试44/44；真实Chromium浏览器19项检查、15张截图，覆盖人物工坊、校园及390×844触屏。已下载原始产物并核对文件与输入摘要，随后查看全部15图并复核肩部近景及动作采样帧。

[本轮QA汇总](../../../qa/m11c-c2/r2/shoulder-final/report.json) · [实际画面复核与限制](../../../qa/m11c-c2/r2/shoulder-final/inspection.md)

源码：`16bf4cabc9e1f90a116d11f653bd25575a158be0`。构建、三组浏览器、普通Git推送与ls-remote核验运行：`34825479955`。后续文档提交不改变受测运行文件。

人物本体80,400三角面、15关节、5个蒙皮批次、3,574,496字节几何缓冲；GLB含Idle / Walk / Run动画。

## 规范、证据和剩余边界

遵循v1.0 + mobile-r12，角色UV和集中颜色的局部偏离详见[设计](design.md)。[证据记录](../../../data/m11c/c2/evidence.json)将用户A确认与精确H参数分开；生成设定图及其中所谓照片面板不是历史照片。人物为通用虚构学生。

**当前实装比批准的生成设定图更简化**：头发仍可见片状分块，脸部细节、衣服褶皱和鞋面细节较少，不把工程通过写成设定图精细度已达到。实装美术是否认可由用户审阅决定。

**实体手机流畅度仍未验收。** 模拟触屏和SwiftShader不能证明用户手机不卡。继承C1 R1.2手机优化与可逆画质档；人物工坊60样本及静止点CPU更新样本保留原值，不换算为全校园/实体手机FPS，不涵盖真机热降频与完整帧调度。

接地影仍是程序化近似。C3全校园连续通行尚未开始，本次不新增复杂表情、换装、NPC或玩法。

## 文件哈希

- `Yali_C2_R2_Character.html` SHA256 `bbb4283ae8692b3510ddb6b0389dde99c6c8c236859d3a49b98e0f8679625c3e`
- `Yali_C2_R2_Viewer.html` SHA256 `2a7838dbf174c588a5b0d019a8fc56a49fb2dc7cc6ffda48d404f389f497150b`
- `Yali_Student_C2_R2.glb` SHA256 `288a34d5ff88062e742b2a6b4b3bb20a7f615f67598c64a488457737acdb6b69`

## 复现

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/*.test.mjs tests/m11c/c2/*.test.mjs tests/render-upgrade/*.test.mjs
export C2_ARTIFACT_DIR=artifacts/m11c-c2/r2-final
export C2_QA_ROOT=qa/m11c-c2/r2/shoulder-final
node tools/m11c-c2/export-r2.mjs
GROUP=studio node tools/m11c-c2/release-capture.mjs
GROUP=campus node tools/m11c-c2/release-capture.mjs
GROUP=mobile node tools/m11c-c2/release-capture.mjs
```

需已安装Playwright/Chromium，`PLAYWRIGHT_MODULE`可指定模块目录。重复验证应把`C2_QA_ROOT`设为新的目录，保留历史原始结果。
