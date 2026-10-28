# 资产来源、许可与上传门槛

检查日期：2026-10-28。此记录用于工程上传决策，不将“私有”当作第三方共享许可。项目整体未增加开源许可证。

## 有开放来源记录的数据

| 文件/来源 | 依据与条件 | 当前判断 |
|---|---|---|
| `data/osm/`、`public/data/xiangjiang.geojson`、OSM 派生 pilot | © OpenStreetMap contributors，ODbL 1.0；保留署名、许可链接和派生数据库义务 | 可按许可共享；不把许可套用到应用代码 |
| `public/data/context.json` | Overture buildings，清单 `data/context/manifest.json`；ODbL 1.0，包含 OSM 与 Qian Shi 等东亚建筑数据 | 保留 Overture/OSM 和上游署名；简化体量非真实建筑精模 |
| `public/data/environment.json` | Overture base/transportation 与 ESA WorldCover；清单 `environment-manifest.json` | ODbL / CC BY 4.0，保留清单与上游署名 |
| `public/data/terrain.json` | Mapzen Terrain Tiles，本地来源清单标为 SRTM/GMTED2010、USGS | 保留来源与修改说明；不能将全球所有 terrain tiles 一概称作同一许可 |
| Three.js、Lucide 等依赖 | 包管理依赖及各自许可证（Three.js MIT、Lucide ISC） | 依赖不复制入库，保留锁文件；发布时遵守各依赖许可 |
| 本项目程序生成模型、窗口、树木及自己的地图截图/SVG | 本地代码与 GIS 派生输出 | 沿用 GIS 署名与精度说明；不宣称实测 |

补充上游署名：Qian Shi 等，*A First High-quality Vector Data of Buildings in East Asian Countries Based on a Comprehensive Large-scale Mapping Framework*，Zenodo，2023-07-22，doi:10.5281/zenodo.8174931，CC BY 4.0。当前转换把建筑足迹简化为带方向的体量，缺失高度作示意，见本地 manifest。

环境数据保留：© ESA WorldCover 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium。本地清单记载 2021；官方页面也区分 2020/2021，不把数据年份写成下载年份。

已核对的官方页面：

- https://www.openstreetmap.org/copyright
- https://opendatacommons.org/licenses/odbl/1-0/
- https://docs.overturemaps.org/attribution/
- https://esa-worldcover.org/en/data-access
- https://registry.opendata.aws/terrain-tiles/
- https://github.com/tilezen/joerd/blob/master/docs/attribution.md

## 仍待确认，阻止完整历史上传

| 编号 | 文件范围 | 已有证据 | 缺少什么 |
|---|---|---|---|
| R1 | `docs/screenshots/reference/`、`docs/screenshots/audit-2026-10-22/*reference*`、`docs/screenshots/rebuild-2026-10-22/reference-minimap.png`、`docs/screenshots/spatial-explorer-2026-10-22/01-reference.jpg` | Masar/Immersive 站点对标截图；旧文档明确仅内部研究、不推定再发布许可 | 上传 GitHub 私有仓库并向协作者共享的依据/授权范围 |
| R2 | `public/assets/`、`design-assets/demo-images/`、`prototype-html/assets/images/` | 初始项目已有的 Figma/原型/方案图片；可能来自自有设计或生成素材，但目录没有完整来源登记 | 项目拥有或获准共享的说明；如含第三方照片/底图，需标明具体来源和范围 |
| R3 | `docs/references/xiangjiang-site-classification.pdf` | 用户提供的地点分类参考；已被用于场域整理 | 作者/权利归属及团队共享许可 |
| R4 | 本地 `.audit/visual-reset/` | 初始未跟踪视觉研究文件，部分文件名对应原设计节点 | 本轮仅本地归档，不新增上传；若未来纳入仓库需同 R2 审核 |

R1–R3 已存在于 Git 历史。现在删除当前文件或追加 .gitignore 都不能阻止历史上传；禁止假装已经清除。保持历史和原始资产不变，等待共享依据。不进行过滤历史、强推或新建无历史仓库来规避用户要求。

用户后续确认时，应记录实际权利来源和允许范围，而非仅写“同意上传”。公开可浏览的网页不自动提供复制/共享其截图、模型或贴图的许可。

## 没有被当作产品资产上传的参考

用户提供的 Masar HAR 位于项目外 Downloads，本轮不复制入仓库。仓库内未找到 .har / .glb / .gltf / .fbx / .blend 文件；已有分析文档说明只在临时目录研究前端产物，没有把 Masar 模型、贴图或脚本植入产品。新的 .gitignore 阻止 HAR 和常见密钥文件被误加入。

## 存储方式

扫描时历史最大 blob 7.55 MiB；拟保存的 SVG 配色文件单个 12.13 MiB，当前没有达到 GitHub 100 MiB 单文件硬限制，因此本轮不启用 LFS、不购买配额、不重写历史。常规 Git 足够；未来大量高频二进制模型要在新增前评估 LFS 或受控资产存储，保留版本/校验/来源和下载说明。

GitHub 大文件说明：https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github

## 本地保留但不纳入 Git

`.env.local`、`.data/`、`.next/`、node_modules、缓存、HAR、私钥、`.local-backups/` 永不作为代码共享。`.audit/` 为本地视觉工作文件；`exports/*.zip` 是已保留可编辑 SVG 文件的重复打包。均未删除。

之前未跟踪的 66 个资产已打包到 `.local-backups/2026-10-28/previously-untracked-assets.tar.gz`，逐文件 SHA-256 验证通过。文件清单见 `github-asset-backup-inventory.json`。本地备份含可能受限资料，不允许把备份整个上传来绕过上述门槛。
