# 湘江 2035 — Spatial Information V1.1 交付与验收

日期：2026-10-28。分支：`codex/spatial-information-v1-1`。
预览：http://127.0.0.1:3002/experience （本机现有开发服务使用 3002）。

## 1. 实际完成的功能

- 六大图层保留；目录调整为排版、细线、局部渐变组成的轻量导航。
- 默认说明保留类别、名称、简明介绍、来源状态与深入资料入口；来源细节折叠。
- 新增 15 个可选择、可聚焦、有资料关联的 Demo 对象，各非基础地理类别 3 个；为所有可点击对象补齐 shortDescription。
- 具体列表条目自动聚焦；一级分类展开和图层开关不主动移动相机；地图直接选择也不强制移动。
- 相机按几何范围避开两侧文字；文字在转场接近完成时进入，支持中断、快速替换、返回原视角。
- 修复旧 Demo 子类未登记导致的目录遗漏，以及旧方案条目选择时未激活方案状态的问题。
- 返回时同时恢复进入信息浏览前的地点、概览和方案状态，避免资料视图残留。
- 保留现有空间高亮、真实岸线、桥梁、地点档案、资料来源与自由操作。

本轮没有改动 `materials.ts`、`lighting.ts`、`scene.ts`、`config.ts`。未重建 AOI，未增加实时反射、点光源或新的后处理。仅在现有引擎中接入信息聚焦与就绪回调。

## 2. 新增 Demo 清单

下列 ID 均有 `v11-record-*` 对应资料，关联地点均为橘子洲。几何是概念定位，不是调查结果。

| 类别 | ID | 标题 | 空间表达 |
|---|---|---|---|
| 生态 | v11-vegetation | 滨岸植被观察示例 | 点 |
| 生态 | v11-ecological-link | 沿江生态连接路径示例 | 线 |
| 生态 | v11-habitat | 滨水生境观察区域示例 | 面 |
| 文化 | v11-life-history | 地方生活史 | 点 |
| 文化 | v11-daily-culture | 滨水日常文化活动 | 线 |
| 文化 | v11-spatial-memory | 历史空间记忆 | 面 |
| 社会 | v11-walking | 居民慢行活动路线示例 | 线 |
| 社会 | v11-space-use | 滨水公共空间使用观察 | 面 |
| 社会 | v11-service | 公共服务设施触点示例 | 点 |
| 经济 | v11-commerce | 沿江商业活动节点示例 | 点 |
| 经济 | v11-tourism | 滨水旅游服务分布示例 | 线 |
| 经济 | v11-operations | 公共空间运营指标模板 | 面，指标值留空 |
| 设计方案 | v11-slow-service | 滨江慢行服务系统概念 | 线 |
| 设计方案 | v11-public-touchpoint | 滨水公共服务触点设计 | 点 |
| 设计方案 | v11-culture-guide | 文化导览与信息服务概念 | 线 |

新增记录由结构化数据生成，并通过 InformationFeature 统一提供 category、subtype、shortDescription、geometryType、geometry、relatedPlaceIds、sourceStatus、isMock、relatedEvidenceIds、relatedProposalIds 等字段。当前完整目录为 51 个对象，其中 31 个 Demo（含之前已有的 16 个）。目录数量按当前范围和 Demo 开关计算，底部另示真正可见的对象数量。

## 3. 数据来源和 Mock 标记

- 几何参考：现有 `pilot-features.json` 中的 OSM 公园范围 `relation/16734077`；真实岸线继续沿用水域边界 `relation/8727387`。
- 新增面由洲岛真实轮廓截取；点和线由同纬度岛内两侧交点约束，不用脱离场地的任意矩形。
- sourceIds 包含 `demo-v11` 与 `osm`；OSM 只支持底图几何，不支持模拟叙述或统计结论。
- 页面统一显示 `DEMO DATA / 模拟研究资料`，详情明确“未实施调查”。默认关闭 Demo，开启后才加入演示对象。
- 2026 标为“示例编制”年份，不是调查年份；作者为“交互演示编辑（非调查团队）”。不填造受访者、真实商户、营收、客流、物种等。
- 已有公开来源文化资料仍保持公开来源身份，不被统一改为 Demo。

## 4. 文化简明介绍示例

“以橘子洲及周边滨水空间为线索，展示居民生活、地方记忆、日常活动与历史资料如何关联到具体位置。此处是文化资料组织演示，尚未导入访谈、老照片或真实历史事件记录。”

先解释信息的用途与空间联系，再提供来源与资料入口；真实历史事件、访谈和旧照片未被虚构。

## 5. UI 前后对照

