# V2.6 经负责人批准移除的模拟方案

回退基线：a858a18（V2.5）。只清理确认属于DEMO的运行时方案，不动数据库、真实课程、公开研究或Proposal类型契约。

移除legacy-p1至legacy-p9（原HTML原型9条虚构方案），以及proposal-care、demo-proposal、v11-record-slow-service、v11-record-public-touchpoint、v11-record-culture-guide。运行时legacy-proposals.json、legacy.ts及其补偿读取删除，相关地图对象与relatedProposalIds/relatedIds一并清理。

保留非Proposal的公开研究、证据、研究机会与明确标注的其他主题示例。原归档prototype-html不作为主地图的数据源；历史记录由Git保留，不改写历史。无正式数据库删除或迁移。

移除空间导读入口、专用上一节/下一节UI及React步骤状态，底层CameraRig、focusInformation、返回视角、focusState接口仍可复用。左上品牌副标改为XIANGJIANG-2035，Hero标题不变。
