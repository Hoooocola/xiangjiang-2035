# Spatial Data Exploration Demo V3

## 基线与协作

采用PR #11确切提交29a160c2cde6129ce0d152fd81847be7eb5aea85，独立feature/spatial-data-exploration-v3分支。核查PR #12 head f594f22、PR #13 head b5c82b2、integration/yanghu-course-complete 7fa474c；均未合并或继承其渲染实现。main为3eae236。原始毕业设计工作区不参与写入。本轮仅Preview，不Production。

## 参考落地与证据边界

- [Masar / Immersive Garden](https://immersive-g.com/projects/masar-destination/)：保留昼夜与原模型主次，用低对比地面纹理作B显影，禁止全域不透明分类覆面。交互页实际访问截图存本地，未下载作本站素材。
- [Marseille开发者解析](https://barradeau.com/blog/?p=1208)：复用已有概括几何与坐标中心，不重复城市。交互网站本轮短时加载只到约5%，不能将该加载截图冒充城市运行证据；技术依据来自作者公开解析，不宣称看过完整运行机制。
- [Lyon开发者解析](https://martinlaxenaire.medium.com/plongez-dans-lyon-webgl-scene-case-study-947dd8c080bb)：沿用原CameraRig和目标选中语义，保留原材质/后处理预算，不追加反射或高价后处理。交互页实际访问到入口及地点目录，动态验证范围受加载状态限制。
- [Global Fishing Watch指南](https://globalfishingwatch.org/user-guide/)：保留五主题及独立来源/可见性，参考层/当前对象/DEMO关系分开。实际地图截图与来源目录保留；不复制其海洋热力配色或GIS卡片。
- [VisQuill Lens](https://visquill.com/tutorials/lens/index.html)：圆形可拖动局部读取；本项目不实现它的聚合图表，也不从屏幕圆推算地理面积。[Esri Magnifier](https://developers.arcgis.com/net/winui/sample-code/show-magnifier/)只用于边缘及操作参考；本工具不是放大镜。[Media Map](https://doc.arcgis.com/en/instant-apps/11.4/create-apps/media-map.htm)用于理解图层揭示，未复制其底图切换代码。

## 数据与地理正确性

沿用基线中已存在的ESA WorldCover 2021 v200裁剪：112.90–113.02°E、28.10–28.27°N，1440×2040原始EPSG:4326像元，约10m，PixelIsArea，西→东/北→南。scripts/prepare-exploration.py用标准库解码既有Deflate TIFF，逐像元比对原JSON，并校验原TIFF源SHA，然后输出无损R8二进制2,937,600字节。没有新下载、重采样或修改分析数据。

当前裁剪只有10/20/30/40/50/60/80：林地、灌丛、草地、农田、建成区、裸地、水体；不显示不存在的湿地植被类。meta与source中保存CC BY 4.0、原始源URL、hash和像元原点；按ESA WorldCover consortium/Copernicus来源署名。[官方产品说明](https://esa-worldcover.org/en/data-access)指出2020/2021算法版本不同，本Demo不把分类差异推断为真实土地变化。

CPU读取与GPU纹理共享同一原始字节。sampleCover使用左闭右开、上闭下开范围和floor行列；纹理Nearest不生成mipmap。场景X东、Z南、100m/单位的现有project/unproject不变。范围外或地面不可见返回NoData。没有随机读数、屏幕面积统计或伪造百分比。

## B+C实现

独立src/exploration模块挂接现有engine。首次启用才读取并缓存CPU数据，复制现有DEM relief几何一次，顶点只加既有地面显示避让，复用同一个renderer、scene、camera。B着色器按目标类显示克制纹理，切换/关闭约0.8秒过渡，随后静态；纹理仅类别编码，不是遥感单棵树、真实田垄或法定用地边界。

C使用同一着色器的屏幕圆形条件显影：圆内所有实际分类较清晰，圆外仍是原三维材质+轻B。深度测试保留建筑遮挡，不能涂建筑立面。没有第二城市、第二相机或第二次完整场景渲染。

透镜边缘和小手柄支持PointerCapture及触屏，手柄方向键移动；圆心直接穿透到原地图操作，圆外可旋转缩放。位置直接更新DOM transform和uniform，地理读取120ms一次，取当前相机与贴地网格的交点。Esc/关闭只退出透镜，回到B，不改视角。信息明确非放大、10m、来源、坐标、NoData，无面积暗示。

## 五主题与三幕

沿用一个LayerPanel，新增P0控件按五类插入；旧资料仍在各类“已有研究资料与示例”下，不建立重复图层面板。类别显示开关与实际显影状态共享，清除同时移除新旧高亮。

- 地理：真实OSM岸线、道路/桥梁批量线段；桥梁沿用现有高度规则，属于视觉高程而非测绘结果；原DEM保留，等高线/剖面规划中。无交通流量动画。
- 生态：真实WorldCover；历史水体时间序列/生物聚合规划中，不假装可用。
- 文化：来自现有注册器的地点坐标与小节点，保留已有文化/课程资料；不是新遗产普查或单栋模型识别。设施分类规划中。
- 社会：3个固定DEMO服务点；步行关系仅选择东岸研究窗口600m附近的既有路段作示意，不是最短路、步行等时圈或实际到达范围。人口规划中。
- 经济：3个固定DEMO商业点，不是商户名录；产业边界/夜光规划中。

三幕从图层目录“开始三幕空间探索”进入，自定步速、每幕建议40–60秒，可随时退出：认识真实岸线/路网/B → C比较并叠加 → 东岸示意研究窗口及近邻步行关系，最后提出待验证问题。进入前记住相机和探索状态，退出恢复，不破坏原课程阅读入口。

## 性能与限制

纹理一次约2.8MiB；地理线/节点批量，关闭释放GPU几何、材质与纹理，CPU分类数据缓存复用；十次循环验证资源回到基线。不为10m像元建Mesh，不逐帧统计/解析GeoJSON。静态图层无持续扫描动画，不新增渲染器、后处理或依赖。

基线与候选在同设备、同1440×900、同核心机位实际采样FPS/P95/调用/三角形/堆/几何/纹理及加载时间。GPU计时无法可靠取得，明确不测；JS堆不等于显存。首轮基线与参考页并行，另以独立固定源码目录单独复测排除构建与参考干扰。实际性能表与截图以本地交付报告为准，不能用测试通过替代流畅度。

未实现P1面积比例、更完整路网分析、人口与产业/夜光，均无假开关。WorldCover裁剪并非全河段；模型/DEM本来是概括场景，视觉避让不提高其地理精度。负责人需验收实际观感后再决定合并；回退到29a160c或正常revert，无force push/reset/标签改写。

## 最终验证（2026-11-03）

TypeScript、生产构建通过；Vitest 38 个文件 / 200 项通过，包含独立 PostgreSQL 测试，无跳过。ESLint 无错误，保留 prototype-html 中原有 2 条 unused-vars 警告。

当前受控 1440×900 / 核心机位复测：稳定基线 60.17 FPS、P95 16.8 ms、141 calls；V3 默认 60.29 FPS、141 calls，B / C / 连续拖动均 60.29 FPS、142 calls，P95 16.7–16.8 ms。同期基线及 V3 均为既有 full 氛围（160 粒子 / 6 雾层），不是通过降低全局画质取得。更早一次运行两者均约 30 FPS / 33.4 ms，已有 auto 氛围进入 low；报告同时保留这次记录，不将单次测量当作所有设备的帧率保证。现在 UI 显示既有“自动轻量”状态，未改其触发逻辑。

相机持续旋转 / 缩放期间另测 59 FPS / P95 16.8 ms；透镜地理中心随相机变化，范围外 NoData，Esc 保持视角，窄屏手柄 44px。十次开关后几何 222 / 纹理 16，与关闭后的基线一致。B / C 增加 1 geometry、1 texture、约 81,090 triangles；CPU 原始栅格缓存约 2.8 MiB。JS Heap 受 GC 影响，不宣称恒定或等同显存；GPU 时间不可可靠测量。

首次本地进入可交互：基线 4,019 ms、V3 4,134 ms（各一次，非统计显著差异，均不包含用户手动停留）。完整浏览器交互、四尺寸课程回归、Preview 实测及截图由最终交付目录保存。
