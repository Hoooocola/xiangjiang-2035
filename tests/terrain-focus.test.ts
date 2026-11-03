import {describe,it,expect} from 'vitest';
import {createTerrainFocus} from '@/src/experience/terrain-focus';
import {ZHAOSHAN_REFERENCE} from '@/src/places/zhaoshan';
import {MAP_PLACES} from '@/src/places/registry';
import * as THREE from 'three';
describe('honest DEM visual focus',()=>{
 it('keeps the known place identity while using a sourced approximate gazetteer point',()=>{const p=MAP_PLACES.find(p=>p.id==='zhaoshan')!;expect(p.coordinate).toEqual(ZHAOSHAN_REFERENCE.coordinate);expect(p.note).toContain('不是山体');expect(ZHAOSHAN_REFERENCE.source).toContain('Q106191971');});
 it('follows the rendered relief instead of a flat polygon and has a feathered visual edge',()=>{const h=(x:number,z:number)=>.8+Math.sin(x*.5)*.3+Math.cos(z*.3)*.2,f=createTerrainFocus(h);const mesh=f.root.children[0] as THREE.Mesh;const pos=mesh.geometry.attributes.position,col=mesh.geometry.attributes.color;let zero=false,solid=false;for(let i=0;i<pos.count;i++){expect(pos.getY(i)).toBeCloseTo(h(pos.getX(i),pos.getZ(i))+.009,4);zero ||= col.getW(i)===0;solid ||= col.getW(i)>.8;}expect(zero&&solid).toBe(true);expect(f.root.userData.geometryMeaning).toContain('不是');f.setActive(true);expect(f.root.visible).toBe(true);f.theme(0);f.setActive(false);expect(f.root.visible).toBe(false);f.dispose();});
});
