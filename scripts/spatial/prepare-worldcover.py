"""Optional offline preparation: pip install rasterio==1.4.3. No frontend dependency."""
import json, hashlib, datetime
from pathlib import Path
import rasterio
from rasterio.windows import from_bounds
url='https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N27E111_Map.tif'
bounds=[112.90,28.10,113.02,28.27]  # analysis window only; never changes scene AOI
out=Path('public/data/spatial');out.mkdir(parents=True,exist_ok=True)
with rasterio.open(url) as src:
    window=from_bounds(*bounds,src.transform).round_offsets().round_lengths()
    values=src.read(1,window=window)
    transform=src.window_transform(window)
    profile=src.profile.copy();profile.update(width=values.shape[1],height=values.shape[0],transform=transform,compress='deflate',tiled=True)
    with rasterio.open(out/'worldcover-2021-core.tif','w',**profile) as dst: dst.write(values,1)
    actual=list(rasterio.transform.array_bounds(*values.shape,transform))
    data=dict(width=values.shape[1],height=values.shape[0],bounds=actual,nodata=0,values=values.flatten().tolist())
    (out/'worldcover-2021-core.json').write_text(json.dumps(data,separators=(',',':')))
    manifest=dict(sourceId='esa-worldcover-2021-v200',sourceName='ESA WorldCover 10m 2021 v200',sourceUrl=url,license='CC-BY-4.0',attribution='© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium',period={'start':'2021-01-01','end':'2021-12-31'},observedAt=None,publishedAt='2022-10-28',retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),spatialResolution='approximately 10 m; native EPSG:4326 pixel spacing',coordinateReferenceSystem='EPSG:4326',geometryAccuracy='10m classification grid; not cadastral or legal wetland boundary',processingMethod='Native pixel window from public COG; no resampling. Study polygon mask applied during analysis.',dataStatus='public',bounds=actual,width=values.shape[1],height=values.shape[0],sha256=hashlib.sha256((out/'worldcover-2021-core.tif').read_bytes()).hexdigest())
    Path('data/spatial/worldcover-source.json').write_text(json.dumps(manifest,indent=2))
    print(json.dumps({k:manifest[k] for k in ['bounds','width','height','sha256']}))
