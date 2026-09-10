"""Idempotent, explicit fixes found by inspecting the first real R2 screenshots.
This edits only named R2/readable files; the workflow commits these edits before capture.
"""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[3]
def replace(path,old,new,marker=None):
 f=R/path;s=f.read_text()
 if (marker or new) in s:return
 if old in s:s=s.replace(old,new)
 else:raise RuntimeError('Unexpected preimage: '+path)
 f.write_text(s)
core='apps/campus/src/b01-r2-core.mjs'
replace(core,"   wall('15',l,'z',z,-w/2,w/2,fy,ceiling,cuts,'corridor-wall');", """   // Classroom-facing corridor windows are true openings, as visible on the terrace.
   for(const r of rooms){const x=(r.a+r.b)/2+1.05,ww=2.45,sh=.95,hh=1.9;cuts.push([x-ww/2,x+ww/2,fy+sh,fy+sh+hh]);window(l,z,x,fy+sh,ww,hh);}
   wall('15',l,'z',z,-w/2,w/2,fy,ceiling,cuts,'corridor-wall');""", 'Classroom-facing corridor windows are true openings')
replace(core,"  for(const x of [-w/2+.12,w/2-.12])wall('15',l,'x',x,front,backLimit,fy,ceiling,[[c0+.15,c1-.15,fy,fy+m.doorHeight]],'end-wall');", "  // Only the west end has floor bridges. Do not repeat the east ground door above a void.\n  for(const x of [-w/2+.12,w/2-.12])wall('15',l,'x',x,front,backLimit,fy,ceiling,x<0||l===1?[[c0+.15,c1-.15,fy,fy+m.doorHeight]]:[],'end-wall');")
replace(core," put('R2_IDS_UNIQUE',new Set(ps.map(q=>q.id)).size===ps.length);", """ put('R2_CORRIDOR_WINDOWS',ps.filter(q=>q.owner==='15'&&q.role==='glazing'&&Math.abs(Math.abs(q.center[2])-1.4)<.01).length===96);
 for(let l=2;l<=5;l++){const y=model.mainFloor+(l-1)*3.8+1.7;put('R2_EAST_UPPER_END_CLOSED_L'+l,model.worldParts.some(q=>q.role==='end-wall'&&segmentBox([123,y,224],[121,y,224],q)));}
 put('R2_IDS_UNIQUE',new Set(ps.map(q=>q.id)).size===ps.length);""", 'R2_CORRIDOR_WINDOWS')
main='apps/campus/src/main.ts'
for old,new in [
 ('position:[73,14,146],target:[73,12,221]','position:[73,14,119],target:[73,12,221]'),
 ('position:[-24,52,147],target:[57,10,229]','position:[-65,75,125],target:[51,10,227]'),
 ('position:[110,17.5,229.5],target:[36,17.1,225.7]','position:[35,16.6,229.5],target:[111,16.55,225.8]'),
 ('position:[110,21.5,224.8],target:[36,21.3,224.8]','position:[35,20.35,224.5],target:[111,20.3,224.5]'),
 ("topCamera.zoom=1;topCamera.updateProjectionMatrix();","topCamera.zoom=name==='r2-axis'?1.5:1;topCamera.updateProjectionMatrix();")]:replace(main,old,new)
replace('tools/m11b/r2/package.py','font-family="sans-serif"','font-family="Noto Sans CJK SC, Microsoft YaHei, sans-serif"')
f=R/'data/m11b/batch01-r2/input.json';p=json.loads(f.read_text());p['status']='IMPLEMENTED / REVIEW_PENDING';f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
f=R/'docs/development-plan.md';s=f.read_text().replace('|M1.1-B 第一批R2|IMPLEMENTATION / REVIEW_PENDING|','|M1.1-B 第一批R2|IMPLEMENTED / REVIEW_PENDING|');f.write_text(s)
capture='tools/m11b/r2/capture.py'
replace(capture,"  views=['r2-front'", """  ends=page.evaluate('''()=>{const a=window.__YALI_R2__;return [2,3,4,5].map(l=>({l,hits:a.probe([123,a.model.mainFloor+(l-1)*3.8+1.7,224],[121,a.model.mainFloor+(l-1)*3.8+1.7,224])}));}''')
  save('east-upper-ends.json',ends);check('upper east ends do not open onto void',all(q['hits']for q in ends),ends)
  glazing=page.evaluate('''()=>{const a=window.__YALI_R2__,q=a.model.parts.find(q=>q.owner==='15'&&q.level===4&&q.role==='glazing'&&Math.abs(q.center[2]+1.4)<.01),x=73+q.center[0]+.3,y=a.model.mainFloor+q.center[1];return a.probe([x,y,225],[x,y,222.2]);}''')
  check('fourth corridor has actual glazing without solid wall behind',any('glazing' in h['name']for h in glazing)and not any('corridor-wall' in h['name']for h in glazing),glazing)
  views=['r2-front'""", 'east-upper-ends.json')
print('Applied screenshot-driven fixes; archived R4/P3/P4 remain untouched.')
