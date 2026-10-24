# 湘江 2035 · V2.1 实施与验收

验收日期：2026-10-24。预览：<http://127.0.0.1:3001/experience>。本轮在现有 V2 上修改，没有整体恢复 V1，也没有重新开发研究后台。

## 状态与交付边界

| 阶段 | 状态 | 结果与限制 |
|---|---|---|
| 0 Git Safety | Done | 保留 version1；建立检查点和独立分支 |
| 1 AOI Diagnosis | Done | 从 Git 定位走廊削弱、底板属性缺失及透明合成问题 |
| 2 AOI Correction | Done | 连续河岸距离带与相连场域扩展；全段、核心、岳麓山、洋湖及旋转缩放实测无明显矩形接缝 |
| 3 Legacy Place Recovery | Partial | 原型文件与关系恢复完成；9 条静态 Demo 不能当作真实历史成果 |
| 4 Mock Information Layers | Done | 六类有内容、有实际计数，可叠加和点击；模拟资料明确标记 |
| 5 Guided Camera | Done | 明确关键帧，完成开始、中段、终点、中断、跳过、重置实测 |
| 6 Art Direction | Partial | 降低地表泛亮，统一暗部与建筑层次；尚未达到 Masar 的精细模型与材质品质 |
| 7 Integration & Regression | Done（本轮范围） | 构建、类型、53 项测试及浏览器交互通过；26 项数据库集成测试跳过 |
| 解放垸坐标与缺失历史附件 | Blocked | 当前资料不足，保留待核验，不伪造坐标或成果 |
| 真实扫描资产与真实研究导入 | Not Started | 本轮未提供，不属于 Mock Demo 的完成声明 |

## 1. Git 安全和提交

分支 `feature/experience-v2-1`。`version1` 保持指向 `cdcd8dd1f8c67944be5b6b89a2813fa0518a54e2`，没有覆盖或移动。V2 基线 `8f137a5`，检查点 `fc182d5`。原有未跟踪 `.audit/` 未纳入修改。已检查磁盘与 Git 状态；无法判断其他编辑器尚未写入磁盘的缓冲区。

| 提交 | 内容 |
|---|---|
| fc182d5 | checkpoint experience before v2.1 |
| 4602593 | 恢复连续河流走廊及相连地理扩展 |
| a18cd9f | 统一外围地形与底板 |
| 8feb11a | 将外围着色修正限制在地面材质 |
| fc9e62d | 恢复原型地点关系，建立统一地点注册表 |
| 7aa132e | 可追溯 Mock 信息层及实际计数 |
| b639c8c | Overview → Approach → Focus 相机序列 |
| b124e43 | 修复 DEM 透明合成接缝，调整夜间材质层次 |
| 03d677c | 对齐图层筛选范围与实际地点关联计数 |

最终 UI 范围/计数修正与本报告分别提交；完整记录见 `git log feature/experience-v2-1`。各阶段可按提交回退，没有破坏性清理。`git diff version1 -- public/data data/osm` 为空，原始河道、建筑、高程与地理源数据未移动。

## 2. 具体根因

读取 `git show version1:src/experience/terrain.ts`，V1 权重为 `1-smoothstep(distance,9,26)`，单位 100 米，即距河岸 900 米内完整展示，至 2600 米柔和衰减。提交 `4d087e1` 将其改成 `.32*(1-smoothstep(1,12,distance))` 并设置 `.12` 最低值。多边形仍有约 .8–1 的权重，基础走廊却被削弱，导致独立光斑观感。

矩形不是 PDF 遮罩。场景没有用 AOI RenderTarget、矩形纹理 UV 或 PDF 拼接图生成范围。实际 DEM 是矩形网格：

1. `5f2dd2b` 增加 `assetEdgeOpacity`，但共享材质的 6000×6000 底板缺少该属性，默认 0 使底板消失。
2. DEM 外围最低 .12 与底板权重 0 不一致，产生亮度差。
3. 修复前两项后，共用透明材质的底板与地形仍受透明排序影响，暴露数据矩形边缘；地面法线和阴影又强化外围亮度差。

