import {describe,it,expect,vi,afterEach} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {informationPose,informationInsets,informationDuration} from '../src/experience/information-framing';
import {CAMERA_PRESETS} from '../src/experience/config';
import {CameraRig} from '../src/experience/camera';
const current=CAMERA_PRESETS[0].pose;
afterEach(()=>vi.unstubAllGlobals());
describe('information compositions and transitions',()=>{
 it('fits each spatial form into text-safe desktop, tablet and mobile space',()=>{
  for(const [width,height,directory] of [[1440,900,true],[1100,740,true],[900,800,false],[462,736,false]] as const){
   const insets=informationInsets(width,height,directory);
   for(const form of ['point','line','area','object'] as const){
    const points=form==='point'?[new Vector3(1,.4,1)]:[new Vector3(-3,0,-12),new Vector3(5,form==='object'?4:.2,15)];
    const pose=informationPose(points,form,current,width,height,38,insets)!;
    expect(Math.abs(pose.azimuth-current.azimuth)).toBeLessThanOrEqual(.320001);
    const camera=new PerspectiveCamera(38,width/height,.1,4500),d=pose.distance;
    camera.position.set(pose.target[0]+d*Math.sin(pose.polar)*Math.sin(pose.azimuth),pose.target[1]+d*Math.cos(pose.polar),pose.target[2]+d*Math.sin(pose.polar)*Math.cos(pose.azimuth));
    camera.lookAt(...pose.target);camera.updateMatrixWorld();
    for(const point of points){const p=point.clone().project(camera),x=(p.x+1)/2*width,y=(1-p.y)/2*height;expect(x).toBeGreaterThan(insets.left);expect(x).toBeLessThan(width-insets.right);expect(y).toBeGreaterThan(insets.top);expect(y).toBeLessThan(height-insets.bottom);}
   }
  }
 });
 it('uses a bounded distance-sensitive duration',()=>{
  const near=informationDuration(current,{...current,target:[3,0,0]}),far=informationDuration(current,{...current,target:[3,0,200],distance:200});
  expect(near).toBeLessThan(far);expect(near).toBeGreaterThanOrEqual(950);expect(far).toBeLessThanOrEqual(2100);
 });
 it('replaces consecutive flights and supports reduced motion without old completions',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  const canvas=Object.assign(new EventTarget(),{style:{},setPointerCapture:()=>{}}) as unknown as HTMLCanvasElement;
  const rig=new CameraRig(new PerspectiveCamera(),canvas),old=vi.fn(),latest=vi.fn();
  rig.fly({...current,target:[0,0,10]},1500,old);rig.update(rig.transition!.start+400,.016);
  const interrupted=[...rig.pose.target];rig.fly({...current,target:[0,0,20]},1600,old);
  expect(rig.transition!.from.target).toEqual(interrupted);
  rig.fly({...current,target:[0,0,30]},1300,latest);rig.update(rig.transition!.start+1400,.016);
  expect(old).not.toHaveBeenCalled();expect(latest).toHaveBeenCalledOnce();expect(rig.pose.target).toEqual([0,0,30]);
  rig.reducedMotion=true;rig.fly({...current,target:[0,0,40]},1800);expect(rig.transition!.duration).toBe(0);rig.update(performance.now(),.016);expect(rig.pose.target).toEqual([0,0,40]);rig.dispose();
 });
});
