import {Vector3} from 'three';
import type {MapObject} from '../atlas/types';
import {geographicAnchor,objectAnchorHeight} from './anchors';
import {project,type Coordinate} from './geo';
import type {TerrainGrid} from './terrain';

/** Exact triangle interpolation of scene.ts's decimated relief mesh, not raw DEM. */
export function renderedTerrainHeight(grid:TerrainGrid,height:(x:number,z:number)=>number){
 const cols=Math.floor((grid.width-1)/2),rows=Math.floor((grid.height-1)/2);
 const dx=grid.dx*(grid.width-1)/cols,dz=grid.dz*(grid.height-1)/rows;
 return (x:number,z:number)=>{
  const u=Math.max(0,Math.min(cols-1e-6,(x-grid.x0)/dx)),v=Math.max(0,Math.min(rows-1e-6,(z-grid.z0)/dz));
  const c=Math.floor(u),r=Math.floor(v),a=u-c,b=v-r,x0=grid.x0+c*dx,z0=grid.z0+r*dz;
  const h00=height(x0,z0),h10=height(x0+dx,z0),h01=height(x0,z0+dz),h11=height(x0+dx,z0+dz);
  return (a+b<=1?h00+(h10-h00)*a+(h01-h00)*b:h11+(h01-h11)*(1-a)+(h10-h11)*(1-b))-.025;
 };
}
/** Render clearance is 20 cm; never written back into source elevations. */
export function informationPoint(o:MapObject,c:Coordinate,height:(x:number,z:number)=>number,relief=height,out=new Vector3()){
 if(!o.surface)return geographicAnchor(c,height,objectAnchorHeight(o.geometry.type),out);
 const [x,z]=project(c);
 const y=o.surface==='shore'?.035:o.surface==='park'?height(x,z)+.025:o.surface==='road'?height(x,z)+.035:relief(x,z);
 return out.set(x,y+.002,z);
}
