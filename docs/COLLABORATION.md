# 2–3 人协作流程

2026-10-28。仓库 https://github.com/Hoooocola/xiangjiang-2035 ，Private。当前处于首次上传准备，历史资产授权未确认，空仓库还不能克隆出项目。首次上传状态以 GITHUB_UPLOAD_AUDIT.md 为准。

## 责任和功能分支

| 人员 | 主责 | 建议分支 |
|---|---|---|
| 负责人 Hoooocola | 地图核心、相机、三维渲染、AOI、最终集成 | `codex/map-<task>` / `codex/camera-<task>` |
| 同事 A（账号待提供） | UI/UX、目录、场景解释与界面动效 | `codex/ui-<task>` |
| 同事 B（账号待提供） | 图层内容、研究资料、地点与方案关系 | `codex/data-<task>` |

这是任务边界，不是允许绕过审核的权限。共享入口 `experience.tsx`、类型契约、空间投影与 overlays 变更由负责人协调；A 通过接口请求镜头动作，B 不直接改相机或材质。

## 主分支和归档

- `main`：已在本地从完成验证的版本准备为集成基线，尚未上传；不替换旧 master。
- `codex/spatial-information-v1-1`：现有主要产品开发分支，保留 `beca2ed` 验收版本。
- `codex/github-collaboration`：本轮文档、资产备份和上传准备分支。
- `master`、`feat/*`、`feature/*`：保留旧版本，不重写。
- `version1` 及其他已有标签不移动；新里程碑使用新名字。

GitHub 默认分支在首次推送后设置为 main。不要使用 `git push --mirror`，它会夹带本地工具检查点；只推送明确保留的 heads 和 tags。

## 每位同事如何开始

1. 使用自己的 GitHub 账号接受邀请，不共享负责人的 Token。
2. 使用自己的 Codex 账号；在自己的电脑克隆项目，打开这个目录并读取 AGENTS.md。不要共用一份正在编辑的工作目录或运行数据库。
3. 按 README 安装依赖、单独创建 `.env.local`；三维地图本身不需要 `.env`。GitHub 仓库权限与 Codex 账号是两回事：必须分别拥有相应访问权限。
4. 设置自己的 Git 提交姓名和已验证邮箱（可用 GitHub 提供的 noreply 地址），不要照抄负责人的身份。
5. 从已拉取的 main 创建自己的功能分支：

```bash
git fetch origin --tags
git switch main
git pull --ff-only
git switch -c codex/ui-example-task
pnpm install --frozen-lockfile
pnpm exec next dev --hostname 127.0.0.1 --port 3002
```

给 Codex 的任务应写清目标、允许修改目录、禁止改动、验收流程和当前分支。聊天并不自动共享：把决定、问题和测试证据写进 PR 或 docs。

## 提交与 Pull Request

```bash
git status
# 明确添加本任务文件，不盲目 git add .
git add path/to/changed-file
git diff --cached
pnpm typecheck
pnpm lint
pnpm test
git commit -m 'feat(ui): describe the concrete change'
git push -u origin codex/ui-example-task
gh pr create --base main --head codex/ui-example-task
```

使用仓库 PR 模板：说明问题、最终行为、模块边界、检查结果、素材来源、截图、风险和回退方法。大型视觉、地图、相机、AOI 或数据契约改变，先有负责人确认，再实施并提交 PR。不能把“测试通过”当作视觉或研究真实性审核通过。

同事的 PR 由 Hoooocola 审核；负责人自己的 PR 应请另一位成员审阅。不要在同一 PR 顺手改不相关模块。数据 PR 检查 ID/关联/来源/坐标，UI PR 检查昼夜/窄屏/可访问性，地图 PR 检查固定镜头和自由操作。

合并使用 merge commit 或经约定的 squash，禁止改写已发布历史。需要回退时提出 revert PR，不使用 force push。同步分支优先 `git fetch` 后在自己的分支 merge origin/main；遇到共享模块冲突，联系负责人，不用整文件覆盖解决。

## 主分支必须审核：配置与现实边界

`.github/CODEOWNERS` 已把所有文件的最终责任设置为 @Hoooocola；同事用户名尚未提供，不虚构账号。CODEOWNERS 本身不是禁止直接 push 的开关。

首次推送 main 后、邀请其他人写入前，应配置并验证服务器规则：

- main 要求 Pull Request；至少 1 位批准，要求 Code Owner 审核。
- 新提交使旧批准失效，讨论必须解决；不得 force push、不得删除 main。
- 如已建立免费额度内的 CI，再把真实运行成功的检查名设为 required；本轮未开通付费 CI 或添加消耗额度的工作流。
- 负责人也走 PR；不要长期使用管理员绕过规则。
- 旧 master 和归档分支保持只读约定；标签如版本保护功能可用，阻止更新与删除。

GitHub 官方说明：私有仓库的受保护分支需要支持该功能的计划（Pro/Team/Enterprise）。当前 API 未返回账号套餐名称，且仓库为空，**尚未启用或验证强制审核规则**。不能把本文件当成服务器端保护已生效的证据。若配置时提示升级，停止该步骤并由负责人决定，不能自行购买或改成 Public。

在强制审核未落实前，不向同事发放仓库写权限；可以先准备账号和任务，等待审核机制与资料授权一起明确。

官方说明：https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

## 邀请同事

授权清理与主分支保护完成后，负责人打开仓库 Settings → Collaborators（界面也可能称 Collaborators and teams）→ Add people，输入同事 GitHub 用户名，核对后邀请。接收者用自己的账号接受，再克隆私有仓库。未收到两位同事的用户名，本轮没有发送任何邀请。

不要把 `.env.local`、数据库、HAR、真实访谈图片或自己的 GitHub/Codex 凭据发到仓库。生产/团队私有数据共享应走单独授权渠道，不通过示例仓库。

## 首次推送的门槛

ASSET_LICENSES.md 中待确认项全部解决；检查历史而不只检查当前目录；本地 refs/bundle 与资产备份校验通过；同名远端无冲突；Private 已核实。之后正常推送 main、现有功能/归档分支及所有已有标签，并用远端 SHA 与本地逐项比对。任何冲突先停，不强制覆盖。
