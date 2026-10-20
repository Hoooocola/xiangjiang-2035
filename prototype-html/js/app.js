import { demo, users, gaps, clusters, clusterCards, proposals, researchSessions, insightCopy, opportunityCopy, fieldRecords } from "./data.js";
import { state, hydrate, update, nested, resetState, preparationComplete, recordComplete } from "./state.js";
import { setRenderer, navigate, goBack, initRouter, currentRoute, currentContext } from "./router.js";
import { toast, showPopover, closePopover, showDialog, closeDialog, bindGlobalDismissals, escapeHtml } from "./interactions.js";

const app = document.querySelector("#app");
const nav = document.querySelector("#global-nav");

const icon = name => ({ overview:"▱", research:"▤", gaps:"◎", records:"⌁", proposals:"□", create:"＋" }[name] || "·");
const arrow = `<span class="btn-arrow" aria-hidden="true">→</span>`;

function button(label, kind="primary", action="", attrs="") {
  return `<button class="btn btn-${kind}" data-action="${action}" ${attrs}>${label}${kind === "primary" || kind === "tertiary" ? arrow : ""}</button>`;
}

function renderNav(route) {
  const mapActive = ["HOME","PLACE","EXISTING_RESEARCH","RESEARCH_GAPS","PLACE_FIELD_RECORDS","PLACE_PROPOSALS"].includes(route);
  nav.innerHTML = `
    <div class="nav-group nav-left">
      <button class="nav-link nav-brand" data-route="HOME">湘江2035</button>
      <button class="nav-link ${mapActive ? "is-active" : ""}" data-route="HOME">地图探索</button>
      <button class="nav-link ${route === "GLOBAL_ARCHIVE" ? "is-active" : ""}" data-route="GLOBAL_ARCHIVE">成果库</button>
      <button class="nav-link ${route === "GLOBAL_SEARCH" ? "is-active" : ""}" data-route="GLOBAL_SEARCH">搜索</button>
    </div>
    <button class="nav-logo" data-route="HOME" aria-label="返回地图探索首页"><span class="logo-wave">≋</span><span>将来的江来</span></button>
    <div class="nav-group nav-right">
      <button class="nav-link nav-create" data-action="global-create">创建调研 <span aria-hidden="true">⌖</span></button>
      <button class="nav-menu-trigger" aria-expanded="${state.menuOpen}" data-action="toggle-menu" aria-label="打开账户菜单"><span class="menu-icon"></span></button>
    </div>
    <div class="account-menu ${state.menuOpen ? "is-open" : ""}" id="account-menu" aria-hidden="${!state.menuOpen}">
      ${state.loggedIn ? `<div class="menu-person"><strong>${state.role === "reviewer" ? "评审教师" : "霍堂祥"}</strong><div class="meta">${state.role === "reviewer" ? "Reviewer" : "Student Researcher"}</div></div>
        <button class="menu-action" data-route="MY_WORK">我的工作 <span>→</span></button>
        <button class="menu-action" data-route="SESSION_OVERVIEW">我的调研 <span>→</span></button>
        <button class="menu-action" data-action="toggle-login">退出登录</button>` :
        `<button class="menu-action" data-action="toggle-login">登录原型账户 <span>→</span></button>`}
    </div>`;
}

function placeRail(active) {
  return `<aside class="place-rail" aria-label="地点详情章节导航">
    ${[["overview","PLACE","场地概览"],["research","EXISTING_RESEARCH","已有研究"],["gaps","RESEARCH_GAPS","值得关注"],["records","PLACE_FIELD_RECORDS","田野记录"],["proposals","PLACE_PROPOSALS","历史方案"]].map(([id,route,label]) => `<button class="${active===id?"is-active":""}" data-route="${route}" title="${label}" aria-label="${label}">${icon(id)}</button>`).join("")}
    <button class="rail-action" data-action="place-create" title="在鹅洲创建调研" aria-label="在鹅洲创建调研">${icon("create")}</button>
  </aside>`;
}

function pageShell(content, cls="") { return `<section class="page ${cls} fade-in"><div class="container">${content}</div></section>`; }

function renderHome() {
  const expanded = state.homeClusterExpanded;
  return `<section class="map-page fade-in" aria-label="湘江地图探索">
    <div class="map-canvas" aria-hidden="true"></div><div class="map-veil"></div>
    ${state.selectPlaceMode ? `<div class="select-place-banner"><div class="eyebrow">SELECT PLACE</div><strong>选择本次调研的地点</strong><div class="meta">地图上的地点均可进入；本次 Demo 选择鹅洲</div></div>` : ""}
    ${!state.selectPlaceMode ? `<article class="explore-panel">
      <div class="eyebrow">PLACE · XIANGJIANG</div><h2>鹅洲</h2>
      <p>湘江南部保留居民聚落的洲岛型场地，生态保护约束较强，同时存在乡野游憩与社区生活需求。</p>
      <div class="explore-stats"><div class="explore-stat"><strong>6</strong><span class="meta">调研</span></div><div class="explore-stat"><strong>87</strong><span class="meta">田野记录</span></div><div class="explore-stat"><strong>3</strong><span class="meta">方案</span></div></div>
      <div class="stack"><button class="btn btn-tertiary" data-route="PLACE">查看点位详情 ${arrow}</button>${button("在此创建调研","secondary","place-create")}</div>
    </article>` : ""}
    <button class="marker place-marker" style="left:55%;top:49%" data-action="${state.selectPlaceMode ? "select-ezhou" : "open-place"}">鹅洲</button>
    ${!state.selectPlaceMode ? `<button class="marker cluster-marker" style="left:51%;top:43%" data-action="expand-cluster" aria-label="展开16条田野记录">16</button>` : ""}
    ${expanded && !state.selectPlaceMode ? `<button class="marker record-marker" style="left:47%;top:31%" data-route="PLACE_FIELD_RECORDS"><img src="assets/images/proposal-ecology-monitoring.jpg" alt="岸线观察"><span>生态岸线观察</span></button><button class="marker record-marker" style="left:57%;top:36%" data-route="PLACE_FIELD_RECORDS"><img src="assets/images/proposal-shared-shoreline.png" alt="共享岸线"><span>树荫下的停留</span></button><span class="marker-chip" style="left:45%;top:49%">📷 4</span><span class="marker-chip" style="left:61%;top:50%">📝 7</span><span class="marker-chip" style="left:53%;top:58%">🎙 5</span>` : ""}
    <div class="map-controls"><button class="map-control" aria-label="放大">＋</button><button class="map-control" aria-label="缩小">−</button></div>
    <div class="map-legend"><span>□ 作品</span><span>● 四级点聚合</span><span>⌖ 三级地点</span></div>
    ${state.selectPlaceMode ? `<div class="map-bottom-action"><button class="btn btn-secondary" data-action="cancel-place-select">取消</button><button class="btn btn-primary" data-action="continue-place-select" ${state.selectedPlace ? "" : "disabled"}>继续创建 ${arrow}</button></div>` : ""}
  </section>`;
}

function renderPlace() {
  return `<div class="place-shell fade-in">${placeRail("overview")}<main class="place-content"><section class="place-hero">
    <div><div class="place-title-index">02 / PLACE DETAIL</div><h1>鹅洲</h1><p class="reading">在湘江水系与居民日常之间，鹅洲保留着低密度村落、生态岸线与开放乡野空间。这里的研究从地点理解开始，并沿着证据逐步走向设计。</p><div class="inline"><button class="btn btn-primary" data-action="place-create">创建调研 ${arrow}</button><button class="btn btn-tertiary" data-route="EXISTING_RESEARCH">滚动查看更多 ${arrow}</button></div></div>
    <figure class="place-hero-map"><img src="assets/images/figma-map.png" alt="鹅洲 GIS 空间底图"><figcaption class="place-hero-map-caption"><span>SPATIAL BASE / GIS</span><button class="btn btn-tertiary" data-action="gis-entry">查看 GIS 影像 ↗</button></figcaption></figure>
  </section></main></div>`;
}

function renderExistingResearch() {
  return `<div class="place-shell fade-in">${placeRail("research")}<main class="place-content">
    <header class="section-head"><div><div class="eyebrow">04 / EXISTING RESEARCH</div><h1>已有研究</h1></div><p class="reading">以前研究过什么？以 Research Session 为单位查看时间、方法、证据规模与研究输出。</p></header>
    <div class="timeline">${researchSessions.map(s => `<button class="timeline-row ${s.featured?"featured":""}" data-route="SESSION_OVERVIEW"><div class="timeline-year">${s.year}</div><div><h3>${s.title}</h3><p>${s.team}</p><div class="inline meta"><span>${s.method}</span><span>${s.records} Field Records</span><span>${s.clusters} KJ Clusters</span><span>${s.insights} Insights</span></div></div><div class="meta">${s.source}<br>查看档案 →</div></button>`).join("")}</div>
  </main></div>`;
}

function renderGaps() {
  return `<div class="place-shell fade-in">${placeRail("gaps")}<main class="place-content">
    <header class="section-head"><div><div class="eyebrow">05 / RESEARCH GAPS</div><h1>值得关注</h1></div><div>${button("在此地点创建调研","primary","gap-create")}</div></header>
    <div class="editorial-grid"><div><p class="reading">已有研究告诉了我们什么，也暴露了仍不确定的部分。选择一个问题，查看它与空间证据的关系。</p></div><div>${gaps.map((g,i)=>`<article class="gap-row ${i===0?"is-selected":""}" data-gap="${g.id}" tabindex="0"><div class="editorial-item-number">${g.number}</div><div><h3>${g.title}</h3><p>${g.summary}</p><div class="meta">Existing Research · Field Records · Insights · Data Freshness</div></div></article>`).join("")}</div>
    <div class="evidence-map"><img src="assets/images/figma-map.png" alt="鹅洲研究缺口空间证据图">${gaps.map((g,i)=>`<div class="evidence-anchor gap-evidence ${i===0?"":"is-muted"}" data-gap-evidence="${g.id}" style="left:${10+i*15}%;top:${18+i*25}%"><strong>${g.number} ${g.place}</strong><span>${g.evidence}</span><span>${g.missing}</span></div>`).join("")}</div></div>
  </main></div>`;
}

function markerSet() {
  const clustersHtml = [[24,32,28],[17,60,35],[11,71,58],[8,43,67]].map(([n,x,y])=>`<button class="marker cluster-marker" style="left:${x}%;top:${y}%" data-action="filter-cluster">${n}</button>`).join("");
  const recordsHtml = Array.from({length:9},(_,i)=>`<button class="marker record-marker" style="left:${30+(i%4)*14+(i%2)*2}%;top:${20+Math.floor(i/4)*26+(i%3)*4}%" data-action="open-record"><img src="${["assets/images/proposal-shared-shoreline.png","assets/images/proposal-ecology-monitoring.jpg","assets/images/proposal-reversible-shade.jpg"][i%3]}" alt="田野记录"><span>${["行为观察","设施记录","生态岸线"][i%3]}</span></button>`).join("");
  return clustersHtml + recordsHtml;
}

