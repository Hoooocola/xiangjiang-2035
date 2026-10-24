import {afterEach,describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {CameraRig} from '../src/experience/camera';
import {CAMERA_LIMITS,OVERVIEW_POSE} from '../src/experience/config';

afterEach(()=>vi.unstubAllGlobals());
function setup(){
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 const canvas=Object.assign(new EventTarget(),{style:{cursor:''},setPointerCapture:()=>{}}) as unknown as HTMLCanvasElement;
 const camera=new THREE.PerspectiveCamera();
 const rig=new CameraRig(camera,canvas,{minimumCameraY:()=>35});
 return {rig,camera,canvas};
}
describe('one camera controller for transitions and direct input',()=>{
 it('interrupts a flight on pointer input and keeps the current position',()=>{
  const {rig,canvas}=setup();rig.fly(OVERVIEW_POSE);const start=rig.transition!.start;rig.update(start+500,.016);
  const position=[...rig.pose.target];const event=Object.assign(new Event('pointerdown'),{pointerId:1,clientX:200,clientY:200});canvas.dispatchEvent(event);
  expect(rig.transition).toBeNull();expect(rig.desired.target).toEqual(position);
  rig.pan(1,0);expect(rig.desired.target).not.toEqual(position);rig.dispose();
 });
 it('pans relative to the camera heading and keeps zoom within limits',()=>{
  const {rig}=setup();rig.desired.target=[0,0,0];rig.desired.azimuth=Math.PI/2;rig.pan(2,0);
  expect(rig.desired.target[0]).toBeCloseTo(0);expect(rig.desired.target[2]).toBeCloseTo(-2);
  rig.zoom(.00001);expect(rig.desired.distance).toBe(CAMERA_LIMITS.minDistance);
  rig.zoom(1e6);expect(rig.desired.distance).toBe(CAMERA_LIMITS.maxDistance);rig.dispose();
 });
 it('honors a terrain and roof clearance even during a flight',()=>{
  const {rig,camera}=setup();rig.fly({target:[0,0,0],distance:23,polar:1.02,azimuth:0},0);rig.update(performance.now(),.016);
  expect(camera.position.y).toBe(35);expect(camera.position.toArray().every(Number.isFinite)).toBe(true);rig.dispose();
 });
 it('makes primary dragging follow the visible mode',()=>{
  const {rig,canvas}=setup();rig.dragMode='orbit';canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{pointerId:1,clientX:100,clientY:100}));
  const before=rig.desired.azimuth;
  canvas.dispatchEvent(Object.assign(new Event('pointermove'),{pointerId:1,clientX:200,clientY:100,buttons:1,shiftKey:false}));
  expect(rig.desired.azimuth).not.toBe(before);rig.dispose();
 });
});

import {INTRO_SEQUENCE,sampleSequence} from '../src/experience/camera-sequence';
describe('authored overview to core sequence',()=>{
 it('holds endpoints and approaches without range or heading reversals',()=>{
  expect(sampleSequence(INTRO_SEQUENCE,600)).toEqual(OVERVIEW_POSE);
  let last=sampleSequence(INTRO_SEQUENCE,1200);
  for(let t=1300;t<=11400;t+=100){const next=sampleSequence(INTRO_SEQUENCE,t);expect(next.distance).toBeLessThanOrEqual(last.distance+1e-8);expect(next.azimuth).toBeGreaterThanOrEqual(last.azimuth-1e-8);expect(next.polar).toBeGreaterThanOrEqual(last.polar-1e-8);expect(next.target[2]).toBeGreaterThanOrEqual(last.target[2]-1e-8);last=next;}
  expect(sampleSequence(INTRO_SEQUENCE,11000)).toEqual(sampleSequence(INTRO_SEQUENCE,11400));
 });
 it('cancels both a sequence and its completion callback on input',()=>{
  const {rig,canvas}=setup(),done=vi.fn();rig.sequence(INTRO_SEQUENCE,done);const start=rig.route!.start;rig.update(start+5500,.016);
  canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{pointerId:1,clientX:100,clientY:100}));rig.update(start+15000,.016);
  expect(rig.route).toBeNull();expect(done).not.toHaveBeenCalled();rig.dispose();
 });
});
