import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {terrainSampler,type TerrainGrid} from '../src/experience/terrain';
import {project} from '../src/experience/geo';
import {PLACES} from '../src/experience/config';
const grid=JSON.parse(readFileSync('public/data/terrain.json','utf8')) as TerrainGrid;
const terrain=terrainSampler(grid);
describe('terrain and persistent context',()=>{
 it('covers every research destination with a complete finite raster',()=>{
  expect(grid.elevations).toHaveLength(grid.width*grid.height);
  expect(grid.riverDistance).toHaveLength(grid.width*grid.height);
  for(const p of PLACES){const [x,z]=project(p.coordinate);expect(x).toBeGreaterThan(grid.x0);expect(x).toBeLessThan(grid.x0+grid.dx*(grid.width-1));expect(z).toBeGreaterThan(grid.z0);expect(z).toBeLessThan(grid.z0+grid.dz*(grid.height-1));expect(Number.isFinite(terrain.height(x,z))).toBe(true);}
 });
 it('keeps the river surface flat while retaining the mountain relief',()=>{
  expect(terrain.height(...project([112.962,28.19]))).toBe(0);
  expect(terrain.height(...project([112.929,28.186]))).toBeGreaterThan(.5);
 });
 it('retains terrain and river emphasis beyond the original core rectangle',()=>{
  const a=terrain.height(...project(PLACES[4].coordinate));expect(a).toBeGreaterThanOrEqual(0);
  expect(terrain.importance(...project(PLACES[4].coordinate))).toBeGreaterThan(.8);
  expect(terrain.importance(...project([112.975,28.197]))).toBeGreaterThan(.8);
 });
});
