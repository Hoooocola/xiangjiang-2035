import {describe,it,expect} from 'vitest';
import {atmosphereQuality,createAtmosphere} from '@/src/experience/atmosphere';
import * as THREE from 'three';
describe('optional spatial atmosphere',()=>{
 it('honors off, reduced motion, compact devices and sustained pressure',()=>{expect(atmosphereQuality('off',false,false)).toBe('off');expect(atmosphereQuality('auto',true,false)).toBe('off');expect(atmosphereQuality('auto',false,true)).toBe('low');expect(atmosphereQuality('auto',false,false,true)).toBe('low');expect(atmosphereQuality('auto',false,false)).toBe('full');});
 it('uses a single batch and depth-tested scene mist, and can fully disable them',()=>{const a=createAtmosphere(),camera=new THREE.PerspectiveCamera();a.update(.1,1,58,camera,[0,0,0],false,false,false,1);expect(a.stats().particles).toBe(160);expect(a.root.children[0]).toBeInstanceOf(THREE.Points);expect(a.fogStrength).toBe(1);const points=a.root.children[0] as THREE.Points<THREE.BufferGeometry,THREE.ShaderMaterial>;const before=points.material.uniforms.uTime.value;const origin=points.position.clone();a.update(.05,1,30,camera,[1,0,1],false,false,false,1);expect(points.material.uniforms.uTime.value).toBeGreaterThan(before);expect(points.position.equals(origin)).toBe(true);a.setPreference('low');a.update(.1,0,58,camera,[0,0,0],false,false,false,1);expect(a.stats()).toEqual({particles:48,mistLayers:3,atmosphere:'low'});a.setPreference('off');a.update(.1,1,58,camera,[0,0,0],false,false,false,1);expect(a.root.visible).toBe(false);expect(a.stats().particles).toBe(0);expect(a.fogStrength).toBe(0);a.dispose();});
});
it('keeps world anchors stable during camera rotation and small pans, across three scale bands',()=>{
 const a=createAtmosphere(),camera=new THREE.PerspectiveCamera();a.update(.1,1,58,camera,[1,0,1],false,false,false,1);
 const points=a.root.children[0] as THREE.Points<THREE.BufferGeometry>;const positions=Array.from(points.geometry.getAttribute('position').array);
 const banks=a.root.children[1] as THREE.Group;const origins=banks.children.map(m=>m.position.clone());
 camera.rotation.y=.4;camera.updateMatrixWorld();a.update(.1,1,59,camera,[2,0,2],false,false,false,1);
 expect(Array.from(points.geometry.getAttribute('position').array)).toEqual(positions);
 banks.children.forEach((m,i)=>expect(m.position.equals(origins[i])).toBe(true));
 a.update(.1,1,1080,camera,[400,0,500],false,false,false,1);
 const p=points.geometry.getAttribute('position');expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
 expect(Math.max(...Array.from(p.array).map(Math.abs))).toBeGreaterThan(500);expect(a.stats().particles).toBe(160);a.dispose();
});
