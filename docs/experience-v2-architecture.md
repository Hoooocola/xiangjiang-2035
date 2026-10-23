# V2 模块边界

仍为 Next.js 单体部署，无新服务或插件框架。

| 模块 | 负责 | 不负责 |
| --- | --- | --- |
| `src/places` | PDF 六类场域、名称、来源、空间核验状态 | 五层研究内容与记录编辑 |
| `src/experience/assets.ts` | 固定版本 GIS / DEM / 环境资产加载、植被采样预算 | 重点范围、研究筛选 |
| `src/experience/aoi` | FocusArea、真实多边形、近似范围、平滑距离权重、max 融合 | 模型显隐、数据覆盖、灯光 |
| `src/experience/scene.ts` | 将资产转换成地形、建筑、道路和植被 | 研究业务、页面导航 |
| `src/experience/materials.ts` | 地表与建筑材质消费同一份 AOI 权重 | 决定研究范围 |
| `src/experience/lighting.ts` | Scene Lighting / Atmospheric Composition | 读取 AOI、隐藏资产 |
| `src/experience/camera.ts` / `config.ts` | 相机状态、预设、动画、手势、边界与高度保护 | React 面板状态 |
| `src/atlas` | 宏观地点资料、研究关系、对象与当前方案限定的情景 | 修改原始 GIS |
| `src/spatial` | 地点级研究现场、五层信息、空间注释、自由/引导探索 | 把 PDF 六类当作研究五层 |
| `app/experience/camera-controls.tsx` | 可见操作与可访问名称，通过引擎发送动作 | 直接写 Three.js 相机参数 |

`experience.tsx` 仍是页面协调器；重复的资料/方案选择清理已集中。没有为目录数量机械迁移业务代码。业务记录与 GIS 数据通过 placeId / proposalId / siteId 关联；不会因缺少研究记录而删除对应地理环境。

建筑数量、源数据、坐标与高程不因 AOI 改变。植被密度使用保留的 V1 采样预算（与河流距离相关的性能策略），其函数与视觉权重分离；这不是新的视觉范围。AOI 可以改变材质，不能改变采样密度。

当前限制：页面协调器与场景构建仍较长；浏览器性能指标是本机观测，不是跨设备基准。将来接入真实扫描模型应使用现有 `src/spatial` 资产适配接口，保留坐标基准、许可和精度元信息；不应把模型加载范围当作研究结论。
