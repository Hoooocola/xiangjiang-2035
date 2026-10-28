import {describe,expect,it} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {researchPose} from '../src/experience/framing';
import {CAMERA_PRESETS} from '../src/experience/config';
import {projectAnchor} from '../src/spatial/projection';

describe('macro, research and place camera framing',()=>{
 it('provides all three roles without losing the authored core view',()=>{
  expect(new Set(CAMERA_PRESETS.map(p=>p.mode))).toEqual(new Set(['macro','research','place']));
  expect(CAMERA_PRESETS[0].mode).toBe('research');
 });
 it('fits tall and wide selected bounds outside the right information panel',()=>{
  const points=[new Vector3(-12,0,-20),new Vector3(16,5,25),new Vector3(-12,5,25),new Vector3(16,0,-20)];
  for(const [width,height] of [[1280,720],[1600,900]]){
   const pose=researchPose(points,width,height,38)!;
   const camera=new PerspectiveCamera(38,width/height,.1,4500),d=pose.distance;
   camera.position.set(pose.target[0]+d*Math.sin(pose.polar)*Math.sin(pose.azimuth),pose.target[1]+d*Math.cos(pose.polar),pose.target[2]+d*Math.sin(pose.polar)*Math.cos(pose.azimuth));
   camera.lookAt(...pose.target);camera.updateMatrixWorld();
   for(const p of points){const s=projectAnchor(p,camera,width,height,new Vector3());expect(s.x).toBeGreaterThan(60);expect(s.x).toBeLessThan(width-Math.min(470,width*.39));expect(s.y).toBeGreaterThan(height>760?135:110);expect(s.y).toBeLessThan(height-140);}
  }
 });
 it('has an explicit fallback for empty or collapsed views',()=>{
  expect(researchPose([],1280,720,38)).toBeNull();
  expect(researchPose([new Vector3()],0,0,38)).toBeNull();
 });
});