下面两张为 1440 × 900、核心河段同一重置机位、同一橘子洲大桥选中对象。测试后画面的 Demo 开关开启；建筑窗灯属于原有动态场景，截图时间不同。直接在地图选择桥梁没有改变相机。

### 调整前

![调整前：双矩形面板](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/before-desktop-night.png)

### 调整后

![调整后：编辑式目录与场景解释](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/after-desktop-night.png)

### 联动样例

![文化点位夜间](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/culture-night.png)

![生态区域日间](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/ecology-day.png)

![生态区域夜间](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/ecology-night.png)

![岸线日间](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/shoreline-day.png)

![桥梁自动聚焦](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/bridge-night.png)

![窄屏文化说明](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/mobile-night.png)

![窄屏滚动后的资料入口](/Users/erich/Desktop/新毕设/docs/screenshots/information-v1-1/mobile-details-entry.png)

## 6. 左右信息设计规则

左侧：288px 目录；保留标题、范围、Demo 总开关；一级中文名称与英文标识，二级类别与数量，具体对象使用小菱形和类别色表达 Active。展开与显示是两个独立动作；支持内部滚动。没有数据的子类收进折叠区，避免伪造可点击空数据。

右侧：320px（中等宽度 280px），34px 主标题、14px 介绍；资料作者、年份、精度和来源按需展开。文字采用局部方向渐变衬底，无大矩形卡片、实色填充、边框或卡片阴影。滚动限制在内容内部，避免裁切渐变形成矩形。

状态：沿用六类语义颜色与现有昼夜文字变量。Hover 提示可点击；Active 结合颜色、菱形和箭头，不只依赖颜色；键盘焦点有轮廓。关键按钮保留 36–40px 点击高度。

窄屏：小于 1100px 选择对象后收起目录；小于 760px 说明位于底部，最多 35% 高度，正文可滚动、返回操作固定保留，地图目标构图预留上方空间。长文字的资料入口需要在说明内滚动，已实测可达。

## 7. 自动聚焦机制

统一入口 `focusSpatialInformation(featureId, {directoryOpen})`。基于现有 overlay 几何取得三维范围，经 `informationPose` 计算可用视口和目标姿态，再交给同一个 CameraRig。第一次进入信息聚焦保存镜头，之后连续选择更新终点而不覆盖返回镜头；React 同时保存地点、概览、自由探索和方案上下文。

`informationInsets` 与 UI 尺寸保持一致；用透视投影检查包围盒角点，额外留 14% 余量。点位的屏幕锚点与三维针尖位置同步，仍在现有逐帧投影链路中更新。

## 8. 四类构图

| 类型 | 规则 |
|---|---|
| Point | 点周围扩出上下文范围，保留约 56° 极角的倾斜观察；避免贴脸放大 |
| Line / Path | 按整条线的范围拟合；主方向只对当前航向作最多约 18° 的修正，保持方向连续 |
| Area | 拟合整个区域边界，采用更俯视的约 46° 极角，避免只看中心 |
| 3D Object | 使用真实生成几何的三维边界和高度，约 57° 极角，保留两岸上下文 |

角度均为当前相机约定中的 polar（相对竖直方向），不是地图俯仰角。不同屏幕使用相应安全区域；数值不是所有对象固定同一距离。

## 9. 转场和切换行为

距离和缩放变化共同决定约 950–2100ms 转场；沿用缓入缓出插值和最短角度。相机进度达到 72% 后，解释正文以 300–400ms 淡入与 8px 位移出现。关闭说明约 140ms 淡出。

连续点击：只保留最后一个转场；拖动：取消飞行并交给自由控制；隐藏当前对象所在图层或子类：停止相关聚焦并清除说明。返回原视角使用保存姿态，同时恢复进入前 UI 上下文。重置和巡游仍由现有控制器处理。减少动态效果偏好沿用现有媒体查询，跳过相机运动和文字动画。

## 10. 验收结果

真实浏览器：本机 IAB，1440×900 与 462×736，日/夜两种模式。结束时已恢复用户原窗口尺寸。不是用静态 HTML 代替场景验收。

