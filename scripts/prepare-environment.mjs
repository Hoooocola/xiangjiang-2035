import fs from 'node:fs';
import path from 'node:path';
const [baseDir='.cache/xiangjiang/base',roadDir='.cache/xiangjiang/transportation']=process.argv.slice(2);
for(const dir of [baseDir,roadDir]){const coverage=JSON.parse(fs.readFileSync(path.join(dir,'coverage.json')));if(coverage.failed.length||coverage.tiles.some(([x,y])=>!fs.existsSync(path.join(dir,`tile-${coverage.z}-${x}-${y}.json`))))throw new Error('Environment download is incomplete; run the downloader again.');}
const grid=JSON.parse(fs.readFileSync('public/data/terrain.json')),forest=new Uint8Array(grid.width*grid.height),rings=[];
const project=([lon,lat])=>[(lon-112.965)*1113.2*Math.cos(28.195*Math.PI/180),-(lat-28.195)*1113.2];
const read=dir=>fs.readdirSync(dir).filter(f=>/^tile-.*\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f))));
for(const f of read(baseDir)){
 const p=f.properties;if(!(p.subtype==='forest'||p._layer==='land_use'&&p.subtype==='park')||!['Polygon','MultiPolygon'].includes(f.geometry.type))continue;
 for(const poly of f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates)rings.push(poly.map(r=>r.map(project)));
}
// Scanline rasterization preserves polygon holes. Merge source coverages by union.
for(const poly of rings){
 const zs=poly[0].map(p=>p[1]),start=Math.max(0,Math.ceil((Math.min(...zs)-grid.z0)/grid.dz)),end=Math.min(grid.height-1,Math.floor((Math.max(...zs)-grid.z0)/grid.dz));
 for(let row=start;row<=end;row++){
  const z=grid.z0+row*grid.dz,crossings=[];
  for(const ring of poly)for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if((a[1]>z)!==(b[1]>z))crossings.push(a[0]+(z-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
  crossings.sort((a,b)=>a-b);
  for(let i=0;i+1<crossings.length;i+=2)for(let col=Math.max(0,Math.ceil((crossings[i]-grid.x0)/grid.dx));col<=Math.min(grid.width-1,Math.floor((crossings[i+1]-grid.x0)/grid.dx));col++)forest[row*grid.width+col]=1;
 }
}
const roads=new Map(),round=v=>Array.isArray(v)?v.map(round):Math.round(v*1e6)/1e6;
for(const f of read(roadDir)){
 const p=f.properties;if(p.subtype!=='road'||!['LineString','MultiLineString'].includes(f.geometry.type))continue;
 if(['footway','path','pedestrian','steps','track'].includes(p.class))continue;
 const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
 for(const line of lines){
  if(line.every(([x,y])=>x>=112.93&&x<=113.005&&y>=28.13&&y<=28.28))continue;
  let bridge=false;try{bridge=JSON.parse(p.road_flags??'[]').some(r=>(r.values??[]).includes('is_bridge'));}catch{}
  const coordinates=round(line),key=p.id+JSON.stringify(coordinates);
  roads.set(key,{type:'Feature',id:'overture/'+p.id,properties:{highway:p.class??'residential',...(bridge?{bridge:'yes'}:{})},geometry:{type:'LineString',coordinates}});
 }
}
fs.writeFileSync('public/data/environment.json',JSON.stringify({type:'FeatureCollection',features:[...roads.values()],forest:Array.from(forest),source:'Overture 2026-09-23.1; OSM; ESA WorldCover 2021',licenses:['ODbL-1.0','CC-BY-4.0']}));
const manifest={release:'2026-09-23.1',retrieved:'2026-10-21',roads:roads.size,forestPolygons:rings.length,forestCells:forest.reduce((a,b)=>a+b,0),forestGrid:[grid.width,grid.height],sources:['https://tiles.overturemaps.org/2026-09-23.1/base.pmtiles','https://tiles.overturemaps.org/2026-09-23.1/transportation.pmtiles'],attribution:'© OpenStreetMap contributors; Overture Maps Foundation; ESA WorldCover 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium',licenses:['ODbL-1.0','CC-BY-4.0'],note:'Vegetation is rasterized land-cover context, not a single-tree survey. Roads are public vector tiles; coverage can be incomplete.'};
fs.writeFileSync('data/context/environment-manifest.json',JSON.stringify(manifest,null,2));console.log(manifest);
