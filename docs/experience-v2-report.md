# 湘江 2035 — V2 交付与验收

完成日期：2026-10-24。预览：<http://127.0.0.1:3001/experience>。

## 1. 版本与恢复

- V1 snapshot：`cdcd8dd1f8c67944be5b6b89a2813fa0518a54e2`。
- Annotated tag：`version1`，未覆盖旧历史。
- V2 分支：`feature/experience-v2`。
- V1 包含此前已完成的矩形小地图、默认暗模式及 Spatial Research Explorer。详见 [V1 归档](version1/README.md) 与 [研究现场交付](spatial-research-explorer-status.md)。
- 原始 GIS / DEM / 环境数据相对 version1 无修改。建筑 158,242 栋、树木 42,023 株，与 V1 相同。
- .env.local、数据库、上传文件、node_modules 不入库；`.audit/` 旧截图未删除或混入提交。

独立恢复，保留当前 V2：

```sh
git worktree add ../xiangjiang-version1 version1
cd ../xiangjiang-version1
pnpm install --frozen-lockfile
pnpm build
pnpm start --hostname 127.0.0.1 --port 3002
```

三维体验页不要求数据库或 Token。研究平台写入功能需按 `.env.example` 配置本地数据库；不复制或提交密钥。V1 归档前已成功构建并运行、截取实际画面；本轮未另做一次全新依赖安装。运行必需资产与锁文件均在 tag 中，无 Git LFS 指针依赖。

主要独立提交：

| Commit | 内容 |
| --- | --- |
| `4d087e1` | PDF 清单、场域驱动 AOI、连续边界 |
| `1ca95f7` | 夜间灯光 / 材质 / 气氛分离 |
| `32150da` | 移除全局时间二分、方案限定情景、轻量导航 |
| `e339b06` | 统一相机操作及新增检查视点 |
| `0069c64` | 资产覆盖与地图模块职责整理 |
| `5f2dd2b` | 外围树冠夜间反差与 DEM 外沿柔化 |

## 2. PDF 与场域数据

实际找到的文件为 `Downloads/Frame 1.pdf`，内部标题《湘江场域标注与分类》，单页 1920 × 4300 pt；已实际渲染查看，原件保存为 [参考 PDF](references/xiangjiang-site-classification.pdf)。没有将地图拼接矩形或 PDF 像素换算成伪精确坐标。

完整的 56 个图上标签、逐条来源、核验状态见 [场域清单](xiangjiang-site-inventory.md)。分类：洲岛 9、滨水/码头/港口 3、生态自然 14、历史文化/景观 6、社区/街区 14、产业/公共设施/创新 10。分类来自图例与地点语义整理，不冒充每一个标签都带有明确分类符号。

本地开放 GIS 匹配结果：20 个面、7 个仅点位、3 个已有项目近似点、26 个尚待坐标核验。排除了以同名地铁站代替街区/山体的匹配。`verified` 表示开放地理实体匹配，不表示实地测绘、行政红线或已完成研究。

程序数据：

- `src/places/xiangjiang-sites.json`：id、name、category、approximateLocation、geometry、spatialExtentStatus、importance、source、verified、displayPriority、notes。
- `src/experience/aoi/focus-areas.json`：23 个 FocusArea；siteId、类别、多边形、importance、extentSource、verified、displayPriority、transitionWidth（米）、visualIntensity、关联地点。
- `scripts/prepare-focus-areas.mjs`：从版本化 OSM 数据与种子清单离线重建；不依赖实时 API 才能运行地图。

20 个开放地理对象范围包含岳麓山、洋湖湿地、橘子洲、月亮岛、巴溪洲、兴马洲等；3 个 Approximate 视觉上下文为铜官窑、鹅洲、昭山，沿用既有项目近似点。只有点位但无可靠范围的地点，不批量生成同半径圆斑。大泽湖、大王山等没有冒充已验证边界。

PDF 六类是场域分类；局部研究现场的 Context / Resources / Evidence / Findings / Proposal 五层仍独立。宏观资料图层也未被 PDF 分类替换。

## 3. 范围问题与新 AOI

完整代码审计见 [AOI 审计](area-of-interest-audit.md)。旧版根据距河 900–2600 米生成连续权重，地面 shader 再做阈值处理，公园与道路按单点阈值分材质。这个组合产生等宽亮带、块状材质切换和山体明暗切割；并非真实 GIS 场域决定范围。

V2 分为四层：连续低权重河流基础、重点多边形、边界外渐变上下文、非零权重背景。对象内部保持一致权重，外部按真实多边形边缘距离平滑下降，保留 holes。山林的过渡通常为 1,700 米，洲岛为 650 米，其他对象为 750 米；近似范围另行标记配置。不同范围取 max union，不累加亮度导致重叠过曝；稳定优先级排序，100 米缓存网格双线性插值。

