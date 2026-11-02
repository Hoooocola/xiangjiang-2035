// OSM 道路 → 贴地精细线条渲染。
// 视觉原则（任务书 6.2）：清晰细线、主次道路权重不同、贴合地面/桥梁、克制亮度、选中加强。
import * as THREE from 'three';
import type {OsmRoads, OsmRoad} from './types';
import {project} from '../geo';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

/** 道路分级视觉映射（order 来自 highway 枚举顺序）。 */
interface RoadStyle { width: number; day: string; night: string; opacity: number; }

// order 0..15（motorway→bridleway）
function roadStyle(road: OsmRoad): RoadStyle {
  const bridge = !!road.bridge;
  switch (road.highway) {
    case 'motorway': case 'trunk':
      return { width: bridge ? 2.4 : 2.2, day: '#8a6d3b', night: '#c9b27a', opacity: 0.95 };
    case 'primary':
      return { width: 2.0, day: '#9a7a4a', night: '#d4bd88', opacity: 0.9 };
    case 'secondary':
      return { width: 1.6, day: '#a08558', night: '#c8b386', opacity: 0.85 };
    case 'tertiary':
      return { width: 1.3, day: '#a89068', night: '#bfab82', opacity: 0.8 };
    case 'unclassified': case 'residential': case 'living_street':
      return { width: 1.0, day: '#b0a080', night: '#a89a78', opacity: 0.7 };
    case 'service':
      return { width: 0.7, day: '#b5a888', night: '#9e9172', opacity: 0.6 };
    case 'footway': case 'path': case 'cycleway': case 'pedestrian': case 'steps':
      return { width: 0.5, day: '#7d9a8a', night: '#5f8a7a', opacity: 0.55 };
    case 'track': case 'bridleway':
      return { width: 0.6, day: '#9a937a', night: '#7a735c', opacity: 0.5 };
    default:
      return { width: 0.8, day: '#a89b80', night: '#8a7f68', opacity: 0.6 };
  }
}

/** 把一条道路的坐标转成贴地 Line2，贴地形 + 桥梁抬高。 */
function buildRoadLine(
  road: OsmRoad,
  height: (x: number, z: number) => number,
  color: THREE.Color,
  style: RoadStyle,
  selected: boolean,
): Line2 | null {
  const coords = road.coordinates;
  if (coords.length < 2) return null;
  const pts: number[] = [];
  for (const c of coords) {
    const [x, z] = project(c);
    // 桥梁抬高到合理高度，普通道路贴地 + 小偏移
    const y = road.bridge ? Math.max(0.28, height(x, z)) + 0.06 : height(x, z) + 0.04;
    pts.push(x, y, z);
  }
  const geometry = new LineGeometry().setPositions(pts);
  const material = new LineMaterial({
    color,
    linewidth: selected ? style.width + 0.6 : style.width,
    worldUnits: false,
    transparent: true,
    opacity: selected ? 1 : style.opacity,
    depthWrite: false,
  });
  const line = new Line2(geometry, material);
  line.computeLineDistances();
  line.renderOrder = selected ? 7 : 5;
  line.userData.roadId = road.id;
  return line;
}

/**
 * 构建全部道路。返回分组与按道路 id 索引的集合（用于选中与拾取）。
 */
export function buildRoads(
  data: OsmRoads,
  height: (x: number, z: number) => number,
  selectedIds: Set<string> = new Set(),
): { group: THREE.Group; byId: Map<string, Line2>; dispose: () => void } {
  const group = new THREE.Group();
  group.name = 'yanghu-roads';
  const byId = new Map<string, Line2>();
  const disposables: { dispose: () => void }[] = [];

  for (const road of data.features) {
    const style = roadStyle(road);
    const selected = selectedIds.has(road.id);
    // 使用日间色，夜间由外层 theme() 统一 lerp
    const color = new THREE.Color(style.day);
    const line = buildRoadLine(road, height, color, style, selected);
    if (!line) continue;
    line.userData.style = style;
    group.add(line);
    byId.set(road.id, line);
    disposables.push(line.geometry, line.material);
  }

  return {
    group,
    byId,
    dispose: () => disposables.forEach(d => d.dispose()),
  };
}

/** 日夜间切换：遍历道路线，按 style 的 day/night 色插值。 */
export function themeRoads(byId: Map<string, Line2>, night: number) {
  for (const line of byId.values()) {
    const style = line.userData.style as RoadStyle;
    const mat = line.material as LineMaterial;
    const day = new THREE.Color(style.day);
    const nightC = new THREE.Color(style.night);
    mat.color.copy(day).lerp(nightC, night);
  }
}

/** 选中道路：加强线宽与亮度。 */
export function selectRoads(byId: Map<string, Line2>, selectedIds: Set<string>) {
  for (const [id, line] of byId) {
    const style = line.userData.style as RoadStyle;
    const mat = line.material as LineMaterial;
    const active = selectedIds.has(id);
    mat.linewidth = active ? style.width + 0.6 : style.width;
    mat.opacity = active ? 1 : style.opacity;
    line.renderOrder = active ? 7 : 5;
  }
}
