// 真实地理数据图层：类型定义与来源元数据。
// 对应任务书 Stage 1-3 的 WorldCover / OSM / GBIF 三种几何类型。
import type {Coordinate} from '../geo';

/** 真实数据状态，遵循「数据真实性」契约：REAL / PROCESSED / DEMO / UNVERIFIED。 */
export type DataStatus = 'REAL' | 'PROCESSED' | 'DEMO' | 'UNVERIFIED';

export interface SourceReference {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  observationPeriod?: string;
  publishedAt?: string;
  retrievedAt?: string;
  spatialResolution?: string;
  coordinateSystem?: string;
  geometryAccuracy?: string;
  processingMethod?: string;
  dataStatus: DataStatus;
}

/** WorldCover 土地覆盖分类（官方 2021 v200 产品定义，11 类）。 */
export interface LandcoverClass {
  code: number;
  name: string;
  zh: string;
  hex: string;
  /** 低饱和、贴地的分类材质色（日/夜）。 */
  day: string;
  night: string;
}

export interface LandcoverRaster {
  source: SourceReference;
  bbox: [number, number, number, number]; // minLon, minLat, maxLon, maxLat
  width: number;
  height: number;
  pixelSize: number; // 度
  nodata: number | null;
  classes: Record<string, { name: string; zh: string; hex: string }>;
  distribution: Record<string, number>;
  data: number[]; // 按行优先的 uint8 分类编码
}

/** OSM 道路分级（视觉权重由前端映射）。 */
export interface OsmRoad {
  id: string;
  highway: string;
  name: string | null;
  bridge: string | null;
  tunnel: string | null;
  surface: string | null;
  foot: string | null;
  bicycle: string | null;
  order: number;
  coordinates: Coordinate[];
}

export interface OsmRoads {
  source: SourceReference;
  bbox: [number, number, number, number];
  features: OsmRoad[];
  counts: { roads: number; bridges: number; footPaths: number };
}

/** GBIF 生物观察记录（清洗后）。 */
export interface GbifRecord {
  key: number;
  occurrenceId: string | null;
  lat: number;
  lon: number;
  uncertainty: number | null;
  precision: 'fine' | 'coarse' | 'unreported';
  species: string | null;
  scientificName: string | null;
  taxon: string;
  taxonRank: string | null;
  kingdom: string | null;
  class: string | null;
  order: string | null;
  family: string | null;
  genus: string | null;
  basisOfRecord: string | null;
  eventDate: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  datasetKey: string | null;
  datasetName: string | null;
  license: string | null;
  geodeticDatum: string | null;
  iucn: string | null;
}

export interface GbifDataset {
  source: SourceReference;
  bbox: [number, number, number, number];
  totalRaw: number;
  afterCleaning: number;
  byClass: Record<string, number>;
  byPrecision: Record<string, number>;
  records: GbifRecord[];
}

/** 空间邻近分析结果（任务书 10.4 要求的结构）。 */
export interface ProximityAnalysis {
  analysisId: string;
  studyAreaId: string;
  inputLayerIds: string[];
  sourceReferences: SourceReference[];
  parameters: {
    distanceMeters: number;
    method: string;
    projection: string;
    minPrecision: string;
  };
  method: string;
  outputGeometry: { type: 'Point'; coordinates: Coordinate[] };
  spatialObservation: string;
  candidateResearchQuestion: string;
  limitations: string[];
  verificationStatus: 'UNVERIFIED';
  stats: {
    totalGbif: number;
    withinDistance: number;
    nearestRoadMetersMin: number;
    nearestRoadMetersMedian: number;
  };
  matchedRecordKeys: number[];
}

/** 真实数据图层开关（并入 OverlayState 的扩展）。 */
export interface RealGeoLayerState {
  landcover: boolean;
  roads: boolean;
  observations: boolean;
}
