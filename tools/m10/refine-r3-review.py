"""Idempotent review fixes after actual screenshots: camera framing and clear gate labels."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
def patch(name,a,b):
 p=R/name;s=p.read_text()
 if b in s:return
 assert a in s,(name,a[:90]);p.write_text(s.replace(a,b,1))
p=R/'data/m10/layout-input.json';l=json.loads(p.read_text());assert l['version']=='M1.0.2-R3'
l['cameraPresets']['longya']['position']=[129,14,205];l['cameraPresets']['longya']['target']=[129,7,257]
p.write_text(json.dumps(l,ensure_ascii=False,indent=2)+'\n')
patch('apps/campus/src/main.ts','tourEdge=tourT=0;el(\'tour-btn\')',"tourEdge=tourT=0;const start=layout.navigation.nodes[tourPath[0] as keyof typeof layout.navigation.nodes],next=layout.navigation.nodes[tourPath[1] as keyof typeof layout.navigation.nodes];camera.position.set(start[0],layout.navigation.reviewHeight,start[2]);camera.lookAt(next[0],layout.navigation.reviewHeight,next[2]);el('tour-btn')")
patch('apps/campus/src/main.ts','function addLabel(f:Facility){if(!f.position)return;',"const shortLabels:Record<string,string>={'02':'侧门','20':'家属区','24':'音乐楼 · 4F','25':'主楼厕所','26':'池畔厕所','27':'校名石'};\nfunction addLabel(f:Facility){if(!f.position)return;")
patch('apps/campus/src/main.ts',"${f.name.replace(/（.*?）/g,'').replace('旧主教学楼／教室','旧主教学楼')}","${shortLabels[f.id] ?? f.name.replace(/（.*?）/g,'').replace('旧主教学楼／教室','旧主教学楼')}")
patch('apps/campus/src/main.ts','label.node.style.left=`${(projected.x*.5+.5)*innerWidth}px`;label.node.style.top=`${(-projected.y*.5+.5)*innerHeight}px`;','const ox=view===\'top\'?(id===\'27\'?-35:id===\'02\'?35:0):0,oy=view===\'top\'?(id===\'01\'?-18:[\'02\',\'27\'].includes(id)?8:0):0;label.node.style.left=`${(projected.x*.5+.5)*innerWidth+ox}px`;label.node.style.top=`${(-projected.y*.5+.5)*innerHeight+oy}px`;')
patch('tools/m10/capture-r3.py',"report['checks'].append({'name':name,'passed':bool(condition),'detail':detail})","report['checks'].append({'name':name,'passed':bool(condition),'detail':detail});print(name, bool(condition), flush=True)")
patch('tools/m10/capture-r3.py',"page.locator('#tour-btn').click();page.wait_for_timeout(150);check('ground tour eye height',abs(page.evaluate('window.__YALI_M10__.getState().camera[1]')-1.7)<.01)","page.locator('#tour-btn').click();page.wait_for_function('window.__YALI_M10__.getState().tour && Math.abs(window.__YALI_M10__.getState().camera[1]-1.7)<.01',timeout=15000);check('ground tour eye height',abs(page.evaluate('window.__YALI_M10__.getState().camera[1]')-1.7)<.01,page.evaluate('window.__YALI_M10__.getState()'))")
patch('tools/m10/capture-r3.py',"page.keyboard.down('KeyW');page.wait_for_timeout(200);page.keyboard.up('KeyW')","page.keyboard.down('KeyW');page.wait_for_function('p=>JSON.stringify(window.__YALI_M10__.getState().camera)!==JSON.stringify(p)',arg=before,timeout=15000);page.keyboard.up('KeyW')")
print('Applied review fixes without changing any facility position/size.')
