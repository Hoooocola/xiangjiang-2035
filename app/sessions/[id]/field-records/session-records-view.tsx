"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ResearchSessionProgress, type ResearchPhase } from "@/app/components/research-session-progress";
import { SessionMap } from "./session-map";

type Session = {
  id: string;
  name: string;
  placeName: string;
  placeLocation: { latitude: number; longitude: number } | null;
  placeGisSource: string | null;
  scopeText: string | null;
  currentPrimaryPhase: ResearchPhase;
};
type RecordRow = {
  id: string;
  displayCode: string;
  observation: string | null;
  location: { latitude: number; longitude: number; accuracyMeters?: number } | null;
  locationStatus: string;
  evidenceType: string;
  createdAt: string;
};
type ApiError = { code: string; message: string };

async function data<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw body.error as ApiError;
  return body.data as T;
}

export function SessionRecordsView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [nextSession, nextRecords] = await Promise.all([
        fetch(`/research-sessions/${sessionId}`, { cache: "no-store" }).then(data<Session>),
        fetch(`/research-sessions/${sessionId}/field-records`, { cache: "no-store" }).then(
          data<RecordRow[]>,
        ),
      ]);
      setSession(nextSession);
      setRecords(nextRecords);
    } catch (reason) {
      setError(reason as ApiError);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    Promise.all([
      fetch(`/research-sessions/${sessionId}`, { cache: "no-store" }).then(data<Session>),
      fetch(`/research-sessions/${sessionId}/field-records`, { cache: "no-store" }).then(
        data<RecordRow[]>,
      ),
    ])
      .then(([nextSession, nextRecords]) => {
        setSession(nextSession);
        setRecords(nextRecords);
      })
      .catch((reason: ApiError) => setError(reason))
      .finally(() => setLoading(false));
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh, sessionId]);

  const positioned = useMemo(() => records.filter((record) => record.location), [records]);
  const unpositioned = records.filter((record) => !record.location);

  if (loading) return <section className="center-state">正在查询田野记录…</section>;
  if (error || !session) {
    return (
      <section className="center-state error-state">
        <p className="eyebrow">{error?.code ?? "SESSION_NOT_FOUND"}</p>
        <h1>无法打开田野记录</h1>
        <p>{error?.message}</p>
      </section>
    );
  }

  const center = session.placeLocation ?? { latitude: 28.057, longitude: 112.874 };
  return (
    <section className="editorial-page session-layout records-layout">
      <ResearchSessionProgress current={session.currentPrimaryPhase} />
      <div className="session-main">
        <Link className="tertiary-link" href={`/sessions/${sessionId}`}>← 返回调研概览</Link>
        <div className="records-heading">
          <div>
            <p className="eyebrow">10C / DESKTOP SESSION MAP</p>
            <p className="context-line"><span className="cyan-dot" />{session.placeName} · {session.name}</p>
            <h1>{records.length} 条田野记录</h1>
          </div>
          <Link className="primary-button" href={`/sessions/${sessionId}/capture`}>
            {records.length ? "新增田野记录 →" : "新增第一条田野记录 →"}
          </Link>
        </div>
        <div className="map-meta">
          <span>Research Scope · {session.scopeText ?? "未补充"}</span>
          <button className="tertiary-action" type="button" onClick={() => void refresh()}>刷新记录 ↻</button>
        </div>
        <div className="map-frame">
          <SessionMap center={center} records={positioned} />
          <div className="map-caption">
            <span>{positioned.length} 个有位置 Marker · {unpositioned.length} 条位置待补充</span>
            <strong>{session.placeGisSource?.includes("DEMO_UNCALIBRATED") ? "DEMO_UNCALIBRATED" : "LOCATION CONTEXT"}</strong>
          </div>
        </div>
        {unpositioned.length > 0 ? (
          <section className="unpositioned-list">
            <p className="section-label">位置待补充</p>
            {unpositioned.map((record) => (
              <Link href={`/records/${record.id}`} key={record.id}>
                <span>{record.displayCode}</span>
                <strong>{record.observation || "影像记录"}</strong>
                <i>查看 ↗</i>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </section>
  );
}
