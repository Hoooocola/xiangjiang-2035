> 2026-10-29 协作副本说明：下文保留首次审计记录；最新清理、历史映射与限制以 [安全协作版本](docs/SAFE_COLLABORATION.md) 为准。原始文件未获得新增版权授权，本副本按明确排除原则处理。

# 湘江 2035 · 将来的江来

面向湘江沿岸生态、文化与社会创新研究的空间地图。当前包含 Three.js 三维地图、六类空间信息、地点与研究资料关联，以及独立的数据库田野采集流程。地图展示与概念 Demo 不等同于实测或真实研究结论。

**Safe collaboration copy (2026-10-29):** Filtered history; original local archive is unchanged. See [migration and verification](docs/SAFE_COLLABORATION.md).

## 环境

- Node.js：本机验证版本 `24.14.0`；本项目采用的 Next.js 16.3.4 最低要求 Node.js 20.9。
- pnpm：`package.json` 声明 `11.19.0`，团队统一使用该版本与 `pnpm-lock.yaml`。本机现有 pnpm 为 11.25.0，最终验证版本见上传审计。
- PostgreSQL：仅研究平台持久化功能需要；推荐与现有项目约定一致的 PostgreSQL 16，并确保 `initdb`、`pg_ctl`、`psql`、`createdb` 在 PATH 中。
- Git。当前单个已版本化文件低于 50 MiB，无需 Git LFS；无需下载外部 GLB 模型。

如尚未安装 pnpm，可在安装 Node.js 后执行 `npm install -g pnpm@11.19.0`。不要使用 npm/yarn 重新生成另一份锁文件。

## 只运行三维地图

首次上传完成且仓库邀请已接受后：

```bash
git clone https://github.com/Hoooocola/xiangjiang-2035.git
cd xiangjiang-2035
# main 已在本地准备；首次上传后可用，不替换历史 master。
git switch main
pnpm install --frozen-lockfile
pnpm exec next dev --hostname 127.0.0.1 --port 3002
```

打开 http://127.0.0.1:3002/experience 。端口占用时换一个空闲端口。本机正在运行的项目使用 3002；普通 `pnpm dev` 默认使用 3000。

地图使用仓库内 `public/data/` 固定资产，不需要数据库、地图 Token 或用户个人 `.env.local`。首次安装依赖需要网络；正常地图渲染不在浏览器中实时下载 OSM 城市数据。

主要入口：

| 路径 | 用途 |
|---|---|
| `/experience` | 三维湘江、六类图层、空间解释与研究资料 |
| `/experience/sites/ezhou` | 鹅洲概念研究现场；不是扫描实测模型 |
| `/experience/style-frame` | 保留的色彩/材质研究预览 |
| `/experience/style-frame-v4` | 保留的 V4 风格帧与调色研究；不代表获批主版本 |
| `/create-research` | 真实数据库研究流程入口，需要以下开发环境 |

## 运行研究平台（开发模式）

地图静态目录与数据库记录是两套现存数据路径，不会自动同步。

```bash
cp .env.example .env.local
```

仅在本机开发环境，将 `.env.local` 中两项设为：

```dotenv
ALLOW_DEV_AUTH=true
ALLOW_DEMO_SEED=true
```

其余使用 `.env.example` 的本地配置：开发库 `xiangjiang2035_dev`、测试库 `xiangjiang2035_test`，端口 55432，示例开发身份 `student.owner@example.test`。

```bash
pnpm db:local:start
pnpm db:migrate
pnpm db:seed
pnpm exec next dev --hostname 127.0.0.1 --port 3002
# http://127.0.0.1:3002/create-research
```

`db:local:start` 在本地 `.data/postgres` 初始化开发数据库，采用 trust 认证；仅用于隔离的个人开发机，不能暴露到公网或团队生产网络。每位协作者运行自己的数据库，不共享该目录。停止数据库：`pnpm db:local:stop`。

开发图片保存在 `.data/uploads`，数据库记录受控的 `local-dev://` 引用。`.env.local`、数据库、上传图片和真实田野资料均不进 Git。

## 检查与构建

```bash
pnpm typecheck
pnpm lint
pnpm test
# 运行下面命令之前需启动本机测试库；不会回退到开发库
pnpm test:integration
pnpm build
pnpm exec next start --hostname 127.0.0.1 --port 3003
```

常规 `pnpm test` 跳过 26 项数据库集成测试。测试库必须由 `TEST_DATABASE_URL` 明确指定。已有 `db:verify:fresh` 脚本还依赖未版本化 `.audit/visual-reset/node-23793.png`，因此当前不作为新成员的可复现入口；本轮保留脚本、不修改功能，采用上面的独立命令验证。

生产构建可用于展示静态地图；**研究平台尚未接入生产认证和生产对象存储**。生产环境拒绝 Dev Auth、Demo Seed 和本地存储回退，不能据此文档直接上线真实田野资料服务。

## 资产与版本

正常开发直接使用已版本化的 `public/data/xiangjiang.geojson`、`terrain.json`、`context.json`、`environment.json`。`data/` 保存来源与清单；`scripts/prepare-*.mjs` 为准备脚本。重新下载、生成 GIS 或调整 AOI 需要负责人审核，不能作为“安装步骤”自动执行。

- 现有 `version1` 标签解析到提交 `cdcd8dd`，是历史归档，不是当前开发版本。
- V1.1 开发分支：`codex/spatial-information-v1-1`，验收提交 `beca2ed`。
- 协作准备分支：`codex/github-collaboration`。
- 历史 `master` 保持原提交；本地 `main` 已准备为集成基线，首次上传后承担审核后的集成版本。

代码未在本轮添加开源许可证；不要把数据的开放许可理解成全部代码、截图或素材可自由再发布。参见 [资产来源与共享状态](docs/ASSET_LICENSES.md)。

## 团队文档

- [所有 Codex 的项目规则](AGENTS.md)
- [项目定位](docs/PROJECT_VISION.md)
- [技术架构与模块](docs/ARCHITECTURE.md)
- [已确定的设计原则](docs/DESIGN_SYSTEM.md)
- [数据关系和字段](docs/DATA_SCHEMA.md)
- [分工、分支、PR 与邀请](docs/COLLABORATION.md)
- [首次上传审计与阻塞项](docs/GITHUB_UPLOAD_AUDIT.md)
- [Spatial Information V1.1 交付](docs/spatial-information-v1-1.md)
- [前版 README（历史记录）](docs/README-before-collaboration-2026-10-28.md)
