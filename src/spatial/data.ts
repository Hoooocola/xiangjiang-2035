import type {Site,ResearchRecord,SpatialAnnotation,GuidedStory} from './types';
import type {CameraPose} from '../experience/config';
export const SITE:Site={id:'ezhou-prototype',placeId:'ezhou',name:'鹅洲 · 概念研究现场',englishName:'Ezhou Prototype Research Site',description:'滨水通行与公共空间可达性 · 假设研究情景。场景和研究资料均为原型演示，不代表鹅洲任何真实码头或建筑。',asset:{id:'ezhou-procedural-v1',siteId:'ezhou-prototype',assetType:'procedural',source:'本项目程序化几何 · 原型验证',isMock:true,originalCRS:null,coordinateSystem:'local-y-up-metres',modelTransform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]}},georeferencing:{status:'unregistered',gisAnchor:null,note:'仅通过 placeId 关联鹅洲；局部坐标未地理配准，不推定具体扫描场址。'}};
export const SITE_HOME:CameraPose={target:[0,2,0],distance:89,azimuth:-.58,polar:.82};
export const SITE_LIMITS={minDistance:16,maxDistance:135,minPolar:.23,maxPolar:1.32};
const base={siteId:SITE.id,sourceType:'mock' as const,source:'Fictional Research Scenario / Demo Only · 原型编辑',timeLabel:'演示时序 T0 · 非实际采集日期',status:'概念示例 · 未经现场验证',annotationIds:[],relatedIds:[],evidenceIds:[],researchId:'EZ-PROTOTYPE-01'};
export const RECORDS:ResearchRecord[]=[
 {...base,id:'C001',kind:'Context',layer:'context',theme:'society',title:'河岸与上下岸设施',summary:'台阶、沿岸道路和公共空间组成一处概念性测试环境。',body:['模型为程序化搭建；台阶和道路并非真实鹅洲设施。','可点选场景中的设施、公共空间与建筑，也可旋转观察路径的衔接。'],annotationIds:['A-C001'],relatedIds:['R003','E003']},
 {...base,id:'C002',kind:'Context',layer:'context',theme:'society',title:'公共活动空间',summary:'提供停留、集合与观察的模拟公共空间。',body:['这里的尺寸、家具和活动安排只为测试空间信息组织，没有对应真实地址。'],annotationIds:['A-C002'],relatedIds:['R002','R001']},
 {...base,id:'C003',kind:'Context',layer:'context',theme:'culture',title:'社区用房与遮阴廊架',summary:'简化建筑与休息设施构成沿岸的空间参照。',body:['不指定真实建筑名称、产权、使用者或历史。文化主题暂未编入专门研究资料。'],annotationIds:['A-C003'],relatedIds:['G001']},
 {...base,id:'R001',kind:'Resource',resourceType:'Society',layer:'resources',theme:'society',title:'模拟居民活动路径',summary:'从社区道路经过公共空间，抵达上下岸设施的概念路径。',body:['线位由设计者编排，不是 GPS 轨迹，也不是实际居民出行统计。','可以和设施信息同时加入叠加比较，观察衔接位置。'],annotationIds:['A-R001'],evidenceIds:['E001','E002'],relatedIds:['R003','I001']},
 {...base,id:'R002',kind:'Resource',resourceType:'Society',layer:'resources',theme:'society',title:'模拟滨水公共空间',summary:'用区域表达停留与集合空间，避免所有资源都变成热点。',body:['半透明面仅表示概念活动范围，无管理边界含义。'],annotationIds:['A-R002'],evidenceIds:['E001'],relatedIds:['R001','IN001']},
 {...base,id:'R003',kind:'Resource',resourceType:'Society',layer:'resources',theme:'society',title:'模拟上下岸设施',summary:'用对象轮廓突出高差与连接方式。',body:['选择设施可以查看模拟观察和照片条目。','本原型不评价真实设施的安全性或无障碍合规性。'],annotationIds:['A-R003'],evidenceIds:['E001','E003'],relatedIds:['R001','I001']},
 {...base,id:'R004',kind:'Resource',resourceType:'Ecology',layer:'resources',theme:'ecology',title:'河岸植被缓冲区',summary:'以区域显示概念性植被带，与活动线路叠加观察。',body:['不是生态红线、生境普查或物种分布图。'],annotationIds:['A-R004'],relatedIds:['F001','G001']},
 {...base,id:'E001',kind:'Evidence',evidenceType:'Field Observation',layer:'evidence',theme:'field',title:'E001 · 模拟现场观察',summary:'假设观察：从公共空间到岸边时，路径在台阶处发生高差变化。',body:['这是一条虚构的观察内容，用于验证证据与空间的对应关系。没有实际观察者、受访者或采集日期。','观察描述与“通行障碍”的判断分开保存；后者属于待验证解释。'],annotationIds:['A-E001'],findingIds:['I001','IN001'],relatedIds:['R003','I001','IN001']},
 {...base,id:'E002',kind:'Evidence',evidenceType:'Field Observation',layer:'evidence',theme:'field',title:'E002 · 模拟活动路线',summary:'假设活动轨迹从社区道路经过公共空间，在台阶上端汇合。',body:['不是实际居民轨迹，不代表出行频率或人群偏好。','该证据以路径关联到空间，可与 E001 对照观察。'],annotationIds:['A-E002'],findingIds:['I001','IN001'],relatedIds:['R001','I001','IN001']},
 {...base,id:'E003',kind:'Evidence',evidenceType:'Photograph',layer:'evidence',theme:'field',title:'E003 · 模拟设施照片条目',summary:'照片条目用于测试设施定位与证据详情。本版未提供真实现场照片。',body:['影像状态：无现场照片。以可旋转的概念模型观察设施，不能把模型截图当成田野摄影。','未来可替换 media.url、拍摄来源和时间，而无需改写研究关联。'],annotationIds:['A-E003'],findingIds:['I001'],relatedIds:['R003','I001']},
 {...base,id:'I001',kind:'Issue',layer:'findings',theme:'society',title:'I001 · 假设性的滨水通行障碍',summary:'示例研究者提出：台阶处的高差是否打断了连续的滨水通行体验？',interpretation:'E001 描述高差，E002 关联活动路径，E003 预留设施影像。这些演示条目支持提出问题，不能证明鹅洲实际存在障碍。',body:['这是人工编排的假设问题。尚未进行现场测绘、不同使用者访谈或通行测试。'],annotationIds:['A-I001'],evidenceIds:['E001','E002','E003'],relatedIds:['IN001','G001','O001']},
 {...base,id:'IN001',kind:'Insight',layer:'findings',theme:'society',title:'IN001 · 连接体验比单个设施更值得观察',summary:'概念性洞察：将到达、停留、上下岸看作连续体验，而非只观察台阶。',interpretation:'由两条模拟观察提出的一种解释；需要使用者参与和更多证据才能成立。',body:['不自动从路径重叠生成结论，也不把洞察当成已经证实的问题。'],annotationIds:['A-IN001'],evidenceIds:['E001','E002'],relatedIds:['I001','O001']},
 {...base,id:'G001',kind:'ResearchGap',gapType:'Knowledge Gap',layer:'findings',theme:'field',title:'G001 · 缺少不同使用者的通行证据',summary:'原型目录尚无访谈、实测高差、季节水位和辅助出行需求资料。',interpretation:'这是当前数据集的知识缺口，并不等于真实鹅洲从未被研究。',body:['不根据场景上缺少 Marker 推断真实研究空白。'],annotationIds:['A-G001'],evidenceIds:['E001','E003'],relatedIds:['I001']},
 {...base,id:'F001',kind:'Conflict',layer:'findings',theme:'ecology',title:'F001 · 活动与植被关照的待检验关系',summary:'活动路径与植被相邻，是否需要调整使用引导？',interpretation:'邻近或重叠不等于真实冲突。本条仅展示一种待检验关系。',body:['没有物种调查或活动强度证据，不作生态损害判断。'],annotationIds:['A-F001'],evidenceIds:['E002'],relatedIds:['R004','G001']},
 {...base,id:'O001',kind:'DesignOpportunity',layer:'proposal',theme:'society',title:'O001 · 连续的滨水连接体验',summary:'把社区道路、公共空间与岸线之间的连接作为服务设计机会。',findingIds:['I001','IN001'],directions:['到达说明与路径信息','需要帮助时的服务联络','可逆的连接设施原型'],body:['先验证不同使用者需求，再讨论设施尺度、许可与运营方式。机会不等于已批准建设。'],annotationIds:['A-O001'],evidenceIds:['E001','E002'],relatedIds:['I001','IN001','P001']},
 {...base,id:'P001',kind:'Proposal',layer:'proposal',theme:'society',proposalType:'Product-Service System',opportunityIds:['O001'],title:'P001 · 滨水通行服务与设施',summary:'以连接示意、服务触点和停留信息构成可撤除的概念系统。',body:['到达：说明路线和可获得的协助。连接：测试临时设施与服务衔接。反馈：记录体验并安排复核。','模型内的紫色连接设施仅为体量原型，未计算坡度合规、洪水影响、承载或施工条件。','“方案情景”用于比较设计介入，不表示鹅洲现状或未来预测。'],annotationIds:['A-P001','A-P002','A-P003'],evidenceIds:['E001','E002','E003'],relatedIds:['O001','I001']},
];
export const ANNOTATIONS:SpatialAnnotation[]=[
 {id:'A-C001',recordId:'C001',layer:'context',form:'object',anchor:[-9,3,0],objectIds:['landing']},
 {id:'A-C002',recordId:'C002',layer:'context',form:'object',anchor:[0,2.85,15],objectIds:['plaza']},
 {id:'A-C003',recordId:'C003',layer:'context',form:'object',anchor:[20,9,15],objectIds:['house']},
 {id:'A-R001',recordId:'R001',layer:'resources',form:'path',anchor:[5,3,8],points:[[16,2.72,26],[12,2.72,17],[3,2.72,15],[-4,2.72,8],[-7,2.72,0]]},
 {id:'A-R002',recordId:'R002',layer:'resources',form:'area',anchor:[-1,2.6,18],points:[[-6,2.57,9],[7,2.57,9],[7,2.57,23],[-6,2.57,23]]},
 {id:'A-R003',recordId:'R003',layer:'resources',form:'object',anchor:[-9,3,0],objectIds:['landing']},
 {id:'A-R004',recordId:'R004',layer:'resources',form:'area',anchor:[-3,2.8,-18],points:[[-10,2.57,-29],[1,2.57,-29],[1,2.57,-10],[-10,2.57,-10]]},
 {id:'A-E001',recordId:'E001',layer:'evidence',form:'point',anchor:[-6,3.4,2]},
 {id:'A-E002',recordId:'E002',layer:'evidence',form:'path',anchor:[5,2.95,15],points:[[14,2.85,25],[11,2.85,17],[1,2.85,14],[-5,2.85,6],[-7,2.85,1]]},
 {id:'A-E003',recordId:'E003',layer:'evidence',form:'point',anchor:[-12,.5,-4]},
 {id:'A-I001',recordId:'I001',layer:'findings',form:'object',anchor:[-8,4,0],objectIds:['landing','plaza']},
 {id:'A-IN001',recordId:'IN001',layer:'findings',form:'path',anchor:[4,3.3,18],points:[[14,2.95,25],[1,2.95,15],[-8,2.95,0]]},
 {id:'A-G001',recordId:'G001',layer:'findings',form:'point',anchor:[-3,3,6]},
 {id:'A-F001',recordId:'F001',layer:'findings',form:'area',anchor:[-5,3,-10],points:[[-9,2.85,-14],[3,2.85,-14],[3,2.85,2],[-9,2.85,2]]},
 {id:'A-O001',recordId:'O001',layer:'proposal',form:'path',anchor:[1,3,9],points:[[12,2.8,20],[0,2.8,14],[-7,2.8,0]]},
 {id:'A-P001',recordId:'P001',layer:'proposal',form:'object',anchor:[-13,2.85,7],objectIds:['proposal-link'],futureOnly:true},
 {id:'A-P002',recordId:'P001',layer:'proposal',form:'point',anchor:[6,4,20],objectIds:['proposal-node'],futureOnly:true},
 {id:'A-P003',recordId:'P001',layer:'proposal',form:'path',anchor:[-3,3,11],points:[[12,2.6,24],[6,2.6,20],[-6,2.6,12],[-13,1,7]],futureOnly:true},
];
export const STORY:GuidedStory={id:'waterfront-access',siteId:SITE.id,title:'从一次到达，理解滨水连接',steps:[
 {id:'observe',verb:'Observe',title:'先观察空间',description:'认识道路、公共空间与上下岸设施的位置。这里是一处概念现场，没有真实扫描或已确认场址。',camera:SITE_HOME,layers:['context'],selectedId:null,highlightIds:[],proposalVisible:false},
 {id:'resources',verb:'Resources',title:'两种资源，怎样相接',description:'活动路径与设施同时可见。先观察连接关系，空间邻近本身不构成问题结论。',camera:{target:[-1,2,8],distance:56,azimuth:-.7,polar:.82},layers:['context','resources'],selectedId:'R001',highlightIds:['R001','R003'],proposalVisible:false},
 {id:'evidence',verb:'Evidence',title:'把描述放回现场',description:'选择 E001 与 E002，区分模拟观察内容与研究者的解释。E003 尚无真实现场影像。',camera:{target:[-6,2,3],distance:38,azimuth:-.9,polar:1.03},layers:['context','evidence'],selectedId:'E001',highlightIds:['E001','E002','E003'],proposalVisible:false},
 {id:'findings',verb:'Findings',title:'理解一种待验证解释',description:'I001 由三条示例证据关联提出。逐条查看依据，也可以不接受这个解释，返回空间继续观察。',camera:{target:[-4,2,6],distance:48,azimuth:.18,polar:.82},layers:['context','evidence','findings'],selectedId:'I001',highlightIds:['I001','E001','E002','E003'],proposalVisible:false},
 {id:'proposal',verb:'Proposal',title:'从设计机会到介入',description:'O001 关联问题与洞察，P001 用连接设施与服务触点表达机会。切换场景比较介入前后；概念不代表建设承诺。',camera:{target:[-3,2,8],distance:58,azimuth:-.62,polar:.72},layers:['context','proposal'],selectedId:'P001',highlightIds:['P001','O001'],proposalVisible:true},
]};
export const recordById=(id:string|null)=>RECORDS.find(r=>r.id===id);
