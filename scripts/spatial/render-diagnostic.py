"""Offline evidence graphic from native raster + existing vectors, not production UI.
Requires Pillow + numpy (only for rendering the review artifact).
"""
import json,base64,io
from pathlib import Path
import numpy as np
from PIL import Image
root=Path('public/data');r=json.loads((root/'spatial/worldcover-2021-core.json').read_text());area=json.loads((root/'spatial/yanghu-study-area.geojson').read_text());ring=area['geometry']['coordinates'][0]
w=min(p[0] for p in ring)-.003;e=max(p[0] for p in ring)+.003;s=min(p[1] for p in ring)-.003;n=max(p[1] for p in ring)+.003
width=850;height=int(width*(n-s)/((e-w)*.882))
W,S,E,N=r['bounds'];x0=int((w-W)/(E-W)*r['width']);x1=int((e-W)/(E-W)*r['width']);y0=int((N-n)/(N-S)*r['height']);y1=int((N-s)/(N-S)*r['height']);w=W+x0*(E-W)/r['width'];e=W+x1*(E-W)/r['width'];n=N-y0*(N-S)/r['height'];s=N-y1*(N-S)/r['height']
a=np.array(r['values'],dtype=np.uint8).reshape(r['height'],r['width'])[y0:y1,x0:x1]
colors={0:'#ffffff',10:'#006400',20:'#ffbb22',30:'#ffff4c',40:'#f096ff',50:'#fa0000',60:'#b4b4b4',70:'#f0f0f0',80:'#0064c8',90:'#0096a0',95:'#00cf75',100:'#fae6a0'}
rgb=np.zeros((*a.shape,3),dtype=np.uint8)
for code,color in colors.items():rgb[a==code]=[int(color[i:i+2],16) for i in (1,3,5)]
b=io.BytesIO();Image.fromarray(rgb).save(b,format='PNG')
def xy(p):return ((p[0]-w)/(e-w)*width+30,(n-p[1])/(n-s)*height+80)
def path(ps):return 'M'+' L'.join('%.2f %.2f'%xy(p) for p in ps)
parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="{height+150}" viewBox="0 0 1180 {height+150}"><rect width="100%" height="100%" fill="#fff"/><text x="30" y="30" font-size="23">Yanghu / spatial overlay diagnostic</text><text x="30" y="56" font-size="13">WorldCover 2021 + existing OSM/Overture roads + bounded GBIF snapshot</text><defs><clipPath id="window"><rect x="30" y="80" width="{width}" height="{height}"/></clipPath></defs><g clip-path="url(#window)"><g id="worldcover"><image x="30" y="80" width="{width}" height="{height}" href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/></g><g id="roads" fill="none" stroke="#111" stroke-width="1.4">']
for file in ['environment.json','xiangjiang.geojson']:
 for f in json.loads((root/file).read_text())['features']:
  if not f['properties'].get('highway') or f['geometry']['type']!='LineString':continue
  ps=f['geometry']['coordinates']
  if max(p[0] for p in ps)<w or min(p[0] for p in ps)>e or max(p[1] for p in ps)<s or min(p[1] for p in ps)>n:continue
  parts.append('<path d="'+path(ps)+'"/>')
parts.append('</g><g id="study-area" fill="none" stroke="#fff" stroke-width="4">')
for rr in area['geometry']['coordinates']:parts.append('<path d="'+path(rr)+' Z"/>')
parts.append('</g><g id="gbif-uncertainty" fill="#ffffff" fill-opacity="0.05" stroke="#a000c8" stroke-width="2" stroke-dasharray="4 4">')
coords={}
for f in json.loads((root/'spatial/gbif-core.geojson').read_text())['features']:
 p=f['geometry']['coordinates'];key=tuple(p)
 if not w<=p[0]<=e or not s<=p[1]<=n:continue
 coords[key]=f['properties']['coordinateUncertaintyInMeters']
for p,u in coords.items():
 x,y=xy(p);radius=u/(111320*.882)/(e-w)*width;parts.append(f'<circle cx="{x}" cy="{y}" r="{radius}"/><circle cx="{x}" cy="{y}" r="7" fill="#a000c8" stroke="#fff"/>')
parts.append('</g></g><g font-family="sans-serif" font-size="14">')
labels=['Legend (official class colours)','10 Tree cover','30 Grassland','40 Cropland','50 Built-up','60 Bare / sparse vegetation','80 Permanent water bodies','White line: OSM park boundary','Black lines: existing roads','Dots: unique GBIF coordinates','Dashed circle: reported uncertainty','Observations are NOT distributions','Years and methods differ','No causal conclusion','Not a legal wetland boundary']
for i,label in enumerate(labels):parts.append(f'<text x="900" y="{95+i*26}">{label}</text>')
parts.append(f'<text x="30" y="{height+110}">EPSG:4326 / © ESA WorldCover 2021; OSM contributors; Overture; GBIF publishers (per-record CC-BY)</text><text x="30" y="{height+133}">Diagnostic only; production Three.js scene and shared visibility state are unchanged.</text></g></svg>')
Path('docs/spatial-data/yanghu-overlay.svg').write_text(''.join(parts))