function renderFieldRecords() {
  const count = state.fieldFilter === "behavior" ? 32 : 87;
  return `<div class="place-shell fade-in">${placeRail("records")}<main class="place-content"><header class="section-head"><div><div class="eyebrow">06 / FIELD RECORDS</div><h1>田野记录地图</h1></div>${button("加入 KJ 综合画布","primary","open-kj")}</header>
    <div class="filter-rail"><button class="chip ${!state.fieldFilter?"is-selected":""}" data-action="filter-all">全部 ${count === 87 ? 87 : "87"}</button><button class="chip ${state.fieldFilter==="behavior"?"is-selected":""}" data-action="filter-behavior">行为观察 32</button><span class="meta">Zoom Out 聚合 · Zoom In 解聚</span></div>
    <div class="record-map">${markerSet()}</div></main></div>`;
}

function renderPlaceProposals() {
  const list = proposals.filter(p=>p.place==="鹅洲").slice(0,5);
  return `<div class="place-shell fade-in">${placeRail("proposals")}<main class="place-content"><header class="section-head"><div><div class="eyebrow">09 / HISTORICAL PROPOSALS</div><h1>历史方案</h1></div><p class="reading">从已发表的方案回看设计依据，并追溯它们来自哪些研究证据。</p></header><div class="proposal-archive">${list.map(p=>`<button class="proposal-row" data-proposal="${p.id}" data-source="place"><div>${p.year}</div><img src="${p.image}" alt="${p.title}"><div><h3>${p.title}</h3><p>${p.team}</p></div><span>查看方案 ↗</span></button>`).join("")}</div></main></div>`;
}

function renderArchive() {
  const list = proposals.filter(p => (!state.archive.place || p.place===state.archive.place) && (!state.archive.year || p.year===state.archive.year) && (!state.archive.source || (state.archive.source==="正式发布"?!p.legacy:p.legacy)) && (!state.archive.team || p.team.includes(state.archive.team)));
  return pageShell(`<header class="section-head"><div><div class="eyebrow">GLOBAL PROPOSAL ARCHIVE</div><h1>成果库</h1></div><p>${list.length} 个可追溯设计方案</p></header><div class="archive-layout">
    <aside class="filter-column"><div class="eyebrow">FILTER</div><div class="filter-group"><div class="field-label">地点</div>${["鹅洲","巴溪洲","兴马洲","解放垸"].map(x=>`<button class="filter-option ${state.archive.place===x?"is-selected":""}" data-filter-place="${x}"><span>${x}</span><span>${state.archive.place===x?"×":""}</span></button>`).join("")}</div><div class="filter-group"><div class="field-label">年份</div>${["2026","2025","2024","2023"].map(x=>`<button class="filter-option ${state.archive.year===x?"is-selected":""}" data-filter-year="${x}"><span>${x}</span><span>${state.archive.year===x?"×":""}</span></button>`).join("")}</div><div class="filter-group"><div class="field-label">来源</div>${["正式发布","历史档案"].map(x=>`<button class="filter-option ${state.archive.source===x?"is-selected":""}" data-filter-source="${x}"><span>${x}</span><span>${state.archive.source===x?"×":""}</span></button>`).join("")}</div><div class="filter-group"><div class="field-label">团队</div>${["设计小组","湖南大学","研究组"].map(x=>`<button class="filter-option ${state.archive.team===x?"is-selected":""}" data-filter-team="${x}"><span>${x}</span><span>${state.archive.team===x?"×":""}</span></button>`).join("")}</div><div class="filter-group"><button class="btn btn-tertiary" data-action="clear-archive-filter">清除筛选</button></div></aside>
    <div><div class="inline" style="margin-bottom:28px">${state.archive.place?`<span class="tag is-selected">地点：${state.archive.place} <button data-action="clear-archive-filter">×</button></span>`:"<span class=\"meta\">全部地点</span>"}</div><div class="cover-grid">${list.map(p=>proposalTile(p,"archive")).join("")}</div></div></div>`, "archive-page");
}

function proposalTile(p, source) {
  return `<button class="cover-item" data-proposal="${p.id}" data-source="${source}"><div class="cover-image"><img src="${p.image}" alt="${p.title}"></div>${p.legacy?`<span class="legacy-label">历史档案 · 封面图待校准</span>`:""}<div class="spread"><div><h3>${p.title}</h3><div class="meta">${p.place} · ${p.year} · ${p.team}</div></div><span>↗</span></div></button>`;
}

function renderSearch() {
  const q = state.search.query.trim();
  const results = q ? proposals.filter(p=>`${p.title}${p.place}${p.team}`.includes(q)) : [];
  const showPlace=["all","place"].includes(state.search.tab);
  const showResearch=["all","research"].includes(state.search.tab);
  const showProposals=["all","proposal"].includes(state.search.tab);
  return pageShell(`<div class="search-hero"><div class="eyebrow">GLOBAL SEARCH</div><input class="search-input" id="global-search-input" value="${escapeHtml(state.search.query)}" placeholder="搜索地点、研究与方案" aria-label="全局搜索"><div class="search-tabs">${[["all","全部"],["place","地点"],["research","研究"],["proposal","方案"]].map(([id,label])=>`<button class="search-tab ${state.search.tab===id?"is-active":""}" data-search-tab="${id}">${label}</button>`).join("")}</div></div>
    <div style="padding-top:42px">${!q?`<div class="empty-state"><div><h3>从一个地点开始</h3><p>试试输入“鹅洲”</p></div></div>`:`<div class="spread" style="margin-bottom:28px"><h3>“${escapeHtml(q)}” 的结果</h3><span class="meta">${(showPlace?1:0)+(showResearch?1:0)+(showProposals?results.length:0)} 项</span></div><div class="data-list">${showPlace?`<button class="data-row" data-route="PLACE"><span>地点</span><strong>鹅洲</strong><span>6 次调研 · 87 条历史记录</span><span>→</span></button>`:""}${showResearch?`<button class="data-row" data-route="SESSION_OVERVIEW"><span>研究</span><strong>${demo.session.title}</strong><span>进行中</span><span>→</span></button>`:""}${showProposals?results.map(p=>`<button class="data-row" data-proposal="${p.id}" data-source="search"><span>方案</span><strong>${p.title}</strong><span>${p.year} · ${p.team}</span><span>↗</span></button>`).join(""):""}</div>`}</div>`, "search-page");
}

function createConfig(route) {
  if (route === "CREATE_RESEARCH_GAP") return { eyebrow:"FROM RESEARCH GAP", title:"围绕研究缺口创建调研", place:"鹅洲", gap:"生态保护与使用需求", origin:"Research Gap" };
  if (route === "CREATE_RESEARCH_PLACE") return { eyebrow:"FROM PLACE", title:"在鹅洲创建调研", place:"鹅洲", gap:"", origin:"Place Detail" };
  return { eyebrow:"GLOBAL ACTION", title:"创建一次调研", place:"", gap:"", origin:"Global Navigation" };
}

function renderCreateResearch(route) {
  const c = createConfig(route);
  return pageShell(`<div class="flow-shell"><button class="back-link" data-action="back">← 返回</button><header class="flow-head"><div><div class="eyebrow">10 / CREATE RESEARCH · ${c.eyebrow}</div><h1>${c.title}</h1><p>先建立最小 Research Session；详细准备将在下一步完成。</p></div><div class="meta">入口：${c.origin}</div></header>
    <div class="context-rail"><span>Place：<strong>${c.place || "待选择"}</strong></span><span>Research Gap：<strong>${c.gap || "可在稍后关联"}</strong></span></div>
    <div class="form-canvas"><div class="stack-lg"><div class="field"><label class="required" for="session-title">调研名称</label><input id="session-title" value="${demo.session.title}"></div>${!c.place?`<div class="field"><label class="required">调研地点</label><button class="select-row" data-action="open-place-picker"><span>${state.selectedPlace||"选择地点"}</span><span>→</span></button></div>`:""}<div class="field"><label class="optional">一句话说明</label><textarea id="session-summary">补充鹅洲北岸岸线使用、生态约束与高峰冲突证据。</textarea></div><div class="action-rail"><span class="meta">创建后进入调研准备</span><div class="action-right">${button("取消","secondary","back")}${button("创建 Research Session","primary","create-session",`${c.place||state.selectedPlace?"":"disabled"}`)}</div></div></div>
    <aside class="form-aside"><div class="eyebrow">EVIDENCE CHAIN</div><p>Place → Research Session → Field Record → KJ Cluster → Insight → Opportunity → Proposal</p><hr class="rule"><div class="meta">当前只创建 Session，不会自动产生研究结论。</div></aside></div></div>`, "flow-page");
}

