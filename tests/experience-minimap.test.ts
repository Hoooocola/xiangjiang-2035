import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {miniPoint,worldPoint,riverMiniPaths} from '../src/experience/minimap';
import {project,type SceneData} from '../src/experience/geo';
import {terrainSampler,type TerrainGrid} from '../src/experience/terrain';
const data=JSON.parse(readFileSync('public/data/xiangjiang.geojson','utf8')) as SceneData;
const terrain=terrainSampler(JSON.parse(readFileSync('public/data/terrain.json','utf8')) as TerrainGrid);
describe('river corridor and mini-map geography',()=>{
 it('preserves geographic positions through rotation and map clicks',()=>{
  for(const coordinate of [[112.811,28.434],[112.9559,28.1857],[112.939,27.963]] as [number,number][]){
   const point=project(coordinate),roundtrip=worldPoint(...miniPoint(...point));expect(roundtrip[0]).toBeCloseTo(point[0],8);expect(roundtrip[1]).toBeCloseTo(point[1],8);
  }
 });
 it('draws river paths from actual source polygons',()=>{
  const paths=riverMiniPaths(data);expect(paths.length).toBeGreaterThan(0);expect(paths.join('')).not.toMatch(/NaN|Infinity/);expect(paths.every(p=>p.startsWith('M')&&p.endsWith('Z'))).toBe(true);
 });
 it('keeps continuous river and nonzero context in north, core and south',()=>{
  const grid=JSON.parse(readFileSync('public/data/terrain.json','utf8')) as TerrainGrid;
  for(const z of [-260,0,210]){
   let bank:[number,number]|undefined,outer:[number,number]|undefined;
   for(let x=grid.x0;x<grid.x0+grid.dx*(grid.width-1);x+=1){const d=terrain.distance(x,z);if(d>4&&d<8)bank=[x,z];if(d>30&&d<38)outer=[x,z];}
   expect(bank).toBeDefined();expect(outer).toBeDefined();for(const point of [bank!,outer!]){expect(terrain.importance(...point)).toBeGreaterThanOrEqual(.119);expect(terrain.importance(...point)).toBeLessThanOrEqual(1);}
  }
 });
});
