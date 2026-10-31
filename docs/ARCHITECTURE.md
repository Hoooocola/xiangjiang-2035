# 技术架构与模块边界

依据当前代码，2026-10-28。Next.js 单体项目，非微服务；没有引入新地图引擎。

## 运行栈

Next.js 16.3.4 App Router、React 19.2.8、TypeScript；Three.js 0.186.1 负责三维体验，Leaflet 1.9.4 保留在田野记录地图；PostgreSQL、Drizzle ORM、Zod 负责研究平台数据。pnpm 锁定依赖；Vitest 验证业务、数据和相机。

## 两条数据路径

1. 三维展示：`public/data` 固定 GIS → `assets.ts` → `scene.ts` / `terrain.ts` → Three.js；`src/atlas` 静态目录 → overlay、说明与地点资料。
2. 田野采集：App Router 路由 → `src/server` 授权/验证/service/repository → `src/db` PostgreSQL；媒体经 StorageAdapter 存 `.data/uploads`（开发环境）。

静态地图记录不会自动成为数据库记录，不能靠共用名称视作已经同步。主地图可脱离数据库运行。

## 模块责任

| 模块 | 责任 | 审核边界 |
|---|---|---|
| `app/experience/experience.tsx` | React 页面协调、选择、面板和引擎回调 | 共享入口，由负责人集成 |
| `layer-panel.tsx` / `focus-label.tsx` / `place-detail.tsx` / CSS | 目录、说明、详情、界面状态 | 同事 A；不直接计算相机 |
| `src/experience/engine.ts` | 渲染生命周期、对象选择、控制器联动 | 负责人 |
| `scene.ts` / `assets.ts` / `terrain.ts` / `geo.ts` | 资产加载、建模、高程、投影 | 负责人 |
| `materials.ts` / `lighting.ts` / `postprocessing.ts` | 材质、光照与后处理 | 负责人审核视觉变化 |
| `camera.ts` / `config.ts` / `framing.ts` / `information-framing.ts` | 单一相机控制、预设与构图 | 负责人 |
| `src/experience/aoi` | 多场域视觉权重及连续过渡 | 负责人；不得改变地理数据 |
| `overlays.ts` / `anchors.ts` / `information-surface.ts` | 研究几何、贴地和标签投影 | 跨视觉/数据，负责人审核 |
| `src/places` | 场域分类、位置、核验状态和地点注册 | 同事 B 提案；坐标/范围由负责人审核 |
| `src/atlas` | 六层信息、资料、来源、对象和方案关系 | 同事 B；类型契约共同审核 |
| `src/spatial` / `app/experience/sites/ezhou` | 地点级概念研究现场 | 保持与宏观地图边界 |
| `src/server` / `src/db` / `drizzle` | 持久化、权限、媒体与迁移 | 负责人审核，独立数据库测试 |
| `style-frame*` | 保留的视觉实验 | 不自动覆盖正式体验 |

## 空间契约

数据经纬度是 WGS84，采用 `geo.ts` 局部投影。X 向东、−Z 向北、Y 向上，1 场景单位为 100 米。不得把坐标标签直接改成 GCJ-02/CGCS2000。高程与视觉权重分离；树木采样预算属于性能/资产层，不是研究范围。

AOI 改材质权重，不能删除外围模型或生成新研究结论。对象贴地有渲染避让高度，不是实际测量高度。标签世界锚点随相机矩阵更新；DOM 内部动画不能覆盖定位 transform。

## 部署边界

本地 `/experience` 不需要地图 Token。研究平台生产认证、对象存储尚未接入；不要把 DEV ONLY 开关带到公开部署。数据库文件与用户上传不纳入 Git。构建应在独立 clone/worktree 中进行，避免与运行中的 dev 输出互相干扰。

## V2.4 空间阅读与氛围增量

PlaceIntroduction负责首次选中的编辑式介绍，PlaceDetail/ResearchReader仅用于主动长文阅读；AtlasLibrary负责标题索引。ProposalExplorer读取src/atlas/proposals.ts的既有Proposal集合，StudentWork仍独立。内部proposal图层标识保留，但不属于五类现实GIS导航。rememberView通过原CameraRig保存/恢复视角，不在UI计算相机。

terrain-focus.ts把既有DEM插值渲染为柔化视觉焦点，不改变源高程或连续AOI。atmosphere.ts提供一个Points批次和最多5个世界雾层，按偏好、减少动态效果和帧率降级；lighting.ts原光照及曝光不变，仅可选距离雾增强。见docs/v2.4。
