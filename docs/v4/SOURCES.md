# 地理证据、重建与许可

核查日期：2026-11-05。经纬度为 WGS84；全域沿用既有 100m 局部单位投影。矿坑不提供经纬度。

## 鹅洲岛

- [OSM 湘江 relation/8727387](https://www.openstreetmap.org/relation/8727387)：本项目现有河面 MultiPolygon 的洲岛孔洞。鹅洲所用环 28 点，范围约 112.942342–112.953246 E、28.003833–28.026502 N；不是兴马洲。保留原环，不把 UI 近似地点标记当作整个岛的几何。
- [OSM map API](https://api.openstreetmap.org/api/0.6/map?bbox=112.935,27.999,112.957,28.030)：2026-11-05 获取道路、建筑等。鹅洲大桥 way/1446549060、way/1446549063；资产保留 OSM 对象 id。公开地理数据并非完整测绘，岸线时效与足迹完整性仍有限。
- 现有 `context.json` / `data/context/manifest.json`：Overture 2026-09-23.1 简化体量，抽取岛内 49 项。方向/位置来自已有数据；缺失高度、屋顶、窗、院落、道路材质、树木与耕作形态属于 RECONSTRUCTED。
- [政协融媒 2026-05-10](https://zx.zxy.hunanzx.gov.cn/szxapp/1/193/content_1124300.html)：公开报道岛上生活与污水配套问题。文中人口户数是报道背景，不作为本 Demo 住户分布、现状统计或网络调查。
- [新湖南 2026-09-22](https://www.hunantoday.cn/news/xhn/202609/33821955.html)：鹅洲生活、农业、桥梁与环岛活动的公开参考。照片只查看来源，不打包再发布。

REAL：岸线/可追溯 OSM 足迹与道路。RECONSTRUCTED：地表细节、缺失高程、简化体量及其屋顶外观、植被。DEMO：所有代表点、服务设施、管网、活动、生态关注区。DEMO ANALYSIS：对固定模拟图进行可达性计算。

## 坪塘深坑“长沙纳木措”

- [新湖南 2026-01-11](https://www.hunantoday.cn/news/xhn/202601/31323649.html)：运动公园开发计划与航拍。仅证明计划，不证明建成/开放。坑缘形态用于人工局部重建参考。
- [湖南日报/华声在线 2025-08-04](https://hunan.voc.com.cn/news/202508/30132627.html)：矿坑现状、积水与公众活动参考。报道中的水深说法未经测绘，本项目不转成测量值。
- [长沙晚报现场报道](https://www.icswb.com/newspaper_article-detail-1827310.html)：山泉路与新学士路附近的入口线索；入口不是坑中心。莲花山村中心也不是坑中心。公开地名检索曾返回附近学校，已明确拒绝作为矿坑坐标。
- [湖南省自然资源厅湘江欢乐城案例](https://zrzyt.hunan.gov.cn/zrzyt/stcpjzsxzl/202507/t20250731_33754452.html)：用于区分已改造的欢乐雪域矿坑，不能拿该场地替代本任务目标。

航拍轮廓可确认大致形态，但未得到可交叉核实的坑缘 WGS84 多边形、现场 DEM 或水深。故固定局部坐标为示意米制，`coordinate: null`。形状、尺度、相对高差均 RECONSTRUCTED；5 路径/3 生态圈/5 节点 DEMO。示意坡度计算是 DEMO ANALYSIS，不是地质安全分析。

## 技术/视觉参考与共享

[Masar](https://www.masardestination.com.sa/en/experience)、[Immersive 项目介绍](https://immersive-g.com/projects/masar-destination/)、[Marseille 作者技术说明](https://barradeau.com/blog/?p=1208)、[Lyon](https://www.plongezdanslyon.fr/en)。仅学习信息与场景层级、合批、预处理和镜头组织，不复制其模型、脚本、贴图或截图进产品。

OSM/Overture 派生数据沿用 ODbL 1.0 和原有署名/上游许可；ESA/地形资产沿用 `docs/ASSET_LICENSES.md` 与原来源清单。矿坑几何、植被、建筑细节均由本项目程序生成。新闻/航拍原图仅在本地对照研究，不提交 Git 或发布到 Preview。UI 提供原文链接。没有新增付费依赖、LFS 或外部服务。

## 再生成

运行应用只需要已经提交的三个 `public/data/research/*.json`，不需要访问 OSM。研究数据固定，不在每次刷新随机生成。

`node scripts/research/prepare-sites.mjs <OSM-JSON路径>` 从已有湘江岸线/context 和标准 OSM JSON 生成鹅洲资产；OSM map API 返回 XML，可用 Python ElementTree 把 node/way/relation 的 id、lat/lon、nd ref、member、tag 转为 Overpass 兼容 `{elements:[...]}` 后传入，或向支持相同 bbox 的 Overpass 请求 `[out:json]`。不要把新闻影像放入生成目录。`node scripts/research/prepare-demo.mjs` 确定性生成模拟网络和矿坑参数；`node scripts/research/asset-versions.mjs` 更新核心资源摘要。
