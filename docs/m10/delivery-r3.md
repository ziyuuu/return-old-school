# M1.0.2-R3 已验证交付

## 状态

本轮用户要求的四项空间修订已落实到实际Three.js源码、工作坐标、导航拓扑、同数据总图与文档。GitHub issues [#8](https://github.com/ziyuuu/return-old-school/issues/8)、[#9](https://github.com/ziyuuu/return-old-school/issues/9)、[#10](https://github.com/ziyuuu/return-old-school/issues/10)、[#11](https://github.com/ziyuuu/return-old-school/issues/11) 已按工程修复完成关闭。校友最终验收与后续精模仍未因此完成。

实际修改源码、生成数据及截图提交：`e36a17ffad129673a6540c652ebd8b12f9692826`。

[成功CI：34384416932](https://github.com/ziyuuu/return-old-school/actions/runs/34384416932)；该次运行构建的源码输入为`04efda487698de940ad30b8c2fe88b7cb6a6594f`，CI应用可审计迁移/校核补丁后将真实源文件提交为上面的e36a17f。以后直接使用已提交源码，无需重复移动对象。

## 实际修订

| Issue | 完成项 | 实机证据 |
|---|---|---|
| #8 | 27在总图左侧；02位于原石位右侧；移除入口处主路与侧路的直接接边及铺装 | [总图](../../qa/m10-r3/top.png)、[入口](../../qa/m10-r3/entrances.png) |
| #9 | 17左移，道路对准北侧实际门洞，门前铺装随数据生成 | [长雅正门](../../qa/m10-r3/longya.png) |
| #10 | 20包络和真实子楼体扩大，接近食堂且不相交 | [家属区/食堂](../../qa/m10-r3/family-canteen.png) |
| #11 | 24与03直接共享墙边，移除03-24-LINK外加接驳；4F与独立ID保留 | [两楼贴体](../../qa/m10-r3/gym-contact.png)、[球场看馆](../../qa/m10-r3/courts-to-gym.png) |

左右按总图-X/+X；从街外看入口时画面左右会反转。侧路在入口处不直接接主路，不等于校内深处的路线必须完全隔绝。

仅02、17、20、24、27的工作位置或尺寸改变。其余23项设施位置尺寸和原点/轴向保持；R2棚跑道、六片球场、操场后缘橡胶直段/沙坑、主楼厕所中部逐层连接、图书馆穿行道路均保留。

## 已执行的校验

| 内容 | 结果 | 原始记录 |
|---|---|---|
| 单元/错误注入回归 | 84/84通过 | [unit-tests.txt](../../qa/m10-r3/unit-tests.txt) |
| TypeScript与Vite构建 | 通过；锁定依赖构建 | [build.txt](../../qa/m10-r3/build.txt) |
| 实际浏览器检查 | 37/37通过 | [browser-report.json](../../qa/m10-r3/browser-report.json) |
| 道路实际Mesh多高度射线 | 324条，未发现阻挡 | [route-mesh-probes.json](../../qa/m10-r3/route-mesh-probes.json) |
| 连桥/入口实际探测 | 9处，未发现阻挡 | [portal-probes.json](../../qa/m10-r3/portal-probes.json) |
| 实机图 | 14个机位+1张手机尺寸画布，共15张 | [当前QA目录](../../qa/m10-r3/) |
| 网页入口 | HTTP生产版本及独立file页面均启动 | 浏览器报告 |
| JS/Shader错误 | 此运行未记录错误 | 浏览器报告 |

[回归校验清单及主动注入反例](regression-r3.md)。自动检查只验证工作模型与规则一致性；使用Chromium软件WebGL，未认证普通电脑帧率或真实手机兼容性，未实现完整物理角色。

测试期间先遇到与项目无关的apt源校验和错误，后遇到巡览初始相机时序问题；前者通过直接安装测试浏览器解决，未关闭下载校验，后者已修成同步初始化1.7m视点并改用状态等待。只有最后全部通过的产物作为本轮交付。

## 可获取产物

[CI artifact 10117229776](https://github.com/ziyuuu/return-old-school/actions/runs/34384416932/artifacts/10117229776)，保留期30天，可能要求GitHub登录；本轮对话另行交付独立文件。

- `Yali_M1_0_R3_Viewer.html`：626146字节；SHA-256 `af792d7acb4e8d2e04f9be675211327f45c9e0a21eed69c7c5f9dc04302cb7f6`。
- `Yali_M1_0_R3_Workspace.zip`：2920627字节，83个文件；SHA-256 `5b75cf65726ad3dd9556ab369ababb5a12e6eeee304406274221d43e0e86a3c6`。
- `Yali_M1_0_R3_Review.html`：真实截图与R2/R3同机位对照，不是三维查看器。
- `Yali_M1_0_R3_Masterplan.svg`：由当前坐标输出的占地/路网工作图，不是现场测绘总图。

整个下载artifact的SHA-256为`02b2676bfbf3742ef26a74eb627f23adb175a1775ccf853cab77b671c57f2a45`，已核验。ZIP完整性检查通过，排除node_modules、字体文件与私人摄影。二进制分发文件位于CI artifact和对话交付，不在这里伪造仓库根目录下载路径。

## 推定边界

音乐楼贴体关系、入口左右、侧路独立和家属区更大来自用户确认；左移36工作米、家属区7m间隙、六个住宅子体量、两楼12m共享边及门洞位置均为H工作方案。六个子体量不代表已经确认六栋历史住宅。没有制作住户信息或私人室内。

本轮为M1.0骨架修复，未推进夜景、怪物、谜题或建筑精模。M0仍以授权推定基线关闭，不是测绘级1:1。
