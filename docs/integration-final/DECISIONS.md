# 第一轮最终集成决策与候选版本

负责人确认：课程成果保留独立URL `/experience?showcase=student-work` 与“关闭设计方案”；普通地图和既有图层继续使用。Hero准确采用“一条江 / 另一种未来”，下方完整名称为“湘江生态、文化与社会创新数字地图：基于D—E—C产品总值指标的设计平台”。

候选基于安全协作 main 3eae236，按PR4→课程分支→main临时组合→PR6顺序在独立副本整合。没有远程合并PR或推送main。Hero JSX仅采用PR6准确文案；CSS恢复短标题各断点，同时保留PR1课程标记hidden规则，没有覆盖课程协调代码。

增加 `mapIntegration` 为只读能力说明，不是第二套可见性状态：
- data-only：WorldCover分类栅格、GBIF样本已提供数据API，尚未接入三维新图层；
- unlocated：水质月报无核验坐标，不能生成点；
- existing-context：道路、公园已有场景上下文，不代表新增分析图层UI已实现。

来源dataStatus仍区分public和demo；课程方案保留“非实施项目”。研究线索仍是requires-field-verification，不自动成为因果结论。

## 验证

最终候选新增3项集成回归测试：准确Hero与正式名称、独立课程URL和关闭入口、真实数据准备状态。完整测试显式启用RUN_DB_TESTS=1，在独立PostgreSQL16临时库（127.0.0.1:55434）运行157项全部通过、零跳过。未使用原开发库，测试仅向临时库写入/清理fixture。

此前26项跳过源于RUN_DB_TESTS默认未启用，不是测试失败。数据库测试要求显式TEST_DATABASE_URL，禁止回退开发库。本次实际跑通session、权限、记录、媒体及模拟存储失败处理。

类型检查和webpack生产构建通过；lint零错误、2个原有prototype警告。浏览器检查包括课程13地点/4未绑定、双PDF、地点上下文、昼夜、镜头拖动中断/返回、窄屏，以及关闭课程后保留geography并隐藏课程专用标记。

## 发布门槛

GitHub仓库核实为Private，main尚未启用服务器保护。所有PR仍须负责人再次确认，不能把本候选合并提交当作远程PR已经合并。

旧Vercel项目在当前账号下不可访问（404），其自动生产部署设置未核实；不得因此推断它不存在Git连接。按负责人追加决定，在当前账号创建独立Preview项目，不连接Git，不更改旧站点，不使用--prod或promote。部署时只上传候选提交归档，不上传个人环境、数据库和未跟踪文件。Preview完成后按准确候选SHA复核；正式发布仍待单独确认。

PR6若吸收此候选，将暂时包含课程依赖提交；按#4→#1先合并后，#6差异会缩小。未核实旧项目自动部署前，远程分支推送保留为发布门槛，避免误触发原正式站点。

候选新增vercel.json：git.deploymentEnabled=false，按官方文档禁止Git推送触发自动部署；只使用明确target=preview的手动CLI部署。该门禁不改旧部署，不自动推广生产，恢复自动发布应另经负责人审核。https://vercel.com/docs/project-configuration/git-configuration
