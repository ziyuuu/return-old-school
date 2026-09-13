# M1.1-B B04 delivery

Delivery state: **IMPLEMENTED / REVIEW_PENDING**. This is not alumni acceptance. B01/B02/B03 R2 accepted state remains inherited.

## Scope delivered

- 13 Science building: differentiated four-storey H envelope, recessed main entrance, warm canopy, glazed circulation bay, real portal and first stair support.
- 17 Longya building: five-storey H envelope, faceted central glazed tower, rounded canopy, splayed six-step direct-road entrance and minimum lobby. The deleted green detour is not restored.
- 07: conservative office shell and real recessed entry; infirmary identity/location remains U.
- 16: low gable, central real arch aperture, pilasters/windows; historic function remains U/H.
- 21: conservative four-storey shell, west portal and stair-band rhythm; “information building” remains a working name U.

No B05, full interiors, formal gameplay or new main roads were added. B03 R2 double arc stair/open round platform/central climb/local slope and canteen print-stair-shop relationship are untouched.

## Standard and deviations

Implements `docs/model-rendering-standard.md` **v1.0**. Shared palette/PBR/AgX/daylight/sky/reflection/depth systems are reused; no bloom/vignette/DOF or photographic textures. The only QA deviation is that a later evidence-text-bound CI export stalled on one compositor screenshot under SwiftShader; the failure is archived and not masked. The primary delivered Viewer below is the earlier geometry-equivalent Viewer that completed the full real-browser B04 iteration successfully.

## Viewer and QA

- Viewer: `artifacts/m11b-b04/Yali_B04_R1_Viewer.html`
- SHA256: `d8e2b969802cfefcaba9d27da496f26ef8e9d1d85eb2a8bc7681d243f3002eda`
- QA: `qa/m11b-b04/README.md`
- Evidence boundary: `docs/m11b/batch04/evidence.md`
- Real screenshot artifact: GitHub Actions run `34733567926`, artifact `B04-real-browser-iteration`

## Review gate

Do not create `data/m11b/batch04/acceptance.json` until the user explicitly approves this batch.
