# 第一批交付

状态：IMPLEMENTED / REVIEW_PENDING。M1.1-A已获校友认可；本批不自动继承该认可。

内容：15旧主楼浅色四层外壳、真实门窗洞和四楼后坪；25连续楼体、完整楼板、两端门与前廊；逐层桥栏杆及既有通行关系。

复现：

```sh
cd apps/campus
npm ci
npm run build
cd ../..
node --test tests/m10/*.test.mjs tests/m11a/*.test.mjs tests/m11a/patch02/*.test.mjs tests/m11b/*.test.mjs
node tools/m11b/export.mjs
python -m pip install playwright==1.62.0
python -m playwright install --with-deps chromium
python tools/m11b/capture.py
python tools/m11b/package.py
```

实际执行结果见`qa/m11b-b01/unit-tests.txt`、`browser-report.json`、`build-manifest.json`和同目录PNG。Review由这些PNG嵌入生成；HTML构建源指纹与QA源指纹一致。冻结文件哈希由`data/m11b/batch01/frozen-files.json`检查。

离线文件在`artifacts/m11b-b01`，可直接打开Viewer HTML；无需CDN。Review包含真实截图。Workspace包括源码、独立数据、旧回归、新回归、工作流、QA与输出。

边界：不含完整教室陈设、厕所室内详设、楼内完整楼梯和人物碰撞控制器。首层与各楼层几何支持和净空检查不是宣称已完成M1.1-C。
