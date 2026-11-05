import type {CameraPose} from '../experience/config';
import {project} from '../experience/geo';import type{IslandAsset,IslandStudy}from'./types';
/** Authored monotone ranges. Analysis stages hold orientation instead of
 * jumping back to an overview. Targets reserve a stable reading column. */
export function islandResearchPose(asset:IslandAsset,study:IslandStudy,step:number):CameraPose{
 const pts=asset.boundary.map(project),xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]),centre=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2];
 const homes=study.nodes.filter(n=>n.kind==='home'),group=homes.slice(0,5).map(n=>project(n.coordinate)),cluster=group.reduce((a,p)=>[a[0]+p[0]/group.length,a[1]+p[1]/group.length],[0,0]),focus=project(homes[4].coordinate);
 const index=Math.max(0,Math.min(5,step)),distances=[Math.max(...zs)-Math.min(...zs)+12,11,9.4,8.2,5.5,5.5],azimuth=[-.65,.1,.16,.2,.23,.23][index],polar=[.73,.95,1.01,1.06,1.08,1.08][index],target=index===0?centre:index>=4?focus:cluster,offset=index===0?2:1.65;
 return {target:[target[0]-offset*Math.cos(azimuth),.08,target[1]+offset*Math.sin(azimuth)],distance:distances[index],azimuth,polar};
}
export function quarryResearchPose(step:number):CameraPose{const i=Math.max(0,Math.min(6,step)),distance=[15,11.5,10,9.4,8.8,8.8,8.8][i],azimuth=.65-i*.025,polar=[.5,.88,1.08,1.1,1.15,1.15,1.15][i];return {target:[-1.2*Math.cos(azimuth),.3,1.2*Math.sin(azimuth)],distance,azimuth,polar}}
