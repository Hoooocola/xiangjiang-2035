# 固定研究数据与计算契约

## 鹅洲

`ezhou.json`：`boundary` (WGS84 ring)、`features` (OSM id/tags/geometry)、`contextBuildings`（现有局部投影体量）、source/license/accuracy。

`ezhou-study.json`：nodes 的 `id/name/coordinate/kind/state`；edges 的 `id/from/to/coordinates/state`；serviceIds。12 home、2 service、3 visitor，全为 DEMO。两组线路为固定预设连接，未推断真实地下管线。

`connectedHomes`：从 serviceIds 出发，沿无向图 BFS。访问到的 home 为接入；其他 home 未接入。默认 8/4，由图算出；移除一条直连边为 7/5；空边集为 0/12；没有服务根的闭环也不能算接入。不做真实排污判断。UI 可移除/恢复一条连接，场景线和颜色随同一数据更新。

## 矿坑

`quarry.json`：`coordinate:null`；RECONSTRUCTED；outline 为 18 个不规则局部控制点；paths 为 5 条折线；restoration 为 3 个示意恢复圈；nodes 为 5 个场景对象；source/note 明示精度。

`quarryHeight(x,z)`：同一示意地表函数供三维网格、路径贴地、剖面与坡度计算使用。积水面以内返回相对 0，不表示坑底或实测水深。岸外用变化坑缘、分段坡壁、微地形构造示意高程。三维是 150×150 离散网格，分析使用连续函数，存在采样误差。

`slopeDegrees`：以 2m 中心差分求 x/z 梯度，再 atan 得角度。`analyzePaths` 按每段不超过 2m 采样，累计超过当前阈值的路径长度；模型中相应段以暖色标记。默认 35° 是演示筛选参数，可调 10–70°，并非标准或风险判定。

`profile`：东西/南北穿越模型原点，-400..+400m，每 5m 一个采样，共 161 点；三维剖切线与面板曲线共用该数据。水面 = 相对 0m，坑缘示意约 +28～+66m；水下深度未知，不能用地表最高/最低值声称矿坑总深度。

自由与引导模式共用固定模型/计算。分析在参数或步骤变更时执行，不在 render 循环里重算。来源事实、模拟对象和开放研究问题在 UI 分开标明。

## 双场地汇总

分析执行后只在当前标签页 sessionStorage 写入最小 DEMO ANALYSIS 快照：site/status/computedAt、鹅洲连接数或矿坑阈值/交叠长度。矿坑末步显示此前鹅洲实际计算记录及当前矿坑结果；未分析鹅洲时明确显示未执行。不是数据库田野记录，不保存个人信息，不作为实际调研证据。无效格式/计数/阈值被拒绝；存储不可用不影响实时分析。
