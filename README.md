# 复原雅礼 · Return Old School

为校庆与同学回忆制作的雅礼中学东塘校区数字复原项目，不是商业游戏。

**校园真实复原 > 模型精度与环境完整度 > 正常白天 > 夜间中式梦核 > 剧情和具体玩法。**

## 当前：M1.1-A Patch02

M0资料与推定基线关闭；M1.0 R4原空间档案继续冻结。M1.1-A首版已实现，现按用户两张体育馆实拍和文字修订。Patch02工程已通过首轮验证，检视光线与镜头的最终复核见当前QA记录；校友最终审阅尚未因此完成。

**本轮有明确登记的局部拓扑例外，不再声称所有道路完全未变。** [#19](https://github.com/ziyuuu/return-old-school/issues/19)授权体育馆正门朝主路、前坪及绕馆环路；原冻结分支与`data/m10`不覆写。全部设施的水平位置、占地和无关道路保持，当前有效视图通过独立覆盖层生成。

|修订|实现与限制|
|---|---|
|入校坡道|从20m升0.20m改为升1.00m，H纵坡5%；内场同步+0.80m，原内部高差不扩大，球场保持平整。|
|体育馆门前|正门朝+X主路，经过前坪和低台阶入馆；原北侧死端改为绕馆通路，不再冒充正门。|
|绕馆环路|沿03/24贴体外围，经既有球场前通道回到主路闭合；隐藏后侧线形和宽度仍H，不穿共享墙造路，不认证车辆/消防条件。|
|左侧外楼梯|从主路面对正门时的左侧有实体外梯到观赛层；28级×0.15m、踏面0.33m和4.20m层高均为H工作值。|
|馆体高度|42×42m工作占地保持；门厅—观赛层—内凹窗带—折面壳体分层；最高19.20m相对首层基准是H，不是测绘。|

## 当前材料入口

- [Patch02修复计划、依据与工作参数](docs/m11a/patch02/plan.md)
- [独立配置](data/m11a/patch02/input.json) · [当前有效布局](data/m11a/patch02/effective-layout.json) · [当前高差](data/m11a/patch02/resolved-terrain.json)
- [同数据总平面](docs/m11a/patch02/masterplan.svg) · [高度参数图](docs/m11a/patch02/height-study.svg)
- [当前实际浏览器截图与探测](qa/m11a-p02/) · [回归清单](docs/m11a/patch02/regression.md)
- [两张用户实拍的证据登记](data/m11a/patch02/evidence-manifest.json)
- [首次M1.1-A研究与历史交付](docs/m11a/delivery.md)

Viewer是实际Vanilla Three.js / TypeScript工程，不是图片播放器。新增体育馆正面、斜前、环路、左梯、观赛层机位和屋壳剖看开关。地坪对照只恢复相对零高程，**不会恢复旧R4拓扑或旧馆模型**，因此界面不再称为完整R4对照。检视日光用于看清结构，不是历史日照复原。

## 运行与构建

```bash
cd apps/campus
npm ci
npm run dev
```

```bash
cd apps/campus
node --test ../../tests/m10/*.test.mjs ../../tests/m11a/*.test.mjs ../../tests/m11a/patch02/*.test.mjs
npm run build
cd ../..
node tools/m11a/build-standalone.mjs
node tools/m11a/patch02/export.mjs
```

独立HTML先输出`artifacts/m11a/Yali_M1_1_A_Viewer.html`；完整CI经过真实浏览器验证后打包为`artifacts/m11a-p02/Yali_M1_1_A_Patch02_Viewer.html`等文件。二进制通过构建产物与对话直接交付，运行时无需CDN或外部校园照片。不把目录名当作已发布的下载网址。

## 冻结项与本轮例外

[冻结说明](docs/m10/m1.0-freeze.md) · [manifest](data/m10/freeze-manifest.json) · [冻结参考分支](https://github.com/ziyuuu/return-old-school/tree/baseline/m1.0-r4)

01–28设施身份稳定；22未定位，不补假位置。校名石在总图主门左侧，侧门右侧；入口处侧路不与主路错误直连。3×2六片球场与带棚直跑道平行且共边；28为低矮单层。后缘跑道、沙坑、主席台、家属区、长雅正门道路和已删除绿色绕路按R4保留。

03与四层24仍直接贴体，不恢复外加连接梯或连廊。25仍为连续厕所，每层完整楼板、门前廊、两端朝主楼的门，中部逐层连桥和桥侧护栏缺口均保留；主楼/厕所间及主楼后门至图书馆的通路不变。

原4个冻结文件做哈希检查；Patch02例外只进入新的有效布局。楼体隐藏面、精确尺寸、台阶级数和未见后侧道路仍是H可替换方案。工程回归验证不是实测、完整角色碰撞或手机性能认证。

## 后续阶段

[开发计划](docs/development-plan.md) · [历史研究手册](docs/restoration-research-v07.md)

M1.1-A待校友复核；本轮只提前处理体育馆与入口、高差直接相关的局部体量，不表示M1.1-B全校园建筑体量已完成。C继续完善物理通行，D做全校多机位复核。M1.2以后再精模、室内、绿化和生活物件。夜间中式梦核、幽魂和玩法仍未开始。

本项目为独立校友创作，不代表学校官方；虚构内容与真实校史和真实师生区分。
