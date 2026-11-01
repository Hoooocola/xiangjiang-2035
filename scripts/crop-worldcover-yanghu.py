#!/usr/bin/env python3
"""从 AWS S3 的 ESA WorldCover 2021 v200 COG 远程裁剪洋湖研究范围，
输出前端可读的 landcover 栅格 JSON（低饱和分类 + 来源元数据）。

用法:
  python scripts/crop-worldcover-yanghu.py
"""
import json
import os
import numpy as np
import rasterio
from rasterio.windows import from_bounds

# 洋湖研究范围 (WGS84)
BBOX = (112.88, 28.09, 112.99, 28.17)  # minLon, minLat, maxLon, maxLat
# WorldCover 瓦片（3°x3°）: N27E111 覆盖 111-114E, 27-30N
TILE_URL = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N27E111_Map.tif"
OUT_DIR = "public/data"
CACHE = ".cache/yanghu"

# WorldCover 2021 分类编码（官方产品定义）
CLASSES = {
    10: {"name": "Tree cover", "zh": "林地", "hex": "#4f7a3d"},
    20: {"name": "Shrubland", "zh": "灌木", "hex": "#a4a06a"},
    30: {"name": "Grassland", "zh": "草地", "hex": "#c7d39b"},
    40: {"name": "Cropland", "zh": "耕地", "hex": "#e1c75f"},
    50: {"name": "Built-up", "zh": "建成区", "hex": "#c1a0a0"},
    60: {"name": "Bare / sparse vegetation", "zh": "裸地/稀疏植被", "hex": "#c9b79b"},
    70: {"name": "Snow and ice", "zh": "冰雪", "hex": "#e8e8e8"},
    80: {"name": "Permanent water bodies", "zh": "永久水体", "hex": "#8fb8d4"},
    90: {"name": "Herbaceous wetland", "zh": "草本湿地", "hex": "#6a9e6a"},
    95: {"name": "Mangroves", "zh": "红树林", "hex": "#3a6b3a"},
    100: {"name": "Moss and lichen", "zh": "苔藓地衣", "hex": "#d4d4c8"},
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(CACHE, exist_ok=True)

    print(f"读取 WorldCover COG: {TILE_URL}")
    with rasterio.open(TILE_URL) as src:
        print(f"  瓦片范围: {src.bounds}, CRS: {src.crs}, 大小: {src.width}x{src.height}")
        # 裁剪到研究范围
        window = from_bounds(*BBOX, transform=src.transform)
        window = window.round_offsets().round_lengths()
        data = src.read(1, window=window)
        transform = src.window_transform(window)
        crs = src.crs
        # 读取有效数据掩码（0 = nodata）
        nodata = src.nodata

    print(f"  裁剪后: {data.shape}, CRS: {crs}")
    # 统计分类分布
    unique, counts = np.unique(data, return_counts=True)
    dist = {}
    for v, c in zip(unique, counts):
        name = CLASSES.get(int(v), {}).get("name", f"unknown({v})")
        dist[str(int(v))] = int(c)

    # 栅格尺寸（行列数、像元大小，以度表示；前端投影时换算为米）
    pixel_size = transform.a  # 东西向，约 8.33e-05 度（10m）
    # 转为紧凑格式：记录编码 + 尺寸 + 元数据，前端用整数数组渲染纹理
    # 用 base64 或直接存整数数组？为控制体积，按行存 uint8 列表
    height, width = data.shape
    flat = data.astype(np.uint8).flatten().tolist()

    manifest = {
        "retrievedAt": __import__("datetime").datetime.now().isoformat(),
        "source": "ESA WorldCover 2021 v200 (10m)",
        "sourceUrl": "https://esa-worldcover.org/en/data-access",
        "tileUrl": TILE_URL,
        "license": "CC-BY 4.0 (ESA WorldCover)",
        "attribution": "© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium",
        "product": "WorldCover 10m 2021",
        "bbox": BBOX,
        "crs": str(crs),
        "width": width,
        "height": height,
        "pixelSize": float(pixel_size),
        "pixelSizeUnit": "degrees (EPSG:4326); ~10m ground resolution",
        "nodata": nodata,
        "classes": CLASSES,
        "distribution": dist,
        "coordinateSystem": "EPSG:4326 (WGS84), 栅格像元对齐到 10m 网格",
        "note": "WorldCover 土地覆盖分类，非城市规划用地；湿地类别非法定湿地保护边界。",
    }

    out = {**manifest, "data": flat}
    out_path = os.path.join(OUT_DIR, "worldcover-yanghu.json")
    with open(out_path, "w") as f:
        json.dump(out, f)
    with open(os.path.join(CACHE, "worldcover-summary.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    size_mb = os.path.getsize(out_path) / 1024 / 1024
    print("=== WorldCover 裁剪结果 ===")
    print(f"  栅格尺寸: {width}x{height} ({width * height} 像元)")
    print(f"  像元大小: {pixel_size}m")
    print(f"  分类分布: {dist}")
    print(f"  输出大小: {size_mb:.2f} MB")
    print(f"  已写入 {out_path}")


if __name__ == "__main__":
    main()
