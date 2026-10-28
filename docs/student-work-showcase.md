# 学生作品展示数据映射与实施记录

来源：用户提供的《副本社会创新设计_作业标题与小组成员.xlsx》，作业名单 A5:G28。原文件只读，文件 SHA256：`67019f943b93f702fe77032b3656ead6bf3b75fe113a15d68bce99c53945f726`。

## 数量与分类

- 作品：24；有可靠现有导航点的作品：16；地图地点：11；待定位作品：8。
- 本地封面：24；已发现 PDF 附件：24。
- 立体交通与网络系统：5。
- 社区生活与在地共创：9。
- 湘江的生态文旅：7。
- 产业规划与场景营造：3。

第 19 组分类按当前单元格保留，和表尾备注冲突；数量不表示该分类已获人工确认。第 18 组题目与原选址冲突，不擅自把大王山改成巴溪洲。

## 每条作品的地点映射

| 序号 | 作品 | 原选址 | 地点 ID | 状态 |
|---|---|---|---|---|
| 1 | 湘江多元水岸交通系统设计 | 铜官窑 | tongguan | 已关联近似导航点 |
| 2 | 「洲行 ZHOU LINK」鹅洲岛立体共运系统 | 鹅洲岛 | ezhou | 已关联近似导航点 |
| 3 | 流岸·2035 | 文津码头 | — | 待核对，不上图 |
| 4 | 记忆·川上转——文津码头*湘江生活档案共创企划 | 文津码头 | — | 待核对，不上图 |
| 5 | 「这里，有故事。」——从居民记忆出发的湘江地图 | 北辰三角洲 | student-beichen | 已关联近似导航点 |
| 6 | 洲有四季——巴溪洲“水位日历”社区共创计划 | 巴溪洲 | baxi | 已关联近似导航点 |
| 7 | 裕湘百年 | 裕湘纱厂 | — | 待核对，不上图 |
| 8 | WEAVE WAVE | 渔人码头 | site-011 | 已关联近似导航点 |
| 9 | “油”点意思——长沙油脂厂改造计划 | 油脂厂1936 | student-oil1936 | 已关联近似导航点 |
| 10 | 江岸接力——橘洲文脉共编系统 | 橘子洲 | juzizhou | 已关联近似导航点 |
| 11 | 湘岸共赴：渔人码头滨水文化体验 | 渔人码头 | site-011 | 已关联近似导航点 |
| 12 | 大王山交通再规划 | 大王山 | — | 待核对，不上图 |
| 13 | Reconnect江脉重连 | 城南街区 | — | 待核对，不上图 |
| 14 | 洋湖叠境-漫游- | 洋湖湿地 | yanghu | 已关联近似导航点 |
| 15 | 栖亭·共栖之江 | 橘子洲 | juzizhou | 已关联近似导航点 |
| 16 | 江边，逗留一会儿 | 猴子石大桥西岸 | student-houzishi-west | 已关联近似导航点 |
| 17 | 江边共话站 | 文津码头 | — | 待核对，不上图 |
| 18 | 「洲野共生」2035巴溪洲全民户外生活岛计划 | 大王山 | — | 待核对，不上图 |
| 19 | 岸间——湘江滨水公共空间 的弹性更新与日常营造 | 渔人码头到裕湘… | — | 待核对，不上图 |
| 20 | 潮间：潮宗街新旧文化共生界面系统 | 潮宗街 | site-031 | 已关联近似导航点 |
| 21 | 青年岛·文旅化改造 | 鹅洲岛 | ezhou | 已关联近似导航点 |
| 22 | 橘子洲大桥桥面交通改进计划 | 橘子洲大桥 | student-juzizhou-bridge | 已关联近似导航点 |
| 23 | 湘洲渡——湘江全域水上交通与文旅综合服务设计 | 鹅洲岛 | ezhou | 已关联近似导航点 |
| 24 | 人人有泊位-渔人码头共泊计划 | 渔人码头 | site-011 | 已关联近似导航点 |

新增的四个导航点来自仓库已有 OSM 几何，不下载或重建底图。北辰三角洲、油脂厂1936、橘子洲大桥采用几何包围盒中心；猴子石大桥西岸采用现有桥线西端。具体来源与精度见 `src/student-works/locations.json`。原地点注册器、场域分类、坐标契约和 AOI 未修改。

