import {MathUtils} from 'three';
import {createAoiSampler} from './aoi';
export interface TerrainGrid {
 width:number; height:number; x0:number; z0:number; dx:number; dz:number;
 elevations:number[]; riverDistance:number[]; water:number[]; forest?:number[];
}
export function terrainSampler(grid:TerrainGrid) {
 const sample=(values:number[],x:number,z:number)=>{
  const u=MathUtils.clamp((x-grid.x0)/grid.dx,0,grid.width-1.001);
  const v=MathUtils.clamp((z-grid.z0)/grid.dz,0,grid.height-1.001);
  const col=Math.floor(u),row=Math.floor(v),i=row*grid.width+col;
  return MathUtils.lerp(MathUtils.lerp(values[i],values[i+1],u-col),MathUtils.lerp(values[i+grid.width],values[i+grid.width+1],u-col),v-row);
 };
 const distance=(x:number,z:number)=>sample(grid.riverDistance,x,z)/10;
 const height=(x:number,z:number)=>{
  const elevation=sample(grid.elevations,x,z)/10;
  const river=distance(x,z);
  // Floodplain compression and shoreline flattening are visual adjustments.
  return Math.max(0,(elevation-42)/100)*MathUtils.smoothstep(river,2.5,5.5);
 };
 // AOI weights never modify elevation or source geography.
 const importance=createAoiSampler(distance);
 return {height,distance,importance,forest:(x:number,z:number)=>grid.forest?sample(grid.forest,x,z):0};
}
