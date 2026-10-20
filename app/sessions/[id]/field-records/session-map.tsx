"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type MapRecord = {
  id: string;
  displayCode: string;
  observation: string | null;
  location: { latitude: number; longitude: number; accuracyMeters?: number } | null;
  locationStatus: string;
};

export function SessionMap({
  center,
  records,
}: {
  center: { latitude: number; longitude: number };
  records: MapRecord[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    void import("leaflet").then((module) => {
      if (disposed || !containerRef.current) return;
      const L = module.default;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(
        [center.latitude, center.longitude],
        records.length ? 15 : 14,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const positioned = records.filter((record) => record.location);
      positioned.forEach((record) => {
        const marker = L.circleMarker(
          [record.location!.latitude, record.location!.longitude],
          {
            radius: 9,
            color: "#111514",
            weight: 1,
            fillColor: "#30d1ff",
            fillOpacity: 1,
          },
        ).addTo(map);
        marker.bindTooltip(record.displayCode, { direction: "top", offset: [0, -8] });
        marker.on("click", () => router.push(`/records/${record.id}`));
      });
      if (positioned.length > 1) {
        map.fitBounds(
          positioned.map((record) => [record.location!.latitude, record.location!.longitude]),
          { padding: [54, 54], maxZoom: 17 },
        );
      }
      cleanup = () => map.remove();
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [center.latitude, center.longitude, records, router]);

  return <div className="session-map" ref={containerRef} aria-label="田野记录地图" />;
}
