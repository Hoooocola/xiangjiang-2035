import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as THREE from 'three';
import {waterSurfaces,cutInlandWater} from '../src/experience/water';
import {isSurfaceWater} from '../src/experience/water-tags.mjs';
import {unproject,type Feature,type SceneData} from '../src/experience/geo';
const polygon=(rings:number[][][],properties={natural:'water',water:'lake'}):Feature=>({type:'Feature',id:'test',properties,geometry:{type:'Polygon',coordinates:rings.map(r=>r.map(p=>unproject(p as [number,number])))}});
const data=(f:Feature):SceneData=>({type:'FeatureCollection',features:[f]});
describe('surface-water pipeline',()=>{
 it('recognizes lake/pond/reservoir and untyped natural water without treating wetlands or grey parcels as water',()=>{
  for(const water of ['lake','pond','reservoir','basin','river'])expect(isSurfaceWater({water})).toBe(true);
  expect(isSurfaceWater({natural:'water'})).toBe(true);
  for(const p of [{natural:'wetland'},{landuse:'residential'},{leisure:'park'}])expect(isSurfaceWater(p)).toBe(false);
 });
 it('indexes multipolygons, negative bucket coordinates and island holes',()=>{
  const f=polygon([[[-2,-2],[2,-2],[2,2],[-2,2],[-2,-2]],[[-1,-1],[-1,1],[1,1],[1,-1],[-1,-1]]]);
  f.geometry={type:'MultiPolygon',coordinates:[(f.geometry as {coordinates:[number,number][][]}).coordinates]};
  const w=waterSurfaces(data(f),()=>.5);expect(w.at(1.5,0)?.level).toBeCloseTo(.515);expect(w.at(0,0)).toBeUndefined();expect(w.at(-1.5,0)).toBeDefined();expect(w.at(3,0)).toBeUndefined();
 });
 it('cuts land under inland water, preserves islands and keeps land height/normals',()=>{
  const f=polygon([[[-2,-2],[2,-2],[2,2],[-2,2],[-2,-2]],[[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]]]);
  const g=new THREE.PlaneGeometry(6,6,6,6);g.rotateX(-Math.PI/2);g.translate(0,2,0);
  const result=cutInlandWater(g,waterSurfaces(data(f),()=>2)),r=new THREE.Raycaster();
  const hit=(x:number,z:number)=>{r.set(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0));return r.intersectObject(new THREE.Mesh(result,new THREE.MeshBasicMaterial())).length>0;};
  expect(result.attributes.uv.count).toBe(result.attributes.position.count);expect(hit(1,0)).toBe(false);expect(hit(0,0)).toBe(true);expect(hit(2.5,0)).toBe(true);
  for(let i=0;i<result.attributes.position.count;i++){expect(result.attributes.position.getY(i)).toBeCloseTo(2);expect(result.attributes.normal.getY(i)).toBeCloseTo(1);}
  g.dispose();result.dispose();
 });
 it('does not cut the existing river DEM geometry',()=>{
  const f=polygon([[[-2,-2],[2,-2],[2,2],[-2,2],[-2,-2]]],{natural:'water',water:'river'});
  const g=new THREE.PlaneGeometry(6,6);g.rotateX(-Math.PI/2);const result=cutInlandWater(g,waterSurfaces(data(f),()=>2));expect(result.attributes.position.count).toBe(6);expect(waterSurfaces(data(f),()=>2).at(0,0)?.level).toBe(.015);g.dispose();result.dispose();
 });
 it('ships complete source polygons for Houhu, Taizihu, ponds and holes; no replacement river',()=>{
  const asset=JSON.parse(fs.readFileSync('public/data/inland-water.geojson','utf8')) as SceneData;
  expect(asset.features.length).toBe(105);expect(asset.features.every(f=>f.properties.water!=='river')).toBe(true);
  const hou=asset.features.find(f=>f.id==='relation/17880216')!;expect(hou.properties.name).toBe('后湖');expect(hou.geometry.type).toBe('Polygon');expect(hou.geometry.coordinates.length).toBe(5);
  expect(asset.features.some(f=>f.properties.name==='桃子湖')).toBe(true);expect(asset.features.some(f=>f.properties.water==='pond')).toBe(true);
  const check=(v:unknown)=>{if(Array.isArray(v)){if(typeof v[0]==='number'){expect(v[0]).toBeGreaterThan(112);expect(v[0]).toBeLessThan(114);expect(v[1]).toBeGreaterThan(27);expect(v[1]).toBeLessThan(29);}else v.forEach(check);}};asset.features.forEach(f=>check(f.geometry.coordinates));
 });
});
