import * as THREE from 'three';
import { CAMERA_LIMITS, CAMERA_PRESETS, type CameraPose } from './config';
const clamp=THREE.MathUtils.clamp;
export const smooth=(t:number)=>t*t*t*(t*(t*6-15)+10);
export function clonePose(p:CameraPose):CameraPose{return {...p,target:[...p.target]};}
export class CameraRig {
 pose=clonePose(CAMERA_PRESETS[0].pose);
 desired=clonePose(this.pose);
 transition:{from:CameraPose;to:CameraPose;start:number;duration:number;done?:()=>void}|null=null;
 pointers=new Map<number,{x:number;y:number}>();
 lastPinch=0; reducedMotion=false; onInteract=()=>{};
 private cleanups:(()=>void)[]=[];
 constructor(readonly camera:THREE.PerspectiveCamera,readonly canvas:HTMLCanvasElement) {
  this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on=(type:string,fn:EventListener,opts?:AddEventListenerOptions)=>{canvas.addEventListener(type,fn,opts);this.cleanups.push(()=>canvas.removeEventListener(type,fn,opts));};
  on('pointerdown',((e:PointerEvent)=>{this.cancel();this.onInteract();canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.style.cursor='grabbing';}) as EventListener);
  on('pointermove',((e:PointerEvent)=>{
   const prev=this.pointers.get(e.pointerId);if(!prev)return;
   const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
   this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(this.pointers.size===2){const p=[...this.pointers.values()];const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(this.lastPinch)this.zoom(this.lastPinch/d);this.lastPinch=d;return;}
   if(e.button===2 || e.buttons===2 || e.shiftKey){this.desired.azimuth-=dx*0.003;this.desired.polar=clamp(this.desired.polar+dy*0.002,CAMERA_LIMITS.minPolar,CAMERA_LIMITS.maxPolar);}
   else {const k=this.desired.distance*0.00075;const a=this.desired.azimuth;this.desired.target[0]-=(dx*Math.cos(a)+dy*Math.sin(a))*k;this.desired.target[2]+=(dx*Math.sin(a)-dy*Math.cos(a))*k;this.boundTarget();}
  }) as EventListener);
  const up=((e:PointerEvent)=>{this.pointers.delete(e.pointerId);this.lastPinch=0;if(!this.pointers.size)canvas.style.cursor='grab';}) as EventListener;
  on('pointerup',up);on('pointercancel',up);on('lostpointercapture',up);
  on('wheel',((e:WheelEvent)=>{e.preventDefault();this.cancel();this.onInteract();this.zoom(Math.exp(clamp(e.deltaY,-120,120)*0.0014));}) as EventListener,{passive:false});
  on('contextmenu',((e:Event)=>e.preventDefault()) as EventListener);
  on('keydown',((e:KeyboardEvent)=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))return;
   e.preventDefault();this.cancel();this.onInteract();
   if(e.key==='Home')this.fly(CAMERA_PRESETS[0].pose);
   else if(e.key==='+'||e.key==='=')this.zoom(0.85);
   else if(e.key==='-')this.zoom(1.18);
   else if(e.key==='ArrowLeft')this.orbit(-0.12);
   else if(e.key==='ArrowRight')this.orbit(0.12);
   else this.desired.polar=clamp(this.desired.polar+(e.key==='ArrowUp'?-0.06:0.06),CAMERA_LIMITS.minPolar,CAMERA_LIMITS.maxPolar);
  }) as EventListener);
 }
 boundTarget(){
  // Restrict exploration to a river corridor; overview still includes the full research reach.
  const t=this.desired.target;
  t[2]=clamp(t[2],-310,270);
  const riverX=t[2]<-60?Math.max(-130,t[2]*0.43+17):t[2]>80?-45:0;
  t[0]=clamp(t[0],riverX-65,riverX+65);
 }
 zoom(f:number){this.desired.distance=clamp(this.desired.distance*f,CAMERA_LIMITS.minDistance,CAMERA_LIMITS.maxDistance);}
 orbit(delta:number){this.cancel();this.desired.azimuth+=delta;}
 cancel(){this.transition=null;this.desired=clonePose(this.pose);}
 fly(to:CameraPose,duration=2400,done?:()=>void){
  this.transition={from:clonePose(this.pose),to:clonePose(to),start:performance.now(),duration:this.reducedMotion?0:duration,done};
  this.desired=clonePose(to);
 }
 update(now:number,dt:number){
  if(this.transition){
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
  this.camera.lookAt(...p.target);
 }
 dispose(){this.cleanups.forEach(f=>f());this.pointers.clear();}
}
