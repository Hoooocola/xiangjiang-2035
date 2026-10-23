import type {SceneData} from './geo';
import type {TerrainGrid} from './terrain';
import type {ContextData} from './scene';

/** Asset coverage is fixed by the versioned source files, never by AOI or research filters. */
export async function loadExperienceAssets(signal:AbortSignal){
 async function read<T>(path:string):Promise<T>{
  const response=await fetch(path,{signal});
  if(!response.ok)throw new Error('地理数据加载失败，请重试。');
  return response.json() as Promise<T>;
 }
 const [source,grid,context,environment]=await Promise.all([
  read<SceneData>('/data/xiangjiang.geojson'),read<TerrainGrid>('/data/terrain.json'),
  read<ContextData>('/data/context.json'),read<SceneData&{forest:number[]}>('/data/environment.json'),
 ]);
 return {data:{...source,features:[...source.features,...environment.features]},grid:{...grid,forest:environment.forest},context};
}

/** Preserve V1 sampling budget independently of visual emphasis. Units: 100 metres. */
export function vegetationSpacing(distanceToRiver:number,island:boolean){
 const t=Math.max(0,Math.min(1,(distanceToRiver-9)/17));
 const sourceDetail=1-t*t*(3-2*t);
 return island?.32:sourceDetail>.2?.65:1.8;
}