function renderSessionOverview() {
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="PLACE">← 返回鹅洲</button><header class="flow-head"><div><div class="eyebrow">RESEARCH SESSION · IN PREPARATION</div><h1>${demo.session.title}</h1><p>围绕“${demo.session.gap}”补充时段、人群和使用场景证据。</p></div><div class="inline">${button("继续准备","secondary","open-preparation")}${preparationComplete()?button("进入现场记录","primary","open-session-records"):""}</div></header><div class="session-metrics"><div class="metric"><strong>${state.recordsCreated}</strong><span>Field Records</span></div><div class="metric"><strong>${state.kj.clusterCreated?1:0}</strong><span>KJ Clusters</span></div><div class="metric"><strong>${state.insight.published?1:0}</strong><span>Published Insights</span></div><div class="metric"><strong>${state.opportunity.active?1:0}</strong><span>Active Opportunities</span></div></div>
    <div class="editorial-grid"><div><div class="eyebrow">PLACE</div><h3>鹅洲</h3><p>北岸滨水带 · 约 2.4 km</p></div><div><div class="eyebrow">RESEARCH QUESTION</div><h3>${state.prep.question}</h3><p>${state.prep.objective}</p></div><div><div class="eyebrow">NEXT STEP</div><p>${preparationComplete()?"准备已完成，可开始采集。":"完成方法、成员与调研范围设置。"}</p></div></div></div>`, "session-page");
}

function renderPreparation() {
  const p=state.prep;
  const selectedUsers=users.filter(u=>p.members.includes(u.id));
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="SESSION_OVERVIEW">← 返回调研概览</button><header class="flow-head"><div><div class="eyebrow">RESEARCH SESSION / PREPARATION</div><h1>调研准备</h1><p>${demo.session.title}</p></div><div><div class="meta">完成度</div><strong>${preparationComplete()?"6 / 6":"4 / 6"}</strong></div></header>
    <div class="form-canvas"><div>
      <section class="form-section form-grid"><div class="field"><label class="required" for="prep-question">研究问题</label><textarea id="prep-question">${escapeHtml(p.question)}</textarea></div><div class="field"><label class="required" for="prep-objective">研究目标</label><textarea id="prep-objective">${escapeHtml(p.objective)}</textarea></div></section>
      <section class="form-section"><div class="field-label required">研究方法</div><button class="select-row" data-action="methods-popover" data-popover-trigger><span>${p.methods.length?p.methods.join(" + "):"选择一种或多种方法"}</span><span>展开 ↓</span></button></section>
      <section class="form-section"><div class="field-label required">调研时间</div><div class="date-range"><div class="field"><label for="date-start">开始</label><input id="date-start" type="date" value="${p.start}"></div><span>→</span><div class="field"><label for="date-end">结束</label><input id="date-end" type="date" value="${p.end}"></div></div></section>
      <section class="form-section"><div class="spread"><div><div class="field-label required">调研成员</div><div class="meta">仅可添加已注册用户 · 最终 2 名成员</div></div><button class="btn btn-secondary" data-action="members-popover" data-popover-trigger>添加成员</button></div><div class="people-results">${selectedUsers.map(u=>`<div class="person-row"><div class="inline"><span class="avatar">${u.name.slice(0,1)}</span><div><strong>${u.name}</strong><div class="meta">${u.org} · ${u.role}</div></div></div>${u.id!=="u1"?`<button class="btn btn-tertiary" data-remove-member="${u.id}">移除</button>`:""}</div>`).join("")}</div></section>
      <section class="form-section"><div class="spread"><div><div class="field-label required">调研范围</div><div class="meta">在地图中确认本次采集边界</div></div><button class="btn btn-secondary" data-action="scope-select">${p.scope?"重新选择":"选择范围"}</button></div>${p.scope?`<div class="scope-map"></div><div class="spread" style="margin-top:12px"><strong>鹅洲北岸</strong><span class="meta">已确认 · 约 2.4 km</span></div>`:""}</section>
      <div class="action-rail"><span class="meta">${preparationComplete()?"所有必填准备已完成":"完成必填项后可开始田野采集"}</span><div class="action-right">${button("保存准备","secondary","save-prep")}${button("开始田野采集","primary","start-collection",preparationComplete()?"":"disabled")}</div></div>
    </div><aside class="form-aside"><div class="eyebrow">PREPARATION CHECK</div><div class="prep-checklist">${[["研究问题",!!p.question],["研究目标",!!p.objective],["研究方法",!!p.methods.length],["时间范围",!!(p.start&&p.end)],["成员",p.members.length>=2],["调研范围",!!p.scope]].map(([label,done])=>`<div class="prep-row"><span class="prep-state ${done?"is-complete":""}"></span><span>${label}</span><span class="meta">${done?"完成":"待补充"}</span></div>`).join("")}</div></aside></div></div>`, "flow-page");
}

function renderSessionRecords() {
  const n=state.recordsCreated;
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="SESSION_OVERVIEW">← 返回调研概览</button><header class="flow-head"><div><div class="eyebrow">RESEARCH SESSION / FIELD RECORDS</div><h1>现场记录</h1><p>${demo.session.title} · 鹅洲北岸</p></div>${button("新增田野记录","primary","new-desktop-record")}</header><div class="session-metrics"><div class="metric"><strong>${n}</strong><span>本次采集</span></div><div class="metric"><strong>32</strong><span>研究目标规模</span></div><div class="metric"><strong>5</strong><span>Evidence Types</span></div><div class="metric"><strong>2.4 km</strong><span>调研范围</span></div></div>
    ${n===0?`<div class="empty-state"><div><div class="eyebrow">NO FIELD RECORDS YET</div><h2>从第一条现场证据开始</h2><p>记录观察、证据类型、标签与位置。</p><div class="inline" style="justify-content:center">${button("新增田野记录","primary","new-desktop-record")}<button class="btn btn-tertiary" data-route="PLACE_FIELD_RECORDS">查看地点历史记录 ↗</button></div></div></div>`:`<div class="data-list"><button class="data-row" data-action="open-saved-record"><span>01</span><strong>树荫下的长时间停留</strong><span>Observation · Behavior · Facility</span><span>查看 ↗</span></button></div><div class="action-rail"><span class="meta">本次调研已有 ${n} 条记录</span><div class="action-right">${button("继续添加","secondary","new-desktop-record")}${button("结束本次采集，开始 KJ 整理","primary","open-kj")}</div></div>`}
    <div style="margin-top:24px"><button class="btn btn-tertiary" data-action="new-mobile-record">改用手机现场采集 ↗</button></div></div>`, "session-page");
}

function renderRecordDesktop() {
  const d=state.recordDraft;
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="SESSION_RECORDS">← 返回现场记录</button><header class="flow-head"><div><div class="eyebrow">NEW FIELD RECORD / DESKTOP</div><h1>记录现场证据</h1><p>直接记录，不需要先选择设备。</p></div><span class="meta">鹅洲北岸 · ${demo.session.title}</span></header>
    <div class="record-editor" style="padding-top:44px"><div class="stack-lg">
      <section><div class="field-label required">现场媒体</div>${d.photo?`<img class="media-preview" src="assets/images/proposal-ecology-monitoring.jpg" alt="已添加的现场照片"><button class="btn btn-tertiary" data-action="remove-photo">移除照片</button>`:`<button class="media-drop" data-action="add-photo"><span><strong>添加照片或视频</strong><br><span class="meta">Demo 将加入鹅洲北岸调研照片</span></span></button>`}</section>
      <div class="field"><label class="required" for="record-observation">观察记录</label><textarea id="record-observation" placeholder="描述你看到、听到或测量到的事实…">${escapeHtml(d.observation)}</textarea></div>
      <section><div class="field-label required">Evidence Type · 单选</div><div class="inline" style="margin-top:10px">${["Observation","Interview","Photo / Video","Measurement","Document / Secondary Research"].map(x=>`<button class="tag ${d.type===x?"is-selected":""}" data-record-type="${x}">${x}</button>`).join("")}</div></section>
      <section><div class="field-label required">Content Tag · 可多选</div><div class="inline" style="margin-top:10px">${["Behavior","Facility","Ecology","Spatial Issue","Community","Tourism","Opportunity"].map(x=>`<button class="tag ${d.tags.includes(x)?"is-selected":""}" data-record-tag="${x}">${x}</button>`).join("")}</div></section>
      <section><div class="field-label required">位置记录方式</div><div class="location-mode"><button class="${d.location==="map"?"is-selected":""}" data-location-mode="map">地图选点</button><button class="${d.location==="gps"?"is-selected":""}" data-location-mode="gps">当前 GPS</button><button class="${d.location==="none"?"is-selected":""}" data-location-mode="none">无明确位置</button></div>${d.location==="map"?`<div class="scope-map"></div><div class="meta" style="margin-top:8px">已定位 · 鹅洲北岸树荫岸段</div>`:""}</section>
      <div class="action-rail"><span class="meta">${recordComplete()?"可以保存":"完成全部必填内容后保存"}</span><div class="action-right">${button("保存田野记录","primary","save-record",recordComplete()?"":"disabled")}</div></div>
    </div><aside><div class="form-aside"><div class="eyebrow">EVIDENCE QUALITY</div><p>记录事实而非过早结论。Evidence Type 只能选择一个；Content Tag 可以跨多个主题。</p><hr class="rule"><div class="meta">必填：媒体、观察、Evidence Type、Content Tag、位置</div></div></aside></div></div>`, "flow-page");
}

function renderRecordMobile() {
  const d=state.mobileDraft;
  return `<section class="page device-stage fade-in"><div class="device"><div class="device-bar"><button class="btn btn-tertiary" data-route="SESSION_RECORDS">关闭</button><strong>现场采集</strong><span class="meta">鹅洲</span></div><div class="device-content">
    <div class="eyebrow">MOBILE FIELD RECORD</div>${d.photo?`<img class="mobile-capture" style="object-fit:cover" src="assets/images/proposal-ecology-monitoring.jpg" alt="现场照片">`:`<button class="mobile-capture" data-action="mobile-photo">轻触拍摄<br><span class="meta" style="color:white">Demo Camera</span></button>`}
    <div class="field"><label class="required" for="mobile-observation">观察记录</label><textarea id="mobile-observation" placeholder="现场发生了什么？">${escapeHtml(d.observation)}</textarea></div><div class="spacer-24"></div>
    <div class="field-label required">Evidence Type</div><div class="inline" style="margin-top:8px">${["Observation","Interview","Photo / Video"].map(x=>`<button class="tag ${d.type===x?"is-selected":""}" data-mobile-type="${x}">${x}</button>`).join("")}</div>
    <div class="action-rail"><span class="meta">自动定位 · 鹅洲北岸</span>${button("保存","primary","save-mobile",d.photo&&d.observation&&d.type?"":"disabled")}</div>
  </div></div></section>`;
}

function renderRecordSaved() {
  return pageShell(`<div class="flow-shell"><div class="section-head"><div><div class="eyebrow">FIELD RECORD · SAVED</div><h1>树荫下的长时间停留</h1></div><span class="tag is-selected">已保存</span></div><div class="record-editor"><img class="media-preview" src="assets/images/proposal-ecology-monitoring.jpg" alt="鹅洲北岸现场记录"><div><div class="eyebrow">OBSERVATION</div><p class="big-question">${escapeHtml(state.recordDraft.observation||state.mobileDraft.observation||"午后树荫下持续出现居民与游客的停留活动，通行路径在高峰时段被压缩。")}</p><div class="inline"><span class="tag">Observation</span><span class="tag">Behavior</span><span class="tag">Facility</span></div><hr class="rule"><div class="meta">鹅洲北岸 · 2026.09.21 15:40 · 霍堂祥</div></div></div><div class="action-rail"><button class="btn btn-tertiary" data-route="SESSION_RECORDS">← 返回本次调研记录</button>${button("继续添加记录","secondary","new-desktop-record")}</div></div>`, "record-saved");
}

