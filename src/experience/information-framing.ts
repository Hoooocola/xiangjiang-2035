import {Box3,MathUtils,Vector3} from 'three';
import {CAMERA_LIMITS,type CameraPose} from './config';
import type {MapObject} from '../atlas/types';
export interface InformationInsets {left:number;right:number;top:number;bottom:number}
/** Shared with the editorial layout: reserve text space, not the whole viewport. */
export function informationInsets(width:number,height:number,directoryOpen=false):InformationInsets{
 if(width<760)return {left:24,right:24,top:132,bottom:Math.min(height*.35+138,height-230)};
 const edge=Math.max(28,Math.min(64,width*.035));
 return {left:directoryOpen&&width>=1100?edge+288+28:32,right:edge+(width<1100?280:320)+28,top:145,bottom:150};
}
export function informationPose(points:Vector3[],form:NonNullable<MapObject['form']>,current:CameraPose,width:number,height:number,fov:number,insets=informationInsets(width,height)):CameraPose|null{
 if(!points.length||width<=0||height<=0)return null;
 const bounds=new Box3().setFromPoints(points),center=bounds.getCenter(new Vector3());
 if(form==='point')bounds.expandByVector(new Vector3(.8,.2,.8));
 // Preserve the current viewing direction; paths get a small, bounded alignment adjustment.
 let azimuth=current.azimuth;
 if(form==='line'&&points.length>1){
  let xx=0,zz=0,xz=0;for(const p of points){const x=p.x-center.x,z=p.z-center.z;xx+=x*x;zz+=z*z;xz+=x*z;}
  const axis=.5*Math.atan2(2*xz,xx-zz),desired=-axis;
  const turn=Math.atan2(Math.sin(2*(desired-azimuth)),Math.cos(2*(desired-azimuth)))/2;
  azimuth+=MathUtils.clamp(turn,-.32,.32);
 }
 const polar=form==='area'?.8:form==='object'?.99:form==='line'?.91:.98;
 const right=new Vector3(Math.cos(azimuth),0,-Math.sin(azimuth));
 const back=new Vector3(Math.sin(polar)*Math.sin(azimuth),Math.cos(polar),Math.sin(polar)*Math.cos(azimuth));
 const up=new Vector3().crossVectors(back,right);
 const l=insets.left/width*2-1,r=1-insets.right/width*2,t=1-insets.top/height*2,b=insets.bottom/height*2-1;
 if(r<=l||t<=b)return null;
 const cx=(l+r)/2,cy=(b+t)/2,tanV=Math.tan(MathUtils.degToRad(fov/2)),tanH=tanV*width/height;
 let distance=CAMERA_LIMITS.minDistance;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new Vector3(x,y,z).sub(center),sx=p.dot(right)/tanH,sy=p.dot(up)/tanV,depth=p.dot(back);
  distance=Math.max(distance,(sx+r*depth)/(r-cx),(-sx-l*depth)/(cx-l),(sy+t*depth)/(t-cy),(-sy-b*depth)/(cy-b));
 }
 distance=MathUtils.clamp(distance*1.14,CAMERA_LIMITS.minDistance,CAMERA_LIMITS.maxDistance);
 center.addScaledVector(right,-cx*distance*tanH).addScaledVector(up,-cy*distance*tanV);
 return {target:center.toArray() as CameraPose['target'],distance,azimuth,polar};
}
export function informationDuration(from:CameraPose,to:CameraPose){
 const travel=new Vector3(...from.target).distanceTo(new Vector3(...to.target));
 const scale=Math.abs(Math.log(to.distance/from.distance));
 return Math.round(MathUtils.clamp(950+Math.sqrt(travel)*65+scale*180,950,2100));
}
