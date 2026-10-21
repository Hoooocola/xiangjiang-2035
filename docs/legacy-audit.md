# Legacy audit · 2026-10-20

## 检查点
原目录无 Git。已创建仓库，旧版提交 `3bf2d3e`，标签 `legacy-before-3d`；新分支 `feat/xiangjiang-immersive`。环境密钥、运行数据库、node_modules 与 .next 没有入库，保留原地。

## 现状
- Next.js 16.3.4 / React 19 / TypeScript / pnpm；App Router。
- `/` 重定向至 `/create-research`；已有研究创建、session、capture、field-records、records 页面和 API。
- Leaflet 1.9.4 仅用于田野记录位置。无 Cesium、Three.js、Mapbox，无可用 GLB、DEM、河道 GeoJSON。
- PostgreSQL + Drizzle，包含团队、地点、研究活动、媒体存储和权限逻辑。
- `src/db/seed-data.ts` 鹅洲位置 112.874,28.057 明确标注 DEMO_UNCALIBRATED，不能视作实测数据。
- `prototype-html/` 为旧静态研究 UI，`public/assets` / `design-assets` 为图片而非三维模型。
- 全局 CSS 含 Leaflet 及研究页面样式；新体验使用独立 CSS Module。

## 去留
保留所有研究路由、数据库、API、权限、媒体模块、静态原型及图片。新增 `/experience`，主页进入此体验，旧研究入口仍为 `/create-research`。不删依赖 Leaflet；不替换正在使用的记录地图。新增场景不依赖数据库、不需要 token 或实时底图服务。

## 技术选型
| 方案 | 视觉/镜头/边界 | GIS 与模型 | 复杂度/性能/扩展 |
|---|---|---|---|
| Cesium + 定制 | 地球坐标优秀，风格化材质与白模外围需要较多改造 | 原生地理/3D Tiles 优秀 | 本轮不需地球、卫星瓦片或大范围流式地形，负担偏重 |
| **Three.js + 地理数据** | 可控制水面 shader、透视镜头、材质、雾和局部细节 | GeoJSON 离线投影；以后可接 GLTF | 本轮选用。静态缓存、合并几何、实例化、分层 LOD；数据和 UI 解耦 |
| Cesium + Three.js | 两类优势可兼得 | 双坐标/深度/相机同步 | 此范围没有收益抵消双渲染器复杂度与资源开销 |

目标是在真实河岸/道路/建筑轮廓上构建艺术化城市空间，而不是随机城市。缺失高度明确作为估算，缺失 DEM 的山体明确作为示意。
