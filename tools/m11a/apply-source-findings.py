"""Final textual source cross-check: preserve the documented uphill entrance, not a flat assumption."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
p=R/'data/m11a/terrain-input.json';d=json.loads(p.read_text())
d['gradeKnots']=[[0,0],[4,0],[24,.20],[80,.20],[160,.30],[214,.45],[291,.45]]
d['gradeBasis']='R校友图集正文明确门口向校内上坡；H门内4–24工作米段抬升0.20m，真实坡度/长度未量测。'
d['entrySlopeEvidence']={'source':'Sina2018','section':'校门段正文','finding':'从校门向校内为上坡','qualitative_only':True,'numerical_rise_H_m':.20,'numerical_run_H_m':20,'measured':None}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
p=R/'apps/campus/src/terrain-core.mjs';s=p.read_text()
if "put('ENTRY_ASCENDS'" not in s:
 anchor=" put('MUSIC_GYM_LEVEL',"
 assert anchor in s
 s=s.replace(anchor," put('ENTRY_ASCENDS',t.groundHeight(0,24)>t.groundHeight(0,4)+.1,'R source text confirms uphill; H rise and length');\n"+anchor)
 p.write_text(s)
p=R/'tests/m11a/terrain.test.mjs';s=p.read_text()
if 'flat entrance contradicts source' not in s:
 p.write_text(s+"\nbad('flat entrance contradicts source',(a,b)=>b.gradeKnots=[[0,0],[80,0],[160,.15],[214,.45],[291,.45]],'ENTRY_ASCENDS');\n")
p=R/'apps/campus/src/main.ts';s=p.read_text()
if "'terrain-entrance':" not in s:
 anchor=" 'terrain-gym':"
 assert anchor in s
 s=s.replace(anchor," 'terrain-entrance':{label:'主门内上坡 · 文字依据 / H数值',position:[-7,2.5,4],target:[0,.3,25]},\n"+anchor)
 p.write_text(s)
p=R/'apps/campus/index.html';s=p.read_text()
if 'data-view="terrain-entrance"' not in s:
 s=s.replace('<button data-view="terrain-main">','<button data-view="terrain-entrance">主门内上坡</button><button data-view="terrain-main">')
 p.write_text(s)
p=R/'tools/m11a/capture.py';s=p.read_text()
if 'actual entrance climbs inward' not in s:
 anchor="  roots=page.evaluate('window.__YALI_M11A__.getRoots()');"
 assert anchor in s
 check="  check('actual entrance climbs inward',page.evaluate(\"(()=>{const a=window.__YALI_M11A__,at=(z)=>a.probeGround(0,z).find(h=>h.name.startsWith('M11A-road-'))?.y;return at(24)>at(4)+.1})()\"))\n"
 s=s.replace(anchor,check+anchor)
 s=s.replace("['overview','top','terrain-main'","['overview','top','terrain-entrance','terrain-main'")
 p.write_text(s)
p=R/'data/m11a/research-sources.json';d=json.loads(p.read_text())
d['text_cross_checks']=[{'id':'TXT-ENTRY-SLOPE','url':'https://k.sina.com.cn/article_6430641585_17f4bcdb1001003x9v.html','section':'校门','finding':'原帖明确校门通往校内是上坡','implementation':'H20m水平段抬升0.20m；定性方向来自正文，数值不是测绘'},{'id':'TXT-SHOP-SLOPE','url':'https://k.sina.com.cn/article_6430641585_17f4bcdb1001003x9v.html','section':'长雅楼','finding':'记述零食店在侧巷坡下','implementation':'仅登记未闭合线索；22仍未定位，不据此恢复用户删除的绿色道路'}]
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for filename in ['research-findings.md','implementation-plan.md']:
 p=R/'docs/m11a'/filename;s=p.read_text()
 if '入口上坡文字复核' not in s:
  s+='\n\n## 入口上坡文字复核\n\n复核[同一校友图集正文](https://k.sina.com.cn/article_6430641585_17f4bcdb1001003x9v.html)时，确认其明确描述校门向校内为上坡。该定性线索优先于最初入口平地假设；实现改为门内4–24工作米段上升0.20m（约1%的H纵坡），入口零点不变。真实坡度、长度和年代精确标高仍未知；运动区继续作为平整台地。增加“入口不能恢复为平地”的失败回归及实际路面射线校核。\n\n正文还提及长雅侧巷的小店处在坡下，但尚不足以将22定位或证明新路；此条只记录线索，不恢复绿色错误绕行。原文观察者的左右不覆盖用户已确认的总图方位。\n'
  p.write_text(s)
p=R/'tools/m11a/package.py';s=p.read_text()
s=s.replace("titles={'overview':","titles={'terrain-entrance':'主门向内上坡：方向有文字依据，坡度为H','overview':")
# A previous pass delivery page is not the authoritative report for a new build.
s=s.replace("and p.suffix.lower() not in badext and not p.name.startswith('.env'):","and p.suffix.lower() not in badext and not p.name.startswith('.env') and p.name!='delivery.md':")
p.write_text(s)
print('Source text uphill direction implemented; no frozen XZ, widths, topology or main/toilet contact modified.')
