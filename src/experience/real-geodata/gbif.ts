// GBIF 生物观察记录 → 空间点位渲染。
// 视觉原则（任务书 7.3）：不所有点同亮度同大小；按相机尺度聚合；
// 精度不足的记录标注不确定性，不伪装高精度点。
import * as THREE from 'three';
import type {GbifDataset, GbifRecord} from './types';
import {project} from '../geo';

/** 分类群颜色（生态语义，克制低饱和）。 */
const CLASS_COLOR: Record<string, { day: string; night: string }> = {
  Aves: { day: '#4a7a8a', night: '#7fb8cc' },          // 鸟类
  Mammalia: { day: '#7a5c4a', night: '#c0a080' },     // 哺乳
  Amphibia: { day: '#5a7a4a', night: '#9ac080' },     // 两栖
  Reptilia: { day: '#8a6a3a', night: '#c0a060' },     // 爬行
  Insecta: { day: '#7a6a8a', night: '#b0a0c0' },      // 昆虫
  Magnoliopsida: { day: '#3a7a5a', night: '#70b090' },// 双子叶植物
  Liliopsida: { day: '#5a8a3a', night: '#90c070' },   // 单子叶植物
  Pinopsida: { day: '#3a6a4a', night: '#60906a' },    // 松柏
  default: { day: '#8a8a7a', night: '#b0b0a0' },
};

function classColor(c: string | null): { day: string; night: string } {
  return CLASS_COLOR[c ?? 'default'] ?? CLASS_COLOR.default;
}

/** 单个观察点的 marker（贴地小圆环 + 中心点）。精度不足用空心/半透明。 */
function buildMarker(
  record: GbifRecord,
  height: (x: number, z: number) => number,
  color: THREE.Color,
): { group: THREE.Group } {
  const [x, z] = project([record.lon, record.lat]);
  const y = height(x, z) + 0.06;
  const group = new THREE.Group();

  const coarse = record.precision !== 'fine';
  const ringMat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: coarse ? 0.55 : 0.85, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 20), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y, z);
  group.add(ring);

  // 高精度点加中心实心点
  if (!coarse) {
    const dotMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false });
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), dotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(x, y + 0.001, z);
    group.add(dot);
  }
  // 低精度点加细竖线，暗示不确定性
  else {
    const stemMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), stemMat);
    stem.position.set(x, y + 0.03, z);
    group.add(stem);
  }

  group.userData.gbifKey = record.key;
  group.userData.precision = record.precision;
  return { group };
}

export interface GbifRender {
  group: THREE.Group;
  markers: Map<number, THREE.Group>;
  dispose: () => void;
  /** 按相机距离更新聚合：近距离显示全部，远距离只显示高精度/主要类群。 */
  updateByDistance: (distance: number) => void;
  /** 高亮单条记录。 */
  highlight: (key: number | null) => void;
  theme: (night: number) => void;
}

export function buildGbifPoints(
  dataset: GbifDataset,
  height: (x: number, z: number) => number,
): GbifRender {
  const group = new THREE.Group();
  group.name = 'yanghu-gbif';
  const markers = new Map<number, THREE.Group>();
  const recordColor = new Map<number, { day: string; night: string }>();
  const disposables: { dispose: () => void }[] = [];
  let currentNight = 0;
  let highlightedKey: number | null = null;

  for (const record of dataset.records) {
    const cc = classColor(record.class);
    recordColor.set(record.key, cc);
    const { group: marker } = buildMarker(record, height, new THREE.Color(cc.day));
    group.add(marker);
    markers.set(record.key, marker);
    marker.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) disposables.push(mesh.geometry);
      if (mesh.material) disposables.push(mesh.material as THREE.Material);
    });
  }

  function paint() {
    for (const [key, marker] of markers) {
      const cc = recordColor.get(key)!;
      const day = new THREE.Color(cc.day);
      const nightC = new THREE.Color(cc.night);
      const highlighted = key === highlightedKey;
      marker.traverse(o => {
        const mesh = o as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
        if (!mat) return;
        mat.color.copy(day).lerp(nightC, currentNight);
        const base = mesh.userData.precision === 'fine' ? 0.85 : 0.55;
        mat.opacity = highlighted ? 1 : base;
      });
      if (highlighted) marker.scale.setScalar(1.6);
      else marker.scale.setScalar(1);
    }
  }

  return {
    group,
    markers,
    dispose: () => disposables.forEach(d => d.dispose()),
    updateByDistance: (distance: number) => {
      // 远距离（全段视角）只显示高精度记录，减少满屏 marker；
      // 中距离显示全部高精度 + 主要类群；近距离显示全部。
      const showAll = distance < 60;
      const showFineOnly = distance > 180;
      for (const marker of markers.values()) {
        const precision = marker.userData.precision as string;
        let visible = true;
        if (showFineOnly && precision !== 'fine') visible = false;
        else if (!showAll && precision === 'unreported') visible = false;
        marker.visible = visible;
      }
    },
    highlight: (key: number | null) => { highlightedKey = key; paint(); },
    theme: (night: number) => { currentNight = night; paint(); },
  };
}
