/** Add only missing, complete inland-water geometry from the existing OSM snapshot.
 * Does not regenerate river, buildings, DEM, AOI, or WorldCover. */
import fs from 'node:fs';
import osmToGeoJSON from 'osmtogeojson';
import {isSurfaceWater,isRiverWater} from '../src/experience/water-tags.mjs';
import {completeOsm} from './lib/complete-osm.mjs';
const elements=new Map();
for(const file of fs.readdirSync('data/osm').filter(f=>f.endsWith('.json')))for(const e of JSON.parse(fs.readFileSync(`data/osm/${file}`)).elements??[])elements.set(`${e.type}/${e.id}`,e);
const base=JSON.parse(fs.readFileSync('public/data/xiangjiang.geojson'));
const existing=new Set(base.features.map(f=>f.id)),excluded=[];
const converted=osmToGeoJSON({elements:[...elements.values()]});
const features=converted.features.filter(f=>{
 if(!isSurfaceWater(f.properties)||isRiverWater(f.properties)||existing.has(f.id)||!['Polygon','MultiPolygon'].includes(f.geometry.type))return false;
 if(f.properties.tainted||!completeOsm(f.id,elements)){excluded.push(f.id);return false;}return true;
}).map(f=>({type:'Feature',id:f.id,properties:Object.fromEntries(['name','name:en','natural','water','waterway','intermittent','tidal'].filter(k=>f.properties[k]!==undefined).map(k=>[k,f.properties[k]])),geometry:f.geometry}));
const result={type:'FeatureCollection',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',source:'https://api.openstreetmap.org/api/0.6/',retrieved:'2026-10-20',prepared:'2026-11-04',crsNote:'WGS84 / EPSG:4326; existing OSM snapshot, no hand-drawn geometry',features};
fs.writeFileSync('public/data/inland-water.geojson',JSON.stringify(result));
const types={};for(const f of features){const type=f.properties.water??'water';types[type]=(types[type]??0)+1;}
const audit={source:result.source,retrieved:result.retrieved,license:result.license,count:features.length,types,excludedIncomplete:excluded,ids:features.map(f=>f.id),houhu:features.find(f=>f.properties.name==='后湖')?.id};
fs.writeFileSync('docs/v3.2/water-source.json',JSON.stringify(audit,null,2));console.log(audit);
