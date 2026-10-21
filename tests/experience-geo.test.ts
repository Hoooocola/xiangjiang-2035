import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {project,unproject,inRing,polygons,type SceneData} from '../src/experience/geo';
import {PLACES,CAMERA_PRESETS,CAMERA_LIMITS,OVERVIEW_POSE} from '../src/experience/config';
import {smooth} from '../src/experience/camera';
const data=JSON.parse(readFileSync('public/data/xiangjiang.geojson','utf8')) as SceneData;
describe('geographic scene integrity',()=>{
 it('round-trips coordinates across the research reach and keeps north negative Z',()=>{
  for(const p of PLACES){const recovered=unproject(project(p.coordinate));expect(recovered[0]).toBeCloseTo(p.coordinate[0],8);expect(recovered[1]).toBeCloseTo(p.coordinate[1],8);}
  expect(project(PLACES.find(p=>p.id==='tongguan')!.coordinate)[1]).toBeLessThan(project(PLACES.find(p=>p.id==='zhaoshan')!.coordinate)[1]);
 });
 it('places Orange Isle marker on the actual OSM island, in a hole of the river',()=>{
  const point=project(PLACES[0].coordinate);
  const island=data.features.find(f=>f.id==='relation/16734076')!;
  expect(inRing(...point,polygons(island)[0][0].map(project))).toBe(true);
  const river=data.features.find(f=>f.id==='relation/8727387')!;
  expect(polygons(river).some(r=>r.slice(1).some(h=>inRing(...point,h.map(project))))).toBe(true);
 });
 it('retains river coverage beyond both study endpoints',()=>{
  const river=data.features.find(f=>f.id==='relation/8727387')!;
  const latitudes=polygons(river).flat(2).map(c=>c[1]);
  expect(Math.min(...latitudes)).toBeLessThan(27.963);expect(Math.max(...latitudes)).toBeGreaterThan(28.434);
 });
 it('does not synthesize closed water from incomplete tributary relations',()=>{
  for(const id of [16731304,5940862,2308803,14964262])expect(data.features.some(f=>f.id===`relation/${id}`)).toBe(false);
 });
 it('keeps all configured cameras above the terrain and inside distance limits',()=>{
  for(const p of [...CAMERA_PRESETS.map(p=>p.pose),OVERVIEW_POSE]){
   expect(p.distance).toBeGreaterThanOrEqual(CAMERA_LIMITS.minDistance);expect(p.distance).toBeLessThanOrEqual(CAMERA_LIMITS.maxDistance);
   expect(p.polar).toBeGreaterThanOrEqual(CAMERA_LIMITS.minPolar);expect(p.polar).toBeLessThanOrEqual(CAMERA_LIMITS.maxPolar);
   expect(Math.cos(p.polar)*p.distance).toBeGreaterThan(10);
  }
 });
 it('uses a monotonic camera curve with zero endpoint velocity',()=>{
  expect(smooth(0)).toBe(0);expect(smooth(1)).toBe(1);
  let last=0;for(let i=0;i<=100;i++){const n=smooth(i/100);expect(n).toBeGreaterThanOrEqual(last);last=n;}
  expect(smooth(.001)/.001).toBeLessThan(.001);expect((1-smooth(.999))/.001).toBeLessThan(.001);
 });
});
