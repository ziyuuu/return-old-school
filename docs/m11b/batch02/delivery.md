# M1.1-B B02｜体育馆03与音乐楼24

状态：**IMPLEMENTED / REVIEW_PENDING**。B01 R3.1 继续 **COMPLETE / ALUMNI_APPROVED**。工程结果以本批实际QA为准，不替代校友审阅。

03在原位重建低层门厅、通长前平台、内凹窗带、独立五环面板、高折屋盖及左外梯。24为四层直接贴馆楼体，沿既有入口登记补出门洞和最小门厅。默认Viewer已替换旧03/24生成器，不叠加旧墙、旧屋盖。所有场景材料仍为程序Canvas Ramp LUT；无照片贴图或后处理掩盖。

体育馆入口：主路→前坪→原低台阶→内退正墙真门洞→门厅。观赛入口：前坪→面对正门左外梯→梯顶落脚→上层侧门→短廊，可再进出前平台。音乐楼入口：既有绕馆路→原门前台阶→运动区侧偏西真门洞→最小门厅。共享墙不开无依据内部通门，环路沿组团外缘。

照片：[证据取舍](evidence.md)；参数：`data/m11b/batch02/input.json`；同源入口图：[access.svg](access.svg)。具体尺寸、屋盖精确侧倾、外梯上层门位、短廊及音乐楼缺图立面保留H。没有完整音乐楼入口原图，不用生成图代替。

导出：`node tools/m11b-b02/export.mjs`；正常构建：`npm run build --prefix apps/campus`；定向几何：`node tools/m11b-b02/check.mjs`；实际浏览器：`python tools/m11b-b02/capture.py`；通过后打包：`python tools/m11b-b02/package.py`。输出在 `artifacts/m11b-b02/`，Viewer、Review、Workspace、Access均使用 `Yali_M1_1_B_B02_` 前缀。

不包含全场内装、完整看台、音乐教室家具或最终人物控制器。前坪/运动面高差、P3/P4、第一批侧返墙开启卷帘门、厕所连接与三旗主轴不改。`data/m10`及冻结基线不动。

## 实际工程记录

8组定向几何检查通过；11组真实Chromium检查通过。5条路线检查真实网格支撑及身体/头部净空，4个完整门洞抽查；共享墙阻断、旧馆体移除，B01入口/主轴/三旗及手机viewport抽查通过。

实际截图16张（含两幅原照片近似对照机位、门厅内回望及手机viewport）。file://单文件加载未请求外部网络资源，无JavaScript/WebGL错误。

受测源码 `ef4b057361313aaf3143afd7e7fcf7709981c281`；Viewer SHA256 `a7f05a435b1a31a160e02ef2b44d3130f136425e38df54a3e72750c064b1d6d6`。工程PASS不等于校友认可，本批继续REVIEW_PENDING。