最终为底板补齐 opacity 属性，移除最低权重差，统一外围地面着色；底板独立为不透明材质，沿用同一 AOI shader，排序为底板 -2、地形 -1。保留原 DEM 的 3 km 外缘 alpha 过渡，没有扩大矩形、增加遮掩贴图或改高程。阴影相机也有矩形范围，但不是本次覆盖接缝的主要来源。

## 3. 连续 AOI 合成与对照

`src/experience/aoi/index.ts` 恢复 V1 河岸距离带，再取 `max(baseCorridor, connectedExtension)`。这是空间权重并集，不是曝光相加，重叠处不叠亮；采用 100 米格网缓存及双线性采样。

每个多边形连通分量单独检查：边界每不超过 100 米采样、内部 200 米采样，必须接触距河岸 1700 米以内的有效基础带，才纳入扩展。没有生成虚构连接线或孤立聚光灯。远离基础带的场地仍可作为普通地点存在。

纳入 22 个相连场域：咸嘉湖、西湖公园、岳麓山、凤凰山、天马山、后湖、南郊公园、洋湖湿地、蔡家洲、月亮岛、傅家洲、橘子洲、巴溪洲、鹅洲、兴马洲、渔人码头、铜官窑、汉长沙国考古遗址公园、开福寺、潮宗街、岳麓污水处理厂、烈士陵园。

昭山风景区现有近似范围未通过连接检查，保留普通地点及周边上下文，没有强造亮斑。社区点位不自动变成社区边界。PDF 提供分类和目录，实际扩展依据已有地理多边形，不将裁切块当 GIS 边界。山体展示范围也不等于法定山界或精确生态边界。

以下为实际浏览器 1280×800 截图。使用各版本对应全段/核心预设；局部预览面板可能不同，不声称像素级相机一致。

| 范围 | V1 | V2 | V2.1 |
|---|---|---|---|
| 全段夜间 | [图](version1/screenshots/corridor-night.jpg) | [图](version2/screenshots/corridor-night.jpg) | [图](version2-1/screenshots/corridor-night.jpg) |
| 核心夜间 | [图](version1/screenshots/core-night.jpg) | [图](version2/screenshots/core-night.jpg) | [图](version2-1/screenshots/core-night.jpg) |
| 核心日间 | [图](version1/screenshots/core-day.jpg) | [图](version2/screenshots/core-day.jpg) | [图](version2-1/screenshots/core-day.jpg) |
| 岳麓山 | [图](version1/screenshots/yuelu-night.jpg) | [图](version2/screenshots/yuelu-night.jpg) | [图](version2-1/screenshots/yuelu-night.jpg) |

V1 沿江连续但近似等宽；V2 基础带削弱且存在矩形边缘；V2.1 保留连续河流主体，并向岳麓山、洋湖等场域扩展。[洋湖截图](version2-1/screenshots/yanghu-night.jpg)、[旋转缩放截图](version2-1/screenshots/rotated-zoomed-night.jpg)补充局部验证。选定视角未见明显矩形或独立亮斑，不代表穷举全部相机位置。

## 4. 地点与历史方案

详见 [legacy-place-recovery.md](legacy-place-recovery.md)。检索最早提交 `3bf2d3e`、version1、分支与删除历史、当前原型/数据及项目资料清单。`prototype-html/js/data.js` 原始与当前 SHA-1 均为 `9026904ae3e2ff52fdfa52fb8db6de186e1f021f`。

找到 9 条原型方案，去重为 4 个候选地点：鹅洲、巴溪洲、兴马洲、解放垸。原型 README 明示静态 Demo；**本次可核实的真实历史方案为 0**。8 条可定位原型方案进入资料索引；解放垸的 `legacy-p8` 保留待核验，没有补造原始报告、访谈或介入几何。

