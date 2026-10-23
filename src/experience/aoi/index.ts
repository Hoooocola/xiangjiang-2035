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
/** Display emphasis only. Does not decide asset loading, height, visibility or research coverage. */
export function createAoiSampler(riverDistance:(x:number,z:number)=>number,areas=FOCUS_AREAS){
 const compiled=compileAreas(areas),cache=new Map<string,number>();
 const at=(x:number,z:number)=>{const key=`${x},${z}`;const saved=cache.get(key);if(saved!==undefined)return saved;
  const corridor=.32*(1-smooth(1,12,riverDistance(x,z)));
  const value=Math.max(.12,corridor,focusWeight(x,z,compiled));cache.set(key,value);return value;};
 return (x:number,z:number)=>{const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;return (at(a,b)*(1-u)+at(a+1,b)*u)*(1-v)+(at(a,b+1)*(1-u)+at(a+1,b+1)*u)*v;};
}
