import {polygons,project,type SceneData} from './geo';

// A rigid rotation and uniform scale: the mini-map preserves actual river geometry.
const north=project([112.811,28.434]),south=project([112.939,27.963]);
const length=Math.hypot(south[0]-north[0],south[1]-north[1]);
const ux=(south[0]-north[0])/length,uz=(south[1]-north[1])/length;
export const MINI_MAP={width:340,height:108,scale:292/length};
export function miniPoint(x:number,z:number):[number,number]{
 const dx=x-north[0],dz=z-north[1];
 return [24+(dx*ux+dz*uz)*MINI_MAP.scale,54+(-dx*uz+dz*ux)*MINI_MAP.scale];
}
export function worldPoint(x:number,y:number):[number,number]{
 const u=(x-24)/MINI_MAP.scale,v=(y-54)/MINI_MAP.scale;
 return [north[0]+u*ux-v*uz,north[1]+u*uz+v*ux];
}
export function riverMiniPaths(data:SceneData):string[]{
 return data.features.filter(f=>f.properties.water==='river'||f.properties.waterway==='riverbank').flatMap(f=>polygons(f).map(rings=>rings.map(ring=>{
  const points=ring.map(c=>miniPoint(...project(c)));
  const reduced=points.filter((p,i)=>i===0||i===points.length-1||Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>.16||i%5===0);
  return reduced.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')+'Z';
 }).join(' ')));
}
