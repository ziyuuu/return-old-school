# M1.1-A 调研结果 / 2026-09-10

## 已做的调研

先登记[调研计划](research-plan.md)，再复查前期研究包中20条图像记录（含原拼版，非20个独立机位），并核查公开原页与方法文档。本轮没有新增现场测绘、无人机扫描或摄影测量成果。

1. [中机国际2023项目说明](https://www.cmie.cn/news2/1882.html)：现状段落确实记录项目基地内部约1–1.5m高差及周边挡土墙；其适用范围、年代和图面真北配准均不足以直接定义历史全校园高程。新方案的下沉庭院、二层入口排除。该来源已在前期收录，本轮提取竖向信息，不伪称新增独立来源。
2. [X. Zhou 2006旗台/田径场摄影](https://commons.wikimedia.org/wiki/File:Yali_High_School_sports_field_2006.jpg)：可见旗台局部台阶与场地边缘栏杆。不能仅凭高机位透视得出整个前庭与操场的绝对高差。[同作者足球训练照片](https://commons.wikimedia.org/wiki/File:Yali_High_School_sports_ground_football_practice.jpg)提供另一地面观察，仍无米制控制。
3. [校友图集原页](https://k.sina.com.cn/article_6430641585_17f4bcdb1001003x9v.html)：已有S03-020体育馆、S03-047长雅楼、S03-049旧图书馆均能看到入口台阶；级高和精确数量仍选H值。S03-038是旧楼楼层后坪，不能当作地面广场；食堂入口背景虚焦，只能支持有上行连接，不足以决定整栋楼地基高度。
4. 学校原站定向检索没有取得2006–2010可验证的完整标高图/控制网。没有把无结果变成已证实平地，也没有继续无限等待测绘。

## 方法依据

[Historic England](https://historicengland.org.uk/images-books/publications/geospatial-survey-specifications-cultural-heritage/)区分建筑解释记录和受控制网约束的精确空间测绘。本阶段属于前者加可替换工作几何；不声称符合测绘级数据规范。

实现依据[Three.js BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html)和[Raycaster](https://threejs.org/docs/pages/Raycaster.html)：地坪与路面真实分段成网格，重新计算法线/包围体；验证须向实际Mesh投射支撑和净空射线，不能只检查配置数值。

## 决策

- 主门为相对0m，不是海拔。没有真北配准，不把文献“南高北低”直接转换成原总图上下。
- 篮球场、棚跑道和田径场采用平整台地，不做起伏草地。
- 道路仅采用温和H工作纵坡；前庭、教学楼/厕所、楼后设统一平台地坪；馆、音乐楼、长雅和图书馆入口另做台阶。
- 体育馆与音乐楼共同抬升，保持直接贴体；主楼、厕所、每层连桥共同抬升，不改变层数或楼板构造。
- 家属区仅处理外部地坪，不套用西側6–7m背景挡墙到这片住宅；花园缺失入口继续挂牌，不恢复绿色假路。
- 精确工作值与范围、证据类别独立保存到data/m11a，不写回冻结的data/m10。

本阶段的照片观察不等于数字测量。完整逐图台账、覆盖与失败记录将随实施包交付。
