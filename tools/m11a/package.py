"""Distribute only complete actual-browser results, without third-party photographs/fonts."""
from pathlib import Path
import base64,hashlib,html,json,os,re,shutil,zipfile
R=Path(__file__).resolve().parents[2];O=R/'artifacts/m11a';Q=R/'qa/m11a';O.mkdir(exist_ok=True,parents=True)
b=json.loads((Q/'browser-report.json').read_text());assert b['passed'] and b['complete'],'Incomplete browser verification'
r=json.loads((Q/'terrain-report.json').read_text());assert r['passed']
unit=(Q/'unit-tests.txt').read_text();n=int(re.search(r'# tests (\d+)',unit).group(1));assert re.search(r'# fail 0\b',unit)
for name,source in [('Yali_M1_1_A_Profiles.svg','docs/m11a/road-profiles.svg'),('Yali_M1_1_A_Elevations.csv','data/m11a/elevations.csv')]:shutil.copyfile(R/source,O/name)
combined='\n\n---\n\n'.join((R/p).read_text() for p in ['docs/m11a/research-plan.md','docs/m11a/research-findings.md','docs/m11a/implementation-plan.md'])
(O/'Yali_M1_1_A_Research_and_Plan.md').write_text(combined)
checklist=f'''# M1.1-A 回归清单 / 实际执行结果

状态：IMPLEMENTED / REVIEW_PENDING。工程已验证，校友尚未认可H高差。

本次CI输入：`{os.getenv('GITHUB_SHA','local')}`。

- [x] {n}项单元/回归（包含原R4的118项）。
- [x] {len(r['results'])}项地坪数据检查。
- [x] {len(b['checks'])}项实际浏览器检查，包括39条冻结道路的路面支撑、全宽和净空。
- [x] 4组入口共17级工作台阶及顶部实际门洞。
- [x] 厕所4层完整楼板、8条到两端入口的路径。
- [x] 8次地坪/R4切换不累计位移。
- [x] 28项身份和27项水平定位、路网、宽度、贴体及逐层连通保持。
- [x] 独立HTML与HTTP启动、导出、相机、巡览相对眼高、手机尺寸画布。
- [x] 本次JS/Shader错误记录为空。
- [ ] 校友对H地坪/台阶尺寸的最终审阅。
- [ ] 真实手机和目标电脑性能测评；物理角色台阶攀爬。

浏览器是Chromium软件WebGL，不是硬件性能认证。精确高程全为H值、测量为空。没有摄影测量或现场控制网。
'''
(O/'Yali_M1_1_A_Regression_Checklist.md').write_text(checklist);(R/'docs/m11a/regression.md').write_text(checklist)
css='body{margin:0;background:#f3f3eb;color:#25463c;font:16px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:30px}h1{font-size:34px}section{background:white;padding:22px;margin:25px 0;border:1px solid #d9e0d6;border-radius:10px}img{width:100%;height:auto}code,pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#256759}'
titles={'terrain-entrance':'主门向内上坡：方向有文字依据，坡度为H','overview':'全校园地坪工作方案','top':'总平面：水平布局未改','terrain-main':'连续主路纵坡','terrain-gym':'体育馆入口台阶（4级H）','terrain-library':'旧图书馆入口（3级H）','terrain-longya':'长雅楼入口（6级H）','terrain-field':'后缘跑道与前庭过渡','terrain-gap':'主楼厕所桥下地面','sports':'球场与棚跑道维持平地','family-canteen':'食堂/家属区中性地坪','r4-comparison':'同机位R4平基准对照','mobile':'手机尺寸画布（非真机性能测试）'}
parts=[f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>雅礼 M1.1-A 地坪研究与实机审阅</title><style>{css}</style><main><h1>复原雅礼 · M1.1-A</h1><p>地形、道路、地坪与高差｜实际Three.js浏览器截图</p><p><strong>{n}项单元/回归 · {len(b["checks"])}项浏览器检查通过</strong></p><p>所有精确标高为H工作推定，主门相对0m不是海拔。此页是截图报告；可操作三维模型请打开 <a href="Yali_M1_1_A_Viewer.html">Viewer HTML</a>。不改变冻结R4的水平坐标和通路。</p><p><a href="https://github.com/ziyuuu/return-old-school/blob/main/docs/m11a/research-plan.md">调研计划</a> · <a href="https://github.com/ziyuuu/return-old-school/blob/main/docs/m11a/research-findings.md">研究结果</a> · <a href="https://github.com/ziyuuu/return-old-school/blob/main/docs/m11a/implementation-plan.md">落地计划</a></p>']
for filename in b['screenshots']:
 p=Q/filename;assert p.is_file();parts.append('<section><h2>'+html.escape(titles.get(p.stem,p.stem))+'</h2><img alt="'+html.escape(p.stem)+'" src="data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()+'"></section>')
parts.append('<section><h2>范围与保留项</h2><p>体育馆、长雅、旧图书馆入口照片支持“有台阶”，不证明当前级高与级数。音乐楼台阶是贴体建筑共同垂直适配的H方案。家属区不做私人住宅内部。花园未明入口和22号未定位仍保留。</p><p>不放入2023新馆下沉庭院，不把2023基地1–1.5m高差套成历史全校园标高，不人为制造陡坡。M1.1-B/C/D和完整人物控制尚未完成。</p></section></main></html>')
(O/'Yali_M1_1_A_Review.html').write_text(''.join(parts))
folders=['apps/campus','data/m10','data/m11a','data/spatial-constraints.json','data/restoration','docs/m11a','docs/m10','tests/m10','tests/m11a','tools/m11a','tools/m10','qa/m11a']
exclude={'node_modules','.git','__pycache__','dist'};badext={'.ttf','.otf','.woff','.woff2','.pyc'}
with zipfile.ZipFile(O/'Yali_M1_1_A_Workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
 for item in folders:
  folder=R/item
  for p in ([folder] if folder.is_file() else sorted(folder.rglob('*'))):
   if p.is_file() and not(exclude&set(p.parts)) and p.suffix.lower() not in badext and not p.name.startswith('.env') and p.name!='delivery.md':z.write(p,p.relative_to(R))
 for p in [O/'Yali_M1_1_A_Viewer.html',O/'THIRD_PARTY_NOTICES.txt',O/'Yali_M1_1_A_Regression_Checklist.md']:z.write(p,p.name)
checksums={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in O.iterdir() if p.is_file() and p.name!='checksums.json'}
(O/'checksums.json').write_text(json.dumps(checksums,indent=2));print('Packaged',n,'tests',len(b['checks']),'browser checks')
