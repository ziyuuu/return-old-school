"""Close the screenshot-observed wall-base gap without changing entrance/sports datums."""
from pathlib import Path
R=Path(__file__).resolve().parents[3]
f=R/'apps/campus/src/b01-r3-core.mjs';s=f.read_text()
if 'R3_GROUND_FOUNDATIONS' not in s:
 marker=' const origins={15:'
 assert marker in s
 s=s.replace(marker,""" // R3_GROUND_FOUNDATIONS: local apron lowering exposes the slab edge. Fill its
 // exact notched footprint downward; do not span the entrance recess or any bridge.
 for(const q of [...parts].filter(q=>q.owner==='15'&&q.level===1&&q.role==='slab')){
  const bottom=q.center[1]-q.size[1]/2,base=-.60;
  parts.push({...q,id:'R3-foundation-'+q.id,role:'foundation',center:[q.center[0],(bottom+base)/2,q.center[2]],size:[q.size[0],bottom-base,q.size[2]]});
 }
"""+marker)
 exact="put('R3_PARTS_VALID_UNIQUE'"
 assert exact in s
 assertion="""put('R3_FOUNDATION_CONTINUOUS',ps.filter(q=>q.owner==='15'&&q.level===1&&q.role==='slab').every(q=>{const b=ps.find(v=>v.id==='R3-foundation-'+q.id);return b&&b.role==='foundation'&&near(b.center[1]-b.size[1]/2,-.60)&&near(b.center[1]+b.size[1]/2,q.center[1]-q.size[1]/2)&&near(b.center[0],q.center[0])&&near(b.center[2],q.center[2])&&near(b.size[0],q.size[0])&&near(b.size[2],q.size[2]);}));"""
 s=s.replace(exact,assertion+exact);f.write_text(s)
f=R/'tests/m11b/r3/revision.test.mjs';s=f.read_text()
if 'missing entrance foundation' not in s:
 s+="\nfault('missing entrance foundation',m=>m.parts=m.parts.filter(q=>q.id!=='R3-foundation-R3-main-floor-1'));\n";f.write_text(s)
f=R/'tools/m11b/r3/capture.py';s=f.read_text()
if 'wall feet have real foundations' not in s:
 marker="  curve=page.evaluate(";assert marker in s
 ins="""  bases=page.evaluate('''()=>{const a=window.__YALI_R3__,bad=[];for(const s of [-1,1]){const x=73+s*44.5,hits=a.probe([x-.6,3.15,215.6],[x+.6,3.15,215.6]);if(!hits.some(h=>h.name.includes('foundation')))bad.push({s,hits});}return{probes:2,bad};}''')
  save('wall-foundation-probes.json',bases);check('wall feet have real foundations below lowered entrance aprons',not bases['bad'],bases)
"""
 s=s.replace(marker,ins+marker);f.write_text(s)
for path in ['tools/m11b/r3/package.py','docs/development-plan.md','docs/m11b/batch01-r3/implementation-plan.md']:
 f=R/path;s=f.read_text().replace('105项','107项').replace('35个','36个');f.write_text(s)
f=R/'docs/m11b/batch01-r3/visual-review.md';f.write_text('''# R3 实际截图复核与修正

首轮26项浏览器检查通过后实际查看局部、整栋、曲线、入口平面与手机截图。发现墙面阴影条纹和门洞受斜机位遮挡，已校正阴影深度偏移、补门框几何和双端正视机位；不使用后期特效。

第二轮截图进一步发现局部门前地坪降低后，相邻五层墙脚的原楼板边缘局部露空。补充与首层楼板完全同轮廓的实体墙基，向下填充到局部最低地面以下。凹口、台阶和桥下道路不跨接封堵，主楼楼面、P3/P4与R2轴线不变。

新增墙基对应检查、删除墙基反例和真实Mesh墙脚射线。此记录是修正原因，最终是否通过以browser-report.json和delivery.md为准。全部审阅截图仍来自实际Viewer。
''')
print('Added exact-footprint foundation fill and independent regression/mesh probes.')
