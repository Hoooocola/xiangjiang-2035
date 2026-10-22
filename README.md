# 湘江生态文化与社会创新地图

## 湘江 2035 / 将来的江来 · 功能 Demo

本轮已完成鹅洲功能样板：地点详情、六类空间图层、按年份浏览研究、证据与问题关联、设计机会及 Today / 2035 概念情景。公开资料与演示内容逐条区分，目录为只读 TypeScript 数据，不读取私有团队记录。

- [功能演示操作指南](docs/functional-demo-guide.md)
- [完整功能状态与 Sprint 验收](docs/functional-demo-status.md)
- [本轮功能审计](docs/functional-audit.md)

默认首页进入 `/experience`：Three.js + 真实 OSM 湘江河道/洲岛/建筑占地，自定义镜头、沿江巡游、地点聚焦、全段概览及日夜主题。此页面无需数据库或地图 Token。

```bash
pnpm install
pnpm dev
# http://localhost:3000/experience
```

生产演示：`pnpm build` 后运行 `pnpm start --hostname 127.0.0.1 --port 3001`，访问 `http://127.0.0.1:3001/experience`。

- [完整交付与限制](docs/delivery.md)
- [参考研究](docs/reference-analysis.md) · [视觉对照](docs/visual-review.md)
- [地理来源、许可与坐标契约](docs/data-sources.md)
- 地理数据重新生成：`pnpm scene:prepare`，使用已保存在 `data/osm/` 的源数据。
- 旧版安全检查点：`legacy-before-3d`（`3bf2d3e`）；当前开发分支 `feat/xiangjiang-functional-demo`；本轮安全标签 `before-functional-demo-20261022`（`2fd7f95`）。
- 原研究平台仍位于 `/create-research`，以下为保留的数据库工作流。

## 原研究平台

M2 Research Vertical Slice：从 Research Session 进入手机田野采集，将 Field Record 与图片真实写入 PostgreSQL / Storage，再由桌面 Session Map 查询并打开 Record Detail。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- PostgreSQL 16
- Drizzle ORM + 可重复 Migration
- Zod API validation
- Leaflet + OpenStreetMap 基础底图
- 可替换 Storage Adapter（本地开发实现只存 `storageRef`）
- Vitest service / integration tests
- pnpm

原 Figma PNG 仍保留在 `public/assets`，但不会与新的真实数据库数据静默混合。

## 本地运行

```bash
pnpm install
pnpm db:local:start
pnpm db:migrate
pnpm db:seed
pnpm dev
```

访问 `http://localhost:3000/create-research`。创建并启动 Research Session 后，可进入 Session Map 与 390px Mobile Capture。

开发数据库由仓库内的 `.data/postgres` 承载并已加入 `.gitignore`。停止它：

```bash
pnpm db:local:stop
```

同一 PostgreSQL 实例会建立独立的 `xiangjiang2035_dev` 与 `xiangjiang2035_test` 数据库；集成测试强制要求 `TEST_DATABASE_URL`，不会回退到开发库。

## 环境与安全边界

复制 `.env.example` 为 `.env.local`。当前认证为显式开启的 `DEV ONLY` 适配层：

```text
ALLOW_DEV_AUTH=true
DEV_AUTH_USER_EMAIL=student.owner@example.test
```

生产环境会拒绝 Dev Auth。M1 没有实现 OAuth / SSO；上线前必须接入真实认证。

Demo Seed 同样必须显式开启：

```text
ALLOW_DEMO_SEED=true
```

生产环境禁止运行 Demo Seed，应用启动也不会自动写入任何示例数据。

图片在开发环境写入 `.data/uploads`，数据库只保存 `local-dev://…` 形式的受控引用，不保存本地绝对路径。Production Storage 尚未接入，属于 P1；生产环境会明确报错而不会偷偷退回本地文件系统。

## Migration 与测试

生成后续 Migration：

```bash
pnpm db:generate
pnpm db:migrate
```

基础检查：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
```

从全新临时 PostgreSQL 完成 Migration、Seed、真实数据库测试、生产构建和 HTTP API 验证：

```bash
pnpm db:verify:fresh
```

该命令只使用 `/tmp` 中的隔离数据库，结束后自动清理，不接触 development 或 production 数据库。

## M2 数据边界

真实数据库：

- User
- Team / Team Member
- Place
- Research Gap
- Research Session / Member / Source Gap
- Field Record / Field Record Media
- Session-scoped Record Count / Marker / Record Detail
- Audit Event

保留为 Legacy Mock，等待后续里程碑：

- KJ / Insight（M3）
- Design Opportunity / Proposal（M4）
- Historical Aggregation、GIS Workspace、Creator Canvas 与复杂权限 UI

鹅洲位置和底图上下文当前明确标记 `DEMO_UNCALIBRATED`；不得将其解释为已校准 GIS 数据。M2 不自动开始 M3。
