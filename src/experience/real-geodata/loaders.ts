// 真实地理数据加载器：按需 fetch 三份预处理后的 JSON 数据。
// 数据文件在 scripts/ 下生成，存放于 public/data/，遵循「不把原始遥感全量打包进前端」。
// 数据文件的 source/sourceUrl/license/attribution 是分散的顶层字段，这里统一归一化为 SourceReference 对象。
import type {LandcoverRaster, OsmRoads, OsmRoad, GbifDataset, GbifRecord, SourceReference} from './types';
import type {Coordinate} from '../geo';

const ROOT = '/data';

let landcoverPromise: Promise<LandcoverRaster> | null = null;
let roadsPromise: Promise<OsmRoads> | null = null;
let gbifPromise: Promise<GbifDataset> | null = null;

async function read<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`数据加载失败: ${path}`);
  return res.json() as Promise<T>;
}

/** OSM 数据文件为 GeoJSON Feature 结构，加载时归一化为扁平的 OsmRoad[]。 */
interface OsmGeoJsonFeature {
  type: 'Feature';
  id: string;
  properties: {
    highway: string;
    name: string | null;
    bridge: string | null;
    tunnel: string | null;
    surface: string | null;
    foot: string | null;
    bicycle: string | null;
    order: number;
  };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

interface OsmGeoJson {
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  bbox: [number, number, number, number];
  coordinateSystem: string;
  counts: { roads: number; bridges: number; footPaths: number };
  note: string;
  features: OsmGeoJsonFeature[];
}

/** WorldCover 数据文件原始 JSON 结构（source 为分散顶层字段）。 */
interface WorldCoverJson {
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  retrievedAt: string;
  bbox: [number, number, number, number];
  crs: string;
  width: number;
  height: number;
  pixelSize: number;
  pixelSizeUnit: string;
  nodata: number | null;
  classes: Record<string, { name: string; zh: string; hex: string }>;
  distribution: Record<string, number>;
  coordinateSystem: string;
  data: number[];
}

/** WorldCover 土地覆盖栅格（约 4.8MB，懒加载）。source 归一化为 SourceReference。 */
export function loadLandcover(): Promise<LandcoverRaster> {
  if (!landcoverPromise) {
    landcoverPromise = read<WorldCoverJson>(`${ROOT}/worldcover-yanghu.json`).then((raw) => {
      const source: SourceReference = {
        sourceId: 'esa-worldcover',
        sourceName: raw.source,
        sourceUrl: raw.sourceUrl,
        license: raw.license,
        attribution: raw.attribution,
        retrievedAt: raw.retrievedAt,
        spatialResolution: raw.pixelSizeUnit,
        coordinateSystem: raw.crs,
        dataStatus: 'PROCESSED',
      };
      return { ...raw, source };
    });
  }
  return landcoverPromise;
}

/** OSM 道路网络（GeoJSON → 扁平 OsmRoad[] 归一化）。 */
export function loadRoads(): Promise<OsmRoads> {
  if (!roadsPromise) {
    roadsPromise = read<OsmGeoJson>(`${ROOT}/osm-yanghu-roads.json`).then((raw) => {
      const features: OsmRoad[] = raw.features.map((f) => ({
        id: f.id,
        highway: f.properties.highway,
        name: f.properties.name,
        bridge: f.properties.bridge,
        tunnel: f.properties.tunnel,
        surface: f.properties.surface,
        foot: f.properties.foot,
        bicycle: f.properties.bicycle,
        order: f.properties.order,
        coordinates: f.geometry.coordinates.map(([lon, lat]) => [lon, lat] as Coordinate),
      }));
      return {
        source: {
          sourceId: 'osm-yanghu',
          sourceName: raw.source,
          sourceUrl: raw.sourceUrl,
          license: raw.license,
          attribution: raw.attribution,
          coordinateSystem: raw.coordinateSystem,
          dataStatus: 'REAL',
        },
        bbox: raw.bbox,
        features,
        counts: { roads: raw.counts.roads, bridges: raw.counts.bridges, footPaths: raw.counts.footPaths },
      };
    });
  }
  return roadsPromise;
}

/** GBIF 数据文件原始 JSON 结构（source 为分散顶层字段）。 */
interface GbifJson {
  source: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  retrievedAt: string;
  bbox: [number, number, number, number];
  totalRaw: number;
  afterCleaning: number;
  removedByGeospatialIssue: number;
  byClass: Record<string, number>;
  byPrecision: Record<string, number>;
  coordinateSystem: string;
  note: string;
  records: GbifRecord[];
}

/** GBIF 生物观察记录。source 归一化为 SourceReference。 */
export function loadGbif(): Promise<GbifDataset> {
  if (!gbifPromise) {
    gbifPromise = read<GbifJson>(`${ROOT}/gbif-yanghu.json`).then((raw) => {
      const source: SourceReference = {
        sourceId: 'gbif',
        sourceName: raw.source,
        sourceUrl: raw.sourceUrl,
        license: raw.license,
        attribution: raw.attribution,
        retrievedAt: raw.retrievedAt,
        coordinateSystem: raw.coordinateSystem,
        dataStatus: 'REAL',
      };
      return { ...raw, source };
    });
  }
  return gbifPromise;
}

/** 预加载全部真实数据（在引擎就绪后调用，用于缓存）。 */
export function preloadRealGeoData(): Promise<[LandcoverRaster, OsmRoads, GbifDataset]> {
  return Promise.all([loadLandcover(), loadRoads(), loadGbif()]);
}
