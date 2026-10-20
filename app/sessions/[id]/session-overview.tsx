"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResearchSessionProgress } from "@/app/components/research-session-progress";

type Session = {
  id: string;
  name: string;
  placeName: string;
  ownerTeamName: string;
  researchQuestion: string;
  objective: string;
  methods: string[];
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  scopeText: string | null;
  currentPrimaryPhase: "Preparation" | "FieldCollection" | "KJ" | "Insight";
  status: "Draft" | "Active" | "Completed" | "Archived";
  directVisibilityScope: string;
  members: Array<{ id: string; displayName: string; role: string }>;
  sourceResearchGaps: Array<{ id: string; title: string; statement: string }>;
};

type ApiError = { code: string; message: string; traceId?: string };

const phaseLabels = {
  Preparation: "准备",
  FieldCollection: "田野采集",
  KJ: "KJ 综合",
  Insight: "洞察",
};

async function readSession(response: Response) {
  const body = await response.json();
  if (!response.ok) throw body.error as ApiError;
  return body.data as Session;
}

function formatDate(value: string | null) {
  if (!value) return "未设定";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" }).format(
    new Date(value),
  );
}

export function SessionOverview({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/research-sessions/${sessionId}`)
      .then(readSession)
      .then((data) => !cancelled && setSession(data))
      .catch((reason: ApiError) => !cancelled && setError(reason))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function startFieldCollection() {
    setStarting(true);
    setError(null);
    try {
      setSession(
        await readSession(
          await fetch(`/research-sessions/${sessionId}/start-field-collection`, { method: "POST" }),
        ),
      );
      router.push(`/sessions/${sessionId}/field-records`);
    } catch (reason) {
      setError(reason as ApiError);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <section className="center-state">正在从数据库读取 Research Session…</section>;
  }
  if (error || !session) {
    return (
      <section className="center-state error-state">
        <p className="eyebrow">{error?.code ?? "SESSION_NOT_FOUND"}</p>
        <h1>{error?.code === "SESSION_FORBIDDEN" ? "你无权查看这次调研" : "无法打开这次调研"}</h1>
        <p>{error?.message}</p>
        <Link className="tertiary-link" href="/create-research">← 返回创建调研</Link>
      </section>
    );
  }

  return (
    <section className="editorial-page session-layout">
      <ResearchSessionProgress current={session.currentPrimaryPhase} />

      <div className="session-main">
        <Link className="tertiary-link" href="/create-research">← 创建另一次调研</Link>
        <p className="eyebrow">10B / RESEARCH SESSION OVERVIEW</p>
        <div className="session-heading">
          <div>
            <p className="context-line"><span className="cyan-dot" />{session.placeName}</p>
            <h1>{session.name}</h1>
          </div>
          <div className="session-state">
            <span>{session.status}</span>
            <strong>{phaseLabels[session.currentPrimaryPhase]}</strong>
          </div>
        </div>

        <div className="metadata-rail">
          <span>{session.ownerTeamName}</span>
          <span>{formatDate(session.plannedStartAt)}—{formatDate(session.plannedEndAt)}</span>
          <span>{session.directVisibilityScope}</span>
          <span>{session.members.length} 位成员</span>
        </div>

        <div className="research-grid">
          <article className="primary-research-question">
            <p className="section-label">研究问题</p>
            <h2>{session.researchQuestion}</h2>
          </article>
          <article>
            <p className="section-label">研究目标</p>
            <p className="body-large">{session.objective}</p>
          </article>
          <article>
            <p className="section-label">空间范围</p>
            <p>{session.scopeText ?? "尚未记录"}</p>
          </article>
          <article>
            <p className="section-label">研究方法</p>
            <ol className="method-list">
              {session.methods.map((method, index) => (
                <li key={method}><span>{String(index + 1).padStart(2, "0")}</span>{method}</li>
              ))}
            </ol>
          </article>
        </div>

        {session.sourceResearchGaps.length > 0 ? (
          <section className="source-gap">
            <p className="section-label">来源 Research Gap</p>
            {session.sourceResearchGaps.map((gap) => (
              <div key={gap.id}>
                <h3>{gap.title}</h3>
                <p>{gap.statement}</p>
              </div>
            ))}
          </section>
        ) : null}

        <div className="action-rail session-action">
          <span>Session ID · {session.id}</span>
          {session.currentPrimaryPhase === "Preparation" ? (
            <button className="primary-button" onClick={startFieldCollection} disabled={starting}>
              {starting ? "正在更新…" : "开始田野采集 →"}
            </button>
          ) : (
            <Link className="primary-button" href={`/sessions/${sessionId}/field-records`}>
              进入田野记录地图 →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
