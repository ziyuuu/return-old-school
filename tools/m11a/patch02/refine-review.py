"""Idempotent screenshot-review adjustments; no layout or terrain changes."""
from pathlib import Path
R=Path(__file__).resolve().parents[3]
p=R/'apps/campus/src/main.ts';s=p.read_text()
s=s.replace('sun.position.set(-100,260,-80)','sun.position.set(190,260,-80)').replace('new THREE.Vector3(-145,260,-215)','new THREE.Vector3(145,260,-215)')
s=s.replace('position:[-17,7.5,69],target:[-31,4.7,63]','position:[-9,11,80],target:[-31,4.7,63]')
s=s.replace('position:[-36,7.5,63],target:[-45,6.4,46]','position:[-36,7.5,63],target:[-46,1.6,45]')
p.write_text(s)
p=R/'apps/campus/src/patch02-gym.ts';s=p.read_text()
s=s.replace('[sign*15,18,.4],[sign*20.72,19.2,0]','[sign*15,p.gym.signTop,.4],[sign*20.72,p.gym.height,0]')
s=s.replace('ys=[19.2,18,18,19.2]','ys=[p.gym.height,p.gym.signTop,p.gym.signTop,p.gym.height]')
s=s.replace('[us[i+1],11.8,41.8],[us[i],11.8,41.8]','[us[i+1],p.gym.roofRearHeight,41.8],[us[i],p.gym.roofRearHeight,41.8]')
p.write_text(s)
p=R/'tools/m11a/patch02/capture.py';s=p.read_text()
needle="  for view in ['top','overview'"
if 'actual gym height matches H parameter' not in s:
 s=s.replace(needle,"  check('actual gym height matches H parameter',page.evaluate(\"(()=>{const a=window.__YALI_P02__,h=window.__YALI_M11A__.state().anchors['03'].floor;return Math.abs(Math.max(...Object.values(a.geometrySnapshot()).filter(x=>x.role==='upper-shell').map(x=>x.max[1]))-h-a.parameters.gym.height)<.002})()\"))\n"+needle)
p.write_text(s)
print('Refined inspection light/camera and parameter-driven shell height; no layout changes.')