| 地点 | 恢复的原型 ID（新 ID 均加 legacy- 前缀） | 定位依据 |
|---|---|---|
| 鹅洲 | p1、p2、p3、p5、p7、p9 | 已核对地名近似坐标及已有 OSM 岛形 |
| 巴溪洲 | p4 | 现有 OSM 洲岛几何导航点 |
| 兴马洲 | p6 | 现有 OSM 洲岛几何导航点 |
| 解放垸 | p8，未落点 | 坐标待核验 |

三个可定位地点原来已在 V2，本轮恢复的是内容关联。另外补入 21 个已有地理依据、不重复的 PDF 场域，使地图从 10 增至 **31 个地点**；这 21 个不是从历史方案中找出的地点。26 个 PDF 未定位地点继续待核验。

`src/places/registry.ts` 为唯一地点入口，管理类别、坐标、来源、核验状态、research/proposal 关联 ID。Proposal 支持 `placeIds[]`，一处地点一个主要 marker。地点类别用洲岛、水岸、树木、文化建筑、社区、设施图标，与信息层分离。屏幕空间疏让、选中优先，完整地点列表可导航。

浏览器已打开巴溪洲预览与 `legacy-p4`，核对出处及 DEMO 标记：[预览](version2-1/screenshots/baxi-preview.jpg)、[方案详情](version2-1/screenshots/legacy-baxi-proposal.jpg)。最终预览改为实际关联研究/方案计数，避免旧的“资料待补”标签覆盖已有关系。

## 5. 信息层及模拟资料

`src/atlas/demo-v21.ts` 独立管理新增 8 条模拟资料和 10 个空间对象；与公开 GIS、已有公开资料分开。合并已有鹅洲 10 个对象，共 **20 个可用空间对象**。计数是全段可用对象数量，不是方案条数或当前屏幕标签数。

| 图层 | 可用数 | 示例 | 视觉编码 |
|---|---:|---|---|
| Geography | 2 | 橘子洲阅读示意、鹅洲 OSM 轮廓 | 蓝色方形、轮廓 |
| Ecology | 3 | 橘子洲林荫、洋湖选区、鹅洲公开议题索引 | 绿色叶形、区域填充 |
| Culture | 2 | 橘子洲记忆模板、鹅洲资料索引 | 赭色菱形 |
| Society | 2 | 橘子洲计划观察路线、鹅洲演示路径 | 橙色圆形、虚线 |
| Research | 3 | 橘子洲问题索引、鹅洲研究索引和记录模板 | 紫色方形/双边框 |
| Proposal | 8 | 地点方案可用状态、选中方案介入几何 | 青色三角形、点线 |

Proposal 的 8 个对象含 3 个地点级状态和 5 个需要对应方案“介入”状态才显示的对象；开启图层不会让 8 个同时出现，也不按每条方案重复建地点点位。永久地理底图不属于可关闭研究覆盖层。

新增模拟资料均保留 `DEMO DATA / 模拟研究资料`，带 `isMock`、`sourceStatus`、`sourceLabel`、类型、geometry、placeIds 及关联证据/方案 ID。示意位置注明“非实测”。没有伪造已完成调查、居民引语、污染结论或保护红线；问题与缺口是演示性提问。

计数默认“全段资料”，选中地点后可切“当前地点”；关闭所有图层不会归零。方案介入会同步切地点范围。地图显示当前视野对象，缩放影响标签；面板列出已启用资料。

实测：开启生态及社会 → 点击林荫对象 → 详情及地点 → 关闭生态保留社会 → 开启研究 → 关联方案 → 基线/介入切换。介入几何只在对应状态出现，其他层保留。证据：[多层叠加](version2-1/screenshots/layers-ecology-society.jpg)、[详情](version2-1/screenshots/ecology-detail.jpg)、[筛选](version2-1/screenshots/layers-filtered.jpg)、[介入](version2-1/screenshots/proposal-intervention.jpg)。

## 6. 镜头编排与控制

`src/experience/camera-sequence.ts` 定义下表。世界坐标单位为 100 米，角度为弧度；这是本项目参数，不是 Masar 原站参数。

