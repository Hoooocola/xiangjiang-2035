"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecordDetail = {
  id: string;
  displayCode: string;
  researchSessionId: string;
  researchSessionName: string;
  placeName: string;
  placeGisSource: string | null;
  ownerTeamName: string;
  authorName: string;
  observation: string | null;
  location: { latitude: number; longitude: number; accuracyMeters?: number } | null;
  locationStatus: string;
  evidenceType: string;
  contentTags: string[];
  directVisibilityScope: string;
  sensitive: boolean;
  createdAt: string;
  updatedAt: string;
  media: Array<{ id: string; filename: string; uploadStatus: string; uploadError: string | null }>;
};

const evidenceLabels: Record<string, string> = {
  Observation: "观察",
  Interview: "访谈",
  PhotoVideo: "影像",
  Measurement: "测量",
  Document: "文献",
};

export function FieldRecordDetail({ recordId }: { recordId: string }) {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null);

  useEffect(() => {
    fetch(`/field-records/${recordId}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw body.error;
        return body.data as RecordDetail;
      })
      .then(setRecord)
      .catch(setError);
  }, [recordId]);

  if (error) return <section className="center-state"><p className="eyebrow">{error.code}</p><h1>无法查看此记录</h1><p>{error.message}</p></section>;
  if (!record) return <section className="center-state">正在读取 Field Record…</section>;

  return (
    <section className="editorial-page record-detail-page">
      <Link className="tertiary-link" href={`/sessions/${record.researchSessionId}/field-records`}>← 返回田野记录地图</Link>
      <header className="record-detail-heading">
        <div>
          <p className="eyebrow">07 / FIELD RECORD DETAIL</p>
          <p className="context-line"><span className="cyan-dot" />{record.placeName} · {record.researchSessionName}</p>
          <h1>{record.displayCode}</h1>
        </div>
        <p>{evidenceLabels[record.evidenceType] ?? record.evidenceType}</p>
      </header>

      <div className="metadata-rail record-meta">
        <span>作者 · {record.authorName}</span>
        <span>{new Date(record.createdAt).toLocaleString("zh-CN")}</span>
        <span>位置 · {record.locationStatus}</span>
        <span>{record.directVisibilityScope}</span>
      </div>

      <div className="record-evidence-layout">
        <section className="record-media-column">
          <p className="section-label">现场证据</p>
          {record.media.length ? record.media.map((media) => (
            <figure key={media.id}>
              {media.uploadStatus === "Success" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/field-records/${record.id}/media/${media.id}/content`} alt={`田野记录影像：${media.filename}`} />
              ) : (
                <div className="media-failed"><strong>图片不可用</strong><span>{media.uploadError}</span></div>
              )}
              <figcaption>{media.filename} · {media.uploadStatus}</figcaption>
            </figure>
          )) : <div className="no-media">未添加影像；本条证据以 Observation 为主。</div>}
        </section>

        <article className="record-observation">
          <p className="section-label">Observation</p>
          <h2>{record.observation ?? "未补充文字观察"}</h2>
          <div className="record-location">
            <span>LOCATION</span>
            <strong>{record.location ? `${record.location.latitude.toFixed(5)}, ${record.location.longitude.toFixed(5)}` : "位置待补充"}</strong>
            {record.location?.accuracyMeters ? <small>精度约 {Math.round(record.location.accuracyMeters)} m</small> : null}
            {record.placeGisSource?.includes("DEMO_UNCALIBRATED") ? <i>DEMO_UNCALIBRATED</i> : null}
          </div>
          <div className="record-tags">
            <p className="section-label">Content Tags</p>
            {record.contentTags.length ? record.contentTags.map((tag) => <span key={tag}>{tag}</span>) : <em>未补充</em>}
          </div>
        </article>
      </div>
    </section>
  );
}