| 验收 | 结果与证据 |
|---|---|
| A 文化 | 地方生活史列表点击自动飞行；动画中 ready=false，落位后 ready=true；文化短介绍、DEMO 与关联资料可见；详情有“示例编制 2026”；关闭详情再返回，place/record/objectIds 清空，返回小地图视野值与进入前完全相同 |
| B 地理 | 岸段 6 自动取景；水域边界贴合，锚点随镜头投影；来源可展开到 OSM 要素；桥梁按体量聚焦，跨江关系在画面中完整显示 |
| C 生态 | 生境观察区域在日夜两种模式完整入画，以面填充/边界而非点符号表现；DEMO 明确；关闭生态图层后对象与解释同步消失 |
| D UI | 同时展示左右目录与说明、开关来源、进入/退出资料、关说明、换图层、再选择均通过；同机位前后截图已保存；窄屏选择后收目录，正文滚动后资料入口可见 |
| E 相机 | 连续点击地方生活史→历史空间记忆→地方记忆索引，最终仅最后对象选中并稳定；飞往较远公开文化索引时拖动，moving 立即 false；返回、重置和图层关闭清理通过 |
| 兼容性 | 新方案路径和旧阅读提示触点均可选择；旧方案激活后返回，proposal 与 place 恢复为 null；经济指标模板可聚焦且没有虚构数值 |
| 不自动运镜 | 一级文化开关前后小地图视野字符串完全一致；直接地图选择桥梁前后镜头也完全一致 |
| 运行错误 | 本轮浏览器 error 日志为空 |

自动检查：`pnpm test` 为 **85 passed / 26 skipped**（18 个测试文件通过，2 个数据库集成文件跳过）。类型检查、修改代码的 ESLint 与 `git diff --check` 通过。新增测试覆盖 Demo 数据完整性、源几何约束、四类构图在桌面/中屏/窄屏安全区内、角度/时长范围、快速替换和减少动态效果。

减少动态效果由单元测试与媒体查询代码验证，未更改用户系统设置进行实机复测。未执行数据库集成测试或生产构建。本轮没有新增依赖。

## 11. 修改文件

- `app/experience/experience.tsx`：列表选择、相机就绪、资料/方案上下文恢复、Demo 和图层联动。
- `app/experience/layer-panel.tsx`：轻量目录与真实计数。
- `app/experience/focus-label.tsx`：简明解释、渐进资料、进入/退出动效。
- `app/experience/information.module.css`：昼夜、桌面、窄屏排版和衬底。
- `app/experience/place-detail.tsx`：Demo 年份明确为示例编制。
- `src/atlas/demo-information-v11.ts`：15 个 Demo 与关联资料。
- `src/atlas/types.ts`、`objects.ts`：统一信息对象字段和所有短介绍。
- `src/atlas/catalog.ts`、`places.ts`、`information.ts`：记录、来源、子类注册。
- `src/experience/information-framing.ts`：按几何与安全区域计算相机。
- `src/experience/engine.ts`、`overlays.ts`：聚焦接口、文字时序、锚点定义。
- `tests/information-v11.test.ts`、`information-framing.test.ts`：新增验证。
- `tests/information-system.test.ts`、`experience-v21.test.ts`、`spatial-projection.test.ts`：更新目录计数与公开数据测试选择。
- 本交付文档与 `docs/screenshots/information-v1-1/`：实际截图和验收记录。

## 12. Git 记录

| 阶段 | Commit | 内容 |
|---|---|---|
| 0 | a9ffc5b | 保护原有空间信息实现与视觉研究的安全检查点 |
| 1 | e14bf1d | 15 个 Demo、来源关联与简明介绍 |
| 2 | 80789a0 | 按几何类型自动聚焦与视口构图 |
| 3 | e1aa461 | 目录与解释 UI 重排 |
| 4 | 2a92bd1 | 文字与镜头时序、退出和减少动态效果 |
| 5 | 本文档所在提交 | 浏览器验收、返回状态修复、测试更新与截图 |

Stage 0 之前已有未提交工作，以检查点整体保护。原有 `.audit/`、其他阶段截图与 `exports/` 未纳入本轮提交，也未删除。没有推送或发布远程版本。

## 13. 已知限制与后续资料需求

- 新增 15 项都是概念示例，集中在已有真实几何较完整的橘子洲；不能作为全河段调研覆盖或真实业务数据。
- 完整湿地、土地利用、交通网络等仍缺资料；保留明确的折叠说明，不用空对象凑数。
- 已有早期 Demo 区域保留原几何，本轮新增区域采用洲岛轮廓。旧示例中的概念范围不能解释为真实生态边界。
- 长介绍在窄屏说明内滚动；桌面长目录也需要滚动，没有一次性展开全部分类。
- 现有场景窗灯/后处理仍会随原有逻辑变化；前后截图不用于证明美术调色差异。本轮 Git 对照确认材质、光照、场景与 AOI 配置未变。
- 本机浏览器测试不是跨 GPU 性能基准；帧率会随窗口大小和场景负载变化，没有承诺统一帧率。
