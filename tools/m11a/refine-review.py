"""Improve near-field shadow sampling and framing, not terrain or horizontal placement."""
from pathlib import Path
R=Path(__file__).resolve().parents[2]
p=R/'apps/campus/src/main.ts';s=p.read_text()
if 'function setReviewShadow' not in s:
 s=s.replace('scene.add(sun,sun.target);','''scene.add(sun,sun.target);
const sunDirection=new THREE.Vector3(-145,260,-215).normalize();
function setReviewShadow(target:number[],detail=false){
 if(detail){sun.target.position.set(target[0],target[1],target[2]);sun.position.copy(sun.target.position).addScaledVector(sunDirection,365);}
 else{sun.position.set(-100,260,-80);sun.target.position.set(45,0,135);}
 const extent=detail?38:250;
 Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:1,far:900});
 sun.shadow.normalBias=detail?.025:.18;sun.shadow.bias=detail?-.000035:-.00015;
 sun.shadow.camera.updateProjectionMatrix();sun.target.updateMatrixWorld();sun.updateMatrixWorld();sun.shadow.needsUpdate=true;
}''')
 s=s.replace("const p=cameraPresets[name];if(!p)return;stopModes();","const p=cameraPresets[name];if(!p)return;setReviewShadow(p.target,name.startsWith('terrain-'));stopModes();")
 s=s.replace("el('tour-btn').onclick=()=>{if(tour)","el('tour-btn').onclick=()=>{setReviewShadow([45,0,135],false);if(tour)")
 s=s.replace("el('fly-btn').onclick=()=>{","el('fly-btn').onclick=()=>{setReviewShadow([45,0,135],false);")
 s=s.replace('position:[-49,3.5,16],target:[-45,1,26]','position:[-53,4.2,10],target:[-45,1.3,25]')
 s=s.replace('position:[69,3.8,236],target:[75,1.1,246]','position:[68,3.8,232],target:[75,1.1,246]')
 s=s.replace('position:[122,3.8,240],target:[129,1.8,250]','position:[120,4.3,236],target:[129,1.8,250]')
 p.write_text(s)
p=R/'apps/campus/src/terrain-scene.ts';s=p.read_text();callback='m.material.onBeforeCompile=mats[6].onBeforeCompile;m.material.customProgramCacheKey=mats[6].customProgramCacheKey;'
while callback+callback in s:s=s.replace(callback+callback,callback)
p.write_text(s)
# Make future one-time adapter runs idempotent for the cloned Ramp callback.
p=R/'tools/m11a/apply-stage.py';s=p.read_text();needle="p.write_text(s)\nprint('M1.1-A integration ready; all4 frozen-file hashes unchanged.')"
if 'while callback+callback' not in s:
 s=s.replace(needle,"p.write_text(s)\ncallback='"+callback+"'\nwhile callback+callback in s:s=s.replace(callback+callback,callback)\np.write_text(s)\nprint('M1.1-A integration ready; all4 frozen-file hashes unchanged.')")
 p.write_text(s)
print('Near-field shadow window and camera framing refined. Terrain/data unchanged.')
