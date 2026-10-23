import * as THREE from 'three';
import { CAMERA_LIMITS, CAMERA_PRESETS, type CameraPose } from './config';
const clamp=THREE.MathUtils.clamp;
export const smooth=(t:number)=>t*t*t*(t*(t*6-15)+10);
export function clonePose(p:CameraPose):CameraPose{return {...p,target:[...p.target]};}
export interface CameraRigOptions {
 initial?:CameraPose;
 limits?:typeof CAMERA_LIMITS;
 boundTarget?:(target:[number,number,number])=>void;
 leftOrbit?:boolean;
 minimumCameraY?:(x:number,z:number)=>number;
}
export class CameraRig {
 pose=clonePose(CAMERA_PRESETS[0].pose);
 desired=clonePose(this.pose);
 transition:{from:CameraPose;to:CameraPose;start:number;duration:number;done?:()=>void}|null=null;
 route:{points:CameraPose[];start:number;duration:number;done?:()=>void}|null=null;
 pointers=new Map<number,{x:number;y:number}>();
 dragMode:'pan'|'orbit'='pan';
 lastPinch=0; reducedMotion=false; onInteract=()=>{};
 private cleanups:(()=>void)[]=[];
 constructor(readonly camera:THREE.PerspectiveCamera,readonly canvas:HTMLCanvasElement,readonly options:CameraRigOptions={}) {
  this.dragMode=options.leftOrbit?'orbit':'pan';
  this.pose=clonePose(options.initial??CAMERA_PRESETS[0].pose);this.desired=clonePose(this.pose);
  this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on=(type:string,fn:EventListener,opts?:AddEventListenerOptions)=>{canvas.addEventListener(type,fn,opts);this.cleanups.push(()=>canvas.removeEventListener(type,fn,opts));};
  on('pointerdown',((e:PointerEvent)=>{this.cancel();this.onInteract();canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.style.cursor='grabbing';}) as EventListener);
  on('pointermove',((e:PointerEvent)=>{
   const prev=this.pointers.get(e.pointerId);if(!prev)return;
   const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
   this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(this.pointers.size===2){const p=[...this.pointers.values()];const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(this.lastPinch)this.zoom(this.lastPinch/d);this.lastPinch=d;return;}
   if(this.dragMode==='orbit'?!e.shiftKey&&e.buttons!==2:e.buttons===2||e.shiftKey){this.desired.azimuth-=dx*0.003;this.desired.polar=clamp(this.desired.polar+dy*0.002,(this.options.limits??CAMERA_LIMITS).minPolar,(this.options.limits??CAMERA_LIMITS).maxPolar);}
   else {const k=this.desired.distance*0.00075;this.pan(-dx*k,dy*k);}
  }) as EventListener);
  const up=((e:PointerEvent)=>{this.pointers.delete(e.pointerId);this.lastPinch=0;if(!this.pointers.size)canvas.style.cursor='grab';}) as EventListener;
  on('pointerup',up);on('pointercancel',up);on('lostpointercapture',up);
  on('wheel',((e:WheelEvent)=>{e.preventDefault();this.cancel();this.onInteract();this.zoom(Math.exp(clamp(e.deltaY,-120,120)*0.0014));}) as EventListener,{passive:false});
  on('contextmenu',((e:Event)=>e.preventDefault()) as EventListener);
  on('keydown',((e:KeyboardEvent)=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))return;
   e.preventDefault();this.cancel();this.onInteract();
   if(e.key==='Home')this.fly(this.options.initial??CAMERA_PRESETS[0].pose);
   else if(e.key==='+'||e.key==='=')this.zoom(0.85);
   else if(e.key==='-')this.zoom(1.18);
   else if(e.shiftKey&&e.key.startsWith('Arrow'))this.pan((e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)*this.desired.distance*.06,(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0)*this.desired.distance*.06);
   else if(e.key==='ArrowLeft')this.orbit(-0.12);
   else if(e.key==='ArrowRight')this.orbit(0.12);
   else this.desired.polar=clamp(this.desired.polar+(e.key==='ArrowUp'?-0.06:0.06),(this.options.limits??CAMERA_LIMITS).minPolar,(this.options.limits??CAMERA_LIMITS).maxPolar);
  }) as EventListener);
 }
 boundTarget(){
  if(this.options.boundTarget){this.options.boundTarget(this.desired.target);return;}
  // Restrict exploration to a river corridor; overview still includes the full research reach.
  const t=this.desired.target;
  t[2]=clamp(t[2],-310,270);
  const riverX=t[2]<-60?Math.max(-130,t[2]*0.43+17):t[2]>80?-45:0;
  t[0]=clamp(t[0],riverX-65,riverX+65);
 }
 pan(right:number,forward:number){
  const a=this.desired.azimuth;
  this.desired.target[0]+=right*Math.cos(a)-forward*Math.sin(a);
  this.desired.target[2]-=right*Math.sin(a)+forward*Math.cos(a);
  this.boundTarget();
 }
 zoom(f:number){this.desired.distance=clamp(this.desired.distance*f,(this.options.limits??CAMERA_LIMITS).minDistance,(this.options.limits??CAMERA_LIMITS).maxDistance);}
 orbit(delta:number){if(this.route||this.transition)this.cancel();this.desired.azimuth+=delta;}
 cancel(){this.route=null;this.transition=null;this.desired=clonePose(this.pose);}
 fly(to:CameraPose,duration=2400,done?:()=>void){
  this.route=null;this.transition={from:clonePose(this.pose),to:clonePose(to),start:performance.now(),duration:this.reducedMotion?0:duration,done};
  this.desired=clonePose(to);
 }
 cruise(points:CameraPose[],duration:number,done?:()=>void){
  this.transition=null;this.route={points:[clonePose(this.pose),...points.map(clonePose)],start:performance.now(),duration,done};this.desired=clonePose(points[points.length-1]);
 }
 update(now:number,dt:number){
  if(this.route){
   const r=this.route,t=clamp((now-r.start)/r.duration,0,1),u=smooth(t)*(r.points.length-1),i=Math.min(Math.floor(u),r.points.length-2),f=u-i;
   const values=[r.points[Math.max(0,i-1)],r.points[i],r.points[i+1],r.points[Math.min(r.points.length-1,i+2)]];
   const interpolate=(read:(p:CameraPose)=>number)=>{
    const [a,b,c,d]=values.map(read);return .5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);
   };
   this.pose={target:[0,1,2].map(n=>interpolate(p=>p.target[n])) as [number,number,number],distance:interpolate(p=>p.distance),azimuth:interpolate(p=>p.azimuth),polar:interpolate(p=>p.polar)};
   if(t===1){this.route=null;r.done?.();}
  }else if(this.transition){
   const tr=this.transition,t=tr.duration?clamp((now-tr.start)/tr.duration,0,1):1,k=smooth(t);
   this.pose={target:tr.from.target.map((v,i)=>THREE.MathUtils.lerp(v,tr.to.target[i],k)) as [number,number,number],distance:THREE.MathUtils.lerp(tr.from.distance,tr.to.distance,k),azimuth:THREE.MathUtils.lerp(tr.from.azimuth,tr.to.azimuth,k),polar:THREE.MathUtils.lerp(tr.from.polar,tr.to.polar,k)};
   if(t===1){this.transition=null;tr.done?.();}
  }else{
   const k=1-Math.exp(-dt*7);
   this.pose.target.forEach((v,i)=>this.pose.target[i]=THREE.MathUtils.lerp(v,this.desired.target[i],k));
   this.pose.distance=THREE.MathUtils.lerp(this.pose.distance,this.desired.distance,k);
   this.pose.azimuth=THREE.MathUtils.lerp(this.pose.azimuth,this.desired.azimuth,k);
   this.pose.polar=THREE.MathUtils.lerp(this.pose.polar,this.desired.polar,k);
  }
  const p=this.pose,d=p.distance;
  this.camera.position.set(p.target[0]+d*Math.sin(p.polar)*Math.sin(p.azimuth),p.target[1]+d*Math.cos(p.polar),p.target[2]+d*Math.sin(p.polar)*Math.cos(p.azimuth));
  if(this.options.minimumCameraY)this.camera.position.y=Math.max(this.camera.position.y,this.options.minimumCameraY(this.camera.position.x,this.camera.position.z));
  this.camera.lookAt(...p.target);
 }
 dispose(){this.cleanups.forEach(f=>f());this.pointers.clear();}
}
