// GBIF 生物观察记录 → 空间点位渲染。
// 视觉原则（任务书 Stage 4 / E）：记录分布概况 → 物种类群 → 具体观察记录，
// 按相机尺度逐步呈现；聚合使用真实坐标计算；每个颜色对应图例；
// 精度不足的记录标注不确定性，不伪装高精度点。
//
// 数据现实：6112 条记录中大量坐标重复（最多一个坐标有 2576 条），
// 直接逐条渲染会造成密集重叠。这里按坐标（约 11m）聚合为一个点位，
// 用数字标签显示该点位的记录数，近景/点击可展开查看具体记录。
import * as THREE from 'three';
import type {GbifDataset, GbifRecord} from './types';
import {project} from '../geo';

/** 物种类群分组（生态语义，克制低饱和）。颜色必须有对应图例。 */
export const GBIF_GROUPS: { key: string; zh: string; classes: string[]; day: string; night: string }[] = [
  { key: 'bird', zh: '鸟类', classes: ['Aves'], day: '#4a7a8a', night: '#7fb8cc' },
  { key: 'plant', zh: '植物', classes: ['Magnoliopsida', 'Liliopsida', 'Pinopsida', 'Polypodiopsida', 'Bryopsida', 'Jungermanniopsida'], day: '#3f7a5a', night: '#70b090' },
  { key: 'insect', zh: '昆虫', classes: ['Insecta', 'Arachnida', 'Diplopoda', 'Malacostraca'], day: '#7a6a8a', night: '#b0a0c0' },
  { key: 'amphibian', zh: '两栖爬行', classes: ['Amphibia', 'Squamata'], day: '#5a7a4a', night: '#9ac080' },
  { key: 'mammal', zh: '哺乳动物', classes: ['Mammalia'], day: '#7a5c4a', night: '#c0a080' },
  { key: 'fungi', zh: '真菌', classes: ['Agaricomycetes', 'Exobasidiomycetes', 'Dacrymycetes', 'Sordariomycetes'], day: '#8a7a5a', night: '#b0a080' },
  { key: 'other', zh: '其他类群', classes: [], day: '#8a8a7a', night: '#b0b0a0' },
];

/** 由 GBIF class 字段映射到物种类群分组。 */
export function groupOfClass(className: string | null): { key: string; zh: string; day: string; night: string } {
  for (const g of GBIF_GROUPS) {
    if (className && g.classes.includes(className)) return g;
  }
  return GBIF_GROUPS[GBIF_GROUPS.length - 1]; // other
}

/** 聚合精度：4 位小数 ≈ 11m。用于合并相同/极相近坐标。 */
const AGG_PRECISION = 4;

/** 一个聚合点位的内部结构。 */
interface Cluster {
  lat: number;
  lon: number;
  records: GbifRecord[];
  group: { key: string; zh: string; day: string; night: string };
  marker: THREE.Group;
}

function roundCoord(v: number): string {
  return v.toFixed(AGG_PRECISION);
}

