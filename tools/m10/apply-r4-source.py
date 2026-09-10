"""Small explicit source edits. Refuse missing preimages and save the resulting unified diff."""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[2]
def edit(path,a,b):
 p=ROOT/path;s=p.read_text()
 if b in s:return
 if a not in s:raise RuntimeError('Missing preimage: '+path+' '+a[:80])
 p.write_text(s.replace(a,b,1))
def main():
 p='apps/campus/src/layout-core.mjs'
 edit(p,"import { r3Checks }","import { r4Checks } from './revision-r4-core.mjs';\nimport { r3Checks }")
 edit(p,'...r3Checks(layout,{bounds,overlap})','...r3Checks(layout,{bounds,overlap}),...r4Checks(layout,{bounds,overlap})')
 p='apps/campus/src/revision-core.mjs';edit(p,' let t0=0,t1=1;',' if(!a||!b||!rect)return true;\n let t0=0,t1=1;')
 p='apps/campus/src/revision-r3-core.mjs'
 edit(p,"gap>0&&gap<=8,'Positive gap<=8working metres, formerly45; selected7H'","gap>0&&gap<=18,'R4 right/up shift replaces R3 exact7H; keep positive gap<=18H, not old45'")
 edit(p,'v.maxZ))<=8','v.maxZ))<=18')
 p='tests/m10/revision-r3.test.mjs';edit(p,'R3 preserves 23 unrelated facility transforms and datum','R3/R4 preserve 22 unaffected facility transforms relative to R2');edit(p,"'24','27'","'24','27','10'");edit(p,'assert.equal(count,23)','assert.equal(count,22)')
 p='apps/campus/src/main.ts'
 edit(p,'import { r3Facility',"import { r4Facility, setToiletSection } from './revision-r4-scene';\nimport { r3Facility")
 edit(p,"'08','11'","'08','10','11'")
 edit(p,"{'02':'侧门'","{'10':'主席台','23':'沙坑','02':'侧门'")
 edit(p,'if(r3Facility(','if(r4Facility(f,g,{box,mesh,line,rect,mats,layout}) || r3Facility(')
 edit(p,'ribbon([pa,pb],edgeWidth(layout,a,b));','const before=surfaces.children.length;\n ribbon([pa,pb],edgeWidth(layout,a,b));\n for(const o of surfaces.children.slice(before)){o.name=`road-${a}--${b}`;o.userData.route=[a,b];o.userData.width=edgeWidth(layout,a,b);}')
 file=ROOT/p;s=file.read_text()
 if(" } else if(f.kind==='toilet'){") in s:
  start=s.index(" } else if(f.kind==='toilet'){");end=s.index(" } else if(f.kind==='gym'){",start);file.write_text(s[:start]+s[end:])
 edit(p,'function setView(name:string){',"let toiletLevel=0;\nfunction setToiletLevel(level:number,focus=false){\n toiletLevel=level;setToiletSection(roots,level);el<HTMLSelectElement>('toilet-level').value=String(level);\n if(focus&&level){stopModes();active=camera;controls.enabled=true;topControls.enabled=false;const y=(level-1)*3.8;camera.position.set(7,y+10,238);controls.target.set(-10,y+1,224);controls.update();}\n}\nfunction setView(name:string){")
 edit(p,'stopModes();view=name;',"stopModes();view=name;setToiletLevel(name==='toilet-floor'?2:0);")
 edit(p,"el<HTMLInputElement>('labels-check').onchange","el<HTMLSelectElement>('toilet-level').onchange=e=>setToiletLevel(Number((e.target as HTMLSelectElement).value),true);\nel<HTMLInputElement>('labels-check').onchange")
 edit(p,'const snapshot:any={};',"const snapshot:any={};const extra:THREE.Object3D[]=[];roots.get('25')?.traverse(o=>{if(o.name)extra.push(o);});extra.push(...surfaces.children.filter(o=>o.name.startsWith('road-')));")
 edit(p,'for(const object of [...roots.values(),','for(const object of [...extra,...roots.values(),')
 edit(p,'layout,report,setView,selectFacility,probeSegment,geometrySnapshot,','layout,report,setView,selectFacility,setToiletLevel,probeSegment,geometrySnapshot,\n probeFloor:(x:number,y:number,z:number)=>{scene.updateMatrixWorld(true);const objects:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh)objects.push(o);});const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.5,z),new THREE.Vector3(0,-1,0),0,.8);return ray.intersectObjects(objects,false).map(h=>({name:h.object.name,y:h.point.y}));},')
 edit(p,'getState:()=>({view,fly,','getState:()=>({toiletLevel,view,fly,')
 p='apps/campus/index.html';file=ROOT/p;file.write_text(file.read_text().replace('M1.0 R3','M1.0 R4'))
 edit(p,'<label for="facility">','<label for="toilet-level">厕所逐层剖看（隐藏上方楼层）</label><select id="toilet-level"><option value="0">完整楼体</option><option value="1">第1层</option><option value="2">第2层</option><option value="3">第3层</option><option value="4">第4层</option></select><label for="facility">')
 edit(p,'<button data-view="overview"','<button data-view="toilet-floor">厕所逐层</button><button data-view="toilet-front">厕所前廊</button><button data-view="black-routes">黑线支路</button><button data-view="rostrum">主席台</button><button data-view="overview"')
 p='tools/m10/export-footprints.mjs';file=ROOT/p;file.write_text(file.read_text().replace('qa/m10-r3','qa/m10-r4'))
 edit(p,'navigation:l.navigation','navigation:l.navigation,toilet25:l.toilet25')
 for path,heading,text in [('README.md','# M1.0.3-R4 空间与逐层厕所修订','当前版本见 [R4修订与验收](docs/m10/revision-r4.md) 和 [回归清单](docs/m10/regression-r4.md)。当前QA为qa/m10-r4；以下旧记录为历史交付。'),('docs/development-plan.md','# M1.0.3-R4 执行更新','M0保持授权推定基线关闭；M1.0修复校友反馈，优先总图/道路，再连续厕所楼体及每层整幅楼板，最后实际WebGL验证。见 [R4修订](m10/revision-r4.md)。以下保留早期阶段规划，不表示当前尚未建模。')]:
  f=ROOT/path;s=f.read_text()
  if not s.startswith(heading):f.write_text(heading+'\n\n'+text+'\n\n'+s)
 patch=ROOT/'.github/m10-r4.patch'
 if not patch.exists():patch.write_text(subprocess.check_output(['git','diff','--','apps/campus','tests/m10','tools/m10/export-footprints.mjs'],cwd=ROOT,text=True))
 print('R4 source edits applied; actual source will be committed only after successful browser checks.')
if __name__=='__main__':main()
