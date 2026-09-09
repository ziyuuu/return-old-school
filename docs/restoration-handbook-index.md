# 复原雅礼 · 还原手册研究入口 v0.6.1

日期：2026-09-09。阶段：**M1 的资料、总平面校核与建模前置整理**。本轮不建模、不设计玩法、不制作夜间场景。

最新完整交接说明见 [restoration-handbook-delivery-v061.md](restoration-handbook-delivery-v061.md)。本页替代旧 v0.6 的交付统计；旧版本可从 Git 历史查看。

## 本次实际交付

| 文件 | 实际内容及状态 |
|---|---|
| `Yali_Restoration_Handbook_v0.6.1.pdf` | 71 页完整图文手册，随项目对话交付 |
| `Yali_Masterplan_Review_v0.6.1.pdf` | 3 页 A3 横向总平面审阅册，随项目对话交付 |
| `Yali_Photo_Index_v0.6.1.html` | 40 条研究图像记录的嵌入式离线索引 |
| `Yali_Restoration_Research_v0.6.1.zip` | PDF、研究图像、可编辑正文/脚本、二维标注、台账与质量记录 |

统计：28 项设施；11 份二维编号分析层；2 处细节裁片；24 类物件/构件；6 类绿化采集对象；168 条建议机位任务；14 项开放问题；20 项来源和方法入口。

40 条图像记录包含拼版、后期对照和低可用背景，不是 40 个同期测绘视角。三张用户同画面实拍不算新增机位。168 条为采集或待匹配任务，不表示已经取得168张照片。

**公开仓库保存文字与结构化研究记录；本页不提供尚未上传的 PDF 路径，也不把第三方摄影视为已授权发行素材。**

## 手册页码

| 页码 | 内容 |
|---|---|
| 1—5 | 交付状态、证据和年代 |
| 6—10 | 原图存档、关系冲突审查、条件性局部订正、像素比例与尺度建立 |
| 11—12 | 01—28 设施登记 |
| 13—20 | 校门、石头、侧通路、旧体育馆内外 |
| 21—25 | 球场、跑道、体育辅助用房、音乐室、田径场、旗台与后期比较 |
| 26—40 | 旧主楼、教室/走廊/厕所、长雅楼、图书馆/后花园、科学馆、食堂、校史馆和缺图卡 |
| 41—47 | 绿化、道路高差、24类物件与材料细节 |
| 48—52 | 数字记录案例、校园对象组织、绿化台账、工具与流程 |
| 53—59 | 补拍、量测、征集、后续精模交接和14项未决问题 |
| 60—63 | 来源与方法入口 |
| 64—70 | 图像联系表 |
| 71 | 文件和边界 |

## 总平面校核结论

原图1548×1095像素；SHA-256 `a29b9dca5cfd5cce4b38ddeef752989c2f8b38280c8ab04592293cff97b98f08`。保持原图和既有设施编号，不重排校园。

已由校友确认：主楼左侧相连独栋厕所；六片3×2篮球场；球场与相邻跑道平行且紧贴；跑道图面左侧有体育辅助用房，包含健身、体育教师办公和器材空间；音乐室在馆后及跑道边；泳池左厕；操场左侧主席台；旗台附近沙坑；校门右侧校名石。

原图U9将篮球场06关联08田径跑道，音乐室关联05风雨跑道。**用户确认的是实际空间关系，未确认旧图编号。** 保留的v0.6-R仅暂把相邻跑道绑定05；这是条件性可回退补丁，不是已验证的全校园足迹。

辅助用房的三类功能不是确定的三栋楼。与音乐教室分开登记功能，实际建筑从属、房间数、层数和门窗仍待核。

篮球场符号约23×43像素，只能用于形状比例审查；FIBA 2024的28×15米是条件参照，不是雅礼当年实测尺寸。**实测控制点0个；全局米制比例未建立。** 后续需要控制点、非平行长度、对角线、高差链及独立检查，不以符号推导全校距离。

## 资料与下一步

- [既有设施登记](../data/restoration/facility-register.csv)
- [既有比例审计](../data/restoration/scale-audit.json)
- [既有局部补丁记录](../data/restoration/masterplan-local-patch.json)
- [空间校正说明](spatial-corrections.md)
- [本次完整交接与新增未决事项](restoration-handbook-delivery-v061.md)

同包v0.6.1台账是本次细化资料：新增物件/植被采集表、树木实例模板、量测模板、机位任务、精模交接模板。仓库旧台账不自动冒充本次二进制资料包。

P0补证：05/08跑道编号绑定；28辅助用房分布；15—25逐层连接；真实尺度基线；旧馆背面/屋盖/平台剖面；24音乐教室身份。照片缺口不得用生成图掩盖。

## 主要来源

- [新浪100张旧照片图集](https://k.sina.cn/article_6430641585_17f4bcdb1001003x9v.html)：混合年代和拼版，不是100个测绘机位。
- [2006年运动场](https://commons.wikimedia.org/wiki/File:Yali_High_School_sports_field_2006.jpg)及[2006年足球练习](https://commons.wikimedia.org/wiki/File:Yali_High_School_sports_ground_football_practice.jpg)：X. Zhou；采用CC BY2.5；缩放/裁切/标注另记。
- [中机国际旧馆与改建设计说明](https://www.cmie.cn/news2/1882.html)：新方案不当旧馆实拍，后期数量不覆盖同期记忆。
- [Historic England测绘规范](https://historicengland.org.uk/images-books/publications/geospatial-survey-specifications-cultural-heritage/)、[NPS建筑记录](https://www.nps.gov/subjects/heritagedocumentation/soi-standards-guidelines.htm)、[NPS/CyArk低成本采集](https://www.nps.gov/articles/000/preserving-heritage-with-low-cost-documentation.htm)：证据、尺度、试采和交付流程。
- [Campus3D](https://3d.nus.app/blog/release/)与[NUS绿化数字化](https://uci.nus.edu.sg/campus-sustainability/dematerialise/)：分区、实例编号和树木记录。

工具分工与后续模型要求见手册48—57页。QGIS、fSpy、COLMAP、CloudCompare的必要输入和使用阶段已经区分，未声称本轮运行了三维重建或真实点云配准。
