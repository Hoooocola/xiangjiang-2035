# Version 1 — 可恢复基线

归档日期 2026-10-23。功能基线为 `f590885`，包含已完成的 Spatial Research Explorer。此目录与同次 snapshot commit 一起由 annotated tag `version1` 标记。V2 在 `feature/experience-v2` 开发。

## 技术与内容

Next.js 16.3.4、React 19.2、TypeScript 5.9、Three.js 0.186；Drizzle/PostgreSQL 研究平台保持独立。宏观地图包含真实 OSM 河道/洲岛/道路/建筑占地、Overture 补充建筑、Mapzen/USGS 高程和 ESA WorldCover 植被数据。未知建筑高度为估算，不是真实扫描。地图无需 Token 或数据库。

功能：全段概览、核心预设、六个地点、巡游、日夜切换、矩形小地图、六类研究图层、鹅洲资料/证据/问题/方案与 Today/2035 概念切换。新增鹅洲局部研究现场，五语义层、16 条 Mock 记录、18 个空间标注、五步引导；可返回鹅洲上下文。

## 视觉基线与问题

默认夜间。深青背景、暖色地块、建筑窗光、紫色强调；日间外围白模。主要问题：重点范围仍由距河 900–2600 米平滑带决定，地形二次 smoothstep 和地块色差加强了边界；公园/道路根据阈值分材料，产生块状变化；顶部工具条比研究平台链接厚重；全局 Today/2035 不符合现在的研究组织方式；相机缺少可见平移控制。

## 截图复现

所有 V1/V2 比较采用 **1280 × 800 CSS px**，无浏览器缩放修改。核心河段使用 CAMERA_PRESETS[0]；全段使用 OVERVIEW_POSE；山体使用 PLACES 的 yuelu 聚焦；日夜切换后等待动画结束。保持同一数据/预设，不能用不同镜头掩盖边界问题。

- `screenshots/core-night.jpg`：核心夜间，包含岳麓山边界截断。
- `screenshots/core-day.jpg`：同镜头日间。
- `screenshots/corridor-night.jpg`：全段夜间。
- `screenshots/top-ui.jpg`：顶部工具条局部，包含 Today/2035。
- `screenshots/yuelu-night.jpg`：岳麓山聚焦。
- `screenshots/mountain-cut.jpg`：上述山体画面的局部证据。

## 资产与安全审计

- 当前 Git 已初始化；归档前分支 `feat/spatial-research-explorer`。
- 必需 GIS 数据和前端资产已跟踪：`public/data/*.json`、`public/data/xiangjiang.geojson`、`data/osm/*`、`public/assets/*`。未依赖 Downloads 文件或下载缓存来运行 V1。
- 最大运行资产约 7.6 MB，普通 Git 管理；无 .gitattributes / LFS pointer，当前系统未安装 git-lfs，不需要 LFS 才能恢复。
- `.env`、`.env.local`、`.env.*.local`、`.data/`、node_modules 和构建输出忽略；只提交无密钥的 `.env.example`。
- `.audit/` 为之前遗留的设计截图，未参与当前运行，不删除、不混入此版本提交。临时 PDF 渲染也不作为运行依赖。
- 不提交私有数据库、上传文件或 Token；未执行 reset --hard、clean 或历史覆盖。

## 恢复和运行

为保留当前改动，建议新目录检出旧版：

```sh
git worktree add ../xiangjiang-version1 version1
cd ../xiangjiang-version1
pnpm install --frozen-lockfile
pnpm build
pnpm start --hostname 127.0.0.1 --port 3002
```

访问 `/experience` 或 `/experience/sites/ezhou`。宏观和概念场景不需要环境变量；原数据库平台如需运行，复制 `.env.example` 为本地 `.env.local` 后按 README 启动数据库。不得将密钥写进版本库。

归档前已验证生产构建、38 项自动测试和实际浏览器流程；26 项需要数据库的集成测试跳过。生产地图/现场 HTTP 200，操作中控制台无 error/warn。两条 lint warning 位于旧 prototype-html。
