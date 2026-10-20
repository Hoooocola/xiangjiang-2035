const initial = () => ({
  loggedIn: true,
  role: "student",
  menuOpen: false,
  selectPlaceMode: false,
  selectedPlace: "",
  createOrigin: "global",
  selectedGap: "",
  sessionCreated: false,
  prep: {
    question: "鹅洲北岸在秋季不同时间段的使用冲突如何发生？",
    objective: "补充岸线高峰与日常使用证据，为共享秩序设计提供依据。",
    methods: [],
    start: "2026-09-21",
    end: "2026-09-24",
    members: ["u1"],
    scope: "",
  },
  recordsCreated: 0,
  recordDraft: { observation:"", type:"", tags:[], location:"", photo:false },
  mobileDraft: { observation:"", type:"", photo:false },
  kj: { selectedCards:[], clusterCreated:false, selectedCluster:"", clusterName:"自发休憩与岸线共享" },
  insight: { mode:"human", aiSuggested:false, adopted:false, published:false, title:"", statement:"", significance:"", limitations:"", confidence:"Emerging" },
  opportunity: { mode:"human", aiSuggested:false, adopted:false, active:false, title:"", framing:"" },
  proposal: { path:"", fileSelected:false, title:"鹅洲岸线共享设计方案", description:"以可逆、轻量的空间介入协调居民与游客的岸线共享。", cover:true, role:"主方案文件", blocks:[], published:false },
  archive: { place:"", year:"", source:"", team:"", selectedProposal:"" },
  search: { query:"", tab:"all", selectedProposal:"" },
  myWorkTab: "ongoing",
  reviewDecision: "",
  qa: {},
});

export let state = initial();

export function update(patch) {
  Object.assign(state, patch);
  persist();
}

export function nested(key, patch) {
  state[key] = { ...state[key], ...patch };
  persist();
}

export function resetState() {
  state = initial();
  persist();
  return state;
}

function persist() {
  try { sessionStorage.setItem("xiangjiang2035-prototype", JSON.stringify(state)); } catch {}
}

export function hydrate() {
  try {
    const saved = sessionStorage.getItem("xiangjiang2035-prototype");
    if (saved) state = { ...initial(), ...JSON.parse(saved) };
  } catch {}
  return state;
}

export function preparationComplete() {
  const p = state.prep;
  return Boolean(p.question && p.objective && p.methods.length && p.start && p.end && p.members.length >= 2 && p.scope);
}

export function recordComplete(draft = state.recordDraft) {
  return Boolean(draft.observation && draft.type && draft.tags?.length && draft.location && draft.photo);
}
