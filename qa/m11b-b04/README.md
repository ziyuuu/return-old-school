# M1.1-B B04 QA report

Status: **IMPLEMENTED / REVIEW_PENDING**  
Model/rendering standard: **v1.0**

## Primary tested Viewer

- Path: `artifacts/m11b-b04/Yali_B04_R1_Viewer.html`
- SHA256: `d8e2b969802cfefcaba9d27da496f26ef8e9d1d85eb2a8bc7681d243f3002eda`
- Real browser session: GitHub Actions run `34733567926`, artifact `B04-real-browser-iteration`
- Result: **PASS** for the B04 browser iteration: 11 screenshots, no JS/WebGL errors, no external requests, actual WebGL2/SwiftShader rendering.

The successful session covers Science near/mid/bay, Longya near/mid, 07, 16, 21, neighbour context and fresh `390×844` mobile views. The mobile UI check reports `390/390` width with no overflow and a 2048 shadow map.

## Build, geometry and access

- Production build: **PASS**.
- Targeted geometry / semantics / BVH suite: **16/16 PASS** on the current evidence-bound source.
- B04 full-scene access: **PASS** — 7 routes and 6 portal grids, zero clearance/portal failures.
- Visible model: **4,823,310 triangles**, **1,796 meshes/geometries**, **141,739,340 bytes** geometry buffers, **76 materials**, 17 shared finish families.
- BVH: 889 indexed geometries. Reflection: 7 shared local probes, including explicit `eastTeaching`, `longya`, `westTeaching` assignment for B04 owners.

## 60-frame performance supplement

A later evidence-text-bound export (`de1f663bc54a07ea84fe1d97a7543f2221968b756fc1a232dfb3a84fd90e45ab`) was run on the same CI software renderer. Numeric B04 geometry parameters and `batch04-core.mjs` / `batch04-scene.ts` runtime hashes were unchanged; the re-export changed evidence/basis text and JSON formatting. It completed 60-frame samples before the compositor later stalled while saving another screenshot.

- Science close: median ~5774.8 ms, P95 ~10882.9 ms.
- Longya: median ~7266.4 ms, P95 ~11916.2 ms.

These are **ANGLE SwiftShader software-renderer timings**, not expected user-GPU frame times. The subsequent screenshot timeout is retained in the archived hash-bound report; it is not disguised as a passing final session.

## Evidence boundary

- 13 Science: visible entrance/canopy/glazed-bay cues are P; dimensions, four-floor envelope and concealed faces remain H.
- 17 Longya: visible central glazed tower/canopy/splayed entrance cues are P; five-floor envelope, six-step/0.90 m relationship and hidden faces remain H. The direct front road is preserved.
- 07: office shell is conservative H; infirmary location/use and formal naming remain U.
- 16: low gable/central arch is P; historical use remains U/H.
- 21: “information building” remains a working U label; no independent real photo was found, so the shell/portal rhythm remains H.

No research originals, photo textures, new official names, B05 work, full interiors or B04 acceptance are included. B01/B02/B03 R2 accepted state is not changed.

## Reproduction

```bash
npm ci --prefix apps/campus
npm run build --prefix apps/campus
node --test tests/m11b/b04/model.test.mjs tests/render-upgrade/*.test.mjs
node tools/m11b-b04/export.mjs
```

Machine-readable summary: `qa/m11b-b04/final-summary.json`. The actual browser screenshots/report are preserved in Actions artifact `B04-real-browser-iteration` (run `34733567926`); the later current-source performance session is preserved under the B04 hash-bound workflow artifacts.
