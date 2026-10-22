# 功能审计 · 2026-10-22

基线 2fd7f95；安全标签 before-functional-demo-20261022；开发分支 feat/xiangjiang-functional-demo。先读取代码并在运行中的 3001 /experience 实际打开地点菜单、鹅洲入口，确认旧面板只有简介和返回。

| 分类 | 功能与发现 | 可复用模块 |
|---|---|---|
| 已完整实现 | Three.js 场景、日夜、核心/全段/预设、拖动旋转缩放、可中断运动、地点聚焦返回、真实河岸小地图 | src/experience/{engine,camera,config,scene,minimap}.ts |
| 已完整实现（独立开发工作流） | 研究活动建立、团队关联、启动田野采集、记录/图片存储、记录详情与 Leaflet 分布 | app/create-research, app/sessions, app/records；src/server/services 与 repositories |
| 部分实现 | 6 个地点标记和简介；没有详情层级、标签、研究链接 | app/experience/experience.tsx；PLACES |
| 部分实现 | 数据库 Place、ResearchSession、FieldRecord、ResearchGap 已建；未接入三维体验 | src/db/schema.ts |
| 尚未实现 | 多类别图层与空间对象查询、地点研究时间轴、Issue/Conflict/Insight/Opportunity/Proposal/Scenario 浏览关联 | 新增独立轻量目录与地图叠加模块，避免新建无用表 |
| 只有视觉没有功能 | 未发现主导航假按钮；Layers 图标实际为镜头预设，不是数据图层 | 本轮新增真正的数据图层入口，保留原镜头预设 |
| 明显问题 | 鹅洲旧坐标 112.874,28.057 为未校准 seed，落在实际洲岛之外 | 不修改旧数据库数据；三维目录使用有出处的近似地点定位，并保留映射与精度说明 |
| 明显问题 | 全段沿岸日间地面色差不足；夜间窗户亮，但地面无明显受光层次 | materials.ts 地面 Shader 局部修正，不开启视觉重做 |
| 明显问题 | 平台/地图名称沿用旧语义 | 更新当前入口和元数据；历史文档留存 |

## 数据与 API 边界

既有 /places、/places/:id/research-gaps；/research-sessions、成员、启动采集、活动田野记录；/field-records、media 上传/读取/重试；/teams。数据库访问与权限、媒体权限保留原实现。Production 拒绝开发身份，不能把数据库内部团队研究直接作为公共展示绕过授权。

seed 只有开发示例鹅洲、研究缺口和 2026 秋季活动，并非实际研究成果。没有可直接公开导入的完整历届课程/方案库。本轮使用独立只读 TypeScript 目录：复用稳定的旧实体 ID 映射与示例活动语义，真实公开资料附原链接，演示对象逐条标记；不迁移或覆盖用户数据库，不伪造后台保存。

## Sprint 顺序

A：地点预览/详情、来源与精度、鹅洲基本档案；实际点选通过后进入 B。
B：六类开关、真实叠加/筛选、研究年份与证据/缺口关联。
C：Issue/Conflict → Opportunity → Proposal → Today/2035，构成鹅洲完整非强制路径。

## 小范围视觉自查结论

日间旧地面仅按重要度乘 0.87，重点/外围依旧同白；夜间只约 0.012 的地面自发光，主要是亮墙而非亮地块。改进：重点铺装采用独立暖灰中性色（外围继续冷白），夜间按地块局部照明形成暖光，不提升整个画面曝光。保持水、模型、相机与边界规则。
