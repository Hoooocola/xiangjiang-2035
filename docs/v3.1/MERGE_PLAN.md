# V3 系列安全合并方案

本轮开始的实际远程状态：

| 版本 | 提交 | 状态 |
|---|---|---|
| main | 3eae2363e2cfc0dc43886300c919ebc8dd588c83 | V3祖先，旧主版本 |
| 稳定PR #11 | 29a160c2cde6129ce0d152fd81847be7eb5aea85 | 原课程/视觉稳定基线 |
| V3 PR #14 | 51f5212997e35f82d4fc22a81b7474c63afaa29e | 本轮起点 |
| WorkBuddy PR #12 | f594f221679fbde0e7501ce5b4096b7cc8391b5c | 不合并 |
| WorkBuddy PR #13 | b5c82b2d216fc969476f8b7e8b04ae1674ced37a | 不合并 |

V3与main之间已有50个提交、203个文件差异，包含早前课程导入/媒体、V2.4–V2.7视觉及空间数据API等前置成果，不能把本轮小diff当成全部主分支差异。main→V3为祖先关系，没有必要以整文件覆盖或历史重写“同步”。

GitHub比较：PR12→V3为diverged，merge-base为main、behind1；PR13→V3也为diverged，merge-base为29a160c、behind4。两者头提交均不在V3祖先链中。旧共享数据API来自先前已集成成果，不等于继承其后续可视化。

## 执行门槛

1. 本轮继续原V3功能分支，完成代码、单测、构建和实际视觉/媒体/交互检查。
2. 推送后以确切head commit生成独立Preview；构建副本仅含跟踪的可共享文件、保留Vercel访问保护。不设置正式域名。
3. 将累计PR明确指向main（可将原PR #14重定向并重写标题/描述），显示所有必需前置变化；不能只cherry-pickV3.1而遗漏课程、原V3和引擎依赖。
4. 再读main和PR状态；若main已变，先按新主版本组合测试并解决冲突，不盲目合并。再次检查不含PR12/13头提交。
5. 通过普通merge commit保留历史。调用需带已验收head SHA，拒绝竞态；不使用管理员绕过、强推、移动版本标签或关闭无关PR。
6. 合并后核对main包含完整head及课程数据、部署与域名状态。如检查或外部审核未满足，准确报告未合并，不能冒称完成。

## 部署联动与审核现状

Vercel项目为当前账号 `huo2/xiangjiang-2035`，GitHub productionBranch为main，`autoAssignCustomDomains=false`。不能把后者单独当成“main推送一定不会建立Production部署”的保证。合并前必须确认Preview验收状态与联动；合并后检查实际部署，不手工promote未验证版本。

本轮开始main protection接口404、rulesets为空、PR14 review为空；因此没有已生效的服务器强制审核。文档约定不是保护规则。当前PR保持独立审核；如GitHub后续出现required review/check，必须满足，不能绕过。没有购买账号计划或付费服务。

本方案只允许与已测试V3.1同一累计版本进入主分支；如自动构建或验收出现问题，应停在Preview并报告，使用正常修复/回退PR处理，不覆盖历史。
