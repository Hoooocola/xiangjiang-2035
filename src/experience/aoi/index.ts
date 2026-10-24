import rawAreas from './focus-areas.json';
import {inRing,project} from '../geo';
import type {FocusArea} from '../../places/types';
export const FOCUS_AREAS=rawAreas as FocusArea[];
type Point=[number,number];
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
export function compileAreas(areas:FocusArea[]){return [...areas].sort((a,b)=>b.displayPriority-a.displayPriority).map(area=>{
 const polygons=(area.geometry.type==='Polygon'?[area.geometry.coordinates]:area.geometry.coordinates).map(p=>p.map(r=>r.map(project)));
 const all=polygons.flat(2),xs=all.map(p=>p[0]),zs=all.map(p=>p[1]),width=area.transitionWidth/100;
 return {area,polygons,width,bounds:[Math.min(...xs)-width,Math.min(...zs)-width,Math.max(...xs)+width,Math.max(...zs)+width]};
});}
export function focusWeight(x:number,z:number,compiled:ReturnType<typeof compileAreas>){
 let weight=0;
 for(const {area,polygons,width,bounds} of compiled){
  if(x<bounds[0]||z<bounds[1]||x>bounds[2]||z>bounds[3])continue;
  let distance=Infinity,inside=false;
  for(const rings of polygons){if(inRing(x,z,rings[0])&&!rings.slice(1).some(r=>inRing(x,z,r)))inside=true;
   for(const ring of rings)for(let i=1;i<ring.length;i++)distance=Math.min(distance,segmentDistance([x,z],ring[i-1],ring[i]));}
  // Max union, never additive exposure. Interior of a complete object keeps its weight.
  const value=area.visualIntensity*area.importance*(inside?1:1-smooth(0,width,distance));
  weight=Math.max(weight,value);
 }
 return Math.min(1,weight);
}
/** V1's continuous bank-distance envelope: full emphasis to 900 m, fade to 2600 m. */
export const corridorWeight=(distance:number)=>1-smooth(9,26,distance);
/** Admit each connected polygon component only when its actual geometry touches the
 * substantial river corridor. Distant sites remain markers, never detached light pools. */
export function connectedAreas(riverDistance:(x:number,z:number)=>number,areas:FocusArea[]){
 return compileAreas(areas).flatMap(entry=>entry.polygons.filter(rings=>{
  const ring=rings[0];
  for(let i=1;i<ring.length;i++){
   const a=ring[i-1],b=ring[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])));
   for(let j=0;j<=steps;j++)if(riverDistance(a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps)<=17)return true;
  }
  // A large polygon may enclose the river without any boundary crossing it.
  const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
  for(let x=Math.min(...xs);x<=Math.max(...xs);x+=2)for(let z=Math.min(...zs);z<=Math.max(...zs);z+=2)
   if(inRing(x,z,ring)&&!rings.slice(1).some(h=>inRing(x,z,h))&&riverDistance(x,z)<=17)return true;
  return false;
 }).map(polygon=>({...entry,polygons:[polygon]})));
}
/** Coverage only: max union avoids added exposure. Geometry and height remain unchanged. */
export function createAoiSampler(riverDistance:(x:number,z:number)=>number,areas=FOCUS_AREAS){
 const compiled=connectedAreas(riverDistance,areas),cache=new Map<string,number>();
 const at=(x:number,z:number)=>{const key=`${x},${z}`;const saved=cache.get(key);if(saved!==undefined)return saved;
  const value=Math.max(corridorWeight(riverDistance(x,z)),focusWeight(x,z,compiled));cache.set(key,value);return value;};
 return (x:number,z:number)=>{const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;return (at(a,b)*(1-u)+at(a+1,b)*u)*(1-v)+(at(a,b+1)*(1-u)+at(a+1,b+1)*u)*v;};
}
