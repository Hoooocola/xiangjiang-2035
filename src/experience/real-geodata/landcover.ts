// WorldCover 土地覆盖栅格 → 贴地分类纹理渲染。
// 视觉原则（任务书 5.3）：低饱和分类材质、保留地形、水体保留原水面、不逐像元建 mesh。
import * as THREE from 'three';
import type {LandcoverRaster} from './types';
import {project} from '../geo';

/** 低饱和、贴地的分类色（区别于官方高饱和遥感色，用于三维地表）。 */
export const LANDCOVER_STYLE: Record<number, { day: string; night: string; label: string }> = {
  10: { day: '#8aa16e', night: '#4a6b52', label: '林地' },
  20: { day: '#a9a07a', night: '#5c5a45', label: '灌木' },
  30: { day: '#b9bf8f', night: '#5c6447', label: '草地' },
  40: { day: '#c9b878', night: '#6b6240', label: '耕地' },
  50: { day: '#b0a79e', night: '#565147', label: '建成区' },
  60: { day: '#b3a894', night: '#555047', label: '裸地/稀疏植被' },
  70: { day: '#e6e6e6', night: '#6f7478', label: '冰雪' },
  80: { day: '#6f93a8', night: '#2c4c5e', label: '永久水体' },
  90: { day: '#7ca67a', night: '#3e5f48', label: '草本湿地' },
  95: { day: '#4f7d55', night: '#2f4f3a', label: '红树林' },
  100: { day: '#cfcbb8', night: '#5d5c50', label: '苔藓地衣' },
};

/**
 * 生成分类纹理。用 Canvas 绘制低饱和分类色，作为贴地 mesh 的纹理。
 * 分辨率控制在研究范围栅格原生分辨率内，避免纹理过大。
 */
export function makeLandcoverTexture(raster: LandcoverRaster): THREE.CanvasTexture {
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
      // nodata 或未知分类：透明，让底层地形透出
      img.data[idx] = 0;
      img.data[idx + 1] = 0;
      img.data[idx + 2] = 0;
      img.data[idx + 3] = 0;
      continue;
    }
    const c = new THREE.Color(style.day);
    img.data[idx] = Math.round(c.r * 255);
    img.data[idx + 1] = Math.round(c.g * 255);
    img.data[idx + 2] = Math.round(c.b * 255);
    img.data[idx + 3] = 210; // 约 82% 不透明度，低饱和半透明贴地
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

/**
 * 构建贴地分类面。在洋湖研究范围上生成一个与地形贴合的平面 mesh，
 * 用分类纹理着色。像元不建独立 mesh，仅一个 tessellated 平面贴合 relief。
 */
export function buildLandcoverMesh(
  raster: LandcoverRaster,
  height: (x: number, z: number) => number,
): { mesh: THREE.Mesh; texture: THREE.CanvasTexture } {
  const texture = makeLandcoverTexture(raster);
  const [minLon, minLat, maxLon, maxLat] = raster.bbox;
  const [x0, z0] = project([minLon, minLat]);
  const [x1, z1] = project([maxLon, maxLat]);
  const w = Math.abs(x1 - x0), h = Math.abs(z1 - z0);

  // 平面细分到与栅格相当，使纹理映射到地理位置正确。
  const cols = Math.max(2, Math.round(w / 0.5)); // 每 0.5 场景单位(=50m) 一个细分
  const rows = Math.max(2, Math.round(h / 0.5));
  const geo = new THREE.PlaneGeometry(w, h, Math.min(cols, 128), Math.min(rows, 128));
  geo.rotateX(-Math.PI / 2);
  // 贴地：采样地形高度，加微小偏移避免 z-fighting
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i), lz = pos.getZ(i);
    const wx = x0 + lx, wz = z0 + lz;
    pos.setY(i, height(wx, wz) + 0.03);
  }
  geo.computeVertexNormals();
  // UV 映射到 bbox 范围（x0~x1, z0~z1）
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const lx = pos.getX(i), lz = pos.getZ(i);
    uv.setXY(i, (lx) / w, (lz) / h);
  }
  geo.attributes.uv.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 2;
  mesh.userData.landcover = true;
  return { mesh, texture };
}

/** 释放资源。 */
export function disposeLandcover(mesh: THREE.Mesh, texture: THREE.CanvasTexture) {
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
  texture.dispose();
}
