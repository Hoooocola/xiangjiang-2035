# V3.2 · Liquid Glass 控件与完整面状水体

基线：`fe9892a6ec1e33d4b454c5d3b3efaad6a0936816`（PR #14 合并后的 main）。独立分支 `feature/liquid-glass-ui-v3-2`；不包含 WorkBuddy #12/#13，不合并 main，不改 Production。本地原始「新毕设」未参与开发。

## 现状审查与参考转化

| 区域 | V3.1 情况 | V3.2 实现 |
|---|---|---|
| 顶部导航 | 分散文字与底线 | 一个小范围玻璃组，选中底片按真实按钮尺寸移动 |
| 昼夜与底部工具 | 实色紫色圆、松散图标 | 两个独立胶囊；昼夜底片只用透明中性色，紫色留给语义强调 |
| 五类图层/资料索引 | 已有渐隐目录 | 保留无边界结构、统一阅读变量；仅分类、开关、局部精读按钮有材质反馈 |
| 地点/研究/课程锚点 | 展开标签常为硬白矩形 | 保留菱形及地理定位，选中标签用小型玻璃；课程默认标签仍是轻量文字 |
| 地点介绍 | 变换动画内的 fixed 伪元素被裁成矩形 | 仅透明度入场、viewport 渐隐衬底、独立滚动内容；相机控件保持可见 |
| 资料长文/课程作品 | 阅读层与封面 | 编辑式渐隐衬底；不模糊正文、PDF、视频或封面，不改列表为大卡片 |
| 土地覆盖透镜 | 数据圆+实色手柄 | 保留原渲染与分类，轮廓高光、小范围玻璃手柄；圆内数据不加滤镜 |

实际访问的参考与实现取舍：

- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)、[Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)（1:29 Dynamics / 6:00 Adaptivity / 10:31 Principles）：控件浮在内容上、昼夜分别调可读性、避免玻璃叠玻璃。Web 实现为局部渐变、细边缘和 6–8px blur，不模拟系统折射。
- [Build a UIKit app](https://developer.apple.com/videos/play/wwdc2025/284/)（7:19 / 13:31 / 17:24 / 19:15）：相近操作共享材质，选中层在容器内移动；弹出菜单靠近来源。这里只借鉴分组和反馈，不引入 UIKit 或第二套渲染器。
- [Masar](https://www.masardestination.com.sa/en/experience)、[项目案例](https://immersive-g.com/projects/masar-destination/)：实际夜景以三维空间为主体，按钮克制、菱形语言明确。本轮保留地图原材料与连续 AOI，不复制沙色地面。
- [Lyon](https://www.plongezdanslyon.fr/en)：已进入实际 WebGL 地图，参考锚点与模型的位置联系、浮动操作与城市间留白；不复制其高饱和城市配色。
- [Marseille](https://marseille.laphase5.com/)：页面可访问，但本机两次等待仍停留在加载画面；没有把未加载的地图细节作为已验证参考。

Apple/Masar/Lyon 参考截图仅存本地验收包，不上传对标图片或视频。Apple 指定章节结合官方完整文字稿核对，截图为实际页面；不把系统视频画面当成本项目实现。

## 组件和 Token

`app/experience/liquid-glass.module.css` 统一以下变量（仅 UI，不驱动场景材料）：

| Token | 日间 | 夜间 |
|---|---|---|
| `--glass-rgb` / `--glass-alpha` | 247,249,247 / .72 | 20,45,53 / .76 |
| `--glass-edge` | 白色 .72 | 浅青白 .22 |
| `--glass-selected` | 白色 .68 | 浅青白 .15 |
| `--glass-highlight` | 白色 .62 | 浅青白 .12 |
| `--glass-fallback` | #E9EFED | #18343E |
| `--glass-blur` | 8px；标签/弹出层 6px | 同左 |
| `--glass-radius` / `--glass-label-radius` | 24px / 14px | 同左 |
| `--glass-fast/state/enter` | 160 / 280 / 360ms | 同左 |

既有 `--reading-rgb/near/middle/soft/fade/tail` 为编辑区域共同衬底，`--text/muted/accent/line` 管理文字与语义。没有给每一行套玻璃。`data-glass=group/control/label/popover` 是共用外观钩子；`GlassNavigation` 只在选中与 ResizeObserver 通知时测量按钮，没有每帧 React 布局。

支持 `prefers-reduced-motion`、`prefers-reduced-transparency`、高对比偏好和无 backdrop-filter 的不透明主题回退。透明度回退为浏览器支持该媒体查询时自动生效；不宣称所有浏览器都提供该系统偏好。装饰底片/衬底不接收指针。布局仍支持键盘与原有 44px 交互热区。

改动组件：Experience 外观钩子、GlassNavigation、CameraControls、AtmosphereControl、DataLens、ResourceMarkers、PlaceIntroduction；CSS 覆盖 experience / information / exploration / editorial / atlas / student-work-showcase。业务事件仍调用原接口，未改 CameraRig、AOI、坐标契约、分析函数、课程目录或媒体路由。

## 水体根因和修复

1. `prepare-scene-data.mjs` 及 `scene.ts` 原来只接纳 `water=river` / `waterway=riverbank`。后湖 `relation/17880216` 已存在于 2026-10-20 OSM 快照，标签是 `natural=water,water=lake`，转换后是 1 外环+4 内环的完整 Polygon；并非坐标错误或 AOI 裁剪。
2. 单纯新增蓝色平面仍会被已有 DEM/公园覆盖。因此用空间索引在建模时从 DEM/公园显示网格扣除湖泊精确占地；保留岛屿孔洞、剩余陆地的插值高度/法线/UV。数据源 DEM 与河流 mask 未重写。不是关闭深度测试或把整个灰地块染蓝。
3. 所有面状水体共用现有 `materials.water` 和 `materials.shore`，原湘江颜色、河面高度、洲岛边界及昼夜光照未改。湖面以岸边采样中位数设定平静显示基准，**不是实测水位**。
4. `scripts/prepare-inland-water.mjs` 从原 OSM 快照提取新增 105 个完整面：湖泊18、池塘39、蓄水/水池5、未细分 natural=water 43。排除不完整 `relation/14890481`；不凭截图补绘，不以 WorldCover 水体像元替代岸线。
5. `src/experience/water-tags.mjs` 为准备脚本和渲染共享识别规则；`water.ts` 为静态空间索引与通用裁剪；`assets.ts` 按 ID 去重加载 `public/data/inland-water.geojson`。没有运行全量 scene/terrain/context 重生成。来源、全部 ID 和排除项见 [water-source.json](water-source.json)。

OSM 几何保持 WGS84、原始坐标精度及 ODbL-1.0/© OpenStreetMap contributors 标注；原始源文件已在安全协作版本内。新文件是开放 GIS 派生几何，不包含截图、PDF、HAR、密钥或用户田野资料。

修正水体占地后，原来错误落在水面内的 12 个简化背景体块和 479 个采样树不再绘制（源资产未删除）；不是全局减少模型或降低画质换取 FPS。其他采样预算、全局 DPR、建筑细节、云雾、粒子和 WorldCover 不变。湖面范围只有现有快照覆盖，不宣称全流域所有湖泊已完整测绘。

## 验证与验收材料

- 锁定依赖安装成功；无新依赖、无收费服务。
- TypeScript 通过；ESLint 0 错误，prototype-html/js/app.js 的 2 个既有 unused-vars 警告保留。
- 40 个测试文件、210 项全部通过，含 26 项隔离 PostgreSQL 测试和 5 项新增水体测试（标签、Multipolygon、内环岛屿、裁剪高度/法线/UV、河面不受影响、真实资产）。
- `next build --webpack` 生产构建通过。
- 实际浏览器检查图层与透镜、地点定位/中断/返回、9个资源锚点、半径计算/空结果、关闭图层清理、10次开关资源回收、课程统计及 PDF/视频索引。媒体沿用现有公开来源与按需解析，第三方可用性不构成本地代码的永久保证。
- 四尺寸：1920×1080、1440×900、1366×768、390×844；截图与机器结果随 PR 验收证据提供。
- 后湖昼夜与咸嘉湖抽样；后湖画面同时可见周边小水塘。精确内环与异常标签另有自动测试，不只针对地名硬编码。

[实际截图与同机位对照](SCREENSHOTS.md) · [性能对照](performance.json) 为本机 Chrome、生产构建、1440×900、DPR1、同机位同状态；不同时运行其他浏览器测量。GPU 时间没有可靠采样，未报告。rAF 帧间隔与引擎 draw calls/heap 一并记录，不能代表所有设备。

## 回退与发布边界

通过 PR 单独审阅。需要回退时 revert 本 PR 即可；基线 main 与原始本地工程均保留，不移动历史标签。Preview 仅本轮功能分支；Production 域名未提升到本分支。

**单独的旧任务状态**：V3.1 main 的测试和 Preview 已通过；准备好的 V3.1 Production 构建为 READY，但未切换正式别名。本轮收到 V3.2 明确“不要修改 Production”的限制后停止提升。正式域名仍指向 `dpl_GZSkZa6kLJaTtN1JEj7vuUe9VFPk`（10月31日旧版）。此事实不能被 V3.2 Preview 上线掩盖。
