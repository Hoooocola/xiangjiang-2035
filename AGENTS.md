<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# 湘江 2035 团队约定

## 开始工作

1. 先读 README、docs/PROJECT_VISION.md、docs/ARCHITECTURE.md、docs/DESIGN_SYSTEM.md、docs/DATA_SCHEMA.md 与 docs/COLLABORATION.md。
2. 检查当前分支、git status 和最近提交，保留用户及同事未提交的工作。只在自己的 `codex/<module>-<task>` 分支开发。
3. 一次任务只解决明确范围；先说明涉及模块、验证方法和是否触及核心。不得顺带重构或改配色。
4. 任务交接记录写入 PR/文档；各 Codex 账号不依赖另一个聊天的隐含上下文。

## 必须审核的边界

负责人 Hoooocola 负责最终集成。地图核心、渲染、相机、坐标、高程、AOI、基础 GIS、整体昼夜美术及共享数据契约的重大修改，先提出影响与验证方案，得到负责人明确授权后实施，合并前再次审阅 diff 和证据。已有明确任务授权无需重复请求同一范围的实施许可。

UI/UX 主要在 `app/experience` 的展示组件和 CSS；它不能直接改写 Three.js 相机或坐标。数据编辑主要在 `src/atlas` 和来源文档；不得用改数据掩盖渲染或定位问题。`experience.tsx` 是共享协调器，修改前协调并缩小 diff。

## 产品与数据真实性

- 保留 Three.js 与当前地图功能；风格帧实验不自动推广到主体验。
- AOI 只负责视觉权重，不改变地理几何、资产数量或数据覆盖；保留连续过渡。
- 区分场域六类、信息六层、研究现场层级，不混用枚举。
- 保留公开资料和 Demo 的显式状态。模拟数据不能宣称实测、真实采访、真实年份统计或真实研究结论。
- 新对象必须有简明介绍、来源、精度、地点关联和可验证几何。坐标按现有 WGS84/局部投影契约处理。
- 标签位置与内部动效分离；使用现有相机控制器；支持自由操作、中断及减少动态效果。

## Git 与安全

- 不直接向 main/master 推送未经审核的产品修改；功能分支 → PR → 负责人审核 → 合并。
- 不执行 `git reset --hard`、`git clean -fd`、force push 或未经明确授权的历史重写，不移动 `version1` 等归档标签。
- 不提交 `.env`、Token、私钥、HAR、数据库、用户上传、备份或真实个人田野资料。不在终端输出或 PR 中粘贴密钥。
- `.gitignore` 不能移除历史敏感信息。若发现历史密钥，停止推送，先撤销/轮换，再由负责人决定修复方案。
- 素材共享许可不明时停止上传相关历史；Private 不等于获得第三方许可。参见 docs/ASSET_LICENSES.md。
- 新依赖、外部服务、付费存储或 LFS 配额调整先说明必要性和成本，不自行购买。

## 验证与交付

依据改动运行类型、lint、相关测试；业务或数据关系改动运行完整单测。涉及数据库时独立测试库；涉及地图/交互时实际浏览器验证昼夜、选择、移动中断、返回、窄屏和控制台。重大视觉修改提供同机位截图与已知限制。

PR 必须说明：问题、最终行为、文件范围、验证、来源/授权、风险和回退方式。未运行的检查明确写出。合并与主分支保护尚未启用前，不把文档约定冒充服务器强制规则。
