# GitHub 首次上传审计

日期：2026-10-28。状态：**本地准备完成；私有空仓库已创建；上传因素材共享许可待确认而暂停。**

## 仓库与账号

- GitHub：https://github.com/Hoooocola/xiangjiang-2035
- API 核验：visibility=PRIVATE、isEmpty=true、viewerPermission=ADMIN。
- 当前 gh 账号：Hoooocola；HTTPS；已登录。仅核对状态，没有显示或复制 Token。
- origin：https://github.com/Hoooocola/xiangjiang-2035.git
- 创建前未查到同名仓库；创建时没有 README 初始化，没有推送文件或提交。

## 本地版本保护

开始本轮前，已将上一任务 V1.1 验收成果提交为 `beca2ed`，保留在 `codex/spatial-information-v1-1`。新建 `codex/github-collaboration` 仅处理协作准备。历史 master、其他功能分支、6 个标签保持原值。

| 分支（上传前已有） | 起始提交 |
|---|---|
| master | 3bf2d3e |
| feat/xiangjiang-immersive | 2fd7f95 |
| feat/xiangjiang-functional-demo | 7579154 |
| feat/spatial-research-explorer | cdcd8dd |
| feature/experience-v2 | 8f137a5 |
| feature/experience-v2-1 | cdbbfbb |
| codex/spatial-information-v1-1 | beca2ed |

标签：`legacy-before-3d`、`before-context-rebuild`、`before-functional-demo-20261022`、`before-spatial-explorer-20261022`、`before-visual-system-rebuild`、`version1`。version1 是 annotated tag，标签对象 `ce93695`，解析到 `cdcd8dd`，不能把两者混淆。

本地全引用备份：`.local-backups/2026-10-28/pre-github-all-refs.bundle`，`git bundle verify` 通过；包含所有历史和本地工具检查点。只在本地保存，**不会向 GitHub 推送 refs/codex 或 HEAD 等工具引用**。

未跟踪资产：66 个、131,531,266 bytes，另行 tar.gz 归档并逐文件 SHA-256 验证。没有 reset --hard、clean、强推、删素材或改写旧提交。

## 密钥与配置检查

通过 `git rev-list --objects --all` 检查全部可达历史（包括旧分支/标签/工具引用）：保存协作文档与资产后共 681 个 blob，其中 428 个文本 blob 完成常见密钥格式检查，253 个二进制 blob 做类型/来源审查。检索常见 GitHub/OpenAI/AWS/Google/Slack/Stripe Token、私钥、JWT、带口令的 URL 和硬编码 secret/password 赋值；没有匹配项。未跟踪文本也没有匹配项。

`.env.local` 被忽略且没有进入 Git 历史；`.env.example` 仅含本机开发连接、开关、测试身份和空白占位 Token。未输出环境文件实际内容。扫描是模式检查，不声称数学意义上的“绝无任何秘密”；截图/PDF 的来源与共享权限按独立门槛处理。

`.gitignore` 改为排除所有 `.env.*`（保留 `.env.example`），补充私钥、HAR、本地数据库、备份和临时审计目录，保留必要源码和 GIS 数据。

## 大文件与版权

历史最大文件 7.55 MiB。之前未跟踪的可编辑 SVG 单个约 12.13 MiB，均低于 GitHub 单文件限制；不需要当前启用 LFS。本机没有 git-lfs，本轮不安装或购买。

开放 GIS 数据可以依相应许可保留来源和署名；详细依据见 ASSET_LICENSES.md。R1 对标截图、R2 原始设计图片、R3 分类 PDF 缺共享许可依据，已经在历史里，所以**暂停全部代码历史推送**。不能仅删当前文件再声称安全上传。

## 协作审核

已准备 AGENTS、模块边界、PR 模板、CODEOWNERS。账号套餐 API 未返回 plan；当前空仓库没有 main，尚未配置/验证强制 PR 审核。首次上传后、发出协作者写入邀请前需设置并测试；若需要付费升级必须交由用户决定。未发送邀请、未开通付费服务、未添加消耗 Actions 额度的工作流。

## 验证记录

- 上一产品验收：85 项通过，26 项数据库集成测试未运行；浏览器日/夜/窄屏验证完成，见 spatial-information-v1-1.md。
- 本轮不改产品源代码、UI、材质、研究数据或相机；仅保留上一任务成果后开始文档/安全准备。
- 隔离本地克隆 `codex/github-collaboration @ f8525c4`：没有个人 `.env.local`、没有原 node_modules；`pnpm install --frozen-lockfile` 成功（本机 Node 24.14.0 / pnpm 11.25.0）。离线安装首先因缓存未完整而失败，联网正常安装后成功；README 已说明首次安装需要网络。
- `pnpm typecheck` 通过；`pnpm lint` 无错误，旧 prototype-html/js/app.js 保留两条未使用变量警告；`pnpm test` 85 passed / 26 skipped；`pnpm build` 成功。
- 单独建立临时 PostgreSQL 16.15 的开发库和测试库，migration、显式 Demo seed 成功；`pnpm test:integration` 26/26 passed。合计常规与数据库测试 111 项通过。
- 清除该测试进程的数据库/开发身份环境后，生产 server 在临时 localhost 端口启动；`/experience`、`/experience/sites/ezhou`、`/experience/style-frame-v4` 与四份核心 GIS 数据均返回 HTTP 200。验证结束已停止临时应用和数据库；未触碰原开发数据库。
- `git diff beca2ed -- app src tests package.json pnpm-lock.yaml scripts data public` 无差异，确认新协作任务没有改产品功能。`git fsck --full --no-dangling` 通过；远端 `git ls-remote origin` 为空。
- 本地文档/资产提交 `f8525c4`；完成验证后另做记录提交，并从该版本建立本地 main 基线。main 尚未推送，远端默认分支和强制审核规则仍未配置。
- 远端代码、分支和标签：**尚未上传，不能验证完整性**。本地历史与 version1 完整。

## 后续完成条件

1. 用户提供 R1–R3 的团队共享依据并登记；若不能确认，继续暂停，不能违背保留历史要求擅自过滤文件。
2. 本地验证与 main 基线已准备；授权解决后普通推送所有明确保留的 heads 和 tags（不 force、不 mirror）。
3. 比较本地与远端所有 branch/tag SHA，检查 GitHub Private、默认分支与文件清单。
4. 配置并核验 main 的 PR 审核规则，确认无新增付费要求。
5. 得到同事 GitHub 用户名后按用户指示邀请；各自账号克隆、分支、PR 开发。
