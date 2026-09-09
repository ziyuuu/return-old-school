# 复原雅礼 · Return Old School

为校庆与同学回忆制作的雅礼中学东塘校区数字复原项目，不是商业游戏。

**校园真实复原 > 模型精度与环境完整度 > 正常白天 > 夜间中式梦核 > 剧情和具体玩法。**

## 当前：M1.0 校园空间骨架首版

M0 已按项目所有者确认，以“资料与推定工作基线”关闭，**不是测绘级 1:1 认证**。M1.0 开始将已有研究、原平面与校友草图转换为可检查的工作坐标、占地轮廓和三维体块。

已提供 Vanilla Three.js / TypeScript 浏览器查看器，登记 28 项设施，其中 27 项具有工作定位；22 号小店保持未定位，不虚构一栋楼补齐数量。食堂下层小卖部为食堂子空间，不当成另一个独立体块。

本版是空间骨架，不是建筑精模、完整校园游戏或完整人物碰撞系统。所有未实测坐标和尺寸均为可追溯的工作方案；采用米制单位不等于实际尺寸已经测绘。

### 使用入口

- [M1.0 交付、运行证据与边界](docs/m10/delivery-review.md)
- [校园浏览器工程](apps/campus/)
- [坐标、原点及数据约定](docs/m10/coordinate-baseline.md)
- [技术实现决策](docs/m10/implementation-decision.md)
- [校园布局输入](data/m10/layout-input.json)
- [生成后的校园数据](data/m10/campus-layout.json)
- [设施占地轮廓](data/m10/footprints.json)
- [实际浏览器截图与检查记录](qa/m10/)

### 本地运行

需要 Node.js、npm 和 Python 3。在仓库根目录：

```bash
python tools/m10/generate-layout.py
cd apps/campus
npm ci
npm run dev
```

终端将显示本地访问地址。构建与布局回归检查：

```bash
npm test
npm run build
npm run standalone
```

独立 HTML 是打包的实际三维查看器，不是图片播放器，不需要运行时加载第三方校园照片。界面支持固定机位、环绕观察、设施信息查看、占地轮廓显示与数据/截图导出；以当前界面说明为准。

### 已运行的首轮验证

源码提交 `eef78cb5621c18f42e9495d2b210bf7f95830fa7` 的首轮构建通过 30 项数据/回归测试、TypeScript / Vite 构建和实际浏览器验证；截图与生成数据在 `8fcbba595aca12dda452c678da7a201aaab9bcb8` 中留存。

[首轮完整验证运行](https://github.com/ziyuuu/return-old-school/actions/runs/34362981878)。后续修订以各自工作流和最新 QA 记录为准，不把首轮截图当作后续代码的验证结果。自动检查验证数据一致性，不替代校友审阅或现场尺寸验证。

## 已确认的空间事实

- 主楼图面左侧独栋厕所：每层连接、门朝教学楼。草图按通道分叉到男女两翼理解，不套用到池畔厕所。
- 篮球场：3×2 六片，与相邻直跑道平行且紧贴，中间不插道路或绿化。
- 直跑道夹在体育辅助用房与篮球场之间。项目编号05，08表示田径环道；编号不是历史正式名称。
- 体育辅助用房28：低矮单层，健身/锻炼、体育教师办公室、器材空间是功能类别，不等于三栋楼。
- 音乐楼24：四层独栋，跑道旁、体育馆后方，不与28合并。
- 音乐楼、WC、泳池位于条形空间同一端；池畔厕所26在泳池图面左侧。
- 主席台位于操场图面左侧，沙坑靠近旗台；校门参考视图右侧有校名石。

草图不提供米制尺度或地理方位。体育馆没有画入草图，局部组团在原总图中的绝对配准仍是H推定。

## 历史研究与证据

- [v0.7 研究、来源和交付说明](docs/restoration-research-v07.md)
- [开发计划](docs/development-plan.md)
- [空间硬约束](data/spatial-constraints.json)
- [28项设施台账](data/restoration/facility-register.csv)
- [未决问题与状态](data/restoration/open-questions.csv)
- [推定参数](data/restoration/assumption-register-v07.json)
- [原总平面局部修订](data/restoration/masterplan-local-patch.json)
- [体育区关系](docs/plates/sports-topology-v07.svg) · [主楼厕所关系](docs/plates/toilet-topology-v07.svg)
- [v0.6.1历史交付记录](docs/restoration-handbook-delivery-v061.md)

已有 PDF 和研究摄影包的历史交付不表示全部二进制文件自动进入仓库。公开摄影与授权不明照片不直接作为发行资产。

A=校友明确确认；P=照片可见；R=类比资料；H=选定工作假设。音乐楼四层属于A，推定层高属于H。未实测字段保持空值，工作参数独立保存，不从旧示意图符号外推出全校实测比例。

## 后续阶段

M1.0 当前交付用于审阅工作坐标和基础体块，校友尚未完成最终空间验收。下一步 M1.1 全校园体块与道路高差校核，再逐栋精模、关键室内、绿化和校园物件。M1 漫游版本本身可独立用于校庆。

M2 才进入可逆的全校园夜间中式梦核层。M3 以后才设计具体玩法、幽魂和怪物。历史2006—2010基底、现代覆盖层和夜间层分别维护。

本项目为独立校友创作，不代表学校官方；虚构内容与真实校史、真实师生经历区分。
