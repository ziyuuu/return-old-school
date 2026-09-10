# 复原雅礼 · Return Old School

长沙雅礼中学东塘校区，2006—2010历史校园复原。服务校庆和校友回忆，非商业项目。

## 当前：M1.1-B 第一批

**15旧主教学楼＋25连续厕所＋四层连接桥：IMPLEMENTED / REVIEW_PENDING。** M1.1-A（P3/P4）已获校友认可；R4冻结空间基线不变。

旧主楼按浅色立面与成组窗洞制作，加入四楼露天后坪和小圆顶轮廓；不套用现代橘红色新楼。连续厕所每层有整幅楼板、前廊、两端门和桥口护栏缺口。8条楼层连接路线、后门和桥下通路均有独立模型及实际浏览器检查。

[第一批范围](docs/m11b/batch01/plan.md) · [证据判断](docs/m11b/batch01/evidence-decisions.md) · [交付与复现](docs/m11b/batch01/delivery.md) · [实际浏览器QA](qa/m11b-b01/browser-report.json) · [开发计划](docs/development-plan.md)

## 运行

```bash
cd apps/campus
npm ci
npm run dev
```

```bash
node --test tests/m10/*.test.mjs tests/m11a/*.test.mjs tests/m11a/patch02/*.test.mjs tests/m11b/*.test.mjs
cd apps/campus && npm run build && cd ../..
node tools/m11b/export.mjs
python tools/m11b/capture.py
python tools/m11b/package.py
```

浏览器QA使用Playwright Chromium（首次安装 `python -m pip install playwright==1.62.0`、`python -m playwright install chromium`）。CI实际执行后保存源SHA、HTML摘要、射线记录和截图；Review由截图生成。下载文件输出到`artifacts/m11b-b01/`，Viewer单HTML离线运行，不依赖CDN、外部校园照片或字体。

## 历史基底与技术

Vanilla Three.js、TypeScript、Vite、WebGL2；Canvas Ramp LUT；无bloom/vignette/DoF。每栋外壳独立数据，可替换局部；当前不含完整教室/厕所室内、物理角色或玩法。

设施01—28身份稳定，`data/m10`与`baseline/m1.0-r4`不覆写。A阶段已认可的入口长坡、田径场下沉、篮球场抬高、三旗宽前坪、食堂下层小卖部继续显示。体育馆正门/前坪/左外梯、音乐楼贴体及环路不回退。既有Patch02局部路网例外和P4旗台场地例外可在#19、#25追溯。

工作参数遵循A/P/R/H证据体系，资料不足按保守方案补全，不反复阻断历史复原。工程验证与校友认可分别记录。

下一批：体育馆＋音乐楼进一步外壳深化；随后全校园其他建筑、实际通行与环境细化。夜间和玩法不在当前范围。项目为独立校友创作，不代表学校官方。
