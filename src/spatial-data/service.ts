// Server-only IO boundary. Scene/React modules consume the HTTP API, not this module.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {SPATIAL_LAYERS} from './catalog';
import {cropRaster,geometryBounds,intersectsBounds} from './geometry';
import type {Bounds,Collection,Feature,Raster} from './types';
const cache=new Map<string,Promise<unknown>>();
async function json<T>(file:string):Promise<T>{let p=cache.get(file);if(!p){p=readFile(path.join(process.cwd(),'public/data',file),'utf8').then(JSON.parse);cache.set(file,p);p.catch(()=>cache.delete(file));}return p as Promise<T>;}
export const listLayers=()=>SPATIAL_LAYERS;
export function getLayer(id:string){const l=SPATIAL_LAYERS.find(l=>l.layerId===id);if(!l)throw new Error('Unknown layerId');return l;}
export async function studyArea(){return json<Feature>('spatial/yanghu-study-area.geojson');}
export async function loadLayer(id:string,bounds?:Bounds){
 getLayer(id);
 if(id==='ecology.worldcover.2021'){const r=await json<Raster>('spatial/worldcover-2021-core.json');return bounds?cropRaster(r,bounds):{...r,values:undefined,note:'Request bbox for pixel values, or download dataUrl GeoTIFF'};}
 if(id==='ecology.water.2025-11')return json<{records:Record<string,unknown>[]}>('spatial/water-quality-2025-11.json');
 let features:Feature[];
 if(id==='geography.yanghu.study-area')features=[await studyArea()];
 else if(id==='ecology.gbif.snapshot')features=(await json<Collection>('spatial/gbif-core.geojson')).features;
 else {const files=await Promise.all(['environment.json','xiangjiang.geojson'].map(f=>json<Collection>(f)));const seen=new Set<string>();features=files.flatMap(f=>f.features).filter(f=>{if(!f.properties.highway||f.geometry.type!=='LineString'||seen.has(String(f.id)))return false;seen.add(String(f.id));return true;});}
 return {type:'FeatureCollection',features:bounds?features.filter(f=>intersectsBounds(geometryBounds(f.geometry),bounds)):features} as Collection;
}
export async function regionLayers(ids:string[],bounds:Bounds){return Object.fromEntries(await Promise.all(ids.map(async id=>[id,{layer:getLayer(id),data:await loadLayer(id,bounds)}])));}
export async function objectDetails(layerId:string,id:string){const d=await loadLayer(layerId);if(d&&'features'in d)return (d as Collection).features.find(f=>String(f.id)===id)??null;if(d&&'records'in d)return d.records.find(r=>r.id===id)??null;return null;}
