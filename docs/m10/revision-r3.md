# M1.0.2-R3 · 入口、长雅楼、家属区与体育组团订正

在R2基础上增量修改，基准提交`80a3613413bbfbe443bbc63a2150736e48982862`。具体数值是H工作方案，不是现场测量。当前issue #8—#11只验收空间骨架修复，不代表校友最终审核或精模完成。

## 1. 修正与被替换的旧解释

| Issue | 当前要求 | 被替换的R2解释 |
|---|---|---|
| [#8](https://github.com/ziyuuu/return-old-school/issues/8) | 27在总图主门左，02在原石位右；独立侧门路沿白线进入 | 石在图面右；侧门在操场后端；入口侧路由主路分出 |
| [#9](https://github.com/ziyuuu/return-old-school/issues/9) | 17左移；纵路正对实际门洞 | 从建筑旁擦过再到南侧错位终点 |
| [#10](https://github.com/ziyuuu/return-old-school/issues/10) | 20范围和实际子楼体扩大，缩小与11空隙 | 小楼群加大片空地 |
| [#11](https://github.com/ziyuuu/return-old-school/issues/11) | 24与03本体共享边界；保留不同ID | 分离两楼加03-24-LINK有棚外接通路 |

“左”是总图-X，不是街外照片观察者的左右。侧门路不在入口处接主路；在校园深处经已有路网间接可达，不意味着两片校园互不可达。

音乐楼四层独立体块不等于不接触体育馆。共享面与首层开口按H方案，不擅自推导所有层互通。圈注/回忆是关系证据，不是尺寸测量。

## 2. 工作值

| 对象 | R2 | R3 |
|---|---|---|
| 27石中心 | (17,0,1) | (-17,0,1) |
| 02侧门中心 | (129,0,184) | (17,0,1) |
| 17长雅中心 | (165,0,258) | (129,0,258)，尺寸不变 |
| 17正门 | 未统一到真实门洞 | (129,0,249)，路和门保持同一X中心线 |
| 20家属区 | 中心(166,0,67)，54×58m | 中心(166,0,82)，60×104m |
| 20至11间隙 | 包络45m | 包络及最后排真实楼体均为7m |
| 24音乐楼 | (-81,0,76) | (-62,0,72)，16×12m、四层不变 |
| 03—24 | 折线外接段 | z=66，x=-66至-54的12m共享工作边 |

六个家属区子体量是H外部密度方案，不是已确认六栋住宅；不记录住户信息或住宅内部。体育馆42×42m包络保持R2，音乐楼向其靠拢，不移动球场和操场掩盖冲突。

## 3. 保留项

仅02、17、20、24、27的工作位置或尺寸改变，其余23项设施位置尺寸与坐标原点/轴向保持。保留R2顶棚、3×2共边球场、主楼厕所中部逐层连接、地面穿行至图书馆、主楼后门、后缘橡胶跑道、唯一23沙坑、26小厕所。

删除入口捷径的实际铺装，不只删导航线；删除旧03-24-LINK屋盖、柱和地面带。新增图面来自同一工作坐标与真实浏览器，不生成替代效果图。

## 4. 同步文件

- `data/m10/layout-input.json`：布局、入口、道路、共享面及家属区子体量。
- `campus-layout.json`、`footprints.json/csv`、`site-features.json`：统一生成。
- `revision-r3.json`：变更、保留ID及用户图片哈希；`baseline-r2-input.json`为前版基准。
- `data/spatial-constraints.json`、`facility-register.csv`、`assumption-register-r3.json`：事实与推定。
- `revision-r3-scene.ts`、`revision-r3-core.mjs`与既有模块：几何及约束。
- `docs/plates/masterplan-m10-r3.svg`：同数据的工作总图，不是测绘图。
- `qa/m10-r3/`：当前版本测试、实际Mesh探测和截图。

`tools/m10/repair-r3.py`是可审计的一次性迁移；重复执行不再次移动对象。CI通过后提交真实修改源码/生成数据，不把只提交脚本称为修复完成。

## 5. 验证和运行

[回归清单](regression-r3.md)。结果以`qa/m10-r3/unit-tests.txt`与`browser-report.json`及CI成功状态为准；它们不认证历史尺寸、物理角色或真实手机帧率。

```sh
python tools/m10/generate-layout.py
cd apps/campus
npm ci
npm test
npm run build
npm run standalone
cd ../..
python tools/m10/capture-r3.py
python tools/m10/package-r3.py
```

最后的浏览器步骤需Python Playwright和Chromium。受限环境可用`M10_EMBEDDED_QA=1`只测内存页面，须另标，不冒充HTTP/file通过。分发产物以CI锁定依赖构建与实际HTTP+file检查为准。

M0按授权推定基线关闭。本轮仍是M1.0校核，未启动M1.1完整体块扩展、建筑精模、夜景或游戏玩法。
