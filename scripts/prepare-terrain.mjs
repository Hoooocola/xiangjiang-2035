import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[require.resolve('next')]}));
const tiles=new Map();
for(const file of fs.readdirSync('data/terrain').filter(f=>f.endsWith('.png'))){
 const [,x,y]=file.replace('.png','').split('-').map(Number);
 const {data,info}=await sharp(`data/terrain/${file}`).removeAlpha().raw().toBuffer({resolveWithObject:true});
 tiles.set(`${x}/${y}`,{data,channels:info.channels});
}
const bounds=[112.70,27.86,113.18,28.58],width=320,height=512;
const origin=[112.965,28.195],k=1113.2,cos=Math.cos(origin[1]*Math.PI/180);
const x0=(bounds[0]-origin[0])*k*cos,z0=-(bounds[3]-origin[1])*k;
const dx=(bounds[2]-bounds[0])*k*cos/(width-1),dz=(bounds[3]-bounds[1])*k/(height-1);
const geo=JSON.parse(fs.readFileSync('public/data/xiangjiang.geojson'));
const water=geo.features.filter(f=>f.properties.water==='river'||f.properties.waterway==='riverbank').flatMap(f=>f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]);
const elevations=[],mask=new Uint8Array(width*height),distance=new Float32Array(width*height).fill(1e6);
let min=Infinity,max=-Infinity;
for(let row=0;row<height;row++){
 const lat=bounds[3]-row/(height-1)*(bounds[3]-bounds[1]);
 const intervals=[];
 for(const rings of water){const crossings=[];for(const ring of rings)for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if((a[1]>lat)!==(b[1]>lat))crossings.push(a[0]+(lat-a[1])*(b[0]-a[0])/(b[1]-a[1]));}crossings.sort((a,b)=>a-b);for(let i=0;i<crossings.length;i+=2)intervals.push([crossings[i],crossings[i+1]]);}
 for(let col=0;col<width;col++){
  const lon=bounds[0]+col/(width-1)*(bounds[2]-bounds[0]);
  const tx=(lon+180)/360*2048,ty=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2048;
  const tile=tiles.get(`${Math.floor(tx)}/${Math.floor(ty)}`);if(!tile)throw new Error(`Missing DEM tile ${Math.floor(tx)}/${Math.floor(ty)}`);
  const i=(Math.floor((ty%1)*256)*256+Math.floor((tx%1)*256))*tile.channels;
  const meters=tile.data[i]*256+tile.data[i+1]+tile.data[i+2]/256-32768;
  min=Math.min(min,meters);max=Math.max(max,meters);
  const index=row*width+col;const wet=intervals.some(([a,b])=>lon>=a&&lon<=b);mask[index]=wet?1:0;if(wet)distance[index]=0;
  elevations.push(Math.round(meters*10));
 }
}
const diagonal=Math.hypot(dx,dz);
for(let row=0;row<height;row++)for(let col=0;col<width;col++){
 const i=row*width+col;let d=distance[i];if(col)d=Math.min(d,distance[i-1]+dx);if(row)d=Math.min(d,distance[i-width]+dz);if(col&&row)d=Math.min(d,distance[i-width-1]+diagonal);if(row&&col<width-1)d=Math.min(d,distance[i-width+1]+diagonal);distance[i]=d;
}
for(let row=height-1;row>=0;row--)for(let col=width-1;col>=0;col--){
 const i=row*width+col;let d=distance[i];if(col<width-1)d=Math.min(d,distance[i+1]+dx);if(row<height-1)d=Math.min(d,distance[i+width]+dz);if(col<width-1&&row<height-1)d=Math.min(d,distance[i+width+1]+diagonal);if(row<height-1&&col)d=Math.min(d,distance[i+width-1]+diagonal);distance[i]=d;
}
// Keep raw elevation separate. Rendering flattens low floodplain near the river;
// this is an explicitly documented art direction operation, not a water-level survey.
const grid={source:'Mapzen / Tilezen Terrain Tiles on AWS; USGS SRTM/GMTED2010',retrieved:'2026-10-21',encoding:'elevation decimeters; riverDistance scene units x10',width,height,x0,z0,dx,dz,elevations,riverDistance:Array.from(distance,v=>Math.round(v*10)),water:Array.from(mask)};
fs.writeFileSync('public/data/terrain.json',JSON.stringify(grid));
fs.writeFileSync('data/terrain/manifest.json',JSON.stringify({source:'https://registry.opendata.aws/terrain-tiles/',attribution:'Mapzen; SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey',license:'Source-specific public-domain datasets; see https://github.com/tilezen/joerd/blob/master/docs/attribution.md',retrieved:'2026-10-21',bounds,format:'Terrarium RGB, EPSG:3857 XYZ; decoded to local WGS84 grid',tiles:[...tiles.keys()].map(key=>`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/11/${key}.png`),minMeters:min,maxMeters:max},null,2));
console.log({width,height,min,max,bytes:fs.statSync('public/data/terrain.json').size});
