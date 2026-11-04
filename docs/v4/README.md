# V4.0 地点研究验收

基线：`fe9892a6ec1e33d4b454c5d3b3efaad6a0936816`（PR #14 / V3.1）。独立分支 `feature/place-based-research-v4`。不合并 PR #15 的 Liquid Glass UI，不合并 #12/#13。仅移植 V3.2 的内陆湖泊补齐与地表裁切。原项目、main、归档标签及 Production 均不改动。

## 使用

`pnpm install --frozen-lockfile`，`pnpm dev --port 3019`。打开 `/experience` → 开始探索 → **地点研究**。也可以在地点探索中选择鹅洲，再点 **进入场地研究**。独立矿坑入口：`/experience/research/quarry`；加 `?guided=1` 启动人工下一步引导。

**开始双场地研究演示**：鹅洲六步 → 末步进入矿坑七步。建议讲述 3–4 分钟；不会强制自动播放。Context / Resources / Evidence / Findings / Proposal 可直接选择。可退出引导继续自由移动，研究对象使用菱形热点。夜间默认，日夜切换保留。

## 已实现与边界

- 鹅洲：真实岸线/OSM 道路及建筑足迹 + 现有 Overture 简化体量；程序生成屋顶、窗、院落、植被、耕作块及岸边细节。49 个背景体量及 OSM 建筑足迹来自两种来源（bbox 快照含 9 个建筑，仅渲染岛内足迹），尚未做测绘级去重；不是实景扫描。局部近景与大地图共用 renderer / CameraRig / 投影。局部范围内暂时替换重复粗模，退出精确恢复原矩阵，不改变全段数据和 AOI。
- 鹅洲模拟研究：12 个聚落代表点、2 个服务节点、2 组网络、3 个活动点、3 个生态关注区。代表点不是住户清单，生态圈不是保护区边界。
- 矿坑：依据公开航拍形态独立重建不规则水潭、坡地、岩壁、植被与局部岩层材质。150×150 地形网格、5 条模拟路径、3 处恢复区、5 个活动节点、东西/南北剖面。未使用 Blender、摄影测量或现场测绘；不得称作实景精模。
- 坑址未获得可验证精确坐标，因此 `coordinate: null`，**不加入主地图空间标记，不从一个虚构坐标飞入**。独立路由只加载局部场景；主地图离开时释放。此处与“两个地点无缝连在同一总图”原目标仍有差距，是用户明确允许的阶段方案。
- 矿坑尺度和标高为模型参数。水面仅为相对零点，水下深度未知；不渲染虚构水下地形。2026 开发计划不等于已建设或已开放。
- 研究结论保持为待验证的问题和机会，不自动生成真实污染判断或工程安全建议。

## 工程边界

- `src/place-research/`：类型、固定模型构建、纯计算、按需加载、独立矿坑 renderer 生命周期。
- `public/data/research/`：三份固定小型 JSON，共约 80KB 原始体积；不会作为主场景首屏必载。
- `app/experience/research-*`：紧凑研究入口/阶段导航/分析面板。沿用 V3.1 阅读衬底和外围衰减，无 Glass 导航、全屏新后处理或外部 UI 依赖。
- `engine.ts`：仅接入局部研究生命周期、镜头预设与临时细节替换。CameraRig、AOI 规则和坐标系统不重写。局部研究降低最低相机高度/距离，退出恢复默认限制。
- `assets.ts` / `next.config.ts`：核心资源内容摘要查询版本与浏览器长缓存；已有 Brotli 不重复压缩。森林只在内存转 Uint8Array，保留原始文件精度。
- `water.ts` 等：水体分类/补齐、地形与绿地裁切，后湖等多边形孔洞保留；不改为重型实时反射。

## 校验与回退

`pnpm typecheck`；`pnpm lint`；`pnpm test`；`pnpm exec next build --webpack`。数据库测试只使用独立临时 PostgreSQL，需 `RUN_DB_TESTS=1 TEST_DATABASE_URL=<独立库> pnpm test`，绝不连接用户正式数据库。

数据改动后运行 `node scripts/research/asset-versions.mjs`，测试会校验版本摘要；版本 URL 才有 immutable 缓存，未版本化旧 URL 仍按默认策略。

后续合并前需审核模型品质、图层日间截图、引导流程与资源回归证据。回退通过撤回本 PR / 后续普通 revert；不得移动旧标签或重写用户仓库历史。

详见 [来源与精度](SOURCES.md)、[分析契约](ANALYSIS.md)、[验证结果](VALIDATION.md)。

可选浏览器回归：已具备独立 Playwright 运行时的环境，可设置 `PLAYWRIGHT_MODULE`（模块绝对路径）、`CHROME_PATH`、`REVIEW_URL`（默认 localhost:3019），运行 `node scripts/research/verify-browser.mjs`。设置 `RECORD_VIDEO=1` 需要该运行时已有 ffmpeg；不向项目新增浏览器依赖。结果默认写入 `/tmp/xiangjiang-v4-evidence`。保护 Preview 需在外部验收工具中提供授权请求头，本脚本不读取任何账号凭据。
