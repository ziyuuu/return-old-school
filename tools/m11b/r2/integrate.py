"""One-time, preimage-checked integration of R2 into the existing Vanilla viewer.
Readable final source is committed by CI. No seed archives or frozen data are replayed.
"""
from pathlib import Path
import hashlib
R=Path(__file__).resolve().parents[3]
f=R/'apps/campus/src/main.ts';s=f.read_text()
if "from './b01-r2-core.mjs'" not in s:
    blob=hashlib.sha1(b'blob '+str(len(f.read_bytes())).encode()+b'\0'+f.read_bytes()).hexdigest()
    if blob!='05d7bc72bc38dc761a490cdaff9245f1a89b69ed':raise RuntimeError('Unexpected main.ts preimage '+blob)
    s=s.replace("import patch04Input from", "import patch04Base from")
    s=s.replace("../../../data/m11b/batch01/input.json", "../../../data/m11b/batch01-r2/input.json")
    s=s.replace("import {buildBatch01Model,batch01Checks} from './batch01-core.mjs';", "import {applyB01R2,buildB01R2Model as buildBatch01Model,b01R2Checks} from './b01-r2-core.mjs';")
    s=s.replace("import {batch01Facility,installBatch01Bridge} from './batch01-scene';", "import {r2Facility as batch01Facility,installR2Details} from './b01-r2-scene';")
    s=s.replace("const layout:typeof source=patch.layout;", "const effective=applyB01R2(patch.layout,patch.terrain,patch04Base,batch01Input);\nconst layout:typeof source=effective.layout;\nconst patch04Input=effective.site;")
    s=s.replace("buildPatch03Model(layout,patch.terrain,patch03Input)","buildPatch03Model(layout,effective.spec,patch03Input)")
    s=s.replace("buildTerrainModel(layout,patch.terrain)","buildTerrainModel(layout,effective.spec)")
    s=s.replace("const terrainSpec=p03Model?.spec??patch.terrain;", "const terrainSpec=p03Model?.spec??effective.spec;")
    s=s.replace("patch03Checks(layout,patch.terrain,patch03Input)","patch03Checks(patch.layout,patch.terrain,patch03Input)")
    s=s.replace("const b01Report=batch01Checks(layout,b01Model,layout);", "const b01Report=b01R2Checks(patch.layout,layout,b01Model,batch01Input);")
    s=s.replace("const el=<T extends HTMLElement>", """Object.assign(cameraPresets,{
 'r2-front':{label:'五层旧主楼 · 中央功能区前凸',position:[73,14,146],target:[73,12,221]},
 'r2-overview':{label:'第二轮 · 五层主楼、连续厕所和共轴图书馆',position:[-24,52,147],target:[57,10,229]},
 'r2-entry':{label:'中央国旗 → 主楼正门 / 功能区',position:[80,8,195],target:[73,9,216]},
 'r2-rear':{label:'三层后排教室 · 四楼大坪 · 五层单排主体',position:[134,33,255],target:[76,13,225]},
 'r2-terrace':{label:'四楼后坪 · 内侧有顶廊 / 外侧露天',position:[110,17.5,229.5],target:[36,17.1,225.7]},
 'r2-fifth':{label:'五楼走廊 · 下方四楼后坪',position:[110,21.5,224.8],target:[36,21.3,224.8]},
 'r2-section':{label:'侧剖校核 · 下三层双排 / 四层坪 / 五层廊',position:[140,24,231],target:[91,13,224]},
 'r2-floor2':{label:'二层剖看 · 双排教室与中走廊',position:[73,54,209],target:[73,7.3,224]},
 'r2-side':{label:'教学楼侧门 · 凸出门廊与内退门洞',position:[132,6.8,212],target:[122.5,5.5,224]},
 'r2-bridge5':{label:'第五层连接 · H延续逐层相连原则',position:[12,25,211],target:[4,19.7,224]},
 'r2-library':{label:'主楼后门 → 中轴图书馆入口',position:[73,5.4,234],target:[73,7,249]},
 'r2-axis':{label:'四节点共轴 · 08 → 中央国旗 → 15 → 18',position:[73,360,154],target:[73,0,154]}
});
const el=<T extends HTMLElement>""")
    s=s.replace("['#253d41','#405e60','#73918b']", "['#253d41','#405e60','#73918b'],['#774f4c','#a77770','#c69c92'],['#811e24','#b5252b','#d33b3c'],['#bb9436','#e5bb4e','#f8d169']")
    s=s.replace("name.startsWith('b01-')||name.startsWith('p04-')", "name.startsWith('b01-')||name.startsWith('r2-')||name.startsWith('p04-')")
    s=s.replace("name==='toilet-floor'||name==='b01-floor2'?2:0", "name==='toilet-floor'||name==='b01-floor2'||name==='r2-floor2'?2:0")
    s=s.replace("document.querySelectorAll('[data-view]').forEach", "b01Bridge?.setMode(name==='r2-section'?'section':name==='r2-axis'?'axis':'normal');\n document.querySelectorAll('[data-view]').forEach")
    s=s.replace("name==='top'", "(name==='top'||name==='r2-axis')").replace("name!=='top'", "(name!=='top'&&name!=='r2-axis')")
    s=s.replace("innerWidth<700&&name.startsWith('b01-')", "innerWidth<700&&(name.startsWith('b01-')||name.startsWith('r2-'))&&name!=='r2-axis'")
    s=s.replace("setView('b01-oblique');renderer.setAnimationLoop(render);", "setView('r2-overview');renderer.setAnimationLoop(render);")
    s=s.replace("b01Bridge=installBatch01Bridge({volumes,roots,structures,mats},b01Model);", "b01Bridge=installR2Details({volumes,roots,structures,mats,scene,renderer,site:patch04Input,terrain:currentModel??terrainSystem.model},b01Model);")
    s=s.replace("o.name.startsWith('B01-')||o.name.startsWith('P04-')", "o.name.startsWith('B01-')||o.name.startsWith('R2-')||o.name.startsWith('P04-')")
    s=s.replace("M1.1-B 第一批 · 旧主楼 / 连廊 / 厕所 · 待审阅", "B01 R2 · 五层剖面 / 中央功能区 / 校园主轴 · 待审阅")
    s += "\nObject.assign(window,{__YALI_R2__:{...((window as any).__YALI_B01__),layout,baseLayout:patch.layout,changes:effective.changes,site:patch04Input,setAxis:(on:boolean)=>b01Bridge.setAxis(on),detailState:()=>b01Bridge.state()}});\nlabelsOn=false;el<HTMLInputElement>('labels-check').checked=false;\nel<HTMLInputElement>('r2-axis-check').onchange=e=>b01Bridge.setAxis((e.target as HTMLInputElement).checked);\n"
    f.write_text(s)
