# V4.3 validation / 2026-11-07

Final production build. Chrome headless / Apple M3 Metal, 1440x900, DPR 1, identical fixed cameras, 3.5s RAF sampling without recording. Local production services; warm server filesystem/build caches. Not a public-CDN cold-start benchmark.

## Checks

- TypeScript and webpack production build: PASS. ESLint: 0 errors, 2 pre-existing prototype warnings.
- 42 test files / 211 tests passed; 2 PostgreSQL files / 26 tests skipped because RUN_DB_TESTS was not enabled and no isolated TEST_DATABASE_URL was supplied. No database changes.
- All 12 story endpoints, water changes, four governance structures, section arrays, profiles, routes, slope ranges and blocked access passed in the browser, with no captured console/page errors.
- Real canvas ray-picking selects candidate-b. E04 facility camera is held into E05. Closing the sidebar leaves pose identical. Manual dragging stops guided playback. Analysis counter remains constant between input changes.
- Tested 1920x1080, 1440x900, 1366x768 and 390x844; scrollable sidebar and actual day/night/technical screenshots.
- Main research entries coexist with legacy research. Course showcase enters and exits. V4.2 route still runs. Spatial catalog and Yanghu analysis return 200. Sample PDF, cover and video resolvers return 302 to upstream resources. Signed URL queries removed from evidence; external availability is not guaranteed forever.

## Fixed-camera performance

|Version / sample|FPS|P95 ms|Calls|Triangles|GPU geometries|GPU textures|Site build ms|
|---|---:|---:|---:|---:|---:|---:|---:|
|V4.2 / E-03|60.3|16.7|32|423991|22|3|520|
|V4.2 / P-02|60.2|16.8|43|71650|34|2|1048|
|V4.2 / P-03|60.3|16.7|15|75346|13|2|1176|
|V4.3 / E-03|60.1|16.7|37|458899|46|4|596|
|V4.3 / P-02|60.2|16.7|43|71650|43|3|1230|
|V4.3 / P-03|60.3|16.7|15|75346|25|3|1237|

V4.3 E-03 benchmark corresponds to the new E04 technical overlay at exactly the baseline E03 camera. P02 uses nine curtains; P03 uses the same ecology close-up. Composite quarry prepares forest and sections once, increasing CPU residency/hidden materials. Heap readings are GC-dependent; raw readings are in validation.json.

Eight alternating site loads: Ezhou GPU geometries/textures return to 5/4; quarry to 14/3. No progressive increase in this bounded test; not a claim about indefinite operation.

## Main-map network

|Version|Ready ms|Map-data transfer bytes|Decoded bytes|
|---|---:|---:|---:|
|V4.2|5659|4764836|22427255|
|V4.3|5282|4764836|22427255|

All five hashed map-data URLs use gzip and existing one-year immutable caching. No new compression configuration. No owner GLB, quarry or story JSON requested by the main first screen.

|JSON resource|Median parse ms (3 runs)|
|---|---:|
|terrain.json|2.8|
|xiangjiang.geojson|18.5|
|context.json|12.8|
|inland-water.geojson|0.3|
|environment.json|16.9|

Additional on-demand resource requests (not a claim of new layer rendering). The WorldCover binary is the current browser raster input; JSON is the analysis/query representation. Do not add both as if both were initial browser downloads.

|Resource|Transfer bytes|Decoded bytes|Encoding|
|---|---:|---:|---|
|worldcover-2021-core.bin|2937900|2937600|null|
|worldcover-2021-core.json|344971|8812911|gzip|
|gbif-core.geojson|4711|83647|gzip|
|water-quality-2025-11.json|1404|11207|gzip|

## Reproduction

- scripts/story/verify-browser.mjs: STORY_BASE_URL, STORY_QA_OUTPUT, PLAYWRIGHT_MODULE (existing installation), optional CHROME_PATH. Recording requires that Playwright installation's FFmpeg. No product dependency added.
- scripts/story/benchmark-browser.mjs: BASELINE_BASE_URL, STORY_BASE_URL, STORY_PERF_OUTPUT, PLAYWRIGHT_MODULE, optional CHROME_PATH. Run baseline and new production servers, avoid other rendering/build loads.
- New runtime JSON totals 141351 bytes, lazy-loaded. Existing 19.57MB owner-authorized GLB is reused, not duplicated.
- Endpoints, selected-object screenshots, day/night screenshots, low-height/mobile checks and continuous recording are in the delivered evidence gallery, outside runtime assets.

## 已知限制与验收边界

- 鹅洲近景继承原创重建与 V4.2 衍生模型的碎片、贴图及简化痕迹。未更换模型，不将其称作测绘级精细模型。
- 江岸背景为 OSM 平面关系与示意高度，不是完整两岸摄影测量。主地图至局部研究是独立路由入口，不是跨越整个湘江的无缝长距离运镜。
- 10m 最低包络不是裸地 DTM；相对水位不等于真实水文站高程或安全结论。
- 150m接线、候选设施、管径/埋深、方案组织、矿坑路径与生态区均是 DEMO。11/12 几何连接不等于完成污水处理。
- 矿坑坐标、实测地形及水下深度仍未知，保持独立未配准场景；坡度筛选不是岩土安全标准。
- Preview 供负责人验收；本分支不得自行合并 main 或更新 Production。
