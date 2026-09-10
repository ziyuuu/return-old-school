"""Screenshot-driven cleanup; no scene layout, floor datum or inherited topology changes."""
from pathlib import Path
R=Path(__file__).resolve().parents[3]
def replace(path,old,new):
 f=R/path;s=f.read_text()
 if new in s:return
 if old not in s:raise RuntimeError(f'Expected source not found: {path}: {old[:80]}')
 f.write_text(s.replace(old,new))
replace('apps/campus/src/main.ts','sun.shadow.normalBias=detail?.025:.18;sun.shadow.bias=detail?-.000035:-.00015;', 'sun.shadow.normalBias=detail?.10:.18;sun.shadow.bias=detail?-.00008:-.00015;')
replace('apps/campus/src/main.ts',"cameraPresets['r2-side']=cameraPresets['r3-east'];", """Object.assign(cameraPresets,{
 'r3-west-front':{label:'图面左端入口正视 · 真实门洞与三级台阶',position:[26.6,5.3,209],target:[26.6,5.1,219]},
 'r3-east-front':{label:'图面右端入口正视 · 真实门洞与三级台阶',position:[119.4,5.3,209],target:[119.4,5.1,219]}
});
cameraPresets['r2-side']=cameraPresets['r3-east'];""")
replace('apps/campus/index.html','<button data-view="r3-wall">', '<button data-view="r3-west-front">左端入口正视</button><button data-view="r3-east-front">右端入口正视</button><button data-view="r3-wall">')
replace('apps/campus/src/b01-r3-core.mjs',"bx('door-reveal',1", "bx('frame',1")
replace('apps/campus/src/b01-r3-core.mjs',"  const x=f.position[0]+cx,z=f.position[2],Y=terrain.anchors['15'].floor;", "  bx('frame',1,cx-e.doorWidth/2-.04,cx+e.doorWidth/2+.04,e.doorWallZ-.04,e.doorWallZ+.12,fy+e.doorHeight,fy+e.doorHeight+.07,`R3-${side}-door-head`);\n  const x=f.position[0]+cx,z=f.position[2],Y=terrain.anchors['15'].floor;")
replace('tools/m11b/r3/capture.py',"'r3-wall','r3-porch-plan'", "'r3-west-front','r3-east-front','r3-wall','r3-porch-plan'")
replace('tools/m11b/r3/capture.py',"check('captured15 fixed model views',len(shots)==15)", "check('captured17 fixed model views',len(shots)==17)")
replace('tools/m11b/r3/package.py','Arial,"Noto Sans CJK SC",sans-serif','"Noto Sans CJK SC",Arial,sans-serif')
replace('tools/m11b/r3/package.py','X=lambda x:720+x*12;Z=lambda z:250+(z+9)*16', 'X=lambda x:720+x*12;Z=lambda z:210+(7-z)*15')
replace('tools/m11b/r3/package.py','Z(z-d/2),w*12,d*16','Z(z+d/2),w*12,d*15')
replace('tools/m11b/r3/package.py',"for q in m['parts']:\n if q['owner']!='15'or q['level']!=1:continue", "for q in sorted(m['parts'],key=lambda q:q['role']!='slab'):\n if q['owner']!='15'or q['level']!=1:continue")
replace('tools/m11b/r3/package.py','[(720,165),(720,500)]','[(720,200),(720,490)]')
replace('tools/m11b/r3/package.py',"text(735,195,'主轴", "text(735,185,'主轴")
replace('tools/m11b/r3/package.py','整栋首层平面：','整栋首层外壳轮廓：')
replace('tools/m11b/r3/package.py',"captions={'r3-front.png':", "captions={'r3-west-front.png':'图面左端入口正视｜门洞、门廊和台阶','r3-east-front.png':'图面右端入口正视｜门洞、门廊和台阶','r3-front.png':")
f=R/'docs/development-plan.md';s=f.read_text()
if '## 当前 B01 R3' not in s:
 s=s.replace('# 开发计划｜2026-09-10 · B01 R2','# 开发计划｜B01 R3')
 s=s.replace('|M1.1-B 第一批R2|IMPLEMENTED / REVIEW_PENDING|五层主楼、连续厕所和桥、主轴校正；工程结果以本轮QA为准|','|M1.1-B 第一批R2|IMPLEMENTED / SUPERSEDED_BY_R3|五层剖面和主轴保留，入口与中央立面由R3修订|\n|M1.1-B 第一批R3|IMPLEMENTED / REVIEW_PENDING|正面两端内退门廊、前伸五层墙体、中央浅弧与三级台阶；工程结果见R3 QA|')
 s=s.replace('## B01 R2：按已对齐的信息实施','''## 当前 B01 R3

[实施方案](m11b/batch01-r3/implementation-plan.md) · [交付](m11b/batch01-r3/delivery.md) · `data/m11b/batch01-r3` · `qa/m11b-b01-r3`。

已按#29修复两端正面退入门廊，移除错误东山墙门廊与外门洞。门口一层、旁边主体五层，墙体继续向前超过门罩；两处台阶均为实际几何并接入既有前坪。中央广播等功能区以水平浅弧表达，墙、楼板和檐口一致，正门轴线及最前点不动。工作尺寸在R3独立参数中，不改P3/P4和R2档案。

保留原583项回归，R3新增105项（含35个故障反例）。实际WebGL验证检查入口全宽支撑、五层前伸墙、真实弧面、十条厕所路线、主轴/运动区/馆体及原道路；审阅含局部、整栋、正视、俯看、桌面和手机viewport。最终结果与截图以R3交付记录为准，不继承旧R2的通过状态。

P3/P4继续已认可；本次新画面仍待校友审阅。内部楼梯、完整内装、角色控制器不在本批。下一批仍为体育馆/音乐楼，未提前制作玩法。

## B01 R2：历史实施说明（入口局部由R3取代）''')
 f.write_text(s)
print('R3 actual screenshot refinements applied; historical geometry remains in independent R3 layer.')
