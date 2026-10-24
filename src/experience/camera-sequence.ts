import {CAMERA_PRESETS,OVERVIEW_POSE,type CameraPose} from './config';
export interface CameraKeyframe {time:number;phase:'overview'|'approach'|'focus';pose:CameraPose}
/** Authored world targets; nothing depends on projected objects or per-frame selections. */
export const INTRO_SEQUENCE:CameraKeyframe[]=[
 {time:0,phase:'overview',pose:OVERVIEW_POSE},
 {time:1200,phase:'approach',pose:OVERVIEW_POSE},
 {time:9800,phase:'focus',pose:CAMERA_PRESETS[0].pose},
 {time:11400,phase:'focus',pose:CAMERA_PRESETS[0].pose},
];
export function sampleSequence(frames:CameraKeyframe[],elapsed:number):CameraPose{
 const index=frames.findIndex((f,i)=>i>0&&elapsed<=f.time);
 if(index<0)return {...frames.at(-1)!.pose,target:[...frames.at(-1)!.pose.target]};
 const a=frames[index-1],b=frames[index],t=Math.max(0,Math.min(1,(elapsed-a.time)/(b.time-a.time))),k=t*t*t*(t*(t*6-15)+10);
 const mix=(x:number,y:number)=>x+(y-x)*k;
 // Log range gives a controlled approach at each scale; no Catmull overshoot.
 const angle=Math.atan2(Math.sin(b.pose.azimuth-a.pose.azimuth),Math.cos(b.pose.azimuth-a.pose.azimuth));
 return {target:a.pose.target.map((v,i)=>mix(v,b.pose.target[i])) as CameraPose['target'],distance:a.pose.distance===b.pose.distance?a.pose.distance:Math.exp(mix(Math.log(a.pose.distance),Math.log(b.pose.distance))),azimuth:a.pose.azimuth+angle*k,polar:mix(a.pose.polar,b.pose.polar)};
}
