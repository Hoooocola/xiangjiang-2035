"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Place = { id: string; name: string; description: string | null };
type Team = { id: string; name: string; course: string | null; memberRole: string };
type Gap = { id: string; title: string; statement: string };
type ApiError = { code: string; message: string; fieldErrors?: Record<string, string[]> };

async function readData<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw body.error as ApiError;
  return body.data as T;
}

export function CreateResearchForm() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [gapId, setGapId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/places").then(readData<Place[]>), fetch("/teams").then(readData<Team[]>)])
      .then(([placeRows, teamRows]) => {
        if (cancelled) return;
        setPlaces(placeRows);
        setTeams(teamRows);
        setPlaceId(placeRows[0]?.id ?? "");
        setTeamId(teamRows[0]?.id ?? "");
      })
      .catch((reason: ApiError) => !cancelled && setError(reason))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    fetch(`/places/${placeId}/research-gaps`)
      .then(readData<Gap[]>)
      .then((rows) => {
        if (cancelled) return;
        setGaps(rows);
        setGapId(rows[0]?.id ?? "");
      })
      .catch((reason: ApiError) => !cancelled && setError(reason));
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const start = String(form.get("plannedStartAt") ?? "");
    const end = String(form.get("plannedEndAt") ?? "");

    try {
      const session = await readData<{ id: string }>(
        await fetch("/research-sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            placeId,
            ownerTeamId: teamId,
            name: form.get("name"),
            researchQuestion: form.get("researchQuestion"),
            objective: form.get("objective"),
            methods: String(form.get("methods") ?? "")
              .split(/[，,]/)
              .map((item) => item.trim())
              .filter(Boolean),
            plannedTime: {
              startAt: start ? new Date(`${start}T00:00:00+08:00`).toISOString() : null,
              endAt: end ? new Date(`${end}T23:59:59+08:00`).toISOString() : null,
            },
            scopeText: form.get("scopeText") || null,
            sourceResearchGapRefs: gapId ? [gapId] : [],
          }),
        }),
      );
      router.push(`/sessions/${session.id}`);
    } catch (reason) {
      setError(reason as ApiError);
      setSubmitting(false);
    }
  }

  return (
    <section className="editorial-page create-layout">
      <aside className="section-index" aria-label="创建调研步骤">
        <span className="index-active">01</span>
        <span>02</span>
        <span>03</span>
      </aside>

      <div className="create-intro">
        <p className="eyebrow">10 / CREATE RESEARCH</p>
        <h1>在一个真实地点，<br />开始新的研究。</h1>
        <p className="lead">
          建立 Research Session，明确问题、范围与方法。后续田野记录、KJ 与洞察都会回到这条研究脉络。
        </p>
        <div className="context-line">
          <span className="cyan-dot" />
          <span>真实数据库 · SessionTeam 可见</span>
        </div>
      </div>

      <div className="form-column">
        {loading ? <div className="system-message">正在读取地点与团队…</div> : null}
        {error ? (
          <div className="error-message" role="alert">
            <strong>{error.code}</strong>
            <span>{error.message}</span>
          </div>
        ) : null}

        <form onSubmit={submit} className="research-form">
          <fieldset disabled={loading || submitting}>
            <div className="field-row two-up">
              <label>
                <span>地点</span>
                <select value={placeId} onChange={(event) => setPlaceId(event.target.value)} required>
                  {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                </select>
              </label>
              <label>
                <span>研究团队</span>
                <select value={teamId} onChange={(event) => setTeamId(event.target.value)} required>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>
            </div>

            <label>
              <span>调研名称</span>
              <input name="name" defaultValue="2026 秋季鹅洲岸线使用补充调研" required />
            </label>

            <label>
              <span>研究问题</span>
              <textarea
                name="researchQuestion"
                rows={3}
                defaultValue="不同人群在鹅洲北岸如何共享停留、通行与临水活动空间？"
                required
              />
            </label>

            <label>
              <span>研究目标</span>
              <textarea
                name="objective"
                rows={3}
                defaultValue="补齐高峰时段与多类使用者的现场证据，为后续空间设计提供可追溯依据。"
                required
              />
            </label>

            <div className="field-row two-up">
              <label>
                <span>开始日期</span>
                <input name="plannedStartAt" type="date" defaultValue="2026-09-15" />
              </label>
              <label>
                <span>结束日期</span>
                <input name="plannedEndAt" type="date" defaultValue="2026-10-05" />
              </label>
            </div>

            <label>
              <span>研究方法</span>
              <input name="methods" defaultValue="行为观察，半结构访谈，定点影像记录" />
              <small>使用逗号分隔</small>
            </label>

            <label>
              <span>空间范围</span>
              <input name="scopeText" defaultValue="鹅洲北岸滨水空间（DEMO 范围，待真实 GIS 校准）" />
            </label>

            <label>
              <span>来源 Research Gap（可选）</span>
              <select value={gapId} onChange={(event) => setGapId(event.target.value)}>
                <option value="">不关联研究缺口</option>
                {gaps.map((gap) => <option key={gap.id} value={gap.id}>{gap.title}</option>)}
              </select>
            </label>

            <div className="action-rail">
              <span>创建者将自动成为 Session Owner</span>
              <button className="primary-button" type="submit" disabled={loading || submitting}>
                {submitting ? "正在创建…" : "创建 Research Session →"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
