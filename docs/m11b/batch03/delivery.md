# B03 R2｜食堂正面与图书馆对称双梯

状态 **IMPLEMENTED / REVIEW_PENDING**。B01/B02仍 **COMPLETE / ALUMNI_APPROVED**。本轮源码继承main `72d7808ffdea8f8271133f658e90b199998a0ce6`，不是覆盖为旧预修快照。

食堂：观察者站在正面（−X）面向+X，左（−Z）打印，中部楼梯，右（+Z）小卖部。楼梯所在上层楼板开口、柱列和门厅一起调整。打印、食堂、小卖部各有真实门洞与独立可达路线；不虚构商号、商品或历史招牌。12仍属于11内部。

图书馆：镜像双弧梯从花园起步，会合到可站立圆平台，再由中央上行段接二层平台和真实门洞。护栏只设在不通行的圆弧边缘，三个接口留空；平台下设置支撑，不再用整块实心体充当护栏。左右各14级，中间12级；花园+4.69、圆台+6.89、上层+8.94m均为H工作标高，不是测绘值。

A为双梯对称和食堂顺序；圆台及确切连接形式是按用户“似乎”的记忆作H补全，尚待审阅。保留原宽弧梯照片可見的曲线踏步与栏杆特征，不把拼版推成测绘图。

R1.1台阶接缝重叠、后门向内开启、图书馆蓝色板在观察者左侧、手机图书馆机位等修订保留。主楼到图书馆爬升不变；B01/B02、运动区、data/m10及冻结基线不改。

复现：`npm ci --prefix apps/campus`；`npm run build --prefix apps/campus`；`node tools/m11b-b03/check.mjs`；`node tools/m11b-b03/export.mjs`；`python tools/m11b-b03/capture.py`；实际通过后 `python tools/m11b-b03/package.py`。

参数 `data/m11b/batch03/input.json`；同源模型/截图接口 `batch03-core.mjs`、`batch03-scene.ts`。导出文件在 `artifacts/m11b-b03/`。只有版本与Viewer SHA256匹配的新报告才算本轮检查结果；旧R1.1成功不能复用成R2成功。
