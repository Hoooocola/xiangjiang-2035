import fs from 'node:fs';
import path from 'node:path';
import clipping from 'polygon-clipping';
const input=process.argv[2]??'.cache/xiangjiang/buildings';
const coverage=JSON.parse(fs.readFileSync(path.join(input,'coverage.json')));
if(coverage.failed.length||coverage.tiles.some(([x,y])=>!fs.existsSync(path.join(input,`tile-${coverage.z}-${x}-${y}.json`))))throw new Error('Context download is incomplete; run the downloader again.');
const grid=JSON.parse(fs.readFileSync('public/data/terrain.json'));
const project=([lon,lat])=>[(lon-112.965)*1113.2*Math.cos(28.195*Math.PI/180),-(lat-28.195)*1113.2];
const riverDistance=([x,z])=>{const col=Math.max(0,Math.min(grid.width-1,Math.round((x-grid.x0)/grid.dx))),row=Math.max(0,Math.min(grid.height-1,Math.round((z-grid.z0)/grid.dz)));return grid.riverDistance[row*grid.width+col]/10;};
const byId=new Map();
for(const file of fs.readdirSync(input).filter(f=>/^tile-.*\.json$/.test(f))){
 for(const f of JSON.parse(fs.readFileSync(path.join(input,file)))){
  const id=f.properties.id??f.id;if(!id||!['Polygon','MultiPolygon'].includes(f.geometry.type)||f.properties.is_underground)continue;
  const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  const old=byId.get(id);if(old)old.polys.push(...polys);else byId.set(id,{polys,properties:f.properties});
 }
}
const buildings=[],counts={north:0,coreContext:0,south:0,knownHeight:0},sources={};let clipped=0;
for(const {polys,properties:p} of byId.values()){
 let merged=polys;
 if(polys.length>1){try{merged=clipping.union(...polys);}catch{clipped++;}}
 for(const rings of merged){
  const ring=rings[0].slice(0,-1);if(ring.length<3)continue;
  const lon=ring.reduce((a,p)=>a+p[0],0)/ring.length,lat=ring.reduce((a,p)=>a+p[1],0)/ring.length;
  // OSM remains authoritative in the previously collected core. No double models.
  if(lon>=112.93&&lon<=113.005&&lat>=28.13&&lat<=28.28)continue;
  if(lat<27.92||lat>28.49||lon<112.73||lon>113.08)continue;
  const points=ring.map(project),center=project([lon,lat]);if(riverDistance(center)>70)continue;
  let longest=0,angle=0;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>longest){longest=d;angle=Math.atan2(b[1]-a[1],b[0]-a[0]);}}
  const co=Math.cos(angle),si=Math.sin(angle),u=points.map(([x,z])=>x*co+z*si),v=points.map(([x,z])=>-x*si+z*co);
  const minU=Math.min(...u),maxU=Math.max(...u),minV=Math.min(...v),maxV=Math.max(...v),cu=(minU+maxU)/2,cv=(minV+maxV)/2;
  const height=Number(p.height)||Number(p.num_floors)*3.2||0;
  const values=[cu*co-cv*si,cu*si+cv*co,maxU-minU,maxV-minV,angle,height||12];
  buildings.push(values.map(n=>Math.round(n*1000)/1000));
  counts[lat>28.28?'north':lat<28.13?'south':'coreContext']++;if(height)counts.knownHeight++;
  const source=p['@geometry_source']??'Overture';sources[source]=(sources[source]??0)+1;
 }
}
fs.mkdirSync('data/context',{recursive:true});
const manifest={source:'https://tiles.overturemaps.org/2026-09-23.1/buildings.pmtiles',release:'2026-09-23.1',retrieved:'2026-10-21',license:'ODbL-1.0',attribution:'Overture Maps Foundation; OpenStreetMap contributors; upstream geometry providers listed below',geometrySources:sources,bounds:[112.73,27.92,113.08,28.49],riverBufferMeters:7000,representation:'Oriented bounding volumes from source footprints. Simplified context only; not exact building models. No inferred landmark detail. OSM core excluded to avoid overlap.',unknownHeightMeters:12,buildings:buildings.length,counts,unmergedMultiPolygons:clipped};
fs.writeFileSync('data/context/manifest.json',JSON.stringify(manifest,null,2));
fs.writeFileSync('public/data/context.json',JSON.stringify({schema:'x,z,width,depth,angleRadians,heightMeters; local units 100m',...manifest,buildings}));
console.log(manifest);