function clusterHtml(c, selected=false, muted=false) {
  const cards = c.id==="c2" ? clusterCards.slice(0,4) : clusterCards.slice(0,3).map((x,i)=>["记录到居民固定交流点","岸线设施缺少维护","游客短时停留集中"][i]);
  return `<section class="kj-cluster ${selected?"is-selected":""} ${muted?"is-muted":""}" style="left:${c.x}%;top:${c.y}%" data-cluster="${c.id}" tabindex="0"><div class="cluster-title"><div><strong>${c.id==="c2"&&state.kj.clusterCreated?state.kj.clusterName:c.title}</strong><div class="meta">${c.count} Records${c.id==="c2"&&state.insight.published?" · 1 Published Insight":""}</div></div><span class="status-dot ${selected?"is-active":""}"></span></div>${cards.map((x,i)=>`<div class="kj-card ${state.kj.selectedCards.includes(`${c.id}-${i}`)?"is-selected":""}" data-card="${c.id}-${i}">${x}</div>`).join("")}<div class="meta" style="padding-top:12px">+${Math.max(0,c.count-cards.length)} more</div>${selected?`<div class="inline"><button class="btn btn-tertiary" data-action="synthesize-insight">提炼洞察 ${arrow}</button><button class="btn btn-tertiary" data-action="rename-cluster">重命名</button><button class="btn btn-tertiary" data-action="add-cluster-card">移入卡片</button><button class="btn btn-tertiary" data-action="remove-cluster-card">移除卡片</button></div>`:""}</section>`;
}

function renderKj() {
  const selected=state.kj.selectedCluster;
  return `<section class="kj-page fade-in"><div class="kj-toolbar"><div><div class="eyebrow" style="margin:0">KJ WORKSPACE · 42%</div><strong>${demo.session.title}</strong></div><div class="inline"><span class="meta">${demo.session.records} Field Records · ${state.kj.clusterCreated?5:4} Clusters · 未归类 ${state.kj.clusterCreated?11:14}</span><button class="btn btn-secondary" data-route="SESSION_RECORDS">返回 Session</button></div></div><div class="kj-canvas">
    ${clusters.slice(0,state.kj.clusterCreated?5:4).map(c=>clusterHtml(c,selected===c.id,selected&&selected!==c.id)).join("")}
    <section class="kj-cluster ${selected?"is-muted":""}" style="left:7%;top:58%"><div class="cluster-title"><strong>未归类</strong><span class="meta">${state.kj.clusterCreated?11:14} Cards</span></div><div class="card-stack">${[0,1,2,3].map(i=>`<button class="mini-card ${state.kj.selectedCards.includes(`u-${i}`)?"is-selected":""}" data-card="u-${i}" style="left:${i*8}px;top:${i*9}px;transform:rotate(${i%2?2:-2}deg)">${["临时停留发生在树下","周末游客围绕水边聚集","居民借用石块作为座椅","通道被短时活动占用"][i]}</button>`).join("")}</div><div class="meta">+${state.kj.clusterCreated?7:10} stacked</div></section>
    ${state.kj.selectedCards.length?`<div class="selection-context"><span>${state.kj.selectedCards.length} Cards selected</span><button class="btn btn-tertiary" style="color:white" data-action="cancel-card-selection">取消</button><button class="btn btn-primary" data-action="create-cluster-dialog">创建 Cluster ${arrow}</button></div>`:""}
    ${selected==="c2" ? renderKjInsightPanel() : ""}
  </div></section>`;
}

function renderKjInsightPanel() {
  if (!state.insight.published && currentContext().panel!=="draft") return "";
  if (state.insight.published) return `<aside class="insight-panel"><div class="insight-context"><div class="eyebrow">PUBLISHED INSIGHT · V1</div><strong>${demo.session.title}</strong></div><h2>${insightCopy.title}</h2><button class="evidence-cue" data-action="highlight-evidence">14 Supporting · 2 Counter ↗</button><hr class="rule"><div class="eyebrow">RESEARCHER CONFIDENCE</div><h3>Emerging</h3><div class="meta">发布于 2026.09.25 · 霍堂祥</div><hr class="rule"><div class="eyebrow">研究追溯</div><div class="stack"><button class="btn btn-tertiary" data-action="highlight-evidence">查看 Evidence ↗</button><button class="btn btn-tertiary" data-action="locate-kj">在 KJ 中定位 ↗</button><button class="btn btn-tertiary" data-action="map-annotation">在地图中定位 ↗</button></div><hr class="rule"><div class="eyebrow">版本管理</div><button class="btn btn-secondary">创建新版本</button><div class="action-rail">${button("形成设计机会","primary","from-published-insight")}</div></aside>`;
  return `<aside class="insight-panel"><div class="insight-context"><div class="eyebrow">INSIGHT DRAFT</div><strong>${demo.session.title}</strong><div class="meta">来源：自发休憩与岸线共享 · 18 Records</div></div><div class="field"><label>Insight Title</label><input value="${insightCopy.title}"></div><div class="spacer-24"></div><div class="eyebrow">INSIGHT STATEMENT</div><p class="big-question">${insightCopy.statement}</p><hr class="rule"><div class="eyebrow">WHY IT MATTERS / 为什么重要</div><p>${insightCopy.significance}</p><hr class="rule"><button class="evidence-cue" data-action="evidence-check">18 Evidence · 4 Types · 2 Counter · 3 coverage gaps ↗</button><div class="spacer-24"></div><div class="field"><label>Limitations</label><textarea>${insightCopy.limitations}</textarea></div><div class="field"><label>Researcher Confidence</label><select><option>Emerging</option><option>Tentative</option><option>Strong</option></select></div><button class="btn btn-tertiary" data-action="ai-insight-note">AI 建议 · 查看 ↗</button><div class="action-rail"><button class="btn btn-secondary" data-action="save-insight-draft">Save Draft</button><button class="btn btn-primary" data-action="publish-insight">Publish ${arrow}</button></div></aside>`;
}

function renderInsightCreate() {
  const i=state.insight;
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="KJ_WORKSPACE">← 返回 KJ Workspace</button><header class="flow-head"><div><div class="eyebrow">CREATE INSIGHT</div><h1>从 Cluster 提炼洞察</h1><p>来源：自发休憩与岸线共享 · 18 Evidence</p></div><span class="meta">研究者拥有最终判断权</span></header><div class="form-canvas"><div class="stack-lg">
    <div class="segmented"><button class="${i.mode==="human"?"is-active":""}" data-insight-mode="human">自主撰写</button><button class="${i.mode==="ai"?"is-active":""}" data-insight-mode="ai">AI 辅助起草</button></div>
    ${i.mode==="ai"&&!i.adopted?`<section class="form-section"><div class="spread"><div><div class="eyebrow">AI SUGGESTION · NOT CONFIRMED</div><h3>${insightCopy.title}</h3></div><span class="tag">AI 建议</span></div><p>${insightCopy.statement}</p><div class="inline"><button class="btn btn-primary" data-action="adopt-ai-insight">采用并编辑 ${arrow}</button><button class="btn btn-secondary" data-action="discard-ai-insight">丢弃</button></div></section>`:`<div class="field"><label class="required">Insight Title</label><input id="insight-title" value="${escapeHtml(i.title)}" placeholder="用一句话表达洞察"></div><div class="field"><label class="required">Insight Statement</label><textarea id="insight-statement" placeholder="说明观察到的关系与发生条件">${escapeHtml(i.statement)}</textarea></div><div class="field"><label class="required">Significance</label><textarea id="insight-significance" placeholder="为什么这件事值得关注？">${escapeHtml(i.significance)}</textarea></div><div class="field"><label class="optional">Limitations</label><textarea id="insight-limitations">${escapeHtml(i.limitations)}</textarea></div><div class="field"><label class="required">Researcher Confidence</label><select id="insight-confidence"><option>Emerging</option><option>Tentative</option><option>Strong</option></select><span class="meta">Researcher Confidence，不是 AI Confidence 或准确率。</span></div>`}
    <div class="action-rail"><span class="meta">18 Evidence · 4 Types · 2 Counter</span><div class="action-right"><button class="btn btn-secondary" data-action="save-insight-draft">保存草稿</button><button class="btn btn-primary" data-action="publish-insight-page" ${i.title&&i.statement&&i.significance?"":"disabled"}>发布 Insight ${arrow}</button></div></div>
  </div><aside class="form-aside"><div class="eyebrow">EVIDENCE CHECK</div><p>14 Supporting · 2 Counter · 2 Context</p><hr class="rule"><div class="meta">周末样本偏多<br>缺少极端高温与雨季数据<br>老年居民访谈不足</div></aside></div></div>`, "flow-page");
}

function renderInsightPublished() {
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="KJ_WORKSPACE">← 返回 KJ Workspace</button><div class="section-head"><div><div class="eyebrow">PUBLISHED INSIGHT · V1</div><h1>${insightCopy.title}</h1></div><span class="tag is-selected">Published</span></div><div class="editorial-grid"><div><div class="eyebrow">SOURCE</div><p>${demo.session.title}<br>自发休憩与岸线共享 · 18 Records</p></div><div><p class="big-question">${insightCopy.statement}</p><hr class="rule"><div class="eyebrow">为什么重要</div><p>${insightCopy.significance}</p></div><div><button class="evidence-cue" data-action="highlight-evidence">18 Evidence ↗</button><p class="meta">14 Supporting · 2 Counter · 2 Context</p><hr class="rule"><div class="eyebrow">RESEARCHER CONFIDENCE</div><h3>Emerging</h3><p class="meta">霍堂祥 · 2026.09.25<br>AI Assistance：${state.insight.adopted?"有，研究者已接受并编辑":"无，研究者自主撰写"}</p></div></div><div class="action-rail"><div class="inline"><button class="btn btn-tertiary" data-route="KJ_WORKSPACE">在 KJ 中定位 ↗</button><button class="btn btn-tertiary" data-action="map-annotation">在地图中定位 ↗</button></div>${button("形成设计机会","primary","from-published-insight")}</div></div>`, "insight-page");
}

