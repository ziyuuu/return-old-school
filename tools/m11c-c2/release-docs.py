"""Write the R2 design record; aggregate only fresh, SHA-matching browser results."""
from pathlib import Path
import json,sys,hashlib,shutil
r=Path('.')
if '--aggregate' not in sys.argv:
    evidence={
      'version':'C2.R2','status':'IMPLEMENTED / REVIEW_PENDING',
      'target':'2006–2010 Yali Dongtang student, generic fictional identity',
      'primaryBasis':'User corrections and final approved character design in this conversation',
      'confirmedByUser':{'grade':'A','collar':'white folded','body':'blue','chestAndSleeves':'white band above red band on blue','mark':'YL on wearer-left chest','fit':'loose blue tracksuit and long blue trousers'},
      'designReference':{'file':'雅礼中学学生3d设定图.png','kind':'AI-generated design sheet approved as art direction, NOT an archival photo','publicFileIncluded':False},
      'hypotheses':['Exact dye values and stripe widths','Back-band continuation','Garment zip length and sewing details','YL letterform and exact size','No visible trouser side stripe as a replaceable working choice','Generic face, hair, body proportions, sneakers and gait'],
      'omitted':['Back logo or text','Personal name, class and real portrait','Unrequested backpack and gameplay mechanics'],
      'superseded':['C2 R1 white/red/navy uniform was rejected','Earlier generated reference-board photo panels are synthetic and must not be cited as real photos','The stale local c2-player.ts box puppet and replacement controller are NOT part of this implementation'],
      'archivalContextOnly':[{'url':'https://www.sohu.com/a/162618801_391114','note':'Previously recorded recollection of oversized clothing; not reclassified here as proof of dyes, logo or construction.'}]}
    (r/'data/m11c/c2/evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    (r/'docs/m11c/c2/design.md').write_text('''# C2 R2｜用户认可造型的实际学生模型

**IMPLEMENTED / REVIEW_PENDING**。替换用户否定的C2 R1造型；用户此前认可的是设定图，不是本次尚待审阅的实装模型。

A：白翻领、蓝上衣及宽松蓝裤、胸袖白带在上红带在下、左胸YL。H：精确染色、条带宽度、背带延续、拉链长度、YL字形/尺寸、裤侧暂不放条、虚构脸型/发型、鞋与动作参数。设定图是AI生成的美术设计，不是历史照片；此前生成图中标为真实参考的面板不进入证据链。无背字、背部YL、班级、姓名或未经要求的背包系统。

## 模型和动画

约1.72m的连续蒙皮造型，15关节、5个SkinnedMesh材质批次；领片、宽松衣袖/裤筒、手指、鞋、YL和短发为真实几何，不是方盒或胶囊拼装假人。有限几何用于改善轮廓、接合和变形，不细分平面凑数。衣带边界明确，局部轮廓插值有界。

idle/walk/run/air由速度和接地决定，真实累计位移推进步态相位。GLB包含Idle/Walk/Run骨骼动画，导出片段不改变当前姿势。空中只为下降姿态，不新增跳跃玩法。

## 共享规范与偏离

统一标准v1.0 + mobile-r12。新增角色表面复用surfaceMaterial、cloneSurfaceMaterial、程序纹理、共同日光、天空、曝光和场景反射。集中character-materials.ts中的蓝白红色值是用户认可色彩关系下的H美术参数，不改原校园色板，不冒称历史RGB。

蒙皮采用角色原生UV，避免世界投影纹理随衣服运动滑移；仅角色克隆材质调整。这是必要局部偏离，无外部照片贴图、独立人物灯、bloom、暗角、景深。继承C1接地影近似，不宣称实时人物太阳投影。人物工坊复用同一模型与日光，不是用于过QA的代理高模。

## 继承

C1 R1.2胶囊、相机相对A/D、坡速、固定步进、实体碰撞、相机防穿、失焦暂停、摇杆和流畅/清晰档均保留。旧工作目录的c2-player.ts不进入本版。B01—B05道路、高差、入口和已认可几何不动。C3尚未开始。
''')
    (r/'docs/m11c/c2/delivery.md').write_text('''# C2 R2｜学生角色实装交付

**IMPLEMENTED / REVIEW_PENDING**。C2 R1错误校服/人偶已被用户否定；R2采用用户确认的白领、蓝身、胸袖上白下红和左胸YL。不登记acceptance、不合并main。

## 文件与操作

校园离线文件：`artifacts/m11c-c2/r2/Yali_C2_R2_Viewer.html`。独立人物工坊：`artifacts/m11c-c2/r2/Yali_C2_R2_Character.html`。GLB：`artifacts/m11c-c2/r2/Yali_Student_C2_R2.glb`，含Idle/Walk/Run动画。工坊和校园使用同一蒙皮代码，不存在截图专用高模。

桌面WASD/方向键移动、Shift跑、拖动观察、V第一/第三人称、Esc暂停；手机左摇杆、右侧观察、跑步按钮。帮助里可换流畅/清晰档。工坊可切正/侧/背/面部及站立/行走/跑步，并导出GLB。

## 规范、证据和边界

遵循v1.0 + mobile-r12，角色UV和集中颜色的局部偏离详见[设计](design.md)。[证据记录](../../../data/m11c/c2/evidence.json)把用户A确认与精确H参数分开；生成设定图不是历史照片。人物为通用虚构学生。模型、姿态和动画可审阅，不把程序化造型冒称照片级一致。

C1控制/碰撞/手机优化及已认可校园保留；人物5个蒙皮材质批次。接地影是近似，C3全校园通行尚未开始。软件GPU和模拟触屏不等于实体手机流畅性验收；工坊60帧样本只代表角色及共同日光/地面，不冒充全校园FPS。

## 复现

```sh
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11c/c1/*.test.mjs tests/m11c/c2/*.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11c-c2/export-r2.mjs
GROUP=studio node tools/m11c-c2/release-capture.mjs
GROUP=campus node tools/m11c-c2/release-capture.mjs
GROUP=mobile node tools/m11c-c2/release-capture.mjs
```

需要已安装Playwright/Chromium；PLAYWRIGHT_MODULE可指定模块目录。本轮报告在`qa/m11c-c2/r2/release/report.json`；性能、错误、截图和受测SHA均绑定本轮产物，旧报告不替代本轮测试。
''')
    p=r/'README.md';s=p.read_text();heading='## C2 R2 · 学生角色实装（待审）'
    if heading not in s:
        i=s.index('\n');s=s[:i+1]+'\n'+heading+'\n\n[交付与操作](docs/m11c/c2/delivery.md) · [校园Viewer](artifacts/m11c-c2/r2/Yali_C2_R2_Viewer.html) · [人物工坊](artifacts/m11c-c2/r2/Yali_C2_R2_Character.html) · [本轮QA](qa/m11c-c2/r2/release/report.json)\n\n白领、蓝身、上白下红横带、左胸YL；15关节/5蒙皮批次。继承C1 R1.2手机优化及已认可校园。R1造型被否定，R2为IMPLEMENTED / REVIEW_PENDING；设定图不是历史照片。\n\n'+s[i+1:];p.write_text(s)
    p=r/'docs/development-plan.md';s=p.read_text().replace('C1 R1.2手机优化 / C2接续','C1 R1.2手机优化 / C2 R2实装待审').replace('| M1.1-C / C2 | AUTHORIZED / NEXT | 有依据的学生形象、校服、正式动画 |','| M1.1-C / C2 R2 | IMPLEMENTED / REVIEW_PENDING | 已确认白领蓝白红YL设定的实际蒙皮角色，待实装审阅 |')
    p.write_text(s)
else:
    out=r/'qa/m11c-c2/r2/release';manifests=[json.loads(p.read_text()) for p in (r/'artifacts/m11c-c2/r2').glob('*.manifest.json')];valid={m['file']:m for m in manifests}
    reports=[]
    for group in ['studio','campus','mobile']:
        q=json.loads((out/group/'report.json').read_text());assert q['passed'];m=valid[q['viewer']];assert q['viewerSHA256']==m['sha256']
        assert hashlib.sha256((r/'artifacts/m11c-c2/r2'/m['file']).read_bytes()).hexdigest()==m['sha256']
        for f,d in m['sources'].items():assert hashlib.sha256((r/f).read_bytes()).hexdigest()==d,f
        for shot in q['screenshots']:assert hashlib.sha256((out/group/shot['file']).read_bytes()).hexdigest()==shot['sha256']
        reports.append(q)
    model=reports[0]['glb'];shutil.copy2(out/'studio'/model['file'],r/'artifacts/m11c-c2/r2'/model['file'])
    tap=(out/'tests.tap').read_text();assert '# fail 0' in tap
    import re
    tests=int(re.search(r'# pass (\d+)',tap)[1]);checks=sum(len(q['checks']) for q in reports);shots=sum(len(q['screenshots']) for q in reports)
    result={'version':'C2.R2','status':'IMPLEMENTED / REVIEW_PENDING','standard':'1.0 + mobile-r12; local character UV and palette deviation documented','unitTests':tests,'browserChecks':checks,'screenshots':shots,'groups':[q['group'] for q in reports],'viewers':[{k:m[k] for k in ['file','sha256','bytes','gitHead']} for m in manifests],'glb':model,'visualInspection':'AWAITING_SCREENSHOT_REVIEW; automated success does not assert art approval','realPhonePerformance':'NOT VERIFIED','passed':True}
    (out/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    (out/'README.md').write_text(f'# C2 R2 本轮QA\n\n{tests}项单元测试，{checks}项浏览器检查，{shots}张截图。全部绑定report.json中的精确Viewer SHA256。逐组报告包含浏览器、GPU、视口、错误、模型统计、测量方法和原始样本。软件GPU不代表真机性能。\n\n实际视觉检查另见后续inspection.md；不得把自动测试成功当成用户认可。\n')
    p=r/'docs/m11c/c2/delivery.md';s=p.read_text();s+='\n## 受测产物\n\n'+f'单元测试{tests}/{tests}；浏览器{checks}项检查，{shots}张截图。\n\n'+'\n'.join(f"- `{m['file']}` SHA256 `{m['sha256']}`" for m in manifests)+f"\n- GLB SHA256 `{model['sha256']}`\n";p.write_text(s)