/** 绘制一个数字标签 Sprite（canvas 纹理）。 */
function makeCountSprite(count: number, color: string): THREE.Sprite {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(8,23,28,0.9)';
  ctx.font = `600 ${Math.min(30, Math.max(16, 30 - String(count).length * 3))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), size / 2, size / 2 + 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true }));
  sprite.scale.set(1.1, 1.1, 1);
  return sprite;
}

export interface GbifRender {
  group: THREE.Group;
  /** 记录详情（供点击拾取后展示）。 */
  record: (key: number) => GbifRecord | undefined;
  /** 某坐标点位的全部记录（聚合展开）。 */
  recordsAt: (key: number) => GbifRecord[];
  /** 当前聚合点位数量。 */
  clusterCount: number;
  dispose: () => void;
  updateByDistance: (distance: number) => void;
  highlight: (key: number | null) => void;
  theme: (night: number) => void;
}

export function buildGbifPoints(
  dataset: GbifDataset,
  height: (x: number, z: number) => number,
): GbifRender {
  const group = new THREE.Group();
  group.name = 'yanghu-gbif';
  const recordByKey = new Map<number, GbifRecord>();
  const clusters = new Map<string, Cluster>();
  const clusterKeyByRecord = new Map<number, string>();
  const disposables: { dispose: () => void }[] = [];
  let currentNight = 0;
  let highlightedKey: number | null = null;
  let currentDistance = 0;

  // 1. 按坐标聚合记录。
  for (const record of dataset.records) {
    recordByKey.set(record.key, record);
    const ck = `${roundCoord(record.lat)}|${roundCoord(record.lon)}`;
    clusterKeyByRecord.set(record.key, ck);
    let cluster = clusters.get(ck);
    if (!cluster) {
      cluster = {
        lat: record.lat,
        lon: record.lon,
        records: [],
        group: groupOfClass(record.class),
        marker: new THREE.Group(),
      };
      clusters.set(ck, cluster);
    }
    cluster.records.push(record);
  }

  // 1b. 每个聚合点取数量最多的类群作为主色。
  for (const cluster of clusters.values()) {
    const byKey = new Map<string, number>();
    for (const r of cluster.records) {
      const k = groupOfClass(r.class).key;
      byKey.set(k, (byKey.get(k) ?? 0) + 1);
    }
    let bestKey = cluster.group.key;
    let bestN = -1;
    for (const [k, n] of byKey) if (n > bestN) { bestN = n; bestKey = k; }
    cluster.group = GBIF_GROUPS.find(x => x.key === bestKey) ?? cluster.group;
  }

  // 2. 为每个聚合点位构建 marker（圆环 + 数字标签）。
  for (const cluster of clusters.values()) {
    const [x, z] = project([cluster.lon, cluster.lat]);
    const y = height(x, z) + 0.08;
    const g = cluster.group;
    const coarse = cluster.records.some(r => r.precision !== 'fine');

    const marker = cluster.marker;
    marker.position.set(x, y, z);

    // 圆环：大小随记录数轻微放大，但克制。
    const ringScale = Math.min(1.6, 0.9 + Math.log10(cluster.records.length + 1) * 0.25);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(g.day), transparent: true, opacity: coarse ? 0.5 : 0.8, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 20), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(ringScale);
    marker.add(ring);
    disposables.push(ring.geometry, ringMat);

    // 数字标签（记录数）：仅当记录数 > 1 时显示，避免单条记录也顶个数字。
    if (cluster.records.length > 1) {
      const sprite = makeCountSprite(cluster.records.length, g.day);
      sprite.position.y = 0.55;
      marker.add(sprite);
      disposables.push(sprite.material, (sprite.material as THREE.SpriteMaterial).map!);
    } else {
      const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(g.day), transparent: true, opacity: 0.9, depthWrite: false });
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), dotMat);
      dot.rotation.x = -Math.PI / 2;
      dot.position.y = 0.001;
      marker.add(dot);
      disposables.push(dot.geometry, dotMat);
    }

    marker.userData.gbifKey = cluster.records[0].key;
    marker.userData.precision = coarse ? 'coarse' : 'fine';
    marker.userData.count = cluster.records.length;
    marker.userData.lat = cluster.lat;
    marker.userData.lon = cluster.lon;
    group.add(marker);
  }

  function distanceFade(): number {
    if (currentDistance > 180) return 0.45;
    if (currentDistance > 90) return 0.7;
    return 1;
  }

  function paint() {
    const fade = distanceFade();
    for (const cluster of clusters.values()) {
      const g = cluster.group;
      const day = new THREE.Color(g.day);
      const nightC = new THREE.Color(g.night);
      const highlighted = highlightedKey !== null && cluster.records.some(r => r.key === highlightedKey);
      const marker = cluster.marker;
      marker.traverse(o => {
        const mat = (o as THREE.Mesh | THREE.Sprite).material as THREE.Material | THREE.Material[] | undefined;
        if (!mat || Array.isArray(mat)) return;
        const colorable = mat as THREE.MeshBasicMaterial | THREE.SpriteMaterial;
        if ('color' in colorable) colorable.color.copy(day).lerp(nightC, currentNight);
        const base = (marker.userData.precision === 'fine' ? 0.8 : 0.5) * fade;
        mat.opacity = highlighted ? 1 : base;
      });
      marker.scale.setScalar(highlighted ? 1.4 : 1);
    }
  }

  function applyDistance() {
    paint();
  }

  return {
    group,
    record: (key: number) => recordByKey.get(key),
    recordsAt: (key: number) => {
      const ck = clusterKeyByRecord.get(key);
      return ck ? clusters.get(ck)?.records ?? [] : [];
    },
    clusterCount: clusters.size,
    dispose: () => disposables.forEach(d => d.dispose()),
    updateByDistance: (distance: number) => { currentDistance = distance; applyDistance(); },
    highlight: (key: number | null) => { highlightedKey = key; paint(); },
    theme: (night: number) => { currentNight = night; paint(); },
  };
}
