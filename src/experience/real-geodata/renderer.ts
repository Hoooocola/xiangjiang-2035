// 统一三维真实数据渲染协调器。
// 管理 WorldCover / OSM / GBIF 三个图层的加载、渲染、显隐、主题与资源释放。
// 复用现有坐标投影 (geo.project) 与地形高度 (terrain.height)，不另建坐标系统。
import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {loadLandcover, loadRoads, loadGbif} from './loaders';
import {buildLandcoverMesh, type LandcoverRender} from './landcover';
import {buildRoads, themeRoads, selectRoads} from './roads';
import {buildGbifPoints, type GbifRender} from './gbif';
import {runProximityAnalysis} from './analysis';
import type {LandcoverRaster, OsmRoads, GbifDataset, ProximityAnalysis} from './types';

export interface RealGeoLayerState {
  landcover: boolean;
  roads: boolean;
  observations: boolean;
}

export interface RealGeoRenderer {
  root: THREE.Group;
  setState: (state: RealGeoLayerState) => void;
  theme: (night: number) => void;
  updateByDistance: (distance: number) => void;
  highlightObservation: (key: number | null) => void;
  selectRoads: (ids: string[]) => void;
  /** 选择要突出的土地覆盖类别（null = 整体弱化视图）。 */
  selectLandcoverClass: (code: number | null) => void;
  analyze: () => Promise<ProximityAnalysis | null>;
  dispose: () => void;
  status: () => { landcover: boolean; roads: boolean; observations: boolean };
  /** GBIF 聚合点位数量（供图例说明）。 */
  gbifClusterCount: () => number;
  /** 某记录所在坐标点位的全部记录（供详情展开）。 */
  gbifRecordsAt: (key: number) => import('./types').GbifRecord[];
  metadata: () => {
    landcover?: LandcoverRaster;
    roads?: OsmRoads;
    gbif?: GbifDataset;
  };
}

export async function createRealGeoRenderer(
  height: (x: number, z: number) => number,
): Promise<RealGeoRenderer> {
  const root = new THREE.Group();
  root.name = 'real-geodata';
  root.visible = false;

  let landcoverRaster: LandcoverRaster | null = null;
  let roadsData: OsmRoads | null = null;
  let gbifData: GbifDataset | null = null;

  let landcoverRender: LandcoverRender | null = null;
  let roadsRender: { group: THREE.Group; byId: Map<string, Line2>; dispose: () => void } | null = null;
  let gbifRender: GbifRender | null = null;

  let state: RealGeoLayerState = { landcover: false, roads: false, observations: false };
  let currentNight = 0;
  let selectedClass: number | null = null;
  let disposed = false;

  const [landcover, roads, gbif] = await Promise.all([
    loadLandcover().catch(e => { console.warn('WorldCover 加载失败', e); return null; }),
    loadRoads().catch(e => { console.warn('OSM 道路加载失败', e); return null; }),
    loadGbif().catch(e => { console.warn('GBIF 加载失败', e); return null; }),
  ]);
  if (disposed) return { root, dispose: () => {}, /* 其余占位 */ } as unknown as RealGeoRenderer;

  landcoverRaster = landcover;
  roadsData = roads;
  gbifData = gbif;

  if (landcover) {
    landcoverRender = buildLandcoverMesh(landcover, height);
    landcoverRender.mesh.visible = false;
    root.add(landcoverRender.mesh);
  }
  if (roads) {
    roadsRender = buildRoads(roads, height);
    roadsRender.group.visible = false;
    root.add(roadsRender.group);
  }
  if (gbif) {
    gbifRender = buildGbifPoints(gbif, height);
    gbifRender.group.visible = false;
    root.add(gbifRender.group);
  }

  function applyState() {
    if (landcoverRender) landcoverRender.mesh.visible = state.landcover;
    if (roadsRender) roadsRender.group.visible = state.roads;
    if (gbifRender) gbifRender.group.visible = state.observations;
    root.visible = state.landcover || state.roads || state.observations;
  }

  let analysis: ProximityAnalysis | null = null;

  return {
    root,
    setState: (next: RealGeoLayerState) => { state = next; applyState(); },
    theme: (n: number) => {
      currentNight = n;
      if (roadsRender) themeRoads(roadsRender.byId, n);
      if (gbifRender) gbifRender.theme(n);
      if (landcoverRender) landcoverRender.update(selectedClass, n);
    },
    updateByDistance: (distance: number) => { gbifRender?.updateByDistance(distance); },
    highlightObservation: (key: number | null) => { gbifRender?.highlight(key); },
    selectRoads: (ids: string[]) => {
      if (roadsRender) selectRoads(roadsRender.byId, new Set(ids));
    },
    selectLandcoverClass: (code: number | null) => {
      selectedClass = code;
      if (landcoverRender) landcoverRender.update(code, currentNight);
    },
    analyze: async () => {
      if (!gbifData || !roadsData) return null;
      if (!analysis) analysis = runProximityAnalysis(gbifData, roadsData);
      return analysis;
    },
    dispose: () => {
      disposed = true;
      landcoverRender?.dispose();
      roadsRender?.dispose();
      gbifRender?.dispose();
      root.clear();
    },
    status: () => ({ landcover: !!landcoverRaster, roads: !!roadsData, observations: !!gbifData }),
    gbifClusterCount: () => gbifRender?.clusterCount ?? 0,
    gbifRecordsAt: (key) => gbifRender?.recordsAt(key) ?? [],
    metadata: () => ({
      landcover: landcoverRaster ?? undefined,
      roads: roadsData ?? undefined,
      gbif: gbifData ?? undefined,
    }),
  };
}