function renderOpportunityCreate() {
  const o=state.opportunity;
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="INSIGHT_PUBLISHED">← 返回 Published Insight</button><header class="flow-head"><div><div class="eyebrow">CREATE DESIGN OPPORTUNITY</div><h1>把洞察转译为设计机会</h1><p>证据关系被继承，但设计问题必须由研究者确认。</p></div><span class="meta">鹅洲 · 18 Evidence</span></header><div class="three-column" style="margin-top:44px"><section class="column-field cyan-strong"><div class="eyebrow">EVIDENCE SOURCE</div><h3>1 Published Insight</h3><p>${insightCopy.title}</p><div class="meta">18 unique Field Records</div></section><section class="column-field"><div class="segmented"><button class="${o.mode==="human"?"is-active":""}" data-opportunity-mode="human">自主定义</button><button class="${o.mode==="ai"?"is-active":""}" data-opportunity-mode="ai">AI 辅助 Framing</button></div>${o.mode==="ai"&&!o.adopted?`<div class="form-section"><div class="eyebrow">AI SUGGESTION · NOT ACTIVE</div><p class="big-question">${opportunityCopy.title}</p><p>${opportunityCopy.framing}</p><div class="inline"><button class="btn btn-primary" data-action="adopt-ai-opportunity">采用并编辑 ${arrow}</button><button class="btn btn-secondary" data-action="discard-ai-opportunity">丢弃</button></div></div>`:`<div class="field" style="margin-top:32px"><label class="required">Design Question</label><textarea id="opportunity-title" class="big-question" placeholder="How might we…">${escapeHtml(o.title)}</textarea></div><div class="field"><label class="required">Design Framing</label><textarea id="opportunity-framing" placeholder="说明设计如何回应洞察，同时保留什么边界。">${escapeHtml(o.framing)}</textarea></div>`}</section><section class="column-field cyan-soft"><div class="eyebrow">VALUES TO PRESERVE</div>${opportunityCopy.values.map(x=>`<p>— ${x}</p>`).join("")}<hr class="rule"><div class="eyebrow">CONSTRAINTS</div>${opportunityCopy.constraints.map(x=>`<p>— ${x}</p>`).join("")}</section></div><div class="action-rail"><span class="meta">AI 不会自动激活 Design Opportunity</span><div class="action-right"><button class="btn btn-secondary" data-action="save-opportunity">保存草稿</button><button class="btn btn-primary" data-action="activate-opportunity" ${o.title&&o.framing?"":"disabled"}>激活设计机会 ${arrow}</button></div></div></div>`, "opportunity-page");
}

function renderOpportunityActive() {
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="INSIGHT_PUBLISHED">← 返回来源 Insight</button><div class="section-head"><div><div class="eyebrow">ACTIVE DESIGN OPPORTUNITY</div><h1>${opportunityCopy.title}</h1></div><span class="tag is-selected">Active</span></div><div class="three-column"><section class="column-field cyan-strong"><div class="eyebrow">EVIDENCE SOURCE</div><h3>1 Published Insight</h3><p>${insightCopy.title}</p><button class="btn btn-tertiary" data-route="INSIGHT_PUBLISHED">查看来源 Insight ↗</button></section><section class="column-field"><div class="eyebrow">DESIGN FRAMING</div><p class="big-question">${opportunityCopy.framing}</p><hr class="rule"><button class="btn btn-secondary" data-action="manage-insights">管理来源洞察</button></section><section class="column-field cyan-soft"><div class="eyebrow">VALUES / CONSTRAINTS</div>${opportunityCopy.values.concat(opportunityCopy.constraints).map(x=>`<p>— ${x}</p>`).join("")}</section></div><div class="action-rail"><span class="meta">Opportunity 已激活 · 可进入 Proposal</span>${button("创建 Proposal","primary","start-proposal")}</div></div>`, "opportunity-page");
}

function renderProposalStart() {
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="OPPORTUNITY_ACTIVE">← 返回设计机会</button><header class="flow-head"><div><div class="eyebrow">PROPOSAL START</div><h1>从证据开始形成方案</h1><p>设计依据将随 Proposal 保留，支持从成果反向追溯到 Insight 与 Field Record。</p></div><span class="meta">鹅洲 · Active Opportunity</span></header><section class="proposal-section"><div><div class="eyebrow">设计依据</div></div><div><h3>${opportunityCopy.title}</h3><p>${insightCopy.title}</p><button class="btn btn-tertiary" data-route="INSIGHT_PUBLISHED">查看来源 Insight ↗</button></div></section><div class="proposal-choice"><button class="choice-panel" data-action="proposal-upload"><div><div class="eyebrow">01 / UPLOAD</div><h2>上传已有方案</h2><p>上传 PDF、图像或视频，并补齐档案信息。</p></div><span>选择上传路径 →</span></button><button class="choice-panel" data-action="proposal-creator"><div><div class="eyebrow">02 / CREATOR</div><h2>使用方案编辑器</h2><p>从 0 个内容块开始，逐步组织图像、文本与附件。</p></div><span>选择编辑器路径 →</span></button></div></div>`, "proposal-start");
}

function renderProposalUpload() {
  const p=state.proposal;
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="PROPOSAL_START">← 返回 Proposal Start</button><header class="flow-head"><div><div class="eyebrow">PROPOSAL / UPLOAD</div><h1>上传已有方案</h1></div><span class="meta">设计依据已关联 · 鹅洲</span></header><div class="form-canvas"><div class="stack-lg">
    ${!p.fileSelected?`<button class="media-drop" data-action="demo-file"><span><strong>选择主方案文件</strong><br><span class="meta">或使用 Demo 文件：鹅洲岸线设计方案.pdf</span></span></button>`:`<div class="file-preview"><img src="assets/images/proposal-attachment-board.png" alt="PDF 第一页预览"><div><div class="eyebrow">PRIMARY FILE</div><h3>鹅洲岸线设计方案.pdf</h3><p>PDF · 24.6 MB</p><div class="inline"><span class="tag is-selected">主方案文件</span><button class="btn btn-tertiary" data-action="remove-demo-file">移除</button></div></div></div>`}
    <div class="field"><label class="required">方案标题</label><input id="proposal-title" value="${escapeHtml(p.title)}"></div><div class="field"><label class="required">方案简介</label><textarea id="proposal-description">${escapeHtml(p.description)}</textarea></div><div class="field"><label class="required">附件角色</label><select id="attachment-role"><option>主方案文件</option><option>补充附件</option></select></div><div class="action-rail"><button class="btn btn-secondary" data-action="save-proposal-draft">保存草稿</button><button class="btn btn-primary" data-action="preview-proposal" ${p.fileSelected&&p.title&&p.description?"":"disabled"}>预览方案 ${arrow}</button></div>
    </div><aside class="form-aside"><div class="eyebrow">PROPOSAL COVER</div><img src="assets/images/proposal-shared-shoreline.png" alt="方案封面"><p class="meta">封面用于详情 Hero、成果库、搜索与分享预览。它与附件预览严格分离。</p></aside></div></div>`, "proposal-page");
}

function renderProposalCreator() {
  const blocks=state.proposal.blocks;
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="PROPOSAL_START">← 返回 Proposal Start</button><header class="flow-head"><div><div class="eyebrow">PROPOSAL / CREATOR</div><h1>方案编辑器</h1><p>当前 ${blocks.length} 个内容块</p></div><span class="meta">不会载入旧内容</span></header><div class="creator-shell" style="margin-top:44px"><aside class="block-palette"><div class="eyebrow">ADD BLOCK</div>${["Image","Full Width Image","Image Pair","Text","Text + Image","Section Title","Attachment","Spacer"].map(x=>`<button class="block-option" data-add-block="${x}">＋ ${x}</button>`).join("")}</aside><div class="creator-canvas">${blocks.length===0?`<div class="creator-empty"><div><h3>0 blocks</h3><p>从左侧选择第一种内容结构</p></div></div>`:blocks.map((b,i)=>renderCreatorBlock(b,i)).join("")}</div></div><div class="action-rail"><button class="btn btn-secondary" data-action="save-proposal-draft">保存草稿</button><button class="btn btn-primary" data-action="preview-proposal" ${blocks.length?"":"disabled"}>预览方案 ${arrow}</button></div></div>`, "proposal-page");
}

function renderCreatorBlock(block,index) {
  const content = block.type.toLowerCase().includes("image")
    ? `<img src="assets/images/proposal-shared-shoreline.png" alt="方案内容图像"><input data-block-caption="${index}" value="${escapeHtml(block.caption || "鹅洲北岸共享空间意向图")}" aria-label="图片说明">`
    : block.type === "Text"
      ? `<textarea data-block-text="${index}">通过可逆的微介入保护自然遮荫与连续通行。</textarea>`
      : `<div class="media-drop">${block.type} 内容块</div>`;
  return `<section class="creator-block"><div class="eyebrow">${String(index+1).padStart(2,"0")} / ${block.type}</div>${content}<div class="block-tools"><button data-move-block="up" data-index="${index}">上移</button><button data-move-block="down" data-index="${index}">下移</button><button data-delete-block="${index}">删除</button></div></section>`;
}

function renderProposalDraft() {
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="OPPORTUNITY_ACTIVE">← 返回设计机会</button><div class="section-head"><div><div class="eyebrow">PROPOSAL · DRAFT</div><h1>${state.proposal.title}</h1><p>${state.proposal.description}</p></div><span class="tag">Draft</span></div><section class="proposal-section"><div><div class="eyebrow">方案封面</div></div><img src="assets/images/proposal-shared-shoreline.png" alt="方案封面"></section><section class="proposal-section"><div><div class="eyebrow">档案信息</div></div><div class="proposal-meta"><span>2026</span><span>设计小组</span><span>上传者 霍堂祥</span><span>上传于 2026.09.05</span></div></section><section class="proposal-section"><div><div class="eyebrow">方案附件</div></div><div><h3>主方案文件</h3><p>鹅洲岸线设计方案.pdf · PDF · 24.6 MB</p></div></section><section class="proposal-section"><div><div class="eyebrow">设计依据</div></div><p>${opportunityCopy.title}</p></section><div class="action-rail"><button class="btn btn-secondary" data-action="save-proposal-draft">保存草稿</button><button class="btn btn-primary" data-action="publish-proposal">发布方案 ${arrow}</button></div></div>`, "proposal-page");
}

function renderProposalPublished() {
  const context=currentContext();
  const backLabel=context.source==="archive"?"返回成果库":context.source==="search"?"返回搜索结果":context.source==="place"?"返回鹅洲方案档案":"返回设计机会";
  return pageShell(`<div class="flow-shell"><button class="back-link" data-action="back">← ${backLabel}</button><figure class="proposal-hero"><img src="assets/images/proposal-shared-shoreline.png" alt="鹅洲岸线共享设计方案封面"><figcaption class="proposal-hero-copy"><div class="eyebrow" style="color:rgba(255,255,255,.72)">PUBLISHED PROPOSAL</div><h1>鹅洲岸线共享设计方案</h1></figcaption></figure><p class="reading big-question">以可逆、轻量的空间介入协调居民日常交流、游客短时休憩与岸线连续通行。</p><div class="proposal-meta"><span>2026</span><span>2026 春季鹅洲综合调研 · 设计小组</span><span>上传者 霍堂祥</span><span>上传于 2026.09.05</span><button class="btn btn-tertiary" data-action="jump-attachments">4 个附件 ↘</button></div>
    <section class="proposal-section"><div><div class="eyebrow">设计意图</div></div><p class="big-question">让自然岸线继续承担主要空间价值，以最少建设建立清晰而温和的共享秩序。</p></section><section class="proposal-section"><div><div class="eyebrow">设计回应</div></div><p>在现有树荫、江景和路径节点上布置可逆遮荫、轻量座椅与连续通行提示，避免把岸线变成固定功能分区。</p></section><section class="proposal-section"><div><div class="eyebrow">主要策略</div></div><div class="strategy-list">${[["01","自然遮荫优先","优先利用现有乔木形成的舒适停留区。"],["02","可逆式介入","所有新增设施可拆卸、可调整，不固化岸线。"],["03","保障连续通行","在高峰停留节点保留清晰而连续的通行带。"],["04","适应季节变化","根据汛期、温度和植被变化调整设施布置。"]].map(x=>`<div class="strategy-row"><span>${x[0]}</span><div><h3>${x[1]}</h3><p>${x[2]}</p></div></div>`).join("")}</div></section><section class="proposal-section"><div><div class="eyebrow">设计依据</div></div><div><p>${opportunityCopy.title}</p><button class="btn btn-tertiary" data-route="OPPORTUNITY_ACTIVE">查看设计机会 ↗</button><button class="btn btn-tertiary" data-route="INSIGHT_PUBLISHED">查看来源 Insight ↗</button></div></section>
    <section class="proposal-section" id="proposal-attachments"><div><div class="eyebrow">方案附件</div></div><div><h2>主方案文件</h2><div class="attachment-primary"><img src="assets/images/proposal-attachment-board.png" alt="主方案 PDF 第一页预览"><div><h3>鹅洲岸线共享设计方案.pdf</h3><p>PDF · 24.6 MB</p><div class="meta">上传于 2026.09.05<br>上传者：霍堂祥</div></div></div><h3 style="margin-top:34px">补充附件</h3>${[["01","鹅洲调研报告.pdf","PDF · 12.1 MB"],["02","课程展板.pdf","PDF · 8.3 MB"],["03","设计演示视频.mp4","MP4 · 46 MB"]].map(x=>`<div class="attachment-row"><span>${x[0]}</span><strong>${x[1]}</strong><span class="meta">${x[2]}</span></div>`).join("")}</div></section></div>`, "proposal-detail");
}

