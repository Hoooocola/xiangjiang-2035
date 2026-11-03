import {describe,it,expect,vi,afterEach} from 'vitest';
import * as THREE from 'three';
import {buildOverlays} from '../src/experience/overlays';
import {MAP_OBJECTS} from '../src/atlas/objects';
import type {OverlayState} from '../src/atlas/types';
import {project} from '../src/experience/geo';
import {CameraRig,clonePose} from '../src/experience/camera';
import {PLACES,placePose} from '../src/experience/config';
const park=MAP_OBJECTS.find(o=>o.id==='pilot-park-15867482')!;
const base:OverlayState={layers:[],selectedObjectIds:[],proposal:null,placeId:null};
const setup=()=>buildOverlays(()=>0,new Map(),()=>0,[park]);
const dispose=(overlay:ReturnType<typeof setup>)=>overlay.root.traverse(o=>{const mesh=o as THREE.Mesh;mesh.geometry?.dispose();if(mesh.material)(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>m.dispose());});
afterEach(()=>vi.unstubAllGlobals());
describe('Yanghu public park focus in the combined release',()=>{
 it('uses the existing OSM public park polygon with projected bounds, rather than an invented wetland extent',()=>{
  expect(park.dataStatus).toBe('public');expect(park.geometry.type).toBe('Polygon');expect(park.sourceIds).toContain('osm');
  const overlay=setup(),g=overlay.groups.get(park.id)!;const fill=g.children.find(o=>o.userData.overlayFill) as THREE.Mesh;
  fill.geometry.computeBoundingBox();const coords=park.geometry.coordinates.map(project);const box=fill.geometry.boundingBox!;
  expect(box.min.x).toBeCloseTo(Math.min(...coords.map(p=>p[0])),4);expect(box.max.z).toBeCloseTo(Math.max(...coords.map(p=>p[1])),4);
  expect(park.precision).toMatch(/OSM|公园/);dispose(overlay);
 });
 it('shows a place focus without forcing the geography layer on, and clears it on exit',()=>{
  const o=setup();o.update(base);expect(o.groups.get(park.id)!.visible).toBe(false);o.focus(park.id);expect(o.groups.get(park.id)!.visible).toBe(true);o.theme(0);expect(o.groups.get(park.id)!.visible).toBe(true);o.focus(null);expect(o.groups.get(park.id)!.visible).toBe(false);dispose(o);
 });
 it('respects explicitly hiding the containing layer or park subtype after a focus',()=>{
  const o=setup();o.update({...base,layers:['geography'],subtypes:['cover']});o.focus(park.id);o.update({...base,layers:['geography'],subtypes:[]});expect(o.groups.get(park.id)!.visible).toBe(false);
  o.update({...base,layers:['geography'],subtypes:[]});o.focus(park.id);o.update(base);expect(o.groups.get(park.id)!.visible).toBe(false);dispose(o);
 });
 it('clears place emphasis while retaining an independently visible information layer',()=>{
  const o=setup();o.update({...base,layers:['geography']});o.focus(park.id);const fill=o.groups.get(park.id)!.children.find(n=>n.userData.overlayFill) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;expect(fill.material.opacity).toBe(.26);o.focus(null);expect(o.groups.get(park.id)!.visible).toBe(true);expect(fill.material.opacity).toBe(.06);dispose(o);
 });
 it('preserves ordinary selected polygon styling outside place focus',()=>{
  const o=setup();o.update({...base,layers:['geography'],selectedObjectIds:[park.id]});const fill=o.groups.get(park.id)!.children.find(n=>n.userData.overlayFill) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;expect(fill.material.opacity).toBe(.19);o.theme(0);expect(fill.material.opacity).toBe(.19);dispose(o);
 });
 it('interrupts the Yanghu flight and can return to the saved camera pose',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:false}));const canvas=Object.assign(new EventTarget(),{style:{cursor:''},setPointerCapture:()=>{}}) as unknown as HTMLCanvasElement;
  const rig=new CameraRig(new THREE.PerspectiveCamera(),canvas);const original=clonePose(rig.pose);const yanghu=PLACES.find(p=>p.id==='yanghu')!;
  rig.fly(placePose(yanghu),2600);const start=rig.transition!.start;rig.update(start+500,.016);expect(rig.pose.target).not.toEqual(original.target);
  canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{pointerId:1,clientX:100,clientY:100}));expect(rig.transition).toBeNull();rig.fly(original,0);rig.update(performance.now(),.016);expect(rig.pose.target).toEqual(original.target);expect(rig.pose.distance).toBeCloseTo(original.distance);rig.dispose();
 });
});

import {informationPose,informationInsets} from '../src/experience/information-framing';
describe('Yanghu polygon framing with the existing camera API',()=>{
 it.each([[1440,900,38],[390,844,52]])('keeps the real park in the available map viewport at %sx%s',(width,height,fov)=>{
  const points=park.geometry.coordinates.map(c=>{const [x,z]=project(c);return new THREE.Vector3(x,0,z);});
  const insets=informationInsets(width,height),pose=informationPose(points,'area',placePose(PLACES.find(p=>p.id==='yanghu')!),width,height,fov)!;
  const camera=new THREE.PerspectiveCamera(fov,width/height,.3,4500);camera.position.set(pose.target[0]+pose.distance*Math.sin(pose.polar)*Math.sin(pose.azimuth),pose.target[1]+pose.distance*Math.cos(pose.polar),pose.target[2]+pose.distance*Math.sin(pose.polar)*Math.cos(pose.azimuth));camera.lookAt(...pose.target);camera.updateMatrixWorld(true);
  for(const point of points){const p=point.clone().project(camera),x=(p.x+1)/2*width,y=(1-p.y)/2*height;expect(x).toBeGreaterThan(insets.left);expect(x).toBeLessThan(width-insets.right);expect(y).toBeGreaterThan(insets.top);expect(y).toBeLessThan(height-insets.bottom);}
 });
});
