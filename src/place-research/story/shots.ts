import type {StoryShot,Site} from './types';
import type {CameraPose} from '../../experience/config';
const pose=(target:CameraPose['target'],distance:number,azimuth:number,polar:number):CameraPose=>({target,distance,azimuth,polar});
const make=(shotId:string,phase:StoryShot['phase'],title:string,researchQuestion:string,camera:CameraPose,layers:string[],mode:StoryShot['analysisMode'],evidence:string,hold=false):StoryShot=>({shotId,phase,title,researchQuestion,cameraPosition:camera,cameraTarget:camera.target,subjectObjects:layers,dimmedObjects:['非当前研究对象'],visibleDataLayers:layers,analysisMode:mode,primaryMetrics:['当前研究尺度','参数计算结果'],annotations:['主体对象','空间约束'],interactionActions:['选择对象','自由移动','关闭侧栏','重置当前镜头','返回湘江全域'],transitionSettings:{duration:1400,hold},evidence});
export const E_SHOTS:StoryShot[]=[
 make('E-01','context','洲岛与湘江','鹅洲如何联系两岸、居民生活与生态保护背景？',pose([0,.1,0],31,.7,1.05),['physical','river','roads'],'entity','2026-05 调研报道保护背景与设施不足；OSM 岸线和道路有来源，模型垂直基准待核实。'),
 make('E-02','resources','生活与游憩','模拟生活需求与活动节点分布在哪里？',pose([0,.08,-1.7],13,.65,.95),['physical','homes','visitors','roads'],'reveal','12 个代表点、66 单元、3 个活动点均为既有 DEMO，不是人口或房屋统计。'),
 make('E-03','evidence','水位与空间分区','江水连通与相对地形如何改变模拟受影响范围？',pose([0,.1,0],27,.55,.95),['physical','flood','homes'],'entity','2024-06 新闻记载低洼积水和露营基地关闭；当前使用原创模型低包络 10m 网格，非裸地 DTM 或水动力模型。'),
 make('E-04','findings','设施布局的约束','需求、路网与汛期分区如何共同约束候选设施？',pose([-.2,.07,.8],8,.6,1.02),['physical','flood','homes','roads','network','facilities'],'technical','设施位置、管径和埋深是 DEMO；路网距离可计算，OSM 连通不代表汛期可通行。选择设施进入局部剖切。'),
 make('E-05','proposal','四种组织情景','改变收集处理组织方式，会产生哪些空间权衡？',pose([-.2,.07,.8],8,.6,1.02),['physical','flood','homes','network','facilities','transport'],'technical','A 岛外纳管 / B 密闭收运 / C 岛内处理 / D 分区组合。计算几何关系，不计算虚构工程效益，不预设最优方案。',true),
];
export const P_SHOTS:StoryShot[]=[
 make('P-01','context','矿坑与公共使用','特殊地形怎样构成公共活动研究的背景？',pose([0,.12,0],17,.65,1.03),['physical','roads'],'entity','2026-01 报道为开发计划，非已建成设施。目标为大王山坪塘矿坑；坐标未核实，不嵌入主地图。'),
 make('P-02','resources','地形高差与剖面','当前重建地形的高差与纵深关系如何？',pose([-1.2,.12,0],11,-.85,1.08),['physical','sections'],'reveal','5m 采样来自同一 quarryHeight；默认单幕，可切换 9 幕。幕底 −20m 仅图解，不表示水下地形。'),
 make('P-03','resources','岩壁与生态空间','模拟生态区域与岩壁地形有哪些结构关系？',pose([-2.9,.38,-2.5],5.2,.45,1),['physical','ecology'],'reveal','复用 V4.2 细枝叶实例化植被和地形贴合多边形；非实测植被或已实施修复。'),
 make('P-04','evidence','入口与道路联系','道路、入口和活动目标是否在图结构中相连？',pose([-2,.3,-1.2],13,-.6,.85),['physical','roads','routes'],'technical','全部入口与路径为未地理配准 DEMO。道路高度由当前地形采样；不能推断实际时间或合法通行。'),
 make('P-05','findings','坡度与活动叠加','哪些连续路段与当前坡度区间及生态区交叠？',pose([-1.5,.3,-1.1],11,-.6,.95),['physical','ecology','routes','slope'],'technical','每 2m 采样，计算地形贴合三维长度；坡度筛选不是安全标准。金色表示坡度交叠，紫色表示生态交叠。'),
 make('P-06','proposal','路径情景比较','路线调整会怎样改变长度、交叠和连接目标？',pose([-1.5,.3,-1.1],11,-.6,.95),['physical','ecology','routes','slope'],'technical','A 与 B 是不同的固定折点几何，同一算法和筛选区间计算，不预设 B 更优。',true),
 make('P-07','proposal','验证与设计机会','哪些空间线索值得带回现场继续核查？',pose([0,.12,0],16,.65,1.03),['physical','ecology','roads','routes'],'reveal','补充精确定位、测绘高程、岩土及生态调查、合法入口与活动记录。当前只是可复现的模型研究。'),
];
export const shotsFor=(site:Site)=>site==='ezhou'?E_SHOTS:P_SHOTS;