## 链接与封面核查

Pinwall 页面及 OSS 附件为公开原作品来源。封面缩略图保持原作品内容，不生成替代设计。只保存本地 WebP 缩略图与来源；不提交签名 URL，不保存完整 PDF。每次打开 PDF 时从固定原项目页解析最新附件 URL；8 秒超时、附件缺失或访问失败则回退原项目页。

| 作品 | 项目页 | 读取状态 | 本地封面 | 发现 PDF |
|---|---|---|---|---|
| 1 | https://pinwall.cn/project/66171 | available | 有 | 是 |
| 2 | https://pinwall.cn/project/66192 | available | 有 | 是 |
| 3 | https://pinwall.cn/project/66181 | available | 有 | 是 |
| 4 | https://pinwall.cn/project/66184 | available | 有 | 是 |
| 5 | https://pinwall.cn/project/66166 | available | 有 | 是 |
| 6 | https://pinwall.cn/project/66178 | available | 有 | 是 |
| 7 | https://pinwall.cn/project/66196 | available | 有 | 是 |
| 8 | https://pinwall.cn/project/66170 | available | 有 | 是 |
| 9 | https://pinwall.cn/project/66168 | available | 有 | 是 |
| 10 | https://pinwall.cn/project/66172 | available | 有 | 是 |
| 11 | https://pinwall.cn/project/66173 | available | 有 | 是 |
| 12 | https://pinwall.cn/project/66174 | available | 有 | 是 |
| 13 | https://pinwall.cn/project/66175 | available | 有 | 是 |
| 14 | https://pinwall.cn/project/66176 | available | 有 | 是 |
| 15 | https://pinwall.cn/project/66179 | available | 有 | 是 |
| 16 | https://pinwall.cn/project/66180 | available | 有 | 是 |
| 17 | https://pinwall.cn/project/66183 | available | 有 | 是 |
| 18 | https://pinwall.cn/project/66185 | available | 有 | 是 |
| 19 | https://pinwall.cn/project/66187 | available | 有 | 是 |
| 20 | https://pinwall.cn/project/66188 | available | 有 | 是 |
| 21 | https://pinwall.cn/project/66189 | available | 有 | 是 |
| 22 | https://pinwall.cn/project/66191 | available | 有 | 是 |
| 23 | https://pinwall.cn/project/66193 | available | 有 | 是 |
| 24 | https://pinwall.cn/project/66190 | available | 有 | 是 |

以上状态为本轮读取结果，不承诺外站持续在线。当前不能访问的项目清单：无（24 个项目页及封面均已成功读取）。

## 范围与实现

独立分支 `demo/student-work-showcase`。新增 `src/student-works` 独立数据，不修改 AtlasRecord、数据库或 AOI。协调器向既有引擎注入演示导航地点；默认值仍为原 PLACES，只在演示模式使用附加点。标签投影、相机控制和地点信息框沿用现有接口。

演示入口：`/experience?showcase=student-work`。普通 `/experience` 关闭课程模式。主题/数量/作品与地点关联均从同一数据集计算。检索支持题目、组员和原选址；未定位作品可在列表中查看并打开。

## 操作与验收

1. 打开演示入口，选择全部或某个方向。
2. 从地图数字标记或左侧地点列表进入地点，镜头到位后自动显示“设计方案 → 学生作品”。
3. 点击封面、题目或“打开完整 PDF”，新标签打开原附件；失败时打开原作品页。
4. 在“作品列表”中检索作者、题目或地点；“地点待核对”保留所有未定位作品。
5. 收起成果面板后仍可操作地图。切换昼夜、自由拖动、中断聚焦与返回沿用原体验。
6. 点击“退出演示”返回普通地图。回退：移除演示 URL 参数，或 revert 功能提交。

## 本轮来源授权与 GitHub

用户于 2026-10-29 要求修改压缩包项目并持续上传 GitHub，并在询问既有三类素材上传范围时回复“都行”。记录此任务授权，不据此虚构素材为原创或第三方许可条款。之后用户明确告知同学已将仓库公开；本轮不改变仓库可见性、不改写既有历史。只提交明确任务文件，不提交环境文件、缓存、数据库或依赖目录。

验证结果将在交付前补记。
