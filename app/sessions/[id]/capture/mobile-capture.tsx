"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResearchSessionProgress, type ResearchPhase } from "@/app/components/research-session-progress";

type Session = {
  id: string;
  name: string;
  placeName: string;
  placeLocation: { latitude: number; longitude: number } | null;
  placeGisSource: string | null;
  currentPrimaryPhase: ResearchPhase;
};
type ApiError = { code: string; message: string };
type Location = { latitude: number; longitude: number; accuracyMeters?: number };

const evidenceTypes = [
  ["Observation", "观察"],
  ["Interview", "访谈"],
  ["PhotoVideo", "影像"],
  ["Measurement", "测量"],
  ["Document", "文献"],
] as const;

async function data<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw body.error as ApiError;
  return body.data as T;
}

export function MobileCapture({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [observation, setObservation] = useState("");
  const [evidenceType, setEvidenceType] = useState<(typeof evidenceTypes)[number][0]>("Observation");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<"Recorded" | "Approximate" | "Missing">("Missing");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    fetch(`/research-sessions/${sessionId}`, { cache: "no-store" })
      .then(data<Session>)
      .then(setSession)
      .catch((reason: ApiError) => setError(reason));
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, [sessionId]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function recordLocation() {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setLocation(null);
      setLocationStatus("Missing");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
        setLocationStatus("Recorded");
        setLocating(false);
      },
      () => {
        setLocation(null);
        setLocationStatus("Missing");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    );
  }

  function useApproximateScopeLocation() {
    if (!session?.placeLocation) return;
    setLocation(session.placeLocation);
    setLocationStatus("Approximate");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!observation.trim() && !file) {
      setError({ code: "RECORD_CONTENT_REQUIRED", message: "请填写 Observation 或添加一张图片" });
      return;
    }
    if (!online) {
      setError({ code: "NETWORK_OFFLINE", message: "当前离线，记录尚未保存；内容已保留，可联网后重试。" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.set(
        "payload",
        JSON.stringify({
          observation: observation.trim() || null,
          evidenceType,
          location,
          locationStatus,
          contentTags: tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean),
          sensitive: false,
        }),
      );
      if (file) form.append("media", file);
      const record = await data<{ id: string }>(
        await fetch(`/research-sessions/${sessionId}/field-records`, { method: "POST", body: form }),
      );
      router.push(`/records/${record.id}/saved`);
    } catch (reason) {
      const next = reason as ApiError;
      setError({
        code: next.code || "RECORD_SAVE_FAILED",
        message: next.message || "保存失败；已保留 Observation、类型与图片选择，请重试。",
      });
      setSaving(false);
    }
  }

  return (
    <main className="capture-shell">
      <header className="mobile-header">
        <Link href={`/sessions/${sessionId}/field-records`} aria-label="返回田野记录地图">←</Link>
        <span>{session?.placeName ?? "田野采集"}</span>
        <i aria-hidden="true" />
      </header>
      <section className="capture-page">
        <ResearchSessionProgress current={session?.currentPrimaryPhase ?? "FieldCollection"} compact />
        <p className="capture-context">{session?.name ?? "正在读取 Research Session…"}</p>
        <h1>记录现场证据</h1>
        <p className="capture-lead">先记下正在发生的事。位置或图片缺失都不会阻止 Observation 保存。</p>

        {!online ? <div className="offline-notice" role="status">当前离线 · 尚未保存</div> : null}
        {error ? (
          <div className="error-message capture-error" role="alert">
            <strong>{error.code}</strong><span>{error.message}</span>
          </div>
        ) : null}

        <form className="capture-form" onSubmit={submit}>
          <fieldset disabled={saving || !session}>
            <div className="capture-media">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={`待上传图片预览：${file?.name ?? "现场图片"}`} />
              ) : (
                <div><span>＋</span><strong>拍照 / 添加图片</strong><small>JPEG、PNG、GIF、WebP · 最大 10 MB</small></div>
              )}
              <label className="media-picker">
                <span>{file ? "更换图片" : "选择图片"}</span>
                <input
                  aria-label="拍照或从相册添加图片"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  capture="environment"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <label className="capture-field">
              <span>短 Observation</span>
              <textarea
                rows={5}
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="记录行为、场景、对话或变化……"
              />
            </label>

            <fieldset className="capture-field evidence-field">
              <legend>Evidence Type</legend>
              <div className="segmented-options">
                {evidenceTypes.map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="evidenceType"
                      checked={evidenceType === value}
                      onChange={() => setEvidenceType(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section className="location-field" aria-live="polite">
              <div>
                <span className="section-label">当前位置</span>
                <strong>
                  {locationStatus === "Recorded"
                    ? "当前位置已记录"
                    : locationStatus === "Approximate"
                      ? "已使用调研范围近似位置"
                      : "位置待补充"}
                </strong>
                <small>{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "GPS 拒绝或不可用时仍可保存"}</small>
              </div>
              <button className="secondary-button" type="button" onClick={recordLocation} disabled={locating}>
                {locating ? "定位中…" : "记录位置"}
              </button>
              {locationStatus === "Missing" && session?.placeLocation ? (
                <button className="tertiary-action approximate-action" type="button" onClick={useApproximateScopeLocation}>
                  使用调研范围中心（近似）
                </button>
              ) : null}
            </section>

            <label className="capture-field">
              <span>Content Tags（可选）</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Behavior，Ecology" />
            </label>

            <div className="capture-save-rail">
              <span>{file ? `1 张图片 · ${file.name}` : "可不添加图片"}</span>
              <button className="primary-button capture-submit" type="submit" disabled={saving || !session}>
                {saving ? "正在保存…" : "保存田野记录"}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
