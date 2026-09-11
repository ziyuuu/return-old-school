# R3.1 侧墙卷帘门修复与第一批完成记录

**COMPLETE / ALUMNI_APPROVED；工程验证 PASS。**

2026-09-11，用户明确确认“第一批可以了。请落地吧。” 第一批累计成果以最终交付 R3.1 正式认可，详见 [第一批认可记录](../batch01/acceptance.md) 与 `data/m11b/batch01/acceptance.json`。这是后续认可登记，不是再次修改模型或重新执行测试；以下工程结果保留原执行事实。

实际开口移到两处凹口内侧返墙，后墙原门洞封回；卷帘收起，保留卷盒、导轨和收拢叶片，不装关闭门板。门洞 H 工作值 2.65×2.80m；雨棚 4.50×3.35m，柱列向前 1.01m 并外展；三级台阶与局部门前平台适配。主楼五层、中央轻弧、后坪、桥与主轴不变。

原工程记录：10 项定向测试；6 组实际 WebGL 检查；8 张截图。手机为 viewport 检查，不是物理手机实机。内部楼梯/完整内装不在本轮。原 QA 文件中的 REVIEW_PENDING 是当时状态，不回写历史报告。

已认可的源码：`8262ca7db79746ebce98210950e045eab11dfbe0`。
源码及 QA 归档：`fff81099cbc4cb93e1c53bd85244099e66c3813c`。
Viewer SHA256：`715bdcc2e9c50e680c1d0d1bd4011a29ba95d041fd5cb2a21b5e7b6c6d9c38f7`。

本次认可不改变 Viewer 字节，不另行生成视觉版本；后续批次继承相同几何。全部工作尺寸继续保留 H，认可状态与证据等级分别记录。

复现：`npm ci --prefix apps/campus`；`node --test tests/m11b/r3/shutter-fix.test.mjs`；`npm run build --prefix apps/campus`；`node tools/m11b/shutter-fix/export.mjs`；`python tools/m11b/shutter-fix/capture.py`；`python tools/m11b/shutter-fix/package.py`。

下一批：体育馆＋贴体四层音乐楼。M1.1-B 剩余四批及后续通行/精化分工见 [开发计划](../../development-plan.md)。
