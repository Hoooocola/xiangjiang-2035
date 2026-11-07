import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {floodAnalysis,zoneAt,roadGraph,governanceAnalysis,quarryRoutes} from '../src/place-research/story/analysis';
import {initialInput,type Grid,type StoryConfig} from '../src/place-research/story/types';
import type {IslandAsset,IslandStudy,QuarryAsset} from '../src/place-research/types';
import {shotsFor} from '../src/place-research/story/shots';
const read=<T,>(name:string)=>JSON.parse(fs.readFileSync(`public/data/research/${name}.json`,'utf8'))as T;
const grid=read<Grid>('ezhou-relative-grid'),cfg=read<StoryConfig>('story-v43'),asset=read<IslandAsset>('ezhou'),study=read<IslandStudy>('ezhou-study'),quarry=read<QuarryAsset>('quarry');
describe('V4.3 deterministic research',()=>{
 it('rejects an enclosed low basin and admits it only after a river-connected sill is submerged',()=>{
  const g={...grid,width:5,depth:5,cell:1,minX:0,minZ:0,heights:[null,null,null,null,null,null,9,9,9,null,null,9,0,9,null,null,9,9,9,null,null,null,null,null,null]};
  expect(zoneAt(g,floodAnalysis(g,2,1),[2.5,2.5])).toBe('caution');expect(floodAnalysis(g,2,1).counts.flooded).toBe(0);expect(floodAnalysis(g,9,1).counts.flooded).toBe(9);
 });
 it('conserves cell area and changes boundaries and objects when water changes',()=>{
  const before=floodAnalysis(grid,8.5,1.2),after=floodAnalysis(grid,12.5,1.2);expect(after.counts.flooded).toBeGreaterThan(before.counts.flooded);expect(after.counts.stable).toBeLessThan(before.counts.stable);expect(Object.values(after.counts).reduce((a,b)=>a+b,0)).toBe(grid.heights.filter(h=>h!==null).length);expect(after.areaHa.flooded).toBe(after.counts.flooded*.01);expect(floodAnalysis(grid,12.5,1.2)).toEqual(after);
 });
 it('derives four distinct governance topologies and metrics without mutating source data',()=>{
  const json=JSON.stringify(study),roads=roadGraph(asset,grid),f=floodAnalysis(grid,10.5,1.2),results=cfg.governance.map(c=>governanceAnalysis(study,grid,f,roads,cfg,c.id));
  console.log('V43 governance',results.map(r=>({id:r.scenario,covered:r.covered,pipe:r.pipeMeters,transport:r.transportMeters,flooded:r.affectedFacilities,route:r.affectedRouteMeters})), 'roads',roads.nodes.length,roads.edges.length);
  expect(roads.edges.some(e=>e.bridge)).toBe(true);expect(new Set(results.map(r=>JSON.stringify([r.links.map(l=>[l.facility,l.method]),r.pipeMeters]))).size).toBe(4);expect(results.every(r=>Number.isFinite(r.pipeMeters))).toBe(true);expect(results.find(r=>r.scenario==='B')!.pipeMeters).toBe(0);expect(JSON.stringify(study)).toBe(json);
  const changed=governanceAnalysis(study,grid,floodAnalysis(grid,12.5,1.2),roads,cfg,'D');expect(changed.links.map(l=>l.method)).not.toEqual(results[3].links.map(l=>l.method));expect(changed.affectedFacilities).not.toBe(results[3].affectedFacilities);
 });
 it('makes road interruption a graph input and separately reports unknown engineering conditions',()=>{
  const r=roadGraph(asset,grid),f=floodAnalysis(grid,10.5,1.2),a=governanceAnalysis(study,grid,f,r,cfg,'A'),b=governanceAnalysis(study,grid,f,r,cfg,'A',true);expect(b.blockedEdge).toBeTruthy();expect(b.blockedEdge).not.toBe(a.blockedEdge);expect(a.dependencies.join('')).toMatch(/容量/);expect(cfg.governance.find(c=>c.id==='C')!.dependencies.join('')).toMatch(/无向湘江排放/);
 });
 it('computes terrain-following lengths, continuous overlap segments and alternate route tradeoffs',()=>{
  const input=initialInput('quarry'),results=quarryRoutes(quarry,cfg,input);console.log('V43 quarry',results.map(({id,length,steep,eco,water,connected})=>({id,length,steep,eco,water,connected})));
  expect(results[0].length).not.toBe(results[1].length);expect(results.every(r=>r.paths.every(p=>p.length>=p.planar))).toBe(true);expect(results.some(r=>r.paths.some(p=>p.slopeSegments.some(s=>s.length>2)))).toBe(true);expect(results[0].connected).toBe(2);expect(quarryRoutes(quarry,cfg,{...input,blocked:true})[0].connected).toBe(0);
  const changed=quarryRoutes(quarry,cfg,{...input,slopeMin:0,slopeMax:90});expect(changed[0].steep).toBeCloseTo(changed[0].length,5);expect(changed[0].eco).toBe(results[0].eco);expect(()=>quarryRoutes(quarry,cfg,{...input,slopeMin:80,slopeMax:20})).toThrow();
 });
 it('shares the five method stages with purposeful hold transitions and explicit modes',()=>{
  expect(shotsFor('ezhou')).toHaveLength(5);expect(shotsFor('quarry')).toHaveLength(7);for(const site of ['ezhou','quarry']as const){const shots=shotsFor(site);expect(new Set(shots.map(s=>s.phase)).size).toBe(5);expect(shots.every(s=>s.visibleDataLayers.length&&s.researchQuestion&&s.interactionActions.length>=4)).toBe(true)}expect(shotsFor('ezhou')[4].transitionSettings.hold).toBe(true);
 });
});
