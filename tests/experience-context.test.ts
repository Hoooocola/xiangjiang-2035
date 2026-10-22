import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {project} from '../src/experience/geo';
const context=JSON.parse(readFileSync('public/data/context.json','utf8')) as {buildings:number[][]};
const environment=JSON.parse(readFileSync('public/data/environment.json','utf8')) as {features:unknown[];forest:number[]};
describe('full reach geographic context',()=>{
 it('includes substantial source-derived building coverage near both endpoints and inland',()=>{
  for(const coordinate of [[112.811,28.434],[112.939,27.963],[113.025,28.20]] as [number,number][]){
   const [x,z]=project(coordinate),near=context.buildings.filter(b=>Math.hypot(b[0]-x,b[1]-z)<30);
   expect(near.length).toBeGreaterThan(100);
  }
 });
 it('contains valid volumes and excludes the original core data rectangle to prevent duplicates',()=>{
  const [left,south]=project([112.93,28.13]),[right,north]=project([113.005,28.28]);
  let core=0;
  for(const b of context.buildings){expect(b).toHaveLength(6);expect(b.every(Number.isFinite)).toBe(true);expect(b[2]).toBeGreaterThan(0);expect(b[3]).toBeGreaterThan(0);expect(b[5]).toBeGreaterThan(0);if(b[0]>left+.5&&b[0]<right-.5&&b[1]>north+.5&&b[1]<south-.5)core++;}
  expect(core).toBe(0);
 });
 it('includes roads and a complete nonempty vegetation mask',()=>{
  expect(environment.features.length).toBeGreaterThan(10000);expect(environment.forest).toHaveLength(320*512);expect(environment.forest.filter(Boolean).length).toBeGreaterThan(10000);
 });
});
