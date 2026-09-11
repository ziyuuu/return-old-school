## R3.1 侧墙卷帘门修复

两端凹口侧墙扩大开口，卷帘默认收起；雨棚与柱列扩大、外移。继承R3五层、后坪、轻弧与中轴。本轮仅10项定向检查及局部浏览器验证，不重开全校园基线。IMPLEMENTED / REVIEW_PENDING；工程结果见 `docs/m11b/shutter-fix/delivery.md` 和 `qa/m11b-shutter-fix/browser-report.json`（没有通过报告前不宣称已验收）。

以下为前序阶段记录：

# 复原雅礼 · Return Old School

长沙雅礼中学东塘校区，2006—2010历史校园复原；校庆与校友回忆，非商业项目。

## 当前：M1.1-B 第一批 R3

**两端正面退入入口、前伸五层主体墙、中央轻弧功能区：IMPLEMENTED / REVIEW_PENDING。** 本轮是实际几何修复，不是只作图核定。工程执行结果以[交付记录](docs/m11b/batch01-r3/delivery.md)及[实际浏览器QA](qa/m11b-b01-r3/browser-report.json)为准；未产生报告前不宣称浏览器验收通过。

15主楼两端门朝操场正面，门罩为一层、旁边高墙持续五层且向前超过门罩；不再使用东山墙外门廊。门前三级台阶和局部前坪连接同层室内。中央广播站等功能体量采用浅弧，楼板、墙面和檐口一致，不变成现代大拱门。

[实施方案](docs/m11b/batch01-r3/implementation-plan.md) · [证据](data/m11b/batch01-r3/evidence-manifest.json) · [参数](data/m11b/batch01-r3/input.json) · [开发计划](docs/development-plan.md)

## 继承的校园

M0 COMPLETE；M1.0 R4 COMPLETE / FROZEN；M1.1-A P3/P4 COMPLETE / ALUMNI_APPROVED。R2五层剖面、四楼后坪、第五层走廊、连续厕所与逐层桥保持。田径场—中央国旗—主楼—旧图书馆共轴保持。入口长坡、下沉运动区、抬高篮球场、三旗宽前坪和食堂下层小卖部不回退。

R3仅对两处门前有限范围地坪作H衔接，不改运动区或前坪整体标高。R4、P3/P4和R2档案不覆写；主轴例外#28、入口局部例外#29可追溯。单栋构件可替换，不为建模方便移动校园。

## 运行与验证

```bash
npm ci --prefix apps/campus
npm run dev --prefix apps/campus
node --test tests/m10/*.test.mjs tests/m11a/*.test.mjs tests/m11a/patch02/*.test.mjs tests/m11b/*.test.mjs tests/m11b/r2/*.test.mjs tests/m11b/r3/*.test.mjs
npm run build --prefix apps/campus
node tools/m11b/r3/export.mjs
python -m pip install playwright==1.62.0
python -m playwright install chromium
python tools/m11b/r3/capture.py
python tools/m11b/r3/package.py
```

输出`artifacts/m11b-b01-r3/`：单HTML Viewer、真实截图Review、完整Workspace、局部/整栋平面与剖面SVG、回归清单。无需CDN、外部照片贴图或字体文件。

Vanilla Three.js、TypeScript、Vite、WebGL2；Canvas Ramp LUT；无bloom/vignette/DoF。只做校园复原，没有剧情或玩法；完整内部楼梯、内装和物理人物属于后续阶段。

历史交付：[B01](docs/m11b/batch01/delivery.md) · [B01 R2](docs/m11b/batch01-r2/delivery.md)。工程验证和校友画面认可分别记录。下一批为体育馆＋贴体音乐楼进一步外壳深化。项目为独立校友创作，不代表学校官方。