function renderMyWork() {
  const reviewer=state.role==="reviewer";
  const tab=state.myWorkTab;
  return pageShell(`<header class="section-head"><div><div class="eyebrow">MY WORK · ${reviewer?"REVIEWER":"STUDENT"}</div><h1>我的工作</h1></div><button class="btn btn-secondary" data-action="switch-role">切换为${reviewer?"学生":"评审"}视图</button></header><div class="work-tabs">${reviewer?`<button class="${tab==="pending"?"is-active":""}" data-work-tab="pending">待审核</button>`:""}<button class="${tab==="ongoing"?"is-active":""}" data-work-tab="ongoing">进行中</button><button class="${tab==="completed"?"is-active":""}" data-work-tab="completed">已完成</button></div><div class="data-list">${reviewer&&tab==="pending"?`<button class="data-row" data-route="CONTRIBUTION_REVIEW"><span>待审核</span><strong>${demo.session.title}</strong><span>学生贡献 · 1 条新记录</span><span>审核 →</span></button>`:tab==="completed"?`<button class="data-row" data-route="PROPOSAL_PUBLISHED"><span>方案</span><strong>鹅洲岸线共享设计方案</strong><span>Published · 2026.09.05</span><span>查看 ↗</span></button>`:`<button class="data-row" data-route="SESSION_OVERVIEW"><span>调研</span><strong>${demo.session.title}</strong><span>${state.recordsCreated} Records · 准备中</span><span>继续 →</span></button>`}</div>`, "work-page");
}

function renderContributionReview() {
  return pageShell(`<div class="flow-shell"><button class="back-link" data-route="MY_WORK">← 返回待审核</button><header class="flow-head"><div><div class="eyebrow">CONTRIBUTION REVIEW</div><h1>审核田野记录贡献</h1><p>${demo.session.title} · 鹅洲北岸</p></div><span class="tag">Pending</span></header><div class="review-layout" style="padding-top:44px"><div><img class="media-preview" src="assets/images/proposal-ecology-monitoring.jpg" alt="提交的田野照片"><h2 style="margin-top:30px">树荫下的长时间停留</h2><p>午后树荫下持续出现居民与游客停留，通行路径在高峰时段被压缩。</p><div class="inline"><span class="tag">Observation</span><span class="tag">Behavior</span><span class="tag">Facility</span></div></div><aside><section class="privacy-preview"><div class="eyebrow">PUBLIC PROJECTION</div><h3>公开后显示</h3><p>观察描述、处理后的照片、Evidence Type、Content Tag 与近似位置。</p><hr class="rule"><div class="eyebrow">PRIVACY</div><p class="meta">人物面部模糊 · 精确位置降采样 · 不公开研究者私人备注</p></section><div class="field" style="margin-top:26px"><label class="optional">拒绝原因</label><textarea id="review-reason" placeholder="仅在拒绝时说明原因"></textarea></div><div class="action-rail"><button class="btn btn-secondary" data-action="reject-contribution">拒绝</button><button class="btn btn-primary" data-action="include-contribution">纳入研究 ${arrow}</button></div></aside></div></div>`, "review-page");
}

function renderQa() {
  const tests=["Logo → Home","Menu open / close","Home Create → Select 鹅洲","Preparation methods","Date range","Registered user","Research scope","Desktop Field Record","1 Record → KJ","KJ 3 cards → Cluster","Cluster → Insight human","Cluster → Insight AI","Insight → Opportunity human","Proposal Upload","Proposal Creator","Archive back context","Search back context","Reviewer include"];
  const passed=Object.values(state.qa).filter(Boolean).length;
  return pageShell(`<header class="section-head"><div><div class="eyebrow">INTERNAL / QA MODE</div><h1>Prototype QA</h1></div><button class="btn btn-secondary" data-action="reset-demo">Reset Demo State</button></header><div class="qa-grid"><section class="qa-card"><div class="eyebrow">STUDENT FLOW</div><h3>Research → Evidence → Proposal</h3><button class="btn btn-primary" data-route="HOME">开始 Student Flow ${arrow}</button></section><section class="qa-card"><div class="eyebrow">REVIEWER FLOW</div><h3>Pending Contribution Review</h3><button class="btn btn-primary" data-action="qa-reviewer">开始 Reviewer Flow ${arrow}</button></section><section class="qa-card"><div class="eyebrow">VISITOR FLOW</div><h3>Explore → Search → Archive</h3><button class="btn btn-primary" data-action="qa-visitor">开始 Visitor Flow ${arrow}</button></section></div><div class="spacer-48"></div><div class="spread"><h2>18 Task Tests</h2><strong>${passed} / 18</strong></div><div class="data-list">${tests.map((t,i)=>`<div class="qa-result"><span>${String(i+1).padStart(2,"0")} · ${t}</span><span class="${state.qa[i+1]?"qa-pass":"muted"}">${state.qa[i+1]?"PASS":"PENDING"}</span></div>`).join("")}</div><p class="meta" style="margin-top:24px">QA Mode 仅供内部验证，不出现在教师正常演示导航中。</p>`, "qa-page");
}

function render(route=currentRoute(), context=currentContext()) {
  renderNav(route);
  const routes={
    HOME:renderHome, PLACE:renderPlace, EXISTING_RESEARCH:renderExistingResearch, RESEARCH_GAPS:renderGaps, PLACE_FIELD_RECORDS:renderFieldRecords, PLACE_PROPOSALS:renderPlaceProposals,
    GLOBAL_SEARCH:renderSearch, GLOBAL_ARCHIVE:renderArchive,
    CREATE_RESEARCH_GLOBAL:()=>renderCreateResearch("CREATE_RESEARCH_GLOBAL"), CREATE_RESEARCH_PLACE:()=>renderCreateResearch("CREATE_RESEARCH_PLACE"), CREATE_RESEARCH_GAP:()=>renderCreateResearch("CREATE_RESEARCH_GAP"),
    SESSION_OVERVIEW:renderSessionOverview, SESSION_PREPARATION:renderPreparation, SESSION_RECORDS:renderSessionRecords,
    FIELD_RECORD_CREATE_DESKTOP:renderRecordDesktop, FIELD_RECORD_CREATE_MOBILE:renderRecordMobile, FIELD_RECORD_SAVED:renderRecordSaved,
    KJ_WORKSPACE:renderKj, INSIGHT_CREATE:renderInsightCreate, INSIGHT_PUBLISHED:renderInsightPublished,
    OPPORTUNITY_CREATE:renderOpportunityCreate, OPPORTUNITY_ACTIVE:renderOpportunityActive,
    PROPOSAL_START:renderProposalStart, PROPOSAL_UPLOAD:renderProposalUpload, PROPOSAL_CREATOR:renderProposalCreator, PROPOSAL_DRAFT:renderProposalDraft, PROPOSAL_PUBLISHED:renderProposalPublished,
    MY_WORK:renderMyWork, CONTRIBUTION_REVIEW:renderContributionReview, QA:renderQa,
  };
  app.innerHTML=(routes[route]||renderHome)();
  app.dataset.route=route;
  requestAnimationFrame(()=>app.focus({preventScroll:true}));
}

function markQa(id) { state.qa[id]=true; nested("qa",state.qa); }

function routeFrom(el) {
  const route=el.dataset.route;
  if (route) navigate(route);
  return Boolean(route);
}

