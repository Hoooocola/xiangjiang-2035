export const SOURCES={island:'https://zx.zxy.hunanzx.gov.cn/szxapp/1/193/content_1124300.html',islandLife:'https://www.hunantoday.cn/news/xhn/202609/33821955.html',quarry:'https://www.hunantoday.cn/news/xhn/202601/31323649.html',quarryEarlier:'https://hunan.voc.com.cn/news/202508/30132627.html'};
export const ISLAND_STEPS=[
 {phase:'Context',title:'鹅洲岛地理环境与空间结构',body:'沿真实岸线、鹅洲大桥和道路认识聚落。地理骨架来自 OSM；屋顶、立面、地表起伏和植被为重建。'},
 {phase:'Resources',title:'鹅洲岛居住与游憩活动的空间分布',body:'12 个聚落代表点与 3 个活动点只是固定的 DEMO 样本，不能推算真实户数、客流或排污量。'},
 {phase:'Evidence',title:'污水收集设施的空间布局',body:'两组示意收集线路连接两个服务节点。线路是研究演示，不代表地下管网测绘，也不是现状建设记录。'},
 {phase:'Findings',title:'污水收集网络的连接关系分析',body:'以服务节点为根，分析模拟网络中的可达路径、连接节点和服务单元；移除边后同步更新统计与空间高亮。'},
 {phase:'Findings',title:'基础设施研究问题与证据缺口',body:'居住与游客活动产生的污水，如何通过基础设施和管理得到有效处理，同时兼顾生态保护？需核实真实住户接入、管线、设施运行及水环境监测。'},
 {phase:'Proposal',title:'基础设施与生态生活的设计机会',body:'待验证方向：分布式收集处理、社区参与运维、游客活动管理与公共生态教育。它们是开放的研究方向，不是最终工程方案。'},
];
export const QUARRY_STEPS=[
 {phase:'Context',title:'坪塘矿坑的地形与水体特征',body:'目标为坪塘街道“长沙纳木措”，并非湘江欢乐城。当前没有可靠坐标，暂不嵌入主地图。依据新闻航拍建立局部空间重建，尺度与标高均为示意。'},
 {phase:'Resources',title:'矿坑地形高差与剖面分析',body:'剖切线穿越坑缘、岩壁与水面。显示的是同一重建地形的采样剖面；模型水面为相对零点，水下深度未知，不将报道的百米深度用作测绘值。'},
 {phase:'Evidence',title:'裸露岩面与恢复空间',body:'三处 DEMO 生态恢复关注区，仅用于讨论空间组织。它们不是实际修复工程或法定生态保护范围。'},
 {phase:'Resources',title:'交通联系与活动路径的空间结构',body:'叠加五条活动路径、外围道路结构和模拟入口。可比较到达距离与路网连接；道路与入口均为未配准的演示关系。'},
 {phase:'Findings',title:'执行坡度与路径交叠计算',body:'按地形高度差计算坡度，并每 2m 沿模拟路线采样。阈值可调整；35°只是演示筛选参数，不是岩土安全标准，结果也不代表真实危险区。'},
 {phase:'Findings',title:'地形条件与公众使用的研究问题',body:'需要高精度测绘、岩土稳定性评价、实际活动调研、水环境和运营信息，才能讨论生态修复、管理与公众活动之间的协调。'},
 {phase:'Proposal',title:'研究问题与后续验证方向',body:'待验证机会：活动空间分区、路径信息引导、修复与公众教育、多主体场地管理。2026 年报道为开发计划，不代表已建成开放。'},
];
