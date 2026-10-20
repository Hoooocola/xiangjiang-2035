# 将来的江来 / 湘江2035 · HTML Prototype

这是一个独立的高保真交互原型。它不会读取或修改现有 Next.js、数据库、登录系统或 Figma 文件。

## 运行

在项目根目录执行：

```bash
python3 -m http.server 4173 --directory prototype-html
```

然后打开：

- 正常演示：<http://localhost:4173>
- 内部 QA：<http://localhost:4173/?qa=1>

浏览器状态保存在当前标签页的 `sessionStorage`。关闭标签页后不会写入数据库。

## 演示主链路

1. 地图探索 → 创建调研 → 选择鹅洲
2. Research Session → 调研准备 → 现场记录
3. Field Record → KJ Cluster → Insight
4. Insight → Design Opportunity → Proposal
5. Proposal Upload 或 Proposal Creator → Draft → Published

成果库、搜索和地点方案档案进入 Proposal Detail 后，返回会恢复原筛选或搜索上下文。

## QA Mode

`?qa=1` 提供 Student / Reviewer / Visitor 三条快捷入口、Demo State 重置，以及 18 项任务状态。此入口不出现在教师正常演示导航中。

## 结构

```text
prototype-html/
  index.html
  styles/
    tokens.css
    global.css
    components.css
    pages.css
  js/
    app.js
    router.js
    state.js
    data.js
    interactions.js
  assets/images/
  QA_REPORT.md
```

## 原型边界

- 地图、聚合、GIS 与定位均为静态 Demo，不连接地图 SDK。
- AI 起草、相机、文件上传和保存均为本地模拟，不调用外部服务。
- KJ 卡片提供选卡、建组、重命名及添加/移除反馈；未实现自由拖拽物理引擎。
- 移动端只实现需求指定的 390 × 844 现场采集设备框。
- 本原型不会回写 Figma。
