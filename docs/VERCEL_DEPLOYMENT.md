# 湘江 2035 公共演示部署

- 日期：2026-10-29。
- 公共地址：https://xiangjiang-2035.vercel.app 。首页自动进入 `/experience`。
- 入口：图层 → 设计方案 → 浏览课程设计作品。
- 代码分支：`demo/student-work-showcase`；未合并 main。
- 实际部署提交：`ad30c0daf4bf31378bf148833fe545da3f3b5c85`。
- Vercel 项目：`xiangjiang-2035`，生产环境，状态 READY；来源为上述功能分支，未改 GitHub 默认分支。
- Node.js 24.x；pnpm 11.19.0；安装 `pnpm install --frozen-lockfile`；构建 `pnpm exec next build --webpack`。
- 无访问口令或 Vercel 登录要求；不购买域名、不添加付费存储、不上传本地环境文件。

## 未登录访问检查

首页、普通地图、兼容课程入口、四个地图数据文件及官方封面均返回 HTTP 200；橘子洲报告入口返回 302 到原始报告。公开浏览器正常加载三维场景（158242 栋建筑、42023 树），可从普通首页开启设计方案并进入橘子洲两件作品列表。

本次上线范围是三维地图、静态课程成果及外部报告。田野采集、保存与研究后台的数据库能力仍需另行配置数据库；本次未开通或购买数据库服务。

后续 GitHub 文档与截图提交不改变部署中的功能代码。重新发布功能修改时，使用同一 Vercel 项目，明确选择本功能分支或待审核提交，不以部署代替 main 合并审核。

[线上橘子洲双作品实际截图](screenshots/design-proposal-layer/public-vercel-course.png)。线上浏览器控制台及 Vercel 地图/报告路由运行错误检查为空。
