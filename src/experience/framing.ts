import {Box3,MathUtils,Vector3} from 'three';
import {CAMERA_LIMITS,type CameraPose} from './config';

/** Fit world-space bounds into the unobstructed part of the viewport.
 * Insets are CSS pixels. Geographic positions and heights are never altered.
 */
export function researchPose(points:Vector3[],width:number,height:number,fov:number):CameraPose|null {
 if(!points.length||width<=0||height<=0)return null;
 const bounds=new Box3().setFromPoints(points),center=bounds.getCenter(new Vector3());
 const azimuth=.38,polar=.94;
 const right=new Vector3(Math.cos(azimuth),0,-Math.sin(azimuth));
 const back=new Vector3(Math.sin(polar)*Math.sin(azimuth),Math.cos(polar),Math.sin(polar)*Math.cos(azimuth));
 const up=new Vector3().crossVectors(back,right);
 const left=width>700?60:24,edge=width>700?Math.min(470,width*.39):24;
 const top=height>760?135:110,bottom=width>700?140:Math.min(height*.53,height-180);
 const l=left/width*2-1,r=1-edge/width*2,t=1-top/height*2,b=bottom/height*2-1;
 const cx=(l+r)/2,cy=(b+t)/2,tanV=Math.tan(MathUtils.degToRad(fov/2)),tanH=tanV*width/height;
 let distance=CAMERA_LIMITS.minDistance;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new Vector3(x,y,z).sub(center),sx=p.dot(right)/tanH,sy=p.dot(up)/tanV,depth=p.dot(back);
  distance=Math.max(distance,(sx+r*depth)/(r-cx),(-sx-l*depth)/(cx-l),(sy+t*depth)/(t-cy),(-sy-b*depth)/(cy-b));
 }
 distance=MathUtils.clamp(distance*1.12,CAMERA_LIMITS.minDistance,CAMERA_LIMITS.maxDistance);
 center.addScaledVector(right,-cx*distance*tanH).addScaledVector(up,-cy*distance*tanV);
 return {target:center.toArray() as CameraPose['target'],distance,azimuth,polar};
}
