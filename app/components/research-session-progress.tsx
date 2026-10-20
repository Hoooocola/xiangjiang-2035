const phases = [
  ["Preparation", "准备"],
  ["FieldCollection", "田野采集"],
  ["KJ", "KJ 综合"],
  ["Insight", "洞察"],
] as const;

export type ResearchPhase = (typeof phases)[number][0];

export function ResearchSessionProgress({
  current,
  compact = false,
}: {
  current: ResearchPhase;
  compact?: boolean;
}) {
  if (compact) {
    const currentIndex = Math.max(0, phases.findIndex(([key]) => key === current));
    return (
      <div className="mobile-progress" aria-label={`当前研究阶段：${phases[currentIndex][1]}`}>
        <span>{String(currentIndex + 1).padStart(2, "0")} / 现场记录</span>
        <i aria-hidden="true" />
      </div>
    );
  }

  return (
    <aside className="session-phase" aria-label="研究阶段">
      {phases.map(([key, label], index) => (
        <div className={key === current ? "phase-item phase-active" : "phase-item"} key={key}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </aside>
  );
}
