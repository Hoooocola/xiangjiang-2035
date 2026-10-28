# 学生作品列表 UI V3 · 实施与验收

2026-10-29；分支 `demo/student-work-showcase`。上一轮编辑式大图版本保留为提交 `15a789b`，V3 在此基础上只修改课程成果 UI。

## 最终行为

右侧为宽 360–430px 的地点作品索引，标题、数量和返回入口位于滚动区域外。每行统一使用小方形封面、作品标题、研究主题、组员和报告链接，数量为 1、2、3、5、10 时不切换结构。移除大图、左右轮播、下一件预览和轮播键盘行为。长标题最多三行，鼠标停留显示原名，键盘聚焦显示完整标题；可访问名称始终包含完整标题。

沿用 [Masar](https://www.masardestination.com.sa/en/experience) 的编辑式标题、细目录、局部渐变和弱动效原则。上一轮已实际观察地点、组成要素、步行通道及车行下穿章节；本轮据学生作品数量采用连续列表，不复制参考站素材。缩略图不加圆角卡片、厚边框或投影。Hover 只强调标题、链接和轻微亮度；支持减少动态效果。

封面仍为已核对的 Pinwall `profileImage`，360×360 原始方形图，contain 显示。封面、标题和 CTA 都在新标签页打开原有 PDF 解析路由；附件不可用时沿用原有项目页回退。没有修改 PDF 路由、正式作品记录、地点关系、研究主题、统计逻辑、地图配色、AOI 或相机核心。

切换地点仍调用现有 focus API，移动中隐藏旧列表；列表容器按地点 key 重建，新地点从顶部开始。关闭回到课程总览，并保留主题、搜索及目录展开状态。

## 修改范围

- `app/experience/student-work-showcase.tsx`：统一纵向列表、固定标题、完整名称访问与报告链接。
- `app/experience/student-work-showcase.module.css`：窄列、100–120px 方形封面、内部滚动、轻分隔、Hover、移动端适配。
- `app/experience/experience.tsx`：仅移除作品轮播所需的单条作品及 onSelect 参数，复用既有分组和定位。
- `tests/student-work-list.test.ts`：1/2/3/5/10 件作品的内容、链接与统一列表验证。
- `tests/fixtures/student-work-list.tsx`：独立容量测试组件，读取原数据的只读切片；混合地点并明确标为测试，不写回正式记录。

容量截图使用临时开发路由挂载上述 fixture；该路由验收后已移除，生产构建中不存在测试入口。正式数据中地点最多 3 件作品，5 和 10 件仅为独立 UI 容量测试。

## 浏览器验收

| 项目 | 实际结果 |
|---|---|
| 1440×900 橘子洲 | 两件同时完整显示；右列 430px，封面 110.16px，contain；无横向溢出；列表底部约 594px |
| 1920×1080 橘子洲 | 两件同时完整显示；右列 430px，封面 120px；无横向溢出；列表底部约 653px |
| 封面面积 | 相对用户给出的原 310×310：110px 为约 1/8，120px 为约 1/6.7 |
| 项目对应 | 66172 江岸接力及王子轩等四位成员；66179 栖亭及吴鑫恒等五位成员；两者主题均为湘江的生态文旅 |
| 打开报告 | 实际点击江岸接力报告，新标签页到达 Pinwall OSS 原报告，地图页保留选择 |
| 切换地点 | 橘子洲→油脂厂1936 后仅一行对应项目，封面仍为 120px，scrollTop=0，无旧地点内容 |
| 返回 | 生态文旅主题与“橘”搜索在打开、关闭列表后保留，目录继续展开 |
| 运动中断 | 停止镜头后 moving=false，当前地点列表可读 |
| 容量 fixture 1280×720 | 1/2/3/5/10 均为 100px 缩略图，无横向溢出；5 件 scrollHeight=699、clientHeight=265；10 件 scrollHeight=1402 |
| 滚动 | 5/10 件键盘 End 可达最后一项，标题固定，滚动条指示当前位置 |
| 390×844 窄屏 | 统一列表、88px 封面、无横向溢出；底部预留 180px，避开原地图操作区 |
| 退出课程模式 | 实际返回 `/experience`，显示正常探索入口 |
| 昼夜与日志 | 切换日间/夜间后列表与地图状态保留；生产预览控制台错误为空 |

## 实际截图

- [橘子洲双作品 1440](screenshots/student-showcase-v3/juzizhou-1440.png)
- [橘子洲双作品 1920](screenshots/student-showcase-v3/juzizhou-1920.png)
- [总览 1440](screenshots/student-showcase-v3/overview-1440.png)
- [总览 1920](screenshots/student-showcase-v3/overview-1920.png)
- [独立五作品测试顶部](screenshots/student-showcase-v3/fixture-five-top.png)
- [独立五作品测试底部](screenshots/student-showcase-v3/fixture-five-bottom.png)
- [独立十作品测试底部](screenshots/student-showcase-v3/fixture-ten-bottom.png)

## 验证与回退

- TypeScript `tsc --noEmit` 通过；相关文件 ESLint 通过。
- 生产 `next build --webpack` 通过，在隔离目录构建并启动生产预览。
- 完整 Vitest：106 通过，26 数据库测试按现有配置跳过；无需数据库迁移。
- `git diff --check` 通过。
- 回退本轮 UI 可撤销 V3 提交，上一轮封面与数据修正独立保留；不操作 main、不改写历史。

保留限制：Pinwall 封面原生为 360px；8 件原选址待核的作品仍不上图。独立 fixture 不增加任何正式地点关系。素材核对细节见 [封面记录](student-work-cover-audit-v2.md)。
