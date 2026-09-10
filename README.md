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

M1.0冻结不等于测绘认证。M1.1-A没有重新摆楼或重画道路；它是独立、可关闭的竖向适配层，采用主门相对0m工作基准。

## M1.1-A 使用与研究入口

- **[已验证交付、下载与完整边界](docs/m11a/delivery.md)**
- [先行调研计划](docs/m11a/research-plan.md) → [实际调研结果](docs/m11a/research-findings.md) → [落地计划](docs/m11a/implementation-plan.md)
- [输入工作标高](data/m11a/terrain-input.json) · [建筑竖向基准表](data/m11a/elevations.csv) · [道路纵剖图](docs/m11a/road-profiles.svg)
- [20条图像观察记录](data/m11a/research-review.csv) · [来源与检索限制](data/m11a/research-sources.json)
- [实际WebGL截图与验证](qa/m11a/) · [回归清单](docs/m11a/regression.md)
- [成功构建34443432460](https://github.com/ziyuuu/return-old-school/actions/runs/34443432460)

已验证源码/生成数据提交：`be35462e2189f2b9bd5b78a0784bafbaad76d8c6`。245项单元/回归（含R4的118项）和27项实际浏览器检查通过。主路路面、宽度、入口台阶、厕所4层楼板和8条门前通路均有实际Mesh探测，不能据此宣称已完成物理角色或目标设备性能认证。

查看器支持“R4 / 地坪对照”、馆前台阶、旧图书馆台阶、长雅台阶、跑道/前庭和桥下净空机位。工作标高可单独导出。`anchors.floor`为R4建筑原点的竖向偏移，不是每个室内房间的实测楼板标高；食堂原有架空层关系仍保留。

### 本地运行

Node.js、npm和Python3。在已经提交集成源码的仓库中：

```bash
cd apps/campus
npm ci
npm run dev
```

构建、全量回归和独立HTML：

```bash
cd apps/campus
node --test ../../tests/m10/*.test.mjs ../../tests/m11a/*.test.mjs
npm run build
cd ../..
node tools/m11a/export.mjs
node tools/m11a/build-standalone.mjs
```

独立页面输出为`artifacts/m11a/Yali_M1_1_A_Viewer.html`。生成文件通过CI artifact与对话交付，不伪造仓库根目录的二进制下载地址；运行时没有CDN依赖或外部校园图片。

## 冻结的 M1.0 基线

[冻结说明](docs/m10/m1.0-freeze.md) · [manifest](data/m10/freeze-manifest.json) · [冻结参考分支](https://github.com/ziyuuu/return-old-school/tree/baseline/m1.0-r4)

- 01–28稳定设施身份，22未定位，不虚构位置。
- 石在主门图面左，侧门右；侧路入口不与主门主路错误直连。
- 3×2六片篮球场与有顶棚的05直跑道平行且紧贴；28低矮单层。
- 08后缘橡胶直段、23后缘右端沙坑、10上移位置按R4保留。
- 03和四层24本体直接贴合，不恢复外加连接楼梯/连廊。
- 25连续楼体每层完整楼板，门前走廊通向两端朝主楼的入口；中部逐层连接和桥侧栏杆缺口保留。
- 主楼/厕所间地面通向图书馆，主楼后门接图书馆。
- 长雅路对正门，绿色错误绕行路删除；主干红框段等宽，黑线三处短接保留。
- 家属区采用R4整体右上移动后的体量，只表现外部，不制作住户信息或私人室内。

4个冻结关键文件哈希不变；冻结分支仍为`43afdd725c884ba17534372195b026bc977fddd5`。M1.0旧构建工作流改为仅手动读取冻结分支，避免旧迁移脚本改写M1.1新工程；不写回冻结分支。

只有新证据证明核心位置/拓扑有实质错误才提出baseline-breaking变更。局部层高、入口、材料、绿化等继续以A校友/P照片/R类比/H工作假设分层维护。没有测量的值不改标为实测。

## 后续开发

[开发计划](docs/development-plan.md) · [历史研究与手册入口](docs/restoration-research-v07.md)

M1.1-B深化全校园体量，C完善入口、楼梯和通行，D做多机位校友审核；M1.2以后逐栋精模、室内、植被和生活细节。M2才做可逆夜间梦核，M3以后再讨论玩法。当前校园漫游目标本身独立服务校庆。

本项目为独立校友创作，不代表学校官方；虚构内容与真实校史、真实师生经历区分。
