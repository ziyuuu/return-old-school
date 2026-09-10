"""Auditable one-time integration into readable main; does not replay old source archives."""
from pathlib import Path
R=Path(__file__).resolve().parents[3]
f=R/'apps/campus/src/main.ts';s=f.read_text()
if "./b01-r3-core.mjs" not in s:
 s=s.replace("import {r2Facility as batch01Facility,installR2Details} from './b01-r2-scene';", "import {r3Facility as batch01Facility,installR3Details} from './b01-r3-scene';\nimport revision3Input from '../../../data/m11b/batch01-r3/input.json';\nimport {applyB01R3Layout,adaptB01R3Terrain,buildB01R3Model,b01R3Checks} from './b01-r3-core.mjs';")
 s=s.replace('const layout:typeof source=effective.layout;', 'const r2Layout=effective.layout;\nconst layout:typeof source=applyB01R3Layout(r2Layout,revision3Input);')
 s=s.replace("const currentModel=verticalScheme==='patch04'?buildPatch04Model(p03Model,patch04Input):p03Model;", "const rawCurrentModel=verticalScheme==='patch04'?buildPatch04Model(p03Model,patch04Input):p03Model;\nconst currentModel=adaptB01R3Terrain(rawCurrentModel??buildTerrainModel(layout,effective.spec),layout,revision3Input);")
 s=s.replace('const b01Model=buildBatch01Model(layout,currentModel??buildTerrainModel(layout,effective.spec),batch01Input);','const b01Model=buildB01R3Model(layout,currentModel,batch01Input,revision3Input);')
 s=s.replace('const b01Report=b01R2Checks(patch.layout,layout,b01Model,batch01Input);','const b01Report=b01R3Checks(r2Layout,layout,b01Model,revision3Input);')
 s=s.replace('b01Bridge=installR2Details(', 'b01Bridge=installR3Details(')
 s=s.replace("name.startsWith('r2-')", "(name.startsWith('r2-')||name.startsWith('r3-'))")
 s=s.replace("name==='r2-section'?'section'", "(name==='r2-section'||name==='r3-section')?'section'")
 s=s.replace("name==='r2-axis'", "(name==='r2-axis'||name==='r3-axis')")
 s=s.replace("o.name.startsWith('R2-')", "(o.name.startsWith('R2-')||o.name.startsWith('R3-'))")
 s=s.replace("setView('r2-overview');renderer.setAnimationLoop(render)","setView('r3-overview');renderer.setAnimationLoop(render)")
 s=s.replace('B01 R2 · 五层剖面 / 中央功能区 / 校园主轴 · 待审阅','B01 R3 · 正面两端内退入口 / 主体前伸墙 / 中央轻弧 · 待审阅')
 marker='const el=<T extends HTMLElement>'
 cameras="""Object.assign(cameraPresets,{
 'r3-front':{label:'R3 整体正面 · 两端内退入口 / 中央浅弧',position:[73,14,109],target:[73,11.7,221]},
 'r3-overview':{label:'R3 全楼斜前 · 五层前伸墙与一层门廊',position:[-14,44,144],target:[66,11,219]},
 'r3-west':{label:'左端入口 · 正面内退 / 右侧五层实墙向前伸',position:[16.5,7.6,202.5],target:[28.3,6.2,217]},
 'r3-east':{label:'右端入口 · 正面内退 / 左侧五层实墙向前伸',position:[129.5,7.6,202.5],target:[117.7,6.2,217]},
 'r3-wall':{label:'五层主体墙超过门罩 · 不是短U形门斗',position:[17,22,202],target:[29.5,13,218]},
 'r3-porch-plan':{label:'端部俯看 · 仅首层剖看，门洞朝操场',position:[26.6,30,214],target:[26.6,3.4,216.5]},
 'r3-arc':{label:'中央功能区浅弧 · 墙/楼板/檐口同源',position:[83,13,199],target:[73,12,216]},
 'r3-arc-plan':{label:'中央曲线俯看 · 轴线与最前点不变',position:[73,45,214],target:[73,9,217]},
 'r3-axis':{label:'共轴保持 · 运动场 / 国旗 / 主楼 / 图书馆',position:[73,360,154],target:[73,0,154]},
 'r3-section':{label:'R2五层剖面保持 · 三层后排 / 四楼大坪',position:[140,24,231],target:[91,13,224]}
});
cameraPresets['r2-side']=cameraPresets['r3-east'];
"""
 s=s.replace(marker,cameras+marker)
 s=s.replace("setToiletLevel(name==='toilet-floor'", "setToiletLevel(name==='r3-porch-plan'?1:name==='toilet-floor'")
 s+="\nObject.assign(window,{__YALI_R3__:{...((window as any).__YALI_R2__),r3:revision3Input,model:b01Model,report:b01Report,baseLayout:r2Layout,terrain:currentModel}});\n"
 f.write_text(s)
html=R/'apps/campus/index.html';s=html.read_text()
if 'data-view="r3-front"' not in s:
 s=s.replace('B01 R2','B01 R3').replace('五层旧主楼 · 第二轮','两端入口与轻弧 · 第三轮')
 s=s.replace('第二轮 · 建筑与主轴','第三轮 · 入口与轻弧修复')
 s=s.replace('<div class="view-grid">','<div class="view-grid">'+''.join(f'<button data-view="{key}">{label}</button>'for key,label in [('r3-front','R3整体正面'),('r3-overview','R3修订总览'),('r3-west','左端入口'),('r3-east','右端入口'),('r3-wall','五层前伸墙'),('r3-porch-plan','入口平面'),('r3-arc','中央轻弧'),('r3-arc-plan','曲线俯看')]))
 s=s.replace('新画面待审阅。','R3按#29重做正面两端入口与前伸高墙，中央轻弧，局部门前三级台阶；新画面待审阅。')
 html.write_text(s)
