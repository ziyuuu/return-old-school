# M1.1-A Patch02 回归记录

状态：工程实现通过；校友审阅待确认，非测绘级。

单元/反例回归：329项通过。浏览器：35项通过。

新旧布局分离，R4冻结文件不覆写；有效视图只应用#19授权的体育馆入口与环路例外。

- [x] terrain initialized
- [x] authorized P02 layout constraints
- [x] actual entrance5 percent H grade
- [x] all45 draped road centerlines supported
- [x] full road widths supported
- [x] actual route clearance after grade change
- [x] 17 physical entry steps and4 top portals
- [x] 4 toilet slabs / 8 end-door routes retained
- [x] 28 spectator treads with supported landing and viewing aisle
- [x] real main-road front doorway
- [x] old north doorway closed
- [x] shared music contact remains open
- [x] actual gym height matches H parameter
- [x] camera top
- [x] camera overview
- [x] camera terrain-entrance
- [x] camera gym-p02-front
- [x] camera gym-p02-oblique
- [x] camera gym-p02-loop
- [x] camera gym-p02-stair
- [x] camera gym-p02-gallery
- [x] camera terrain-longya
- [x] camera terrain-gap
- [x] camera courts-to-gym
- [x] gym cutaway hides only upper shell
- [x] comparison restores all root Y
- [x] 8 toggles no accumulated displacement
- [x] actual shared gym/music floor
- [x] actual shared main/toilet floor
- [x] terrain export action
- [x] tour relative eye height
- [x] tour exits
- [x] mobile viewport resized
- [x] standalone file startup
- [x] no page/shader errors

测试为软件WebGL；射线与实体表面检查不代表完整人物控制或目标设备帧率。高程、坡度、门洞、楼梯级数仍为H工作值。
