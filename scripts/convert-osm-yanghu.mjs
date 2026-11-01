// 将 Overpass 下载的洋湖 OSM 道路数据转换为前端可读的 GeoJSON。
// 输入: .cache/yanghu/roads-raw.json (Overpass JSON: nodes + ways)
// 输出: public/data/osm-yanghu-roads.json (分级道路 + 元数据)
import fs from 'node:fs';
import path from 'node:path';

const CACHE = '.cache/yanghu';
const OUT_DIR = 'public/data';

// 道路分级：视觉权重、线宽与颜色由前端决定，这里保留 highway 语义与桥隧属性
const HIGHWAY_ORDER = {
  motorway: 0, trunk: 1, primary: 2, secondary: 3, tertiary: 4,
  unclassified: 5, residential: 6, living_street: 7, service: 8,
  footway: 9, path: 10, cycleway: 11, pedestrian: 12, steps: 13,
  track: 14, bridleway: 15,
};

function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(CACHE, 'roads-raw.json'), 'utf8'));
  const elements = raw.elements;
  const nodes = new Map();
  const ways = [];
  for (const e of elements) {
    if (e.type === 'node') nodes.set(e.id, [e.lon, e.lat]);
    else if (e.type === 'way') ways.push(e);
  }

  const features = [];
  let withRoads = 0, withBridges = 0, withFoot = 0;
  for (const w of ways) {
    const highway = w.tags?.highway;
    if (!highway) continue;
    const coords = w.nodes.map(id => nodes.get(id)).filter(Boolean);
    if (coords.length < 2) continue; // 悬空 way（节点未被下载）跳过
    const order = HIGHWAY_ORDER[highway] ?? 99;
    const name = w.tags?.name ?? null;
    const bridge = w.tags?.bridge && w.tags.bridge !== 'no' ? w.tags.bridge : null;
    const tunnel = w.tags?.tunnel && w.tags.tunnel !== 'no' ? w.tags.tunnel : null;
    const surface = w.tags?.surface ?? null;
    const foot = w.tags?.foot ?? null;
    const bicycle = w.tags?.bicycle ?? null;

    features.push({
      type: 'Feature',
      id: `osm/${w.id}`,
      properties: { highway, name, bridge, tunnel, surface, foot, bicycle, order },
      geometry: { type: 'LineString', coordinates: coords },
    });
    withRoads += 1;
    if (bridge) withBridges += 1;
    if (['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'track', 'bridleway'].includes(highway)) withFoot += 1;
  }

  const manifest = {
    retrievedAt: new Date().toISOString(),
    source: 'OpenStreetMap via Overpass API',
    sourceUrl: 'https://overpass-turbo.eu/',
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    bbox: [112.88, 28.09, 112.99, 28.17],
    coordinateSystem: 'WGS84 (EPSG:4326)',
    counts: { roads: withRoads, bridges: withBridges, footPaths: withFoot, totalFeatures: features.length },
    note: '道路来自 OSM 矢量；覆盖可能不完整，未根据影像臆测缺失连接。',
  };

  const out = { ...manifest, features };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'osm-yanghu-roads.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(CACHE, 'osm-roads-summary.json'), JSON.stringify(manifest, null, 2));
  console.log('=== OSM 道路转换结果 ===');
  console.log(JSON.stringify(manifest, null, 2));
}

main();
