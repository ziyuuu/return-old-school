"""Apply the screenshot-found shoulder closure to the exact reviewed rig source."""
from pathlib import Path
import hashlib
p = Path('apps/campus/src/player/student-rig.mjs')
old_hash = 'ea58790371177d4b996df6305972e64f632e7596c162ef25fec650110fe9e76f'
new_hash = '4eb16f54f81017b36e388a087275aa1e6835a82aa95318ad6708512cc0670548'
digest = lambda b: hashlib.sha256(b).hexdigest()
if digest(p.read_bytes()) != new_hash:
    assert digest(p.read_bytes()) == old_hash, 'Unexpected rig version; do not overwrite it'
    s = p.read_text()
    s = s.replace('function ringsGeometry(rings, segments=48, folds=0, head=false) {',
                  'function ringsGeometry(rings, segments=48, folds=0, head=false, capTop=false) {', 1)
    anchor = "  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));"
    s = s.replace(anchor, """  if(capTop){
    const [y,,,cx=0,cz=0]=rings.at(-1),centre=p.length/3,start=(rings.length-1)*(segments+1);
    p.push(cx,y,cz);uv.push(2,(y-rings[0][0])*6);
    for(let j=0;j<segments;j++)ix.push(centre,start+j,start+j+1);
  }
""" + anchor, 1)
    s = s.replace('ringsGeometry(sampleProfiles(profiles,.012,bands),40,.0016)',
                  'ringsGeometry(sampleProfiles(profiles,.012,bands),40,.0016,false,true)', 1)
    assert digest(s.encode()) == new_hash, 'Patch did not produce the locally checked rig'
    p.write_text(s)
print('Closed both sleeve crowns: +80 effective triangles, same five batches and original envelope.')