document.addEventListener("click", e => {
  const target=e.target.closest("button, [data-action], [data-route], [data-card], [data-cluster], [data-gap]");
  if (!target) return;
  if (routeFrom(target)) {
    if (target.dataset.route==="HOME") markQa(1);
    state.menuOpen=false; update({menuOpen:false}); return;
  }
  const action=target.dataset.action;
  if (target.dataset.proposal) {
    const source=target.dataset.source||"archive";
    if(source==="archive") state.archive.selectedProposal=target.dataset.proposal;
    if(source==="search") state.search.selectedProposal=target.dataset.proposal;
    navigate("PROPOSAL_PUBLISHED",{source}); return;
  }
  if (target.dataset.filterPlace) { state.archive.place=target.dataset.filterPlace; nested("archive",state.archive); render("GLOBAL_ARCHIVE"); return; }
  if (target.dataset.filterYear) { state.archive.year=state.archive.year===target.dataset.filterYear?"":target.dataset.filterYear; nested("archive",state.archive); render("GLOBAL_ARCHIVE"); return; }
  if (target.dataset.filterSource) { state.archive.source=state.archive.source===target.dataset.filterSource?"":target.dataset.filterSource; nested("archive",state.archive); render("GLOBAL_ARCHIVE"); return; }
  if (target.dataset.filterTeam) { state.archive.team=state.archive.team===target.dataset.filterTeam?"":target.dataset.filterTeam; nested("archive",state.archive); render("GLOBAL_ARCHIVE"); return; }
  if (target.dataset.searchTab) { state.search.tab=target.dataset.searchTab; nested("search",state.search); render("GLOBAL_SEARCH"); return; }
  if (target.dataset.insightMode) { state.insight.mode=target.dataset.insightMode; nested("insight",state.insight); render("INSIGHT_CREATE"); return; }
  if (target.dataset.opportunityMode) { state.opportunity.mode=target.dataset.opportunityMode; nested("opportunity",state.opportunity); render("OPPORTUNITY_CREATE"); return; }
  if (target.dataset.workTab) { state.myWorkTab=target.dataset.workTab; update({myWorkTab:state.myWorkTab}); render("MY_WORK"); return; }
  if (target.dataset.recordType) { state.recordDraft.type=target.dataset.recordType; nested("recordDraft",state.recordDraft); render("FIELD_RECORD_CREATE_DESKTOP"); return; }
  if (target.dataset.recordTag) { const tag=target.dataset.recordTag; state.recordDraft.tags=state.recordDraft.tags.includes(tag)?state.recordDraft.tags.filter(x=>x!==tag):[...state.recordDraft.tags,tag]; nested("recordDraft",state.recordDraft); render("FIELD_RECORD_CREATE_DESKTOP"); return; }
  if (target.dataset.locationMode) { state.recordDraft.location=target.dataset.locationMode; nested("recordDraft",state.recordDraft); render("FIELD_RECORD_CREATE_DESKTOP"); return; }
  if (target.dataset.mobileType) { state.mobileDraft.type=target.dataset.mobileType; nested("mobileDraft",state.mobileDraft); render("FIELD_RECORD_CREATE_MOBILE"); return; }
  if (target.dataset.removeMember) { state.prep.members=state.prep.members.filter(x=>x!==target.dataset.removeMember); nested("prep",state.prep); render("SESSION_PREPARATION"); return; }
  if (target.dataset.card) { const id=target.dataset.card; state.kj.selectedCards=state.kj.selectedCards.includes(id)?state.kj.selectedCards.filter(x=>x!==id):[...state.kj.selectedCards,id]; nested("kj",state.kj); render("KJ_WORKSPACE"); return; }
  if (target.dataset.cluster) { state.kj.selectedCluster=target.dataset.cluster; nested("kj",state.kj); navigate("KJ_WORKSPACE",{}, {replace:true,instant:true}); return; }
  if (target.dataset.addBlock) { state.proposal.blocks.push({type:target.dataset.addBlock,caption:""}); nested("proposal",state.proposal); render("PROPOSAL_CREATOR"); return; }
  if (target.dataset.deleteBlock!==undefined) { state.proposal.blocks.splice(Number(target.dataset.deleteBlock),1); nested("proposal",state.proposal); render("PROPOSAL_CREATOR"); return; }
  if (target.dataset.moveBlock) { const i=Number(target.dataset.index); const j=target.dataset.moveBlock==="up"?i-1:i+1; if(j>=0&&j<state.proposal.blocks.length){[state.proposal.blocks[i],state.proposal.blocks[j]]=[state.proposal.blocks[j],state.proposal.blocks[i]]; nested("proposal",state.proposal); render("PROPOSAL_CREATOR");} return; }
  if (target.dataset.gap) { document.querySelectorAll("[data-gap]").forEach(x=>x.classList.toggle("is-selected",x.dataset.gap===target.dataset.gap)); document.querySelectorAll("[data-gap-evidence]").forEach(x=>x.classList.toggle("is-muted",x.dataset.gapEvidence!==target.dataset.gap)); return; }
  switch(action) {
    case "toggle-menu": state.menuOpen=!state.menuOpen; update({menuOpen:state.menuOpen}); renderNav(currentRoute()); if(state.menuOpen) markQa(2); break;
    case "toggle-login": state.loggedIn=!state.loggedIn; update({loggedIn:state.loggedIn,menuOpen:false}); renderNav(currentRoute()); toast(state.loggedIn?"已登录原型账户":"已退出原型账户"); break;
    case "back": goBack(); break;
    case "global-create": state.selectPlaceMode=true; state.selectedPlace=""; state.createOrigin="global"; update({selectPlaceMode:true,selectedPlace:"",createOrigin:"global",menuOpen:false}); navigate("HOME"); break;
    case "place-create": state.createOrigin="place"; state.selectedPlace="鹅洲"; update({createOrigin:"place",selectedPlace:"鹅洲"}); navigate("CREATE_RESEARCH_PLACE"); break;
    case "gap-create": state.createOrigin="gap"; state.selectedPlace="鹅洲"; state.selectedGap="生态保护与使用需求"; update({createOrigin:"gap",selectedPlace:"鹅洲",selectedGap:state.selectedGap}); navigate("CREATE_RESEARCH_GAP"); break;
    case "open-place": navigate("PLACE"); break;
    case "expand-cluster": state.homeClusterExpanded=!state.homeClusterExpanded; update({homeClusterExpanded:state.homeClusterExpanded}); render("HOME"); break;
    case "select-ezhou": state.selectedPlace="鹅洲"; update({selectedPlace:"鹅洲"}); render("HOME"); break;
    case "continue-place-select": markQa(3); state.selectPlaceMode=false; update({selectPlaceMode:false}); navigate("CREATE_RESEARCH_PLACE"); break;
    case "cancel-place-select": state.selectPlaceMode=false; update({selectPlaceMode:false}); render("HOME"); break;
    case "open-place-picker": state.selectPlaceMode=true; update({selectPlaceMode:true}); navigate("HOME"); break;
    case "gis-entry": toast("GIS 影像入口 · Demo 以当前图像 Focus 表达"); break;
    case "filter-behavior": state.fieldFilter="behavior"; update({fieldFilter:"behavior"}); render("PLACE_FIELD_RECORDS"); break;
    case "filter-all": state.fieldFilter=""; update({fieldFilter:""}); render("PLACE_FIELD_RECORDS"); break;
    case "filter-cluster": toast("Cluster 在当前 Zoom 下解聚为单条 Field Record"); break;
    case "open-record": navigate("FIELD_RECORD_SAVED",{source:"place-map"}); break;
    case "clear-archive-filter": Object.assign(state.archive,{place:"",year:"",source:"",team:""}); nested("archive",state.archive); render("GLOBAL_ARCHIVE"); break;
    case "create-session": state.sessionCreated=true; update({sessionCreated:true}); toast("Research Session 已创建"); navigate("SESSION_PREPARATION"); break;
    case "open-preparation": navigate("SESSION_PREPARATION"); break;
    case "open-session-records": navigate("SESSION_RECORDS"); break;
    case "methods-popover": showMethods(target); break;
    case "members-popover": showMembers(target); break;
    case "scope-select": showScopeDialog(); break;
    case "save-prep": toast("调研准备已保存"); break;
    case "start-collection": navigate("SESSION_RECORDS"); break;
    case "new-desktop-record": navigate("FIELD_RECORD_CREATE_DESKTOP"); break;
    case "new-mobile-record": navigate("FIELD_RECORD_CREATE_MOBILE"); break;
    case "add-photo": state.recordDraft.photo=true; nested("recordDraft",state.recordDraft); render("FIELD_RECORD_CREATE_DESKTOP"); break;
    case "remove-photo": state.recordDraft.photo=false; nested("recordDraft",state.recordDraft); render("FIELD_RECORD_CREATE_DESKTOP"); break;
    case "save-record": state.recordsCreated=Math.max(1,state.recordsCreated); update({recordsCreated:state.recordsCreated}); markQa(8); toast("田野记录已保存"); navigate("FIELD_RECORD_SAVED"); break;
    case "mobile-photo": state.mobileDraft.photo=true; nested("mobileDraft",state.mobileDraft); render("FIELD_RECORD_CREATE_MOBILE"); break;
    case "save-mobile": state.recordsCreated=Math.max(1,state.recordsCreated); update({recordsCreated:state.recordsCreated}); toast("手机记录已同步"); navigate("FIELD_RECORD_SAVED"); break;
    case "open-saved-record": navigate("FIELD_RECORD_SAVED"); break;
    case "open-kj": if(state.recordsCreated>0) markQa(9); navigate("KJ_WORKSPACE"); break;
    case "cancel-card-selection": state.kj.selectedCards=[]; nested("kj",state.kj); render("KJ_WORKSPACE"); break;
    case "create-cluster-dialog": showClusterDialog(); break;
    case "rename-cluster": showClusterDialog(); break;
    case "add-cluster-card": toast("已进入移入卡片模式 · 选择未归类卡片后加入当前 Cluster"); break;
    case "remove-cluster-card": toast("已移除 1 张代表卡片并保留其 Evidence 关系（Demo）"); break;
    case "synthesize-insight": navigate("INSIGHT_CREATE"); break;
    case "evidence-check": toast("Evidence Check 展开为 annotation：14 Supporting · 2 Counter · 2 Context"); break;
    case "ai-insight-note": toast("AI 起草了初步表述；研究者已接受并编辑。后台保留可追溯记录。"); break;
    case "save-insight-draft": toast("Insight Draft 已保存"); break;
    case "publish-insight": state.insight.published=true; nested("insight",state.insight); navigate("KJ_WORKSPACE",{panel:"published"},{replace:true}); break;
    case "publish-insight-page": state.insight.published=true; nested("insight",state.insight); markQa(state.insight.mode==="ai"?12:11); toast("Insight 已发布"); navigate("INSIGHT_PUBLISHED"); break;
    case "adopt-ai-insight": Object.assign(state.insight,{adopted:true,title:insightCopy.title,statement:insightCopy.statement,significance:insightCopy.significance,limitations:insightCopy.limitations}); nested("insight",state.insight); render("INSIGHT_CREATE"); break;
    case "discard-ai-insight": state.insight.mode="human"; state.insight.aiSuggested=false; nested("insight",state.insight); render("INSIGHT_CREATE"); break;
    case "highlight-evidence": toast("已高亮 18 条关联 Evidence（Demo Annotation）"); break;
    case "locate-kj": state.kj.selectedCluster="c2"; nested("kj",state.kj); render("KJ_WORKSPACE"); break;
    case "map-annotation": toast("在地图中定位：本轮以 Annotation 表达，不新增地图状态页"); break;
    case "from-published-insight": navigate("OPPORTUNITY_CREATE"); break;
    case "adopt-ai-opportunity": Object.assign(state.opportunity,{adopted:true,title:opportunityCopy.title,framing:opportunityCopy.framing}); nested("opportunity",state.opportunity); render("OPPORTUNITY_CREATE"); break;
    case "discard-ai-opportunity": state.opportunity.mode="human"; nested("opportunity",state.opportunity); render("OPPORTUNITY_CREATE"); break;
    case "save-opportunity": toast("Design Opportunity Draft 已保存"); break;
    case "activate-opportunity": state.opportunity.active=true; nested("opportunity",state.opportunity); markQa(13); toast("Design Opportunity 已激活"); navigate("OPPORTUNITY_ACTIVE"); break;
    case "manage-insights": showManageInsights(); break;
    case "start-proposal": navigate("PROPOSAL_START"); break;
    case "proposal-upload": state.proposal.path="upload"; nested("proposal",state.proposal); navigate("PROPOSAL_UPLOAD"); break;
    case "proposal-creator": state.proposal.path="creator"; state.proposal.blocks=[]; nested("proposal",state.proposal); navigate("PROPOSAL_CREATOR"); break;
    case "demo-file": state.proposal.fileSelected=true; nested("proposal",state.proposal); render("PROPOSAL_UPLOAD"); break;
    case "remove-demo-file": state.proposal.fileSelected=false; nested("proposal",state.proposal); render("PROPOSAL_UPLOAD"); break;
    case "save-proposal-draft": toast("Proposal Draft 已保存"); break;
    case "preview-proposal": markQa(state.proposal.path==="upload"?14:15); navigate("PROPOSAL_DRAFT"); break;
    case "publish-proposal": state.proposal.published=true; nested("proposal",state.proposal); toast("方案已发布"); navigate("PROPOSAL_PUBLISHED",{source:"opportunity"}); break;
    case "jump-attachments": document.querySelector("#proposal-attachments")?.scrollIntoView({behavior:"smooth"}); break;
    case "switch-role": state.role=state.role==="reviewer"?"student":"reviewer"; state.myWorkTab=state.role==="reviewer"?"pending":"ongoing"; update({role:state.role,myWorkTab:state.myWorkTab}); render("MY_WORK"); break;
    case "include-contribution": state.reviewDecision="included"; update({reviewDecision:"included"}); markQa(18); toast("贡献已纳入 Research Session"); navigate("MY_WORK"); break;
    case "reject-contribution": if(!document.querySelector("#review-reason")?.value.trim()){toast("请先填写拒绝原因");return;} state.reviewDecision="rejected"; update({reviewDecision:"rejected"}); toast("已拒绝并记录原因"); navigate("MY_WORK"); break;
    case "qa-reviewer": state.role="reviewer"; state.myWorkTab="pending"; update({role:"reviewer",myWorkTab:"pending"}); navigate("MY_WORK"); break;
    case "qa-visitor": state.loggedIn=false; update({loggedIn:false}); navigate("HOME"); break;
    case "reset-demo": resetState(); toast("Demo State 已重置"); render("QA"); break;
  }
});

