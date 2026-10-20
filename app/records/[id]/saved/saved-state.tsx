"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

type Media = { id: string; filename: string; uploadStatus: "Uploading" | "Success" | "Failed"; uploadError: string | null };
type RecordDetail = {
  id: string;
  displayCode: string;
  researchSessionId: string;
  researchSessionName: string;
  placeName: string;
  authorName: string;
  observation: string | null;
  location: { latitude: number; longitude: number } | null;
  locationStatus: string;
  evidenceType: string;
  createdAt: string;
  media: Media[];
};

async function readRecord(response: Response) {
  const body = await response.json();
  if (!response.ok) throw body.error;
  return body.data as RecordDetail;
}

export function FieldRecordSaved({ recordId }: { recordId: string }) {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/field-records/${recordId}`, { cache: "no-store" })
      .then(readRecord)
      .then(setRecord)
      .catch((reason) => setError(reason?.message ?? "无法读取刚保存的记录"));
  }, [recordId]);

  async function retryMedia(event: ChangeEvent<HTMLInputElement>, mediaId: string) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("media", file);
    try {
      const response = await fetch(`/field-records/${recordId}/media/${mediaId}/retry`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw (await response.json()).error;
      setRecord(await readRecord(await fetch(`/field-records/${recordId}`, { cache: "no-store" })));
    } catch (reason) {
      setError((reason as { message?: string })?.message ?? "图片重试失败");
    }
  }

  if (error) return <main className="center-state"><p>{error}</p></main>;
  if (!record) return <main className="center-state">正在确认数据库记录…</main>;

  return (
    <main className="saved-shell">
      <section className="saved-page">
        <div className="saved-mark" aria-hidden="true">✓</div>
        <p className="eyebrow">10E / FIELD RECORD SAVED</p>
        <h1>田野记录已保存</h1>
        <p className="saved-code">{record.displayCode}</p>
        {record.media.map((media) => (
          <figure className="saved-media" key={media.id}>
            {media.uploadStatus === "Success" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/field-records/${record.id}/media/${media.id}/content`} alt={`现场证据：${media.filename}`} />
            ) : (
              <div className="media-failed">
                <strong>图片上传失败</strong>
                <span>{media.uploadError}</span>
                <label className="secondary-button">重试上传<input type="file" accept="image/*" onChange={(event) => void retryMedia(event, media.id)} /></label>
              </div>
            )}
          </figure>
        ))}
        <div className="saved-summary">
          <div><span>Observation</span><p>{record.observation ?? "未填写；该记录包含影像证据。"}</p></div>
          <div><span>位置</span><p>{record.location ? `${record.location.latitude.toFixed(5)}, ${record.location.longitude.toFixed(5)} · ${record.locationStatus}` : "位置待补充"}</p></div>
          <div><span>记录时间</span><p>{new Date(record.createdAt).toLocaleString("zh-CN")}</p></div>
          <div><span>作者</span><p>{record.authorName}</p></div>
        </div>
        <div className="saved-actions">
          <Link className="secondary-button" href={`/records/${record.id}`}>查看记录详情</Link>
          <Link className="primary-button" href={`/sessions/${record.researchSessionId}/field-records`}>回到 Session Map →</Link>
        </div>
      </section>
    </main>
  );
}
