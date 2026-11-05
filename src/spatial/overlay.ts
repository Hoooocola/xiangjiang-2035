import {Camera,Vector3} from 'three';
export interface OverlayViewport{left:number;top:number;width:number;height:number}
/** Both elements use CSS pixels. Drawing-buffer DPR never enters projection.
 * Account for canvas offsets and a scaled overlay ancestor once per frame. */
export function overlayViewport(viewport:HTMLElement,layer:HTMLElement):OverlayViewport{
 const v=viewport.getBoundingClientRect(),r=layer.getBoundingClientRect();if(v.width<=0||v.height<=0||r.width<=0||r.height<=0)return {left:0,top:0,width:0,height:0};const sx=r.width/Math.max(1,layer.clientWidth),sy=r.height/Math.max(1,layer.clientHeight);
 return {left:(v.left-r.left)/sx,top:(v.top-r.top)/sy,width:v.width/sx,height:v.height/sy};
}
export function projectOverlay(world:Vector3,camera:Camera,view:OverlayViewport,out:Vector3){out.copy(world).project(camera);out.x=view.left+(out.x+1)*view.width/2;out.y=view.top+(1-out.y)*view.height/2;return out}
export function positionMarker(el:HTMLElement,p:Vector3){const value=`translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0)`;if(el.style.transform!==value)el.style.transform=value;}
