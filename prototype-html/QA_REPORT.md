# HTML PROTOTYPE QA REPORT

## A. Run Instructions

在项目根目录运行 `python3 -m http.server 4173 --directory prototype-html`，打开 `http://localhost:4173`。内部 QA 入口为 `http://localhost:4173/?qa=1`。

## B. Implemented Screens

已实现 HOME、Place Detail 及 Existing Research / Research Gaps / Field Records / Historical Proposals、Global Search、Global Archive、三类 Create Research 入口、Research Session Overview / Preparation / Records、桌面与移动端 Field Record、KJ Workspace、Insight Create / Published、Opportunity Create / Active、Proposal Start / Upload / Creator / Draft / Published、My Work、Contribution Review、QA Mode。

## C. Design System

以 `#30D1FF` 为唯一品牌强调，白色与极浅灰作为主背景；Typography、真实地图/证据图片、细分隔线和留白承担层级。Token、Button、Popover、Dialog、Tag、Action Rail 均已拆分为共享样式。

## D. Button Alignment Validation

`.btn` 统一使用 `inline-flex`、`align-items:center`、`justify-content:center`；Primary / Secondary / Tertiary / Icon 均通过 40px 基准高度验证。关键按钮文字与箭头垂直居中。

## E. Navigation / Back

Logo 返回 Home；全局导航和右上菜单一致。Proposal Detail 根据进入来源分别显示返回成果库、返回搜索结果、返回鹅洲方案档案或返回设计机会。浏览器返回与页面返回均保留筛选和查询状态。

## F. Global Create Research

全局入口先进入地图 Select Place；选择鹅洲并继续后进入 Place-prefilled Create Research。Place 与 Research Gap 入口分别继承 Place、Place + Gap 上下文。

## G. Preparation Interactions

实现方法多选 Popover、日期范围、仅注册用户成员搜索/添加/移除、鹅洲北岸 2.4 km 空间范围确认。仅当 6 个必填准备条件完成后启用“开始田野采集”。

## H. Field Record

桌面编辑器支持媒体、观察文本、Evidence Type 单选、Content Tag 多选及三种位置模式；移动端以 390 × 844 设备框模拟现场拍摄和保存。保存后回到 Session Records，1 条记录即可进入 KJ。

## I. KJ

初始 32 Records / 4 Clusters / 14 Unclustered；支持选择 3 张卡、创建 Cluster、重命名、移入/移除反馈，以及从 Cluster 进入 Insight。高密度卡片以代表卡与 +N 堆叠表达。

## J. Insight Human / AI

人工路径从空字段开始；AI 路径明确显示 `AI SUGGESTION · NOT CONFIRMED`，必须采用并编辑后才能发布。Published Insight 保留 Evidence、Researcher Confidence 与 AI Assistance 追溯信息。

## K. Opportunity Human / AI

继承 Place、Published Insight 与 Evidence 关系，研究者字段保持可编辑。AI 只提供 Framing 建议，不自动激活；人工确认后进入 Active Opportunity。

## L. Proposal Upload

支持 Demo PDF、PDF 第一页附件预览、标题、简介、Proposal Cover、附件角色、保存草稿与预览。Proposal Cover 与 Attachment Preview 分离。

## M. Proposal Creator

初始 0 Blocks；支持 Image、Full Width Image、Image Pair、Text、Text + Image、Section Title、Attachment、Spacer。已验证新增图像/文本、上下移动、删除、Caption 与预览。

## N. Archive Filter

成果库包含 9 个方案，覆盖地点、年份、来源和团队筛选；历史方案明确标记 Legacy。鹅洲筛选后进入 Proposal 再返回，筛选保持。

## O. Search

独立 Search Page 支持“鹅洲”查询及 All / Place / Research / Proposals Tab。进入 Proposal 后返回，查询与 Tab 状态保持。

## P. Reviewer

My Work 可切换 Student / Reviewer；Reviewer 的 Pending Contribution 进入 Review，显示 Research Session、公开投影与隐私处理，可纳入或填写理由后拒绝。

## Q. Tests 01–18

1. Logo → Home：PASS
2. Menu open / close：PASS
3. Home Create → Select 鹅洲 → Create：PASS
4. Preparation methods：PASS
5. Date range：PASS
6. Registered user：PASS
7. Research scope：PASS
8. Desktop Field Record complete / save：PASS
9. 1 Record → End Collection → KJ：PASS
10. KJ select 3 → create Cluster：PASS
11. Cluster → Insight human：PASS
12. Cluster → Insight AI：PASS
13. Insight → Opportunity human：PASS
14. Opportunity → Proposal Start → Upload：PASS
15. Opportunity → Proposal Start → Creator：PASS
16. Archive 鹅洲 filter → Proposal → Back：PASS
17. Search 鹅洲 → Proposal → Back：PASS
18. Reviewer → Pending → Include：PASS

## R. Known Limitations

- 静态本地原型，无数据库、权限、多人协作与真实持久化。
- 地图 Cluster / GIS / GPS 为静态交互模拟，不含真实地图算法。
- AI、相机与文件读取为 Demo 状态，不连接外部 API 或硬件权限。
- KJ 暂不实现自由拖拽、画布缩放引擎和复杂空间碰撞。
- Evidence 在地图中定位、覆盖缺口展开等次级交互以 Toast / Annotation 表达。

---

BUTTON TEXT CENTERING = PASS

GLOBAL NAV = PASS

MENU ANIMATION = PASS

CONTEXTUAL BACK = PASS

PREPARATION FORM = PASS

FIELD RECORD FORM = PASS

KJ INTERACTION = PASS

INSIGHT HUMAN / AI = PASS

OPPORTUNITY INPUT = PASS

PROPOSAL UPLOAD = PASS

PROPOSAL CREATOR = PASS

ARCHIVE FILTER STATE = PASS

SEARCH STATE = PASS

18 TASK TESTS = 18 / 18 PASS

PRODUCT QA READY = YES
