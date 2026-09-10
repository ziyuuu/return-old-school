"""One-time, audited integration; leave every frozen M1.0 data file unchanged."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2]
lock=json.loads((R/'data/m11a/baseline-lock.json').read_text())
for path,digest in lock['file_sha256'].items():
 assert hashlib.sha256((R/path).read_bytes()).hexdigest()==digest,path+' changed from frozen baseline'
ref=R/'data/m11a/baseline-r4-layout.json'
if not ref.exists():ref.write_bytes((R/'data/m10/campus-layout.json').read_bytes())
p=R/'apps/campus/src/main.ts';s=p.read_text()
def replace(a,b):
 global s
 assert a in s,'Missing integration anchor: '+a[:80]
 s=s.replace(a,b)
if 'installTerrain' not in s:
 replace("import './style.css';","import './style.css';\nimport terrainSpec from '../../../data/m11a/terrain-input.json';\nimport {installTerrain} from './terrain-scene';")
 replace('const layout=source, report=checkLayout(layout);','''const layout=source, report=checkLayout(layout);
let terrainSystem:any=null;
const groundEye=(x:number,z:number)=>layout.navigation.reviewHeight+(terrainSystem?.enabled?terrainSystem.surfaceHeight(x,z):0);
const cameraPresets:any={...layout.cameraPresets,
 'terrain-gym':{label:'体育馆入口 · 4级H台阶',position:[-49,3.5,16],target:[-45,1,26]},
 'terrain-library':{label:'图书馆入口 · 3级H台阶',position:[69,3.8,236],target:[75,1.1,246]},
 'terrain-longya':{label:'长雅入口 · 6级H台阶',position:[122,3.8,240],target:[129,1.8,250]},
 'terrain-field':{label:'后缘跑道与前庭 · H地坪过渡',position:[120,5,192],target:[94,.2,183]},
 'terrain-main':{label:'主路 · 温和纵坡工作方案',position:[-8,3.2,167],target:[0,.8,204]},
 'terrain-gap':{label:'主楼/厕所 · 平接与桥下净空',position:[6.5,2.19,217],target:[6.5,2.19,238]}
};''')
 replace('const p=layout.cameraPresets[name as keyof typeof layout.cameraPresets];','const p=cameraPresets[name];')
 replace('体量校核 / 非精模 · 坐标全部为工作推定','M1.1-A 地坪校核 · 标高H推定 / 非测绘')
 replace('camera.position.set(start[0],layout.navigation.reviewHeight,start[2]);camera.lookAt(next[0],layout.navigation.reviewHeight,next[2]);','camera.position.set(start[0],groundEye(start[0],start[2]),start[2]);camera.lookAt(next[0],groundEye(next[0],next[2]),next[2]);')
 replace('camera.position.set(THREE.MathUtils.lerp(a[0],b[0],tourT),layout.navigation.reviewHeight,THREE.MathUtils.lerp(a[2],b[2],tourT));camera.lookAt(b[0],layout.navigation.reviewHeight,b[2]);','const tx=THREE.MathUtils.lerp(a[0],b[0],tourT),tz=THREE.MathUtils.lerp(a[2],b[2],tourT);camera.position.set(tx,groundEye(tx,tz),tz);const lt=Math.min(1,tourT+3/Math.max(len,1)),lx=THREE.MathUtils.lerp(a[0],b[0],lt),lz=THREE.MathUtils.lerp(a[2],b[2],lt);camera.lookAt(lx,groundEye(lx,lz),lz);')
 replace('const params=new URLSearchParams(location.search);','''terrainSystem=installTerrain({scene,surfaces,volumes,outlines,routeOverlay,roots,labels,layout,box,mats,structures},terrainSpec);
function setTerrain(on:boolean){terrainSystem.setEnabled(on);el<HTMLInputElement>('terrain-check').checked=on;el('terrain-state').textContent=on?'地坪方案 H · 1×':'R4 平基准对照';if(selected)selectFacility(selected,false);}
el<HTMLInputElement>('terrain-check').onchange=e=>setTerrain((e.target as HTMLInputElement).checked);
el('terrain-compare').onclick=()=>setTerrain(!terrainSystem.enabled);
el('terrain-export').onclick=()=>download('yali-m11a-terrain-working.json',new Blob([JSON.stringify(terrainSystem.model.exportData(),null,2)],{type:'application/json'}));
el('terrain-summary').textContent=`地坪检查 ${terrainSystem.report.results.filter((x:any)=>x.passed).length}/${terrainSystem.report.results.length}`;
el('terrain-checks').innerHTML=terrainSystem.report.results.map((r:any)=>`<div>${r.passed?'✓':'✕'} ${r.id}</div>`).join('');
Object.assign(window,{__YALI_M11A__:{ready:true,version:terrainSpec.version,state:()=>terrainSystem.state(),setEnabled:setTerrain,
 inspect:terrainSystem.inspect,groundEye,probeGround:terrainSystem.probeGround,probeActual:terrainSystem.probeActual,
 exportData:()=>terrainSystem.model.exportData(),setView,model:terrainSystem.model,
 getRoots:()=>Object.fromEntries([...roots].map(([id,g])=>[id,g.position.toArray()]))}});
setTerrain(true);
const params=new URLSearchParams(location.search);if(params.get('terrain')==='0')setTerrain(false);''')
 replace("el('details').innerHTML=`<h3>","el('details').innerHTML=`${terrainSystem&&f.position?`<div class=\"terrain-note\">地坪适配：H ${(terrainSystem.model.anchors[f.id]?.floor??0).toFixed(2)} m；主门相对零点，非海拔。${terrainSystem.enabled?'当前已开启':'当前R4对照'}</div>`:''}<h3>")
 replace('y=(level-1)*3.8;camera.position',"y=(level-1)*3.8+(terrainSystem?.enabled?terrainSystem.model.anchors['25'].floor:0);camera.position")
 s=s.replace('yali-M1.0-${view}','yali-M11A-${view}');p.write_text(s)
p=R/'apps/campus/index.html';s=p.read_text()
if 'terrain-compare' not in s:
 s=s.replace('复原雅礼 · M1.0 R4 空间骨架','复原雅礼 · M1.1-A 地坪与高差工作方案').replace('/ M1.0 R4','/ M1.1-A').replace('<span>空间骨架</span>','<span>地坪与高差</span>')
 s=s.replace('<div class="top-tools">','<div class="terrain-tools"><button id="terrain-compare">R4 / 地坪对照</button><span id="terrain-state">地坪方案 H · 1×</span></div><div class="top-tools">')
 s=s.replace('<label for="toilet-level">','<div class="terrain-note">主门=0m相对基准。运动场平整；局部入口台阶与温和坡度为H工作方案，未测绘。</div><label><input type="checkbox" id="terrain-check" checked> 启用M1.1-A地坪层</label><button id="terrain-export" class="wide">导出地坪与纵剖数据</button><details><summary id="terrain-summary">地坪检查</summary><div id="terrain-checks"></div></details><label for="toilet-level">')
 s=s.replace('<nav class="views" aria-label="校核机位">','<nav class="views" aria-label="校核机位"><button data-view="terrain-main">主路地坪</button><button data-view="terrain-gym">馆前台阶</button><button data-view="terrain-library">图书馆台阶</button><button data-view="terrain-longya">长雅台阶</button><button data-view="terrain-field">跑道/前庭</button><button data-view="terrain-gap">桥下净空</button>')
 if 'rel="icon"' not in s:s=s.replace('<title>','<link rel="icon" href="data:,"><title>')
 p.write_text(s)
p=R/'apps/campus/src/style.css';s=p.read_text()
if '.terrain-tools{' not in s:p.write_text(s+'\n.terrain-tools{position:fixed;right:28px;top:88px;z-index:8;display:flex;align-items:center;gap:10px;font-size:12px;color:#42594c}.terrain-tools button{font:inherit;padding:9px 14px;border:1px solid #97a993;border-radius:8px;background:#f9f8ec;color:#224940;cursor:pointer}.terrain-note{font-size:12px;line-height:1.7;padding:10px;margin:10px 0;background:#edf0e8;border-left:3px solid #8e9f85;color:#395347}.clean .terrain-tools{display:none}@media(max-width:700px){.terrain-tools{top:93px;right:15px;gap:4px}.terrain-tools span{display:none}.terrain-tools button{padding:7px 10px}}\n')
# Retain Ramp shader callback on the double-sided terrain edge material.
p=R/'apps/campus/src/terrain-scene.ts';s=p.read_text().replace('m.material=mats[6].clone();','m.material=mats[6].clone();m.material.onBeforeCompile=mats[6].onBeforeCompile;m.material.customProgramCacheKey=mats[6].customProgramCacheKey;');p.write_text(s)
callback='m.material.onBeforeCompile=mats[6].onBeforeCompile;m.material.customProgramCacheKey=mats[6].customProgramCacheKey;'
while callback+callback in s:s=s.replace(callback+callback,callback)
p.write_text(s)
print('M1.1-A integration ready; all4 frozen-file hashes unchanged.')
