# 复原雅礼 · Return Old School

为校庆与同学回忆制作的雅礼中学东塘校区数字复原项目，不是商业游戏。

**校园真实复原 > 模型精度与环境完整度 > 正常白天 > 夜间中式梦核 > 剧情和具体玩法。**

## 当前状态

|阶段|状态|
|---|---|
|M0 资料与推定工作基线|COMPLETE|
|M1.0 R4 空间基线|COMPLETE / FROZEN|
|M1.1-A 地形、道路、地坪与高差|**IMPLEMENTED / REVIEW_PENDING**：首版已实现、验证，H标高待校友审阅|
|M1.1-B/C/D 全校体量、通行与校友复核|后续阶段，尚未整体完成|
|M1.2+ 建筑精模、环境细节|PLANNED|
|M2 夜间中式梦核 / M3+玩法|未启动|

M1.0冻结不等于测绘认证。M1.1-A没有重新摆楼或重画道路，是独立、可关闭的竖向适配层，以主门相对0m为基准，不是海拔。

## M1.1-A 使用与研究入口

- **[已验证交付、下载与完整边界](docs/m11a/delivery.md)**
- [先行调研计划](docs/m11a/research-plan.md) → [实际调研结果](docs/m11a/research-findings.md) → [落地计划](docs/m11a/implementation-plan.md)
- [工作标高输入](data/m11a/terrain-input.json) · [建筑竖向基准表](data/m11a/elevations.csv) · [道路纵剖图](docs/m11a/road-profiles.svg)
- [20条既有图像观察记录](data/m11a/research-review.csv) · [来源、文字核查和检索限制](data/m11a/research-sources.json)
- [实际WebGL截图与验证](qa/m11a/) · [回归清单](docs/m11a/regression.md)
- [最终成功构建34444719278](https://github.com/ziyuuu/return-old-school/actions/runs/34444719278)

最终已验证源码/数据：`dc16db9996451a3cea8676d56d63d9a3b7e807fd`。247项单元/回归（含R4的118项）和29项实际浏览器检查通过；13张实机截图已经检查。具体数值与失败探测结果见交付记录，不据此宣称完整物理角色或目标设备性能认证。

原帖正文明确主门入内为上坡，本版以0.20m/20m的H方案表达该方向；级数、坡度和标高都未测量。运动场地保持平整，体育馆/音乐楼与主楼/厕所分别共同垂直适配，局部入口使用实体台阶。

查看器支持“R4 / 地坪对照”、主门内上坡、馆前台阶、图书馆台阶、长雅台阶、跑道/前庭及桥下机位。工作标高可独立导出。`anchors.floor`为R4建筑原点的竖向偏移，不是每个房间的实测楼板标高；食堂原有架空层关系仍保留。

### 本地运行

Node.js、npm和Python3。在已经提交集成源码的仓库中：

```bash
cd apps/campus
npm ci
npm run dev
```

构建、全量回归及独立HTML：

```bash
cd apps/campus
node --test ../../tests/m10/*.test.mjs ../../tests/m11a/*.test.mjs
npm run build
cd ../..
node tools/m11a/export.mjs
node tools/m11a/build-standalone.mjs
```

独立页面输出`artifacts/m11a/Yali_M1_1_A_Viewer.html`。分发文件通过CI artifact与对话交付，不伪造仓库根目录二进制下载路径；运行时没有CDN依赖或外部校园图片。

## 冻结的 M1.0 基线

[冻结说明](docs/m10/m1.0-freeze.md) · [manifest](data/m10/freeze-manifest.json) · [冻结参考分支](https://github.com/ziyuuu/return-old-school/tree/baseline/m1.0-r4)

01–28设施身份稳定；22未定位，不虚构位置。石在主门图面左，侧门右；侧路入口不与主门主路错误直连。3×2六片球场与带棚直跑道平行且紧贴；28低矮单层。后缘橡胶直段、右端沙坑、上移后的主席台均按R4保留。

03和四层24直接贴体，不恢复外加连接楼梯/连廊。25为连续楼体，每层完整楼板，门前走廊通向两端朝主楼入口，中部逐层连接和护栏桥侧缺口保留。主楼/厕所间地面与主楼后门分别通图书馆。长雅道路对正门，绿色绕行路已删除，主干等宽及黑线短接保留。家属区按R4右上移后的体量，仅表现外部，不制作住户信息或私人室内。

4个冻结关键文件哈希不变；冻结分支仍为`43afdd725c884ba17534372195b026bc977fddd5`。旧M1.0工作流仅手动读取冻结分支，避免旧迁移脚本改写M1.1工程，不向冻结分支提交开发内容。

仅有新证据推翻核心位置/拓扑才提出baseline-breaking变更。局部层高、入口、材料和绿化以A校友/P照片/R参照/H假设分别维护；精确值未实测就不能改标为测绘。

## 后续

[开发计划](docs/development-plan.md) · [历史研究与手册入口](docs/restoration-research-v07.md)

B深化全校园体量，C完善楼梯、入口和实际通行，D做多机位校友审阅；M1.2以后逐栋精模、室内、植被和生活物件。M2才进入可逆夜间梦核，M3以后再讨论具体玩法。校园漫游目标本身独立服务校庆。

本项目为独立校友创作，不代表学校官方；虚构内容与真实校史、真实师生经历区分。
