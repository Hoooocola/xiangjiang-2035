# 真实数据来源与处理

- ESA WorldCover 2021 v200：官方 https://esa-worldcover.org/en/data-access ，CC-BY-4.0。2021年，约10m，EPSG:4326。保留全部11类官方代码、0为nodata。源COG → 原生像元窗口 [112.90,28.10,113.02,28.27] → GeoTIFF和JSON。JSON由服务端延迟读取。不是规划用地或法定湿地。2020 v100与2021 v200算法不同，禁止把逐像元差值直接称为真实变化。
- GBIF：官方API https://techdocs.gbif.org/en/openapi/v1/occurrence 。查询、时间、响应哈希和分页状态见 data/spatial/gbif-query.json。仅保留CC-BY4/CC0、正数且≤1000m误差、有效坐标、无地理问题、非未来日期；删除观察者姓名。100条是516条匹配记录中的受限样本，非完整分布/名录。每条带记录、数据集链接与许可。未知误差不按零处理。不能据缺失断言没有物种；分析距离小于误差时不作确定判断。
- 湖南省生态环境厅2025年11月月报： https://sthjt.hunan.gov.cn/sthjt/xxgk/zdly/hjjc/hjzl/202512/t20251222_33876308.html 。发布2025-12-22，观测2025-11；30个长沙湘江流域断面（其中8个干流），保留原始名称“桔子洲”等，不与地图同名地点强绑。仅整理公开事实性表格字段，不转载HTML/PDF/图片；网站未提供CC许可，不能把整份报告宣称开放授权。指标空白保存null，不能解释成数值零。全部positionStatus=unverified且geometry=null，禁止上图。非实时水质。HTML源SHA256保留供核验。
- 洋湖研究面：复用既有OSM公园polygon（ODbL-1.0），不变更AOI或places；道路复用已有OSM/Overture资产，保留出处、下载时间与不完整覆盖说明。

## 复现准备（仅离线工具）

`python3 -m venv /tmp/xiangjiang-gis-tools`；`/tmp/xiangjiang-gis-tools/bin/pip install rasterio==1.4.3`。此免费工具只用于数据准备，不是Next依赖。

运行 `python scripts/spatial/prepare-worldcover.py`。可通过正常HTTPS_PROXY设置使用本机现有代理，脚本不内置代理或密钥。Rasterio使用HTTP Range，只读取窗口所需COG块；不加载全球数据。WMS/WMTS适合预览，无法代替分类值作统计。

下载上述官方HTML至临时文件，按gbif-query.json的queryUrl下载JSON，然后运行 `python3 scripts/spatial/prepare-snapshots.py water.html gbif.json`。结果是版本化快照；重新运行可能得到更新GBIF记录，必须审查diff，不作为安装步骤自动刷新。

## JRC调查（本轮不下载）

官方 https://global-surface-water.appspot.com/download ，页面2026-10-15更新：v1.5长时序汇总1984–2024；新增Monthly/Yearly仅2022–2024，早期需结合历史产品。Occurrence适合长期出现频率；Seasonality适合季节性。30m，Copernicus开放使用并署名EC JRC/Google；Collection1/2混用存在配准偏差，Monthly Recurrence存在已知问题。建议只取洋湖窗口验证Occurrence与Seasonality，先检查2021与2024网格/配准，不能直接把水体变化归因于公共活动。本轮仅方案，未宣称有JRC分析结果。
