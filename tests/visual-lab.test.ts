import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as T from 'three';
import {sectionSamples,SECTION_OFFSETS,ECO_ZONES,zoneStats} from '../src/visual-lab/data';
import {quarryHeight} from '../src/place-research/analysis';
import {createResearchForest} from '../src/visual-lab/forest';
import {disposeRoot} from '../src/visual-lab/geometry';
import type {QuarryAsset} from '../src/place-research/types';
const quarry=JSON.parse(fs.readFileSync('public/data/research/quarry.json','utf8')) as QuarryAsset;
describe('Visual Lab source and geometry contracts',()=>{
 it('samples all nine sections from the shared reconstructed terrain, with unchanged horizontal/vertical units',()=>{
  expect(SECTION_OFFSETS).toHaveLength(9);for(let i=1;i<9;i++)expect(SECTION_OFFSETS[i]-SECTION_OFFSETS[i-1]).toBe(60);
  for(const offset of SECTION_OFFSETS){const points=sectionSamples(quarry,offset);expect(points).toHaveLength(161);expect(points.at(-1)!.distance-points[0].distance).toBe(800);for(const p of points){expect(p.x).toBe(offset);expect(p.height).toBe(quarryHeight(p.x,p.z,quarry.outline));expect(p.height).toBeGreaterThanOrEqual(0)}}
  expect(sectionSamples(quarry,0)).not.toEqual(sectionSamples(quarry,240));expect(sectionSamples(quarry,0)[80].height).toBe(0);
 });
 it('computes union crown coverage rather than adding overlapping circles or using concept-board values',()=>{
  const polygon:[number,number][]=[[0,0],[20,0],[20,20],[0,20]],crown={x:10,z:10,radius:100};
  expect(zoneStats(quarry,polygon,[]).coverPercent).toBe(0);expect(zoneStats(quarry,polygon,[crown,crown]).coverPercent).toBe(100);expect(zoneStats(quarry,polygon,[crown]).areaHa).toBe(.04);
  expect(ECO_ZONES.every(z=>z.ring.length>4)).toBe(true);expect(zoneStats(quarry,ECO_ZONES[0].ring,[]).areaHa).toBeGreaterThan(0);
 });
 it('uses one shared curved leaf instance geometry and balanced LOD instead of per-leaf meshes/wires',()=>{
  const forest=createResearchForest(quarry),leaves=forest.root.children.find(o=>o instanceof T.InstancedMesh) as T.InstancedMesh;
  expect(forest.treeCount).toBeGreaterThan(50);expect(leaves).toBeTruthy();const full=leaves.count;expect(full).toBeGreaterThan(forest.treeCount*1000);
  forest.updateLod(8);expect(leaves.count).toBe(Math.floor(full/2));forest.updateLod(3);expect(leaves.count).toBe(full);
  forest.setTechnical(true);expect(leaves.visible).toBe(false);forest.setTechnical(false);expect(leaves.visible).toBe(true);
  disposeRoot(forest.root);
 });
 it('ships a bounded owner-authorized GLB with quantized source geometry, atlas and source-derived structural edges',()=>{
  const report=JSON.parse(fs.readFileSync('public/data/visual-lab/asset-report.json','utf8')),file=fs.readFileSync('public/data/visual-lab/ezhou-owner.glb');
  expect(file.readUInt32LE(0)).toBe(0x46546c67);expect(file.readUInt32LE(8)).toBe(file.length);expect(file.length).toBe(report.glbBytes);expect(file.length).toBeLessThan(25*1024*1024);
  const json=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString());expect(json.extensionsRequired).toContain('KHR_mesh_quantization');expect(json.nodes.map((n:{name:string})=>n.name)).toEqual(['owner-island-surface','owner-island-structural-edges']);expect(json.accessors[json.meshes[0].primitives[0].indices].count/3).toBe(report.outputTriangles);
  expect(report.sourceState).toMatch(/owner confirmed/);expect(report.outputTriangles).toBeLessThan(report.sourceTriangles/20);expect(report.registration).toMatch(/unverified/);
 });
});
