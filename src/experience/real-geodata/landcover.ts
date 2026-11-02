// WorldCover 土地覆盖栅格 → 贴地分类纹理渲染。
// 视觉原则（任务书 Stage 3 / C）：低饱和分类材质、保留地形与建筑深度、水体保留原水面、
// 不逐像元建 mesh、支持按类别高亮、克制亮度与不透明度。
import * as THREE from 'three';
import type {LandcoverRaster} from './types';
import {project} from '../geo';

/** 低饱和、贴地的分类色（区别于官方高饱和遥感色，用于三维地表）。 */
export const LANDCOVER_STYLE: Record<number, { day: string; night: string; label: string; zh: string }> = {
  10: { day: '#7f9a68', night: '#44644d', label: 'Tree cover', zh: '林地' },
  20: { day: '#a49c76', night: '#565544', label: 'Shrubland', zh: '灌木' },
  30: { day: '#aeb487', night: '#565e42', label: 'Grassland', zh: '草地' },
  40: { day: '#bfb276', night: '#645d3c', label: 'Cropland', zh: '耕地' },
  50: { day: '#a89f97', night: '#514c43', label: 'Built-up', zh: '建成区' },
  60: { day: '#aca18c', night: '#504a42', label: 'Bare / sparse vegetation', zh: '裸地/稀疏植被' },
  70: { day: '#dcdcdc', night: '#686d72', label: 'Snow and ice', zh: '冰雪' },
  80: { day: '#6f8fa4', night: '#2b4859', label: 'Permanent water bodies', zh: '永久水体' },
  90: { day: '#7ba277', night: '#3c5c46', label: 'Herbaceous wetland', zh: '草本湿地' },
  95: { day: '#4f7d55', night: '#2f4f3a', label: 'Mangroves', zh: '红树林' },
  100: { day: '#c5c1b2', night: '#57564c', label: 'Moss and lichen', zh: '苔藓地衣' },
};

/**
 * 生成分类纹理。用 Canvas 绘制低饱和分类色。
 * 方向约定：数据 `data` 为行优先（row 0 = 最北，来自 north-up GeoTIFF）。
 * Canvas 第 0 行（顶部）= 数据 row 0 = 北。CanvasTexture 默认 flipY=true，
 * 使 canvas 顶部映射到 v=1；PlaneGeometry rotateX 后 v=1 位于 z 最小处（北），
 * 因此默认 UV 与纹理方向天然对齐，无需手工翻转。
 *
 * @param highlight 要突出的类别编码；null 表示整体弱化显示全部类别。
 * @param night 0=日间, 1=夜间，用于在日/夜间配色间插值。
 */
export function makeLandcoverTexture(
  raster: LandcoverRaster,
  highlight: number | null = null,
  night = 0,
): THREE.CanvasTexture {
  const { width, height, data } = raster;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(width, height);
  for (let i = 0; i < data.length; i++) {
    const code = data[i];
    const style = LANDCOVER_STYLE[code];
    const idx = i * 4;
    if (!style) {
      // nodata 或未知分类：完全透明，让底层地形透出。
      img.data[idx] = 0;
      img.data[idx + 1] = 0;
      img.data[idx + 2] = 0;
      img.data[idx + 3] = 0;
      continue;
    }
    const c = new THREE.Color(style.day).lerp(new THREE.Color(style.night), night);
    img.data[idx] = Math.round(c.r * 255);
    img.data[idx + 1] = Math.round(c.g * 255);
    img.data[idx + 2] = Math.round(c.b * 255);
    // 透明度策略：
    // - 未选中类别：整体弱化（约 45% 不透明度），让地形与建筑保持可读。
    // - 选中某类别：该类别更突出（约 78%），其余类别进一步降低（约 22%）。
    // - 水体：额外降低不透明度，尽量保留底层水面材质。
    const isWater = code === 80;
    let alpha: number;
    if (highlight === null) alpha = isWater ? 0.28 : 0.45;
    else if (code === highlight) alpha = isWater ? 0.55 : 0.78;
    else alpha = 0.18;
    img.data[idx + 3] = Math.round(alpha * 255);
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export interface LandcoverRender {
  mesh: THREE.Mesh;
  texture: THREE.CanvasTexture;
  /** 更新当前选中的类别（null = 整体弱化）与昼夜，重建纹理。 */
  update: (highlight: number | null, night: number) => void;
  dispose: () => void;
}

/**
 * 构建贴地分类面。在洋湖研究范围上生成一个与地形贴合的平面 mesh，
 * 用分类纹理着色。像元不建独立 mesh，仅一个细分平面贴合 relief。
 *
 * 关键修复：PlaneGeometry 中心在原点，必须平移到 bbox 投影中心，
 * 否则 mesh 停留在原点附近，导致整层错位（此前 wx = x0 + lx 的基准错误）。
 * 默认 UV 已与纹理方向对齐，不再手工重写。
 */
export function buildLandcoverMesh(
  raster: LandcoverRaster,
  height: (x: number, z: number) => number,
): LandcoverRender {
  const [minLon, minLat, maxLon, maxLat] = raster.bbox;
  const [x0, z0] = project([minLon, minLat]); // 西南（z 大，南）
  const [x1, z1] = project([maxLon, maxLat]); // 东北（z 小，北）
  const w = Math.abs(x1 - x0);
  const h = Math.abs(z1 - z0);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;

  // 平面细分与栅格相当（约每 0.5 场景单位 = 50m 一个细分，封顶避免过密）。
  const cols = Math.min(128, Math.max(2, Math.round(w / 0.5)));
  const rows = Math.min(128, Math.max(2, Math.round(h / 0.5)));
  const geo = new THREE.PlaneGeometry(w, h, cols, rows);
  geo.rotateX(-Math.PI / 2);

  // 贴地 + 平移到 bbox 中心（PlaneGeometry 中心在原点，须平移）。
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const wx = cx + lx;
    const wz = cz + lz;
    pos.setY(i, height(wx, wz) + 0.05);
  }
  geo.computeVertexNormals();
  // 注意：不重写 UV。默认 UV 已正确（u: 西→东, v: 北→南），
  // 与 CanvasTexture flipY + 行优先 north-up 数据方向对齐。

  const texture = makeLandcoverTexture(raster);
  // 使用更贴合地表的材质：启用深度测试保持真实遮挡，关闭深度写入避免遮挡建筑；
  // 用 polygonOffset 把面片略微下沉，避免与地形 z-fighting。
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 1;
  mesh.userData.landcover = true;

  let disposed = false;
  const render: LandcoverRender = {
    mesh,
    texture,
    update: (highlight, night) => {
      if (disposed) return;
      const next = makeLandcoverTexture(raster, highlight, night);
      render.texture.dispose();
      render.texture = next;
      material.map = next;
      material.needsUpdate = true;
    },
    dispose: () => {
      disposed = true;
      geo.dispose();
      material.dispose();
      render.texture.dispose();
    },
  };
  return render;
}

/** 释放资源（兼容旧调用）。 */
export function disposeLandcover(render: LandcoverRender) {
  render.dispose();
}
