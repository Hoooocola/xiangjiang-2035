# V4.3 双场地研究叙事与空间推演

基线：V4.2 PR #18 / `4f3c8593986496407c0aaf2fb6395504ba68ef11`。本分支 `feature/place-research-story-v4-3` 独立叠加，不合并 main，不更新 Production。

## 入口与使用

- `/experience/research/story?site=ezhou`：五幕汛期与生活污水治理组织研究。
- `/experience/research/story?site=quarry`：七幕地形、生态与公共活动路径研究。
- `/experience` 的地点研究入口增加两条新研究链接；原 V4.1 研究、V4.2 样板、课程、资料与地图入口保留。
- 依赖及环境沿用根 README；`npm run build -- --webpack`，`npm run start -- -p 3025`。依赖未新增。
- 关闭侧栏仅隐藏 UI；退出引导取消后续自动步骤与当前运镜；重置回当前幕预设；返回湘江通过独立链接进入主地图。旋转、平移、缩放可中断运镜。
- 最后两幕提供保存、恢复、导出 JSON。保存只在本浏览器 localStorage，不写数据库；恢复校验参数并重新计算。

## 实现边界

复用 `src/visual-lab/engine.ts` 的 Renderer、CameraRig、环境、投影标签、模型释放，未复制另一套 Three.js 渲染器。V4.2 默认工厂与模式保持兼容。V4.3 工厂包装原 GLB / 地形 / 细枝叶森林，在一个活动场地上增加分析结构。

`src/place-research/story/shots.ts` 定义 Context → Resources → Evidence → Findings → Proposal。E-05/P-06 从上一幕进入时保持镜头，直接跳入时采用本幕预设。自由操作优先，标签投影避让侧栏与相互碰撞。大数字固定在场景留白区。

`SidePanelShell` 与研究主题、日夜切换直接复用。本轮没有 Liquid Glass 重构，没有调整主地图 AOI、颜色、地理数据或课程成果。

## 数据与计算

详见 [METHODS.md](METHODS.md)。原始 GIS、模型和既有 DEMO 文件不改写。新增：

| 文件 | 状态 | 用途 |
|---|---|---|
| `public/data/research/ezhou-relative-grid.json` | RECONSTRUCTED / DEMO | 原创模型 10m 低包络相对高度网格，含输入 SHA、零点和填补方法 |
| `public/data/research/ezhou-river-context.json` | REAL 平面几何 / RECONSTRUCTED 平面高度 | 从项目既有 OSM 湘江水面裁剪，仅局部研究按需加载 |
| `public/data/research/story-v43.json` | DEMO | 固定水位、候选设施、四种治理规则、两套路径几何及待核查条件 |

模型由用户本人原创，沿用 V4.2 已确认授权的公开衍生 GLB；本轮没有上传原始 OBJ、贴图目录或对标截图。原模型近景有重建碎片、简化与贴图局限，本轮不以更换模型或滤镜掩盖。

## 研究结果的解释

当前默认水位下几何连接 11/12 个 DEMO 代表点；不是 11/12 的真实居民得到处理保障。未连接点、受淹设施及道路交叠均保留，不修改数据追求全部通过。

治理方案没有最优排序。B 的外运不等于完成最终处理；C 不绘制向湘江排放管线；D 是公开规则的组合，不是优化求解。矿坑 B 更长，部分当前筛选指标较低，仍不能据此认定可实施或更优。

## 验证与回退

类型、lint、单测、生产构建、真实浏览器十二幕、参数变化与资源对照见 [VALIDATION.md](VALIDATION.md)。26 项数据库测试需独立 PostgreSQL 测试库，本轮无数据库修改，未将跳过写成通过。

回退按 PR 撤销本分支引入的 story 路由、入口链接与共享宿主的可选扩展；不移动归档标签、不重写历史。主地图、V4.1 和 V4.2 路由可继续独立使用。
