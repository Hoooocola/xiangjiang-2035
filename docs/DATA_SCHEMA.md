# 数据关系与编辑契约

依据现有类型与注册器，2026-10-28。下面区分展示目录和数据库，不代表已实现自动同步。

## A. 宏观地点与场域

`src/places/types.ts` 的 XiangjiangSite：id、name、category、approximateLocation、geometry、spatialExtentStatus、importance、source、verified、displayPriority、notes。

场域分类为 island / waterfront / ecology / heritage / community / infrastructure，与信息图层六类不同。`registry.ts` 生成 MAP_PLACES；未核验且缺少坐标的地点进入 PENDING_PLACES，不编造坐标强行上图。

FocusArea 关联 siteId，具有 polygon/multipolygon、extentSource、verified、transitionWidth、visualIntensity；仅提供视觉权重。修改范围或重要性会改变地图，应负责人审核。

## B. 研究目录 AtlasRecord

来源 `src/atlas/types.ts`、`catalog.ts`。核心字段：

| 字段 | 含义 |
|---|---|
| id / kind / title | 稳定记录 ID、研究/证据/问题/洞察/机会/方案等类型、标题 |
| placeId / placeIds | 主地点与多地点关系 |
| year / author / themes | 时间、作者和主题；Demo 的 year 是编制年份 |
| summary / body | 简述与完整正文 |
| dataStatus / state | public 或 demo，以及可读状态说明 |
| sourceIds | 对应来源目录条目 |
| evidenceIds / relatedIds | 证据与相关记录关系 |
| objectIds | 对应空间对象 ID |
| gapType / proposalType / legacyId | 适用记录的分类或原型来源 |

RecordKind 包含 ResearchProject、ResearchSession、FieldRecord、ResearchGap、Insight、Issue、Conflict、DesignOpportunity、Proposal。部分属于静态/Legacy Demo，不代表数据库已有相应表。

## C. 地图对象 MapObject / InformationFeature

`MAP_OBJECTS` 由注册源对象与 Demo 标准化形成。

- id、title、shortDescription：稳定 ID、名称与可读解释。
- layer/category：geography、ecology、culture、society、economy、proposal。
- subtype：必须登记在 `information.ts`；避免计数存在却找不到目录项。
- placeId/placeIds/relatedPlaceIds、recordId、sourceIds：地点、记录与出处。
- geometry：Point、LineString、Polygon；可包含 paths、holes、polygons；Coordinate 为 `[longitude, latitude]`，Point 的 coordinates 仍使用一项数组。
- anchor、surface、form：标注锚点、贴合面（terrain/shore/park/road/model）、表达类型（point/line/area/object）。
- precision、sourceFeatureIds：精度说明、与源 GIS/模型对象绑定。
- dataStatus / sourceStatus / isMock：public/demo、public/mock、布尔标记统一对应；不能只修改其中一个来掩盖来源。
- relatedEvidenceIds、relatedProposalIds：标准化关联。
- metric（可选）：label、value、unit、scope，搭配 year；缺少证据时不填造值。

`registry.ts` 提供记录与对象双向查询和校验。层级可见性与方案选择经 `visibleObjects` 统一计算；一个对象可以服务多条资料，不要复制多个重复地点 Marker。

## D. 方案情景和研究现场

ProposalScenario：proposalId + baseline/intervention。只有当前方案的相关对象进入对应情景，不能全场叠加所有概念方案。

`src/spatial` 的鹅洲地点级研究现场是另一组概念资产/研究分层与镜头组织，与宏观 Atlas 通过地点关联；不得将概念 geometry 标成实测扫描模型。

## E. PostgreSQL 持久化

`src/db/schema.ts`：

- User → Team（owner）与 TeamMember。
- Place → ResearchSession（ownerTeamId、createdBy）和 ResearchGap。
- ResearchSession ↔ ResearchGap 经 researchSessionResearchGaps 关联；SessionMember 控制会话角色。
- ResearchSession → FieldRecord（authorId、位置状态、证据类型、敏感标记、可见范围）。
- FieldRecord → FieldRecordMedia（storageRef、上传状态、权限、MIME/大小）。
- AuditEvent 保存操作审计。

数据库使用 UUID；静态目录使用可读 ID，不能直接互换。研究数据可见范围包括 Private、SessionTeam、AuthorizedResearch、Unlisted、Public；界面状态不替代服务端授权。媒体文件不进数据库、不进 Git，数据库只存受控引用。

KJ / Insight、Design Opportunity / Proposal 等完整数据库流程尚未接入；生产认证和存储也未完成。

## 数据 PR 验收

稳定 ID 不随标题重命名；引用必须解析；来源与权限明确；几何闭合、坐标有限且符合 WGS84；新增子类能在目录选择；统计带单位/范围/时间；Demo 不包装成事实。执行目录、关系、几何与 overlay 测试，并浏览器验证选择和资料入口。涉及真实田野资料时先审核隐私和上传权限。