| 时间 ms | 阶段 | Target | Range | Azimuth | Polar |
|---:|---|---|---:|---:|---:|
| 0 | Overview | [-55,0,-4] | 1080 | .05 | .24 |
| 1200 | Approach 起点 | [-55,0,-4] | 1080 | .05 | .24 |
| 9800 | Focus 到达 | [2,0,-1] | 75 | .38 | 1.00 |
| 11400 | Focus 停留结束 | [2,0,-1] | 75 | .38 | 1.00 |

目标点线性路径乘五次平滑缓动，距离对数插值，方位取最短角差；不再使用反复摆动的 Catmull 路径，不每帧按 marker 重算目标。拖动、滚轮、键盘取消自动引导，手动控制不叠加。跳过以 600 ms 到核心，重置以 2600 ms 回核心；近景重播先回全段再启动序列。尊重减少动态效果偏好。

证据：[开始](version2-1/screenshots/tour-overview.jpg)、[中段约 4.4 秒](version2-1/screenshots/tour-middle.jpg)、[终点](version2-1/screenshots/tour-end.jpg)、[拖动中断](version2-1/screenshots/tour-interrupted.jpg)、[跳过](version2-1/screenshots/tour-skipped.jpg)、[重置](version2-1/screenshots/tour-reset.jpg)。中段实际连续采样，非静态预设冒充动画帧。中断后 UI 恢复“播放沿江巡游”，可继续手动操作。

小地图继续使用随方向旋转的矩形视野指示，默认暗模式；此前移除的“山水洲城”大字没有恢复。

## 7. 夜间美术与参考限制

本轮再次尝试 Masar 官方体验页，返回 `ERR_CONNECTION_CLOSED`，无法重新操作 WebGL 导览。采用此前实际访问保存的[参考夜景](screenshots/reference/06-live-night.jpg)、[参考日景](screenshots/reference/07-live-day.jpg)、[参考分析](reference-analysis.md)和用户截图，不虚构原站镜头曲线或技术参数。

分开空间权重、地表材质与环境光：降低夜间地面自发光、屋顶基色、半球光和补光，保留方向光；统一外围地形与底板的低对比色。沿用立面变化、程序窗光、暖冷材质与远景处理，没有添加按场域投射的局部天光或用强 Bloom 遮接缝。

核心建筑与外围有层级，水体统一暗蓝，暗部保留道路与体量；日间维持冷中性底色与绿地。建筑仍主要由开放轮廓挤出，绝大多数高度缺真实测量；精细立面、真实夜景灯光与 Masar 定制模型仍有差距。美术对标标为 Partial，不宣称同品质复刻。

## 8. 验证、限制与后续

- `pnpm typecheck`、`pnpm build`：通过；本地预览运行最新生产构建。
- `pnpm test`：11 个文件、53 项通过；2 个数据库文件、26 项跳过。
- `pnpm lint`：0 errors，原型 app 存在 2 个既有未使用变量 warnings。
- 测试覆盖 AOI 连通性、距离带、地点去重与关系、图层计数/筛选/介入作用域、相机单调插值与取消。
- 实际浏览器完成流程 A–E：全段/核心/局部、昼夜、旋转缩放、地点聚焦、图层叠加、资料/方案详情及导览控制。
- 鹅洲局部现场额外回归场景加载、引导启动与步骤导航，保留独立五层研究体系：[回归截图](version2-1/screenshots/local-research-regression.jpg)。
- 最终新浏览器会话未见 Console Error。开发期间曾出现材质 shader 错误，已由 `8feb11a` 修复。

这不是完整数据库端到端验收。真实写入/权限和数据库集成不在本轮浏览器结论内。最新视觉证据为桌面 1280×800，没有重新完成所有移动端流程。全段会疏让 marker，完整地点可从列表访问。

后续优先补充解放垸坐标、缺失历史方案附件、未定位 PDF 场域的可靠 GIS 边界，以及昭山范围核验；再替换 Mock 资料。替换时保留稳定 ID、source、verificationStatus、地点和证据关联，只在核验后移除 DEMO 标记。真实扫描可接入局部研究现场，不必改变全局地点入口或混合三套分类。
