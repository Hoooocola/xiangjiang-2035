export const demo = {
  session: {
    id: "RS-2026-09-EZ",
    title: "2026 秋季鹅洲岸线使用补充调研",
    place: "鹅洲",
    gap: "生态保护与使用需求",
    records: 32,
    clusters: 4,
    insights: 2,
    opportunity: 1,
    proposal: 1,
  },
  history: {
    title: "2026 春季鹅洲综合调研",
    records: 87,
    clusters: 5,
    insights: 2,
  },
};

export const users = [
  { id: "u1", name: "霍堂祥", role: "Owner", org: "湖南大学" },
  { id: "u2", name: "张三", role: "研究成员", org: "湖南大学 HNU" },
  { id: "u3", name: "李四", role: "研究成员", org: "湖南大学 HNU" },
  { id: "u4", name: "王五", role: "研究成员", org: "湖南大学 HNU" },
];

export const gaps = [
  {
    id: "g1",
    number: "01",
    title: "生态保护与使用需求",
    summary: "岸线生态敏感性与居民、游客的高峰使用需求之间仍缺少可验证的平衡依据。",
    place: "北岸滨水带",
    evidence: "32 条相关 Field Records",
    missing: "缺少节假日高峰观察",
  },
  {
    id: "g2",
    number: "02",
    title: "岛内基础设施与环境治理",
    summary: "码头、公共设施和环境维护记录存在时间断层，尚不足以支持长期配置判断。",
    place: "码头与公共设施",
    evidence: "12 条设施记录 · 最近系统调研 2024",
    missing: "部分信息已过期",
  },
  {
    id: "g3",
    number: "03",
    title: "居民生活与旅游发展",
    summary: "居民日常生活与游客周末活动的交界仍缺少连续时段和不同人群样本。",
    place: "村落 / 游客活动交界",
    evidence: "18 条行为记录",
    missing: "缺少周末高峰样本",
  },
];

export const clusterCards = [
  "树荫下的长时间停留明显多于无遮荫岸段",
  "周末游客与居民在狭窄通道交汇",
  "临时座椅围绕江景视线自然形成",
  "儿童靠近浅滩活动，陪同者停留在树下",
  "居民聊天点与游客拍照点发生重叠",
  "正午后无树荫区几乎无人停留",
];

export const clusters = [
  { id: "c1", title: "居民日常活动", count: 21, x: 5, y: 9 },
  { id: "c2", title: "自发休憩与岸线共享", count: 18, x: 29, y: 15 },
  { id: "c3", title: "基础设施问题", count: 14, x: 57, y: 7 },
  { id: "c4", title: "生态岸线使用", count: 11, x: 70, y: 45 },
  { id: "c5", title: "游客行为", count: 9, x: 40, y: 55 },
];

export const proposals = [
  { id:"p1", title:"鹅洲岸线共享设计方案", place:"鹅洲", year:"2026", team:"2026 春季鹅洲综合调研 · 设计小组", image:"assets/images/asset-unavailable.svg", legacy:false },
  { id:"p2", title:"鹅洲生态监测步道", place:"鹅洲", year:"2025", team:"湖南大学乡建设计课", image:"assets/images/asset-unavailable.svg", legacy:false },
  { id:"p3", title:"乡野路径导视系统", place:"鹅洲", year:"2024", team:"湘江公共空间工作坊", image:"assets/images/asset-unavailable.svg", legacy:true },
  { id:"p4", title:"季节性生态廊道", place:"巴溪洲", year:"2026", team:"河流景观研究组", image:"assets/images/asset-unavailable.svg", legacy:false },
  { id:"p5", title:"可逆遮荫单元", place:"鹅洲", year:"2026", team:"2026 春季鹅洲综合调研 · 设计小组", image:"assets/images/asset-unavailable.svg", legacy:false },
  { id:"p6", title:"社区渡口更新", place:"兴马洲", year:"2023", team:"湘江2035 联合研究", image:"assets/images/asset-unavailable.svg", legacy:true },
  { id:"p7", title:"浅滩观察节点", place:"鹅洲", year:"2022", team:"公共空间研究室", image:"assets/images/asset-unavailable.svg", legacy:true },
  { id:"p8", title:"乡村慢行环线", place:"解放垸", year:"2025", team:"城乡规划课程", image:"assets/images/asset-unavailable.svg", legacy:false },
  { id:"p9", title:"岸线共享设施原型", place:"鹅洲", year:"2026", team:"岸线使用补充调研", image:"assets/images/asset-unavailable.svg", legacy:false },
];

export const researchSessions = [
  { year:"2026", title:"春季鹅洲综合调研", team:"湖南大学 · 乡建设计课程", method:"观察 / 访谈 / 影像", records:87, clusters:5, insights:2, source:"课程档案 / 田野数据库", featured:true },
  { year:"2025", title:"居民生活与游客行为调研", team:"湘江公共空间工作坊", method:"行为观察 / 半结构访谈", records:54, clusters:4, insights:3, source:"工作坊档案" },
  { year:"2024", title:"鹅洲生态环境观察", team:"河流景观研究组", method:"生态测量 / 文献", records:31, clusters:3, insights:2, source:"研究组档案" },
];

export const insightCopy = {
  title: "岸线休憩需求依赖自然条件，但高峰期缺少共享秩序",
  statement: "鹅洲北岸的停留活动并非由正式设施驱动，而是集中发生在同时具备树荫、江景和到达便利的位置。居民的日常交流与游客的短时休憩在周末高峰重叠，由于缺少清晰的停留和通行边界，产生空间冲突。",
  significance: "自然条件正在承担空间组织功能。任何介入都应优先保护树荫、江景与连续通行，并以轻量方式协调共享秩序。",
  limitations: "周末记录明显多于工作日；缺少夏季极端高温和雨季数据；老年居民访谈不足。",
};

export const opportunityCopy = {
  title: "如何在不削弱自然岸线体验的前提下，建立可共享、可适应高峰变化的休憩秩序？",
  framing: "以自然遮荫与江景视线为优先，通过可逆的微介入划分停留与通行边界。",
  values: ["自然岸线连续性", "居民日常使用权", "低维护与可逆性"],
  constraints: ["避免硬质大体量建设", "保留汛期变化空间", "兼顾周末高峰与工作日日常"],
};

export const fieldRecords = [
  { id:"fr1", title:"树荫下的长时间停留", type:"Observation", tags:["Behavior","Facility"], place:"鹅洲北岸", image:"assets/images/asset-unavailable.svg" },
  { id:"fr2", title:"周末通行与停留冲突", type:"Observation", tags:["Behavior","Spatial Issue"], place:"鹅洲北岸", image:"assets/images/asset-unavailable.svg" },
  { id:"fr3", title:"临时座椅朝向江景", type:"Photo / Video", tags:["Behavior","Opportunity"], place:"鹅洲北岸", image:"assets/images/asset-unavailable.svg" },
];
