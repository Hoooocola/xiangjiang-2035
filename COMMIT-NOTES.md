# V2.8 真实地理数据纠偏 — 提交说明

## 分支与基线

- 新分支：`feature/geodata-visual-refinement-v2-8`
- 工作树：`/Users/erich/Desktop/xiangjiang-2035-v2-8`（独立 worktree）
- 基线：`integration/yanghu-course-complete` @ `7fa474c`（已含 PR #11 课程成果 + PR #12 真实数据）

## 本轮修改（9 个文件，428 增 / 220 删）

| 文件 | 改动 |
|---|---|
| `src/experience/real-geodata/landcover.ts` | 修复 WorldCover 几何错位 + 删除错误 UV 重写 + 低饱和配色 + 类别选择高亮 + 水体降透明 |
| `src/experience/real-geodata/gbif.ts` | 坐标聚合（4位小数≈11m）+ 物种类群分组（7 类图例）+ 数字标签 + 详情访问 |
| `src/experience/real-geodata/renderer.ts` | 新增 selectLandcoverClass / gbifClusterCount / gbifRecordsAt |
| `src/experience/engine.ts` | 暴露类别选择 / 元数据 / 聚合计数 / GBIF 射线拾取 |
| `app/experience/layer-panel.tsx` | 移除独立 REAL DATA 区块，三图层整合进五大分类 + 空间分析入口 + 文案「空间信息」+ 统计命名 |
| `app/experience/gbif-detail.tsx`（新） | GBIF 记录详情（轻量） |
| `app/experience/experience.tsx` | 状态 + 图例数据 + GBIF 详情渲染 |
| `app/experience/information.module.css` | 修复面板上下矩形边界（mask）+ 图例样式 |
| `tests/student-work-layer.test.ts` | 同步 LayerPanel 新 props |

## 核心诊断结论

1. **WorldCover 错位根因**：`buildLandcoverMesh` 里 PlaneGeometry 中心在原点但未平移到 bbox 投影中心（`wx = x0 + lx` 基准错误），导致整层偏移约 5km；UV 重写 `lx/w`（范围 [-0.5,0.5]）覆盖了正确默认 UV。已用 three 实测：PlaneGeometry rotateX(-π/2) 后默认 UV v=1 在北，与 CanvasTexture flipY + north-up 数据方向天然对齐。
2. **GBIF 密集根因**：6112 条记录中唯一坐标（4位小数）仅 1247 个，最多一个坐标 (28.1258,112.9272) 有 2576 条（42%）。已按坐标聚合。

## 在沙箱外完成提交的命令

```bash
cd /Users/erich/Desktop/xiangjiang-2035-v2-8

# 1. 清理残留的 git index 锁（沙箱无法删除）
rm -f /Users/erich/Desktop/xiangjiang-2035-review/.git/worktrees/xiangjiang-2035-v2-8/index.lock

# 2. 暂存（显式列出，避免误提交 _tmp_/vumd3sqe 临时文件）
git add app/experience/experience.tsx \
        app/experience/information.module.css \
        app/experience/layer-panel.tsx \
        app/experience/gbif-detail.tsx \
        src/experience/engine.ts \
        src/experience/real-geodata/gbif.ts \
        src/experience/real-geodata/landcover.ts \
        src/experience/real-geodata/renderer.ts \
        tests/student-work-layer.test.ts

# 3. 提交
git commit -m "fix(experience): 纠偏 WorldCover 空间错位并重构真实数据图层

- 修复 landcover mesh 未平移导致整层偏移约 5km 的坐标错误，删除错误的 UV 重写
- WorldCover 低饱和贴地表达 + 按真实分类选择高亮 + 水体保留原水面
- GBIF 按坐标聚合（6112 条→1247 个点位），物种类群图例 + 数字标签 + 点击详情
- 三数据图层整合进基础地理/生态分类，移除独立 REAL DATA 区块
- 空间分析改为轻量入口；文案「阅读这段湘江」→「空间信息」
- 修复图层面板上下矩形背景边界（mask 垂直衰减）
- 统计改为「研究对象 N 个」，避免误导"

# 4. 推送新分支
git push -u origin feature/geodata-visual-refinement-v2-8
```

## 本地验证命令（沙箱外）

```bash
cd /Users/erich/Desktop/xiangjiang-2035-v2-8
pnpm install          # 若 node_modules 不可用
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest run
pnpm build            # next build
```

## Vercel Preview

推送后基于 `feature/geodata-visual-refinement-v2-8` 创建 Preview 部署（target=preview，不碰 Production）。
注意 git-author 需用 noreply 邮箱 `167979544+Hoooocola@users.noreply.github.com` 通过 Vercel git-author 检查。

## 未完成/局限

- F4 分析结果高亮（GBIF 记录 + 道路联动高亮）未实现，当前仅 AnalysisPanel 显示统计与说明。
- 相机尺度下的 WorldCover 细节变化（全段弱化/局部清晰）仅通过透明度 fade 做了近似，未做 LOD 级纹理。
- 本地 tsc/vitest/build 因沙箱安全策略（safe-delete bulk guard 锁死 + 依赖 symlink 拦截）未能运行，需在沙箱外验证。
