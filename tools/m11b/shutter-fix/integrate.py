"""Idempotent entry wiring for the small side-wall shutter repair; no geometry in this script."""
from pathlib import Path
R=Path(__file__).resolve().parents[3]
p=R/'apps/campus/src/main.ts'
s=p.read_text()
old="import revision3Input from '../../../data/m11b/batch01-r3/input.json';"
new="import revision3Base from '../../../data/m11b/batch01-r3/input.json';\nimport shutterFix from '../../../data/m11b/batch01-r3/shutter-fix.json';\nconst revision3Input={...revision3Base,version:shutterFix.version,status:shutterFix.status,entrances:{...revision3Base.entrances,...shutterFix.entrances}};"
if old in s:s=s.replace(old,new,1)
assert 'import shutterFix' in s, 'Unexpected main entry; do not patch blindly'
s=s.replace("from './b01-r3-core.mjs';", "from './b01-shutter-fix.mjs';")
marker='// SHUTTER_FIX_VIEWS'
if marker not in s:
 insert="""// SHUTTER_FIX_VIEWS
Object.assign(cameraPresets,{
 'r3-west':{label:'左端 · 侧墙开启卷帘门 / 放大雨棚',position:[20.8,6.7,211.8],target:[28.0,5.1,217.5]},
 'r3-east':{label:'右端 · 侧墙开启卷帘门 / 放大雨棚',position:[125.2,6.7,211.8],target:[118.0,5.1,217.5]},
 'r3-west-front':{label:'左端正看 · 后墙封回 / 两柱外移',position:[25.0,5.8,207.5],target:[26.5,5.1,218]},
 'r3-east-front':{label:'右端正看 · 后墙封回 / 两柱外移',position:[121.0,5.8,207.5],target:[119.5,5.1,218]},
 'r3-porch-plan':{label:'首层俯看 · 进门后转入中廊',position:[27,20,216.4],target:[27,3.45,217]},
 'r31-west-door':{label:'左端卷帘门近看 · 无关闭门板',position:[25.4,5.1,216.6],target:[29.3,5.1,217.5]},
 'r31-east-door':{label:'右端卷帘门近看 · 无关闭门板',position:[120.6,5.1,216.6],target:[116.7,5.1,217.5]}
});
"""
 s=s.replace("cameraPresets['r2-side']=cameraPresets['r3-east'];",insert+"cameraPresets['r2-side']=cameraPresets['r3-east'];")
p.write_text(s)
p=R/'apps/campus/index.html';s=p.read_text();s=s.replace('B01 R3','B01 R3.1') if 'B01 R3.1' not in s else s
s=s.replace('门洞朝操场','门洞在凹口侧墙').replace('两端正面入口','两端侧墙卷帘入口')
p.write_text(s)

p=R/'apps/campus/index.html';s=p.read_text();s=s.replace('第三轮 · 入口与轻弧修复','R3.1 · 侧墙卷帘门与雨棚');
if 'data-view="r31-east-door"' not in s:s=s.replace('<button data-view="r3-wall">', '<button data-view="r31-west-door">左卷帘门近看</button><button data-view="r31-east-door">右卷帘门近看</button><button data-view="r3-wall">')
p.write_text(s)

note='## R3.1 侧墙卷帘门修复'
for filename in ['README.md','docs/development-plan.md']:
 p=R/filename;s=p.read_text()
 if note not in s:
  s=note+'\n\n两端凹口侧墙扩大开口，卷帘默认收起；雨棚与柱列扩大、外移。继承R3五层、后坪、轻弧与中轴。本轮仅10项定向检查及局部浏览器验证，不重开全校园基线。IMPLEMENTED / REVIEW_PENDING；工程结果见 `docs/m11b/shutter-fix/delivery.md` 和 `qa/m11b-shutter-fix/browser-report.json`（没有通过报告前不宣称已验收）。\n\n以下为前序阶段记录：\n\n'+s
 p.write_text(s)
