# 来源、精度与再生成

继承 [V4 来源清单](../v4/SOURCES.md) 和全项目 [资产许可](../ASSET_LICENSES.md)。核查2026-11-05；仅公开来源链接，未提交新闻/对标图片、脚本或贴图。

- 鹅洲岸线：OSM relation/8727387及本项目既有河面孔洞；道路/足迹保留OSM对象ID，Overture简化体量位置继承已有资产。屋顶、高度缺失项、植被、岸坡细节、农田与院落属 RECONSTRUCTED。
- 鹅洲聚落与污水网络：全部 DEMO；新闻 [鹅洲生活与污水配套背景](https://zx.zxy.hunanzx.gov.cn/szxapp/1/193/content_1124300.html) 不等于本项目12节点的实测。`roadReference` 是演示近邻索引，非地籍归属。66单元只是图上参数，不填入真实人口或污水量。
- 坪塘矿坑：[新湖南2026-01-11计划与航拍](https://www.hunantoday.cn/news/xhn/202601/31323649.html)、[华声在线2025-08-04](https://hunan.voc.com.cn/news/202508/30132627.html)。明确区分湘江欢乐城矿坑。图片只本地研究。
- 现有资料不足以核准坑缘WGS84、多边形尺度、道路配准和高程；保持 `coordinate:null`。轮廓/相对地形 RECONSTRUCTED，周边道路/入口/路径 DEMO，不拿莲花山村中心冒充坑址，不宣称运动公园已经建成。
- 水面零点不等于坑底，不渲染/推测水下深度。相对高程、坡度、长度皆基于演示地形/局部米制单位。
- [Masar](https://www.masardestination.com.sa/en/experience)、[制作案例](https://immersive-g.com/projects/masar-destination/)、[Marseille作者技术说明](https://barradeau.com/blog/?p=1208)：参考几何细节层级、合批、镜头与信息表达，没有复制品牌模型、程序或素材。

运行只依赖已提交公共JSON，不在首屏请求OSM或第三方模型。再生成沿用 `node scripts/research/prepare-demo.mjs`，V4.1节点属性及入口路网从同目录 `study-config.json` 确定性合入。修改真实骨架需单独审核，不能以重建细节冒充测绘资料。
