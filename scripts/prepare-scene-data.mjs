import fs from 'node:fs';
import osmToGeoJSON from 'osmtogeojson';
const files=fs.readdirSync('data/osm').filter(f=>f.endsWith('.json'));
const elements=new Map();
for(const file of files){const d=JSON.parse(fs.readFileSync(`data/osm/${file}`,'utf8'));for(const e of (d.elements??[]))elements.set(`${e.type}/${e.id}`,e);}
// The converter can close partial river relations without setting `tainted`.
// Check source membership before accepting a water polygon.
function complete(id, visiting=new Set()) {
 const element=elements.get(id);
 if(!element)return false;
 if(visiting.has(id))return false;
 if(element.type==='node')return true;
 const next=new Set(visiting);next.add(id);
 if(element.type==='way')return element.nodes.every(node=>elements.has(`node/${node}`));
 return element.members.filter(member=>member.role==='outer'||member.role==='inner'||member.role==='').every(member=>complete(`${member.type}/${member.ref}`,next));
}
const excludedWater=[];
const geo=osmToGeoJSON({elements:[...elements.values()]});
const round=(v)=>Array.isArray(v)?v.map(round):typeof v==='number'?Math.round(v*1e6)/1e6:v;
const features=geo.features.filter(f=>{
 const p=f.properties,g=f.geometry;
 if((p.water==='river'||p.waterway==='riverbank')&&!complete(f.id)){excludedWater.push(f.id);return false;}
 if(p.tainted) return false;
 const islandPath = ['path','footway','cycleway'].includes(p.highway) && g.type==='LineString' && g.coordinates.every(([x,y])=>x>112.953&&x<112.962&&y>28.168&&y<28.226);
 if(islandPath)return true;
 return (p.water==='river'||p.waterway==='riverbank'||p.place==='island'||p.building||p['building:part']||p.leisure==='park'||p.landuse==='forest'||p.natural==='wood'||(p.highway&&!['steps','cycleway','path','footway','service','track','platform','corridor'].includes(p.highway))) && ['Polygon','MultiPolygon','LineString'].includes(g.type);
}).map(f=>({type:'Feature',id:f.id,properties:Object.fromEntries(['name','name:en','building','building:part','building:levels','height','min_height','natural','water','waterway','place','leisure','landuse','highway','bridge','lanes'].filter(k=>f.properties[k]!==undefined).map(k=>[k,f.properties[k]])),geometry:{type:f.geometry.type,coordinates:round(f.geometry.coordinates)}}));
const data={type:'FeatureCollection',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',source:'https://api.openstreetmap.org/api/0.6/',retrieved:'2026-10-20',crsNote:'WGS84 longitude/latitude (EPSG:4326); NOT CGCS2000',features};
fs.writeFileSync('public/data/xiangjiang.geojson',JSON.stringify(data));
const stats={features:features.length,buildings:features.filter(f=>f.properties.building||f.properties['building:part']).length,roads:features.filter(f=>f.properties.highway).length,water:features.filter(f=>f.properties.water==='river').length,parks:features.filter(f=>f.properties.leisure==='park').length,excludedIncompleteWater:excludedWater};
fs.writeFileSync('docs/data-stats.json',JSON.stringify(stats,null,2));console.log(stats);
