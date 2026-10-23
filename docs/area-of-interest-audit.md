# Area of Interest — V1 审计与 V2 方案

基线 `version1`（cdcd8dd），2026-10-23。先保存 V1 截图与 Git 标签后修改。

## 真实机制

- `terrain.ts` 从既有 grid.riverDistance 双线性采样距河距离，V1 importance = 1 - smoothstep(distance, 9, 26)。1 scene unit = 100 米，即主要影响是距河 900–2600 米的等宽过渡。
- 地形顶点、公园采样、建筑中心、实例建筑及植被颜色都使用这一个重要性；不是 GIS 重点场域 Polygon，不是新的光照半径或模型裁剪。
- `materials.ts` ground 再做 smoothstep(.15,.85)，缩窄过渡；夜间 .012 的暗底与 .22 暖地面、额外正弦 emissive pool 拉大亮度差，形成明显亮带。
- `scene.ts` 道路按中间点、公园按首顶点 importance < .2 二分，选择 road/contextRoad 或 park/contextPark；整个对象换材质，导致连续街区、山林的块状断层。
- 建筑虽然按单栋中心写 importance，选中地点时 shader 又用局部椭圆 focus 调暗外部，进一步让空间权重随选择改变。
- 真实高程由 terrain.height 独立处理，但已有岸边压缩/平顺；本轮保持其原样，不把视觉权重写进高程。
- 模型加载源是 public/data 的固定下载范围；树木还受森林与距河 7.5 km 的密度/生成限制。这些是资产覆盖，不能冒充 AOI 或研究覆盖。V2 不移动河流、洲岛、道路或地点。
- Fog 与相机距离相关，建筑批次 frustum culling 是性能层；不能用扩大 fog 或隐藏批次解决重点边界。

## V2 数据与融合

PDF 实际为 Downloads/Frame 1.pdf，内部标题《湘江场域标注与分类》，单页 1920 × 4300 pt。已复制原件到 docs/references。56 个图上标签人工读取并与文字提取互校；六类为场域类别，不取代五个研究语义层。

独立 `src/places` 保存清单与来源；`src/experience/aoi` 保存视觉范围及采样。公开 OSM 实体经本地原始数据重建，可用边界保持不规则 Polygon/MultiPolygon 和 holes。点位不能代表区域；无边界地点不默认生成统一圆斑。铜官窑、鹅洲、昭山沿用项目近似点配置显式 Approximate 视觉上下文，不声称真实研究边界。

四层逻辑：

1. River Corridor：低权重连续底层，保持河流/洲岛/桥梁；不让沿岸全部达到最高强调。
2. Focus Areas：真实开放地理对象边界或有来源的概念包络，按类别/面积设置视觉强度和过渡。
3. Context Areas：从每个 Focus Area 外缘按米计算距离渐变，生态对象过渡较宽。
4. Background Areas：最低非零权重保留城市/自然背景，由主题与空气透视降低对比。

同一权重供日夜使用。区域之间采用 max union，重叠不会相加过曝，优先级排序稳定。100 米缓存网格双线性混合控制开销。对地形是连续顶点权重；建筑保持单栋权重；道路沿每段连续采样；公园取消按单顶点切换材料。完整山林在内部保持一致权重，边缘向外渐弱，避免在山体中间按距江切开。

## 来源限制

本地 GIS 能匹配 20 个面与 7 个点，另 3 处仅有项目近似定位，26 处尚无可靠坐标。公开 Overpass 主节点返回 HTTP 406，镜像请求超时；本轮不据此编造缺失坐标。点名称不清或疑似车站替代场域的条目需标注待核验。大泽湖、大王山、狮峰山等若缺范围，只验证其相邻地区的显示连续性，不宣称已验证该场域边界。

## Masar 对照范围

本轮实际尝试访问主站超时、官方案例浏览器连接关闭，因此不声称本轮完成日夜、旋转的现场操作。官方案例文本可访问，确认 WebGL 与日夜双模式；主站文本说明拖动探索、滚轮/双指缩放。复核仓库已有 reference 截图可观察重点区域与外围城市对比、克制文字导航；具体 shader、光照和遮罩技术均是实现推测，不当作对方技术事实。

来源：[官方案例](https://immersive-g.com/projects/masar-destination/)、[Masar 体验](https://www.masardestination.com.sa/en/experience)。
