import {Vector3} from 'three';
import {METERS_PER_UNIT,project,type Coordinate} from './geo';

/** Terrain-relative physical offsets in metres; DOM labels share the pin tip.
 * Areas and their outlines use the same clearance above the rendered surface.
 */
export const ANCHOR_HEIGHT_METERS={place:0,pointBase:4,pointStemCenter:6,pointStemHeight:12,pointTip:12,path:4,area:4} as const;
export function objectAnchorHeight(type:'Point'|'LineString'|'Polygon'):number {
 return type==='Point'?ANCHOR_HEIGHT_METERS.pointBase+ANCHOR_HEIGHT_METERS.pointTip:type==='LineString'?ANCHOR_HEIGHT_METERS.path:ANCHOR_HEIGHT_METERS.area;
}
export function geographicAnchor(coordinate:Coordinate,height:(x:number,z:number)=>number,offsetMeters:number,out:Vector3):Vector3 {
 const [x,z]=project(coordinate);
 return out.set(x,height(x,z)+offsetMeters/METERS_PER_UNIT,z);
}