document.addEventListener("input", e => {
  const id=e.target.id, value=e.target.value;
  if(id==="global-search-input"){state.search.query=value;nested("search",state.search);window.clearTimeout(window.__searchTimer);window.__searchTimer=window.setTimeout(()=>render("GLOBAL_SEARCH"),220);}
  if(id==="prep-question"){state.prep.question=value;nested("prep",state.prep);}
  if(id==="prep-objective"){state.prep.objective=value;nested("prep",state.prep);}
  if(id==="date-start"){state.prep.start=value;nested("prep",state.prep);markQa(5);render("SESSION_PREPARATION");}
  if(id==="date-end"){state.prep.end=value;nested("prep",state.prep);markQa(5);render("SESSION_PREPARATION");}
  if(id==="record-observation"){state.recordDraft.observation=value;nested("recordDraft",state.recordDraft);}
  if(id==="mobile-observation"){state.mobileDraft.observation=value;nested("mobileDraft",state.mobileDraft);}
  if(id==="insight-title"){state.insight.title=value;nested("insight",state.insight);}
  if(id==="insight-statement"){state.insight.statement=value;nested("insight",state.insight);}
  if(id==="insight-significance"){state.insight.significance=value;nested("insight",state.insight);}
  if(id==="insight-limitations"){state.insight.limitations=value;nested("insight",state.insight);}
  if(id==="opportunity-title"){state.opportunity.title=value;nested("opportunity",state.opportunity);}
  if(id==="opportunity-framing"){state.opportunity.framing=value;nested("opportunity",state.opportunity);}
  if(id==="proposal-title"){state.proposal.title=value;nested("proposal",state.proposal);}
  if(id==="proposal-description"){state.proposal.description=value;nested("proposal",state.proposal);}
  if(e.target.dataset.blockCaption!==undefined){state.proposal.blocks[Number(e.target.dataset.blockCaption)].caption=value;nested("proposal",state.proposal);}
  if(e.target.dataset.blockText!==undefined){state.proposal.blocks[Number(e.target.dataset.blockText)].text=value;nested("proposal",state.proposal);}
  const publishInsight=document.querySelector('[data-action="publish-insight-page"]');
  if(publishInsight) publishInsight.disabled=!(state.insight.title&&state.insight.statement&&state.insight.significance);
  const activateOpportunity=document.querySelector('[data-action="activate-opportunity"]');
  if(activateOpportunity) activateOpportunity.disabled=!(state.opportunity.title&&state.opportunity.framing);
});

document.addEventListener("change", e => {
  if(e.target.id==="insight-confidence"){state.insight.confidence=e.target.value;nested("insight",state.insight);}
  if(e.target.id==="attachment-role"){state.proposal.role=e.target.value;nested("proposal",state.proposal);}
});

document.addEventListener("prototype:escape",()=>{ if(state.menuOpen){state.menuOpen=false;update({menuOpen:false});renderNav(currentRoute());} });
document.addEventListener("click",e=>{
  if(state.menuOpen && !e.target.closest(".nav-right") && !e.target.closest(".account-menu")){
    state.menuOpen=false; update({menuOpen:false}); renderNav(currentRoute());
  }
});

function showMethods(anchor) {
  const methods=["Observation","Interview","Photo / Video","Measurement","Document / Secondary Research"];
  showPopover(anchor,`<div class="popover-title">选择研究方法 · 可多选</div>${methods.map(x=>`<button class="popover-option ${state.prep.methods.includes(x)?"is-selected":""}" data-method="${x}">${x}</button>`).join("")}<div class="action-rail"><span class="meta">${state.prep.methods.length} selected</span><button class="btn btn-primary" data-action="confirm-methods">确认 ${arrow}</button></div>`);
}

function showMembers(anchor) {
  showPopover(anchor,`<div class="popover-title">添加已注册用户</div><input id="member-search" placeholder="搜索姓名或组织"><div id="member-options">${users.filter(u=>u.id!=="u1").map(u=>`<button class="popover-option ${state.prep.members.includes(u.id)?"is-selected":""}" data-member="${u.id}"><span>${u.name}<small class="meta"> · ${u.org}</small></span></button>`).join("")}</div>`);
}

function showScopeDialog() {
  showDialog(`<div class="dialog-head"><div><div class="eyebrow">RESEARCH SCOPE</div><h2>选择调研范围</h2></div><button class="dialog-close" data-action="close-dialog" aria-label="关闭">×</button></div><p>在鹅洲范围中选择本次田野采集的空间边界。</p><div class="scope-map"></div><div class="spread" style="margin-top:18px"><div><strong>鹅洲北岸</strong><div class="meta">沿岸线约 2.4 km</div></div><button class="btn btn-primary" data-action="confirm-scope">确认范围 ${arrow}</button></div>`,{label:"选择调研范围"});
}

function showClusterDialog() {
  showDialog(`<div class="dialog-head"><div><div class="eyebrow">CREATE KJ CLUSTER</div><h2>为 ${state.kj.selectedCards.length} 张卡片建立 Cluster</h2></div><button class="dialog-close" data-action="close-dialog">×</button></div><div class="field"><label class="required">Cluster 名称</label><input id="cluster-name" value="${state.kj.clusterName}"></div><div class="action-rail"><button class="btn btn-secondary" data-action="close-dialog">取消</button><button class="btn btn-primary" data-action="confirm-cluster">创建 Cluster ${arrow}</button></div>`,{label:"创建KJ Cluster"});
}

function showManageInsights() {
  showDialog(`<div class="dialog-head"><div><div class="eyebrow">MANAGE INSIGHTS</div><h2>管理来源洞察</h2></div><button class="dialog-close" data-action="close-dialog">×</button></div><div class="data-list"><div class="data-row"><span>V1</span><strong>${insightCopy.title}</strong><span>Published · 18 Evidence</span><button class="btn btn-tertiary">移除引用</button></div></div><div class="action-rail"><button class="btn btn-secondary">添加来源洞察</button><button class="btn btn-primary" data-action="close-dialog">完成 ${arrow}</button></div>`,{label:"管理来源洞察"});
}

document.addEventListener("click", e => {
  const method=e.target.closest("[data-method]");
  if(method){const x=method.dataset.method;state.prep.methods=state.prep.methods.includes(x)?state.prep.methods.filter(m=>m!==x):[...state.prep.methods,x];nested("prep",state.prep);method.classList.toggle("is-selected");return;}
  const member=e.target.closest("[data-member]");
  if(member){
    const id=member.dataset.member;
    state.prep.members=state.prep.members.includes(id)
      ? state.prep.members.filter(x=>x!==id)
      : state.prep.members.length>=2 ? ["u1",id] : [...state.prep.members,id];
    nested("prep",state.prep);
    if(state.prep.members.length>=2){markQa(6);closePopover();render("SESSION_PREPARATION");}
    else member.classList.toggle("is-selected");
    return;
  }
  const a=e.target.closest("[data-action]")?.dataset.action;
  if(a==="confirm-methods"){markQa(4);closePopover();render("SESSION_PREPARATION");}
  if(a==="confirm-scope"){state.prep.scope="鹅洲北岸 · 2.4 km";nested("prep",state.prep);markQa(7);closeDialog();render("SESSION_PREPARATION");}
  if(a==="close-dialog") closeDialog();
  if(a==="confirm-cluster"){const name=document.querySelector("#cluster-name")?.value.trim()||"自发休憩与岸线共享";state.kj.clusterName=name;state.kj.clusterCreated=true;state.kj.selectedCards=[];state.kj.selectedCluster="c2";nested("kj",state.kj);markQa(10);closeDialog();render("KJ_WORKSPACE");toast("Cluster 已创建，可继续重命名、移动或提炼洞察");}
});

document.addEventListener("input",e=>{
  if(e.target.id==="member-search"){
    const q=e.target.value.trim();document.querySelectorAll("[data-member]").forEach(row=>{const u=users.find(x=>x.id===row.dataset.member);row.classList.toggle("is-hidden",q&&!`${u.name}${u.org}`.includes(q));});
  }
  if(e.target.id==="cluster-name"){state.kj.clusterName=e.target.value;nested("kj",state.kj);}
});

// Context-sensitive QA markers are recorded when returning to a preserved result state.
window.addEventListener("popstate",()=>{
  window.setTimeout(()=>{
    if(currentRoute()==="GLOBAL_ARCHIVE"&&state.archive.place==="鹅洲") markQa(16);
    if(currentRoute()==="GLOBAL_SEARCH"&&state.search.query==="鹅洲") markQa(17);
  },0);
});

hydrate();
setRenderer(render);
initRouter();
bindGlobalDismissals();
render();
