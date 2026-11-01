// 空间邻近关系分析：GBIF 观察记录与 OSM 道路的测地距离关系。
// 不能把经纬度角度坐标的欧氏距离当米；使用 Haversine 测地距离。
// 分析结果遵循任务书 10.4 的结构，且不把邻近解释为因果。
import type {GbifDataset, OsmRoads, ProximityAnalysis, SourceReference} from './types';

const EARTH_R = 6371008.8; // 米

/** Haversine 测地距离（米）。 */
export function haversineMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(a));
}

/** 点到线段的最近测地距离（米）。线段端点用局部等距近似，距离用测地公式。 */
export function pointToSegmentMeters(
  plon: number, plat: number,
  alon: number, alat: number, blon: number, blat: number,
): number {
  // 在局部平面（米）投影上求最近点参数 t，再算测地距离
  const lat0 = plat, cosLat = Math.cos(lat0 * Math.PI / 180);
  const mPerDegLon = 111320 * cosLat, mPerDegLat = 110540;
  const ax = (alon - plon) * mPerDegLon, ay = (alat - plat) * mPerDegLat;
  const bx = (blon - plon) * mPerDegLon, by = (blat - plat) * mPerDegLat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return haversineMeters(plon, plat, alon, alat);
  let t = -((ax * dx + ay * dy) / len2);
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  const clon = plon + cx / mPerDegLon, clat = plat + cy / mPerDegLat;
  return haversineMeters(plon, plat, clon, clat);
}

/** 计算一条记录到所有道路的最近距离（米）。 */
export function nearestRoadDistance(lon: number, lat: number, roads: OsmRoads): number {
  let best = Infinity;
  for (const road of roads.features) {
    const c = road.coordinates;
    for (let i = 1; i < c.length; i++) {
      const d = pointToSegmentMeters(lon, lat, c[i - 1][0], c[i - 1][1], c[i][0], c[i][1]);
      if (d < best) best = d;
    }
  }
  return best;
}

export const STUDY_AREA = { id: 'yanghu-wetland', name: '洋湖湿地及周边' };

/** 执行邻近分析，返回结构化结果。 */
export function runProximityAnalysis(
  gbif: GbifDataset,
  roads: OsmRoads,
  distanceMeters = 150,
): ProximityAnalysis {
  const validRecords = gbif.records.filter(r => r.precision !== 'unreported');
  const within: number[] = [];
  const distances: number[] = [];

  for (const r of validRecords) {
    const d = nearestRoadDistance(r.lon, r.lat, roads);
    distances.push(d);
    if (d <= distanceMeters) within.push(r.key);
  }

  distances.sort((a, b) => a - b);
  const median = distances.length ? distances[Math.floor(distances.length / 2)] : 0;
  const min = distances.length ? distances[0] : 0;

  const sourceReferences: SourceReference[] = [gbif.source, roads.source];

  return {
    analysisId: `proximity-gbif-roads-${distanceMeters}m`,
    studyAreaId: STUDY_AREA.id,
    inputLayerIds: ['observations', 'roads'],
    sourceReferences,
    parameters: {
      distanceMeters,
      method: '测地最近邻距离（Haversine）',
      projection: 'WGS84，点到线段用局部等距投影 + 测地距离公式',
      minPrecision: '排除 coordinateUncertainty 未报告的记录',
    },
    method: `计算每条 GBIF 观察记录（${validRecords.length} 条有效坐标记录）到最近 OSM 道路线段的测地距离，筛选 ≤ ${distanceMeters} 米的记录。`,
    outputGeometry: {
      type: 'Point',
      coordinates: validRecords.filter(r => within.includes(r.key)).map(r => [r.lon, r.lat]),
    },
    spatialObservation: `在 ${validRecords.length} 条有效坐标观察记录中，${within.length} 条（${((within.length / validRecords.length) * 100).toFixed(1)}%）位于最近道路 ${distanceMeters} 米范围内。最近道路距离中位数约 ${median.toFixed(0)} 米，最小值 ${min.toFixed(0)} 米。`,
    candidateResearchQuestion: '部分生态观察记录集中在现有道路附近，建议进一步调查该区域的人类活动方式（步行可达性、观测便利性）、生态条件与观察数据覆盖情况，而非直接推断道路对生物多样性有影响。',
    limitations: [
      'GBIF 观察记录存在采样偏差：记录集中在便于到达的位置，不代表完整物种分布。',
      '坐标不确定性未报告或 > 500m 的记录已被排除或标记，精度有限。',
      'OSM 道路覆盖可能不完整（如新建道路、园路缺失），距离计算受道路数据完整性影响。',
      '空间邻近是待验证的问题线索，不构成因果关系。',
    ],
    verificationStatus: 'UNVERIFIED',
    stats: {
      totalGbif: validRecords.length,
      withinDistance: within.length,
      nearestRoadMetersMin: min,
      nearestRoadMetersMedian: median,
    },
    matchedRecordKeys: within,
  };
}
