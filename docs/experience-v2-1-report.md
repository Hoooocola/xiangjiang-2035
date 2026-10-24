# 湘江 2035 · V2.1 实施与验收

## Stage 0 — Done

分支 `feature/experience-v2-1`；检查点 `fc182d5`。`version1` 保持指向 `cdcd8dd1f8c67944be5b6b89a2813fa0518a54e2`。原 V2 最终提交 `8f137a5`。工作区仅有原有未跟踪 `.audit/`，不纳入修改。磁盘文件与 Git 状态已检查，无法判断其他编辑器尚未写入磁盘的缓冲区。

## Stage 1 — Done：实际根因

读取 `git show version1:src/experience/terrain.ts`：V1 权重为 `1-smoothstep(distance,9,26)`，单位 100 米，即距河岸 900 米内完整展示，至 2600 米柔和衰减。`4d087e1` 将其改为 `.32*(1-smoothstep(1,12,distance))`，并取 `.12` 最低值。多边形保持约 .8–1 的权重，基础走廊却被大幅削弱，导致场域看似独立光斑。

矩形不是 PDF 遮罩，也没有 AOI 渲染纹理/RenderTarget。`scene.ts` 的 DEM 是真实矩形网格；`5f2dd2b` 为地形材质增加 `assetEdgeOpacity`，但共享材质的 6000×6000 底板没有此属性，其默认值为 0，底板消失。地形外围最低 .12、底板权重 0 又产生不一致的亮度。地形外缘透明衰减实际混入场景背景，暴露了矩形数据范围。阴影相机也有矩形范围，但不是这一地表覆盖边缘的来源。

## Stage 2 — Partial：待浏览器对照验收

恢复 V1 原始距离带；与实际场域多边形使用 max 空间并集，不相加曝光。每个 Polygon 连通分量必须通过边界采样或内部采样接触距河岸 1700 米内的基础走廊，才允许扩展；远离走廊的场地只保留地点标记。移除 .12 全网格最低权重，使外围和底板一致；补齐底板透明度属性。保留原地理坐标、高程、数据覆盖和地形外缘衰减，不扩大矩形、不增加贴图。

## 后续阶段

Stage 3 Legacy Place Recovery — Not Started。
Stage 4 Mock Information Layers — Not Started。
Stage 5 Guided Camera — Not Started。
Stage 6 Art Direction — Not Started。
Stage 7 Integration & Regression — Not Started。