f=R/'apps/campus/index.html';s=f.read_text()
if 'r2-axis-check' not in s:
    s=s.replace('M1.1-B Batch01','M1.1-B B01 R2').replace('旧主楼 · 第一批','五层旧主楼 · 第二轮')
    s=s.replace('<option value="4">第4层</option>','<option value="4">第4层</option><option value="5">第5层</option>')
    s=s.replace('厕所逐层剖看（隐藏上方楼层）','建筑逐层剖看（隐藏上方楼层）')
    s=s.replace('<div class="toggles">','<label><input type="checkbox" id="r2-axis-check"> 显示四节点校园主轴</label><div class="toggles">')
    start=s.index('  <details class="b01-panel"');end=s.index('<nav class="views"',start)
    views=[('front','五层正面'),('overview','修订总览'),('entry','中央国旗/正门'),('rear','三层后排'),('terrace','四楼大坪'),('fifth','五楼走廊'),('section','侧剖关系'),('floor2','二层平面'),('side','侧门门廊'),('bridge5','第五层桥'),('library','后门/图书馆'),('axis','主轴俯视')]
    panel='<details class="b01-panel" open><summary>第二轮 · 建筑与主轴</summary><div class="view-grid">'+''.join(f'<button data-view="r2-{v}">{label}</button>'for v,label in views)+'</div></details>'
    s=s[:start]+'  '+panel+s[end:]
    s=s.replace('导出当前布局 JSON（含P02）','导出有效布局（含#28例外）')
    s=s.replace('本批复原旧主楼、厕所与连接桥；四楼后坪来自旧照片及校友回忆。第一批待审阅。','R2：五层教室/廊；四层教室/廊/坪；下三层双排教室夹廊。主轴经#28例外校正。内部楼梯段/家具不在本批；新画面待审阅。')
    f.write_text(s)
print('R2 integrated; only main.ts and index.html touched.')
