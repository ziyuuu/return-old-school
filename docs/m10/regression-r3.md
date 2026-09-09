# R3 回归校验清单

以下为验收项。结果以`qa/m10-r3/unit-tests.txt`及`browser-report.json`为准，不能只凭清单宣称通过。

| 分组 | 必须检查 | 自动证据 |
|---|---|---|
| 入口 | 27在01图面左；02在原石位右；唯一门/石 | R3_STONE_LEFT、R3_SIDE_GATE_AT_ENTRANCE；F27/F01/F02实际包络 |
| 入口路网 | 独立侧门入口；无主路接边；铺装不跨主路 | R3_NO_ENTRY_SHORTCUT、R3_SIDE_PAVING_SEPARATE；旧捷径三点向下探测 |
| 长雅楼 | 左移、门对准纵路、门洞真实可进入 | R3_LONGYA_SHIFTED_LEFT、R3_LONGYA_DOOR_ALIGNMENT；实际门洞射线 |
| 家属区 | 范围及真实体量扩大；近食堂且不相交 | R3_FAMILY_AREA_ENLARGED、R3_FAMILY_CANTEEN_GAP；六块实际Box3 |
| 子体量 | 不出界、不相交，不只放大底板 | R3_CONTEXT_COMPONENTS_CONTAINED、R3_CONTEXT_REAL_MASS_REACHES_CANTEEN、R3_CONTEXT_BLOCKS_DISJOINT |
| 体育组团 | 共享正长度墙边、零缝、不重叠，无外加接驳 | R3_GYM_MUSIC_ABUT、R3_SHARED_CONTACT_DATA、R3_NO_EXTERNAL_GYM_LINK；实际包络 |
| 开口 | 共享面两侧门同位置对向，门前铺装按数据 | R3_SHARED_PORTALS、R3_THRESHOLDS_CURRENT；门洞射线 |
| 原约束 | 28ID、27定位/1未定位、六片共边有棚、1F辅助/4F音乐、中部逐层厕所、沙坑、图书馆路 | 适用R2测试继续运行 |
| 增量 | 23无关设施位置尺寸与原点轴向不变 | 与baseline-r2-input逐项比对 |
| 全路径 | 路面全宽不穿建筑；巡览只走实际图边 | 膨胀矩形线段检查；Mesh多高度/横向偏移射线 |
| 查看器 | 新机位、选择、顶棚开关、占地图、未知对象、导出、环绕、巡览、自由校核、调整尺寸 | 浏览器操作检查 |
| 独立产物 | HTTP与file启动，正确版本导出，无JS/Shader报错 | CI Chromium软件WebGL，不认证整机帧率 |

## 反例

主动恢复石头右位、侧门后位、入口捷径；令侧路跨主路、长雅回右、门位偏轴、恢复小家属区/大间隙、只缩子体量、音乐楼留1m缝/插入馆体、恢复旧接驳、移动共享门位，必须分别触发对应规则失败。

## 替代记录

`R2_GYM_MUSIC_LINK`专门验证旧的外加接驳，因用户明确纠正而撤销，替换为共享边及无外加构件检查。旧“入口主路分支→侧门后端”链改为“侧门独立入口→白线小路→校园深处→长雅正门”。其余R2检查继续保留，不用删测试掩盖错误。