建筑按整栋取权重；地形、公园、道路沿顶点连续采样。日夜使用同一套 AOI 数据。河道位置、洲岛轮廓、道路、高程、原有地点坐标未改动。树木数量由独立的 V1 采样预算决定，AOI 只控制显示权重。模型加载范围、研究数据覆盖与视觉重点互不替代。

全段视角另对 DEM 资产最外围做 3 公里透明度过渡，柔化下载瓦片的矩形外沿；这不代表 PDF 场域边界，也不改变地形坐标、高程或研究权重。

## 4. 夜间视觉

- Scene Lighting：独立环境光、定向主光、补光、曝光；主光方向固定于世界，不随相机旋转。
- Spatial Emphasis：材质消费 AOI；选择地点的紫色提示不再压暗整个外围。
- Atmospheric Composition：独立背景与距离雾；夜间保留更远的城市结构。
- 移除地面大面积暖黄自发光和正弦“灯池”，改为冷灰青地面；暖光留给窗格、桥梁。
- 加强屋顶与侧立面差异，远距窗光有限保留；不使用 Bloom。
- 山林提升暗部受光；外围树冠另降低夜间反差，避免白点抢眼。
- 日间保持中性浅灰背景，重点生态对象有色，背景建筑弱化。

对标证据：本轮主站浏览器访问超时，官方案例页浏览器连接关闭；复核了仓库已有真实参考截图与此前观察记录。不能声称本轮成功操作 Masar 日夜切换，也不能把自身 shader 实现当作对方的技术事实。参考 [官方案例](https://immersive-g.com/projects/masar-destination/) 与 [体验站](https://www.masardestination.com.sa/en/experience)。

## 5. 方案、UI 与相机

全局 Today / 2035 控件和过滤逻辑已移除。`OverlayState.proposal` 为 `{proposalId, view: 'baseline' | 'intervention'} | null`；方案几何带 proposalId，只有当前地点、当前方案和对应图层同时匹配时显示。所有原有资料和方案对象保留。入口：资料 → 方案 → 洲岛轻行 → 基线场景 / 方案介入。换地点、换资料或回总览会清理方案上下文；收起面板仍可观察当前方案。昼夜、研究年份、方案介入分别管理。

顶部图层/资料与研究平台采用文字、细底线、统一强调色及焦点样式，去掉外框与大片选中背景。主要新工具命中范围不少于 44px。图层、资料、平台、全段与地点探索均保留。

相机由单一 CameraRig 管理：

- 默认拖动平移，Shift/右键拖动旋转；面板可切换主拖动方式。
- 滚轮及 +/- 缩放，方向键旋转/俯仰，Shift + 方向键平移。
- 可展开面板提供四向平移、左右旋转、放大/缩小；另有重置。
- 点击地点聚焦，关闭地点返回之前视角；全段/核心/三种预设/巡游保留。
- 用户输入可中断镜头动画；按钮连续输入保留累计目标。
- 距离、俯仰和沿江探索边界集中限制；宏观镜头保持地形之上 6.6 单位（660 米）的保守高度，覆盖当前简化建筑 6 单位高度上限。不是可供建筑内部漫游的精确碰撞系统。
- 小地图仍是旋转矩形的近似视野指示，不冒充透视测绘边界；默认暗模式保持。

## 6. 模块化整理

见 [模块职责](experience-v2-architecture.md)。新增独立 Places / AOI / Lighting / Assets 模块，提取 CameraControls，集中资料清理；保留现有 atlas 与 spatial 业务模块。没有新建微服务或插件框架。

主要文件：`src/places/types.ts`、`src/places/index.ts`、`src/experience/aoi/index.ts`、`terrain.ts`、`scene.ts`、`materials.ts`、`lighting.ts`、`assets.ts`、`camera.ts`、`config.ts`、`engine.ts`；`src/atlas/types.ts` / `objects.ts`；`app/experience/experience.tsx` / `camera-controls.tsx` / `place-detail.tsx` / `layer-panel.tsx` 及相关样式。

## 7. V1 / V2 实际对照

桌面均使用 1280 × 800 CSS px。核心使用 CAMERA_PRESETS[0]；全段使用 OVERVIEW_POSE；山体使用相同 yuelu 地点预设。洋湖比较从全段出发，点击小地图同一坐标 `[217.3504776, 32.8802395]`（viewBox 340 × 108），两版目标均为 `[112.9344092, 28.1302825]`，距离 100、azimuth .05、polar .88。

| 视角 | V1 | V2 | 主要观察 |
| --- | --- | --- | --- |
| 核心夜间 | [V1](version1/screenshots/core-night.jpg) | [V2](version2/screenshots/core-night.jpg) | 暖黄带消退，山林与远景有层次 |
| 核心日间 | [V1](version1/screenshots/core-day.jpg) | [V2](version2/screenshots/core-day.jpg) | 重点生态对象着色，背景中性白灰 |
| 全段夜间 | [V1](version1/screenshots/corridor-night.jpg) | [V2](version2/screenshots/corridor-night.jpg) | 不均匀场域分布，瓦片外沿柔化 |
| 岳麓山 | [V1](version1/screenshots/yuelu-night.jpg) | [V2](version2/screenshots/yuelu-night.jpg) | 按完整山林对象展开，取消距河硬分区 |
| 洋湖同坐标 | [V1](version2/screenshots/v1-yanghu-coordinate-night.jpg) | [V2](version2/screenshots/yanghu-coordinate-night.jpg) | 湿地从暗背景中显出，沿河不是等宽亮带 |
| 顶部 UI | [V1](version1/screenshots/top-ui.jpg) | [V2](version2/screenshots/top-ui.jpg) | 去除全局时间开关与盒状工具栏 |

照片均来自实际浏览器，不是渲染草图或生成图。阶段截图 `aoi-core-stage` / `night-material-stage` 仅记录开发过程，不作为最终对照。区域截图在局部视角未受最外围 DEM 透明度修正影响。

## 8. 验证结果

- `pnpm build`：生产构建成功，包含 `/experience` 与 `/experience/sites/ezhou`。
- `pnpm typecheck`：通过。
- `pnpm test`：48 通过，26 数据库集成测试因未启用 RUN_DB_TESTS 跳过；不把跳过视为已验证。
- `pnpm lint`：0 error，2 个原有 prototype-html 未使用变量 warning。
- 建筑/树木数量与 V1 相同；git diff 确认原始 public/data 与 data/osm 未修改。
- 本机 1280×800 生产版核心/全段约 70–84 fps，核心约 94 draw calls / 193 万三角形，全段约 219 calls / 340 万三角形。采样依赖浏览器、设备、后台负载；不是跨设备性能保证。
- 研究平台入口可正常到达 `/create-research`；生产环境随后显示既有 `UNAUTHENTICATED / 生产认证尚未接入`，本轮未绕过认证或创建研究记录。此项是现有平台接入限制，不能将入口可达等同于写入功能已验收。
- 浏览器已走通资料 → 方案 → 介入/基线，资料入口与图层入口保留；方案隔离由自动化测试检查地点、图层、proposalId 不匹配时不可见。
- 手机 390×844：镜头面板四向平移可点击、图层开关实际切换，文档无横向溢出；详情和图层列表内部滚动。见 [手机镜头](version2/screenshots/mobile-camera.jpg) / [手机图层](version2/screenshots/mobile-layers.jpg)。
- 桌面真实拖动打断重置动画后可继续旋转；按钮平移、旋转、缩放连续可用，指北针与矩形小地图同步。见 [旋转视角](version2/screenshots/rotated-night.jpg) / [镜头面板](version2/screenshots/camera-controls.jpg)。
- 局部研究现场可进入、引导下一步、跳到方案、切回基线、退出并返回鹅洲；返回后单 canvas、无记录到的 console error。

区域检查：

| 区域 | 结果与限制 |
| --- | --- |
| 铜官窑附近 | 河流、洲岛、背景建筑连续；强调为已有点的近似包络，非遗址边界 |
| 月亮岛 / 大泽湖一带 | 月亮岛完整；大泽湖未核验范围不伪造高亮边界 |
| 橘子洲 / 长沙城区 | 昼夜及核心视角通过，洲岛连续，东岸不再全段同等明亮 |
| 岳麓山 | 山体对象与外围渐变连续；未新增地形或精确山界 |
| 洋湖湿地 | 同坐标比较显示按湿地对象展开；内部水系精细程度受既有 GIS 限制 |
| 巴溪洲 / 大王山一带 | 岛屿完整、周边城市保留；大王山精确范围待补 |
| 鹅洲 / 兴马洲 | 南段两岛与周边背景连续，研究现场入口正常 |
| 昭山附近 | 南端河流和地形可见；近似标记不是景区精确位置/边界 |

## 9. 限制与后续

1. 26 个场域仍缺可靠坐标，7 个只有点位。补充经过核验的 polygon 与资料来源是后续重点；不能从 PDF 像素推算精确 GIS。
2. 大部分建筑是开放轮廓挤出的简化体量，未知高度仍为估算；窗格是程序材质，不是真实夜间灯光数据。与定制高精模型的参考站仍有明显细节差距。
3. 洋湖等地区缺细致内部水系/植被/设施模型；不得靠虚构模型“补齐”。
4. 宏观相机采用保守高空安全高度，未实现逐栋精确碰撞或地面第一人称漫游。
5. 地形保持 V1 高程及河岸平顺处理，未完成 CGCS2000 校准；场域强调不等于法定保护范围。
6. 新增四个地点导航只用于地理检查，没有编造新的研究档案。真实扫描、田野证据仍需遵循既有来源与精度元信息接口接入。
7. 研究平台生产认证尚未接入，真实写入流程不在本轮地图改造中完成；26 个数据库测试未运行。
8. 页面协调器与场景构建仍偏长，可后续按实际变化继续提取；目前避免大规模业务目录搬迁。
