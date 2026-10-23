import {describe,it,expect} from 'vitest';
import {SITE,ANNOTATIONS,RECORDS,STORY} from '../src/spatial/data';
import {explorerReducer as reduce,initialState,visibleAnnotations,highlightedRecordIds,relatedFindings} from '../src/spatial/controller';
import {miniViewport,MINI_MAP} from '../src/experience/minimap';
import {SITE_HOME} from '../src/spatial/data';
import {CameraRig} from '../src/experience/camera';
import {PerspectiveCamera} from 'three';
import {loadSiteModel} from '../src/spatial/scene';
import {createAnnotations} from '../src/spatial/annotations';

describe('spatial research contract',()=>{
 it('resolves the shared data graph and independent spatial annotations',()=>{
  expect(new Set(RECORDS.map(r=>r.id)).size).toBe(RECORDS.length);
  for(const r of RECORDS){expect(r.siteId).toBe(SITE.id);for(const id of [...r.relatedIds,...r.evidenceIds])expect(RECORDS.some(r=>r.id===id),id).toBe(true);for(const id of r.annotationIds)expect(ANNOTATIONS.some(a=>a.id===id&&a.recordId===r.id),id).toBe(true);}
  for(const a of ANNOTATIONS)expect(RECORDS.some(r=>r.id===a.recordId&&r.layer===a.layer)).toBe(true);
  expect(new Set(ANNOTATIONS.map(a=>a.form))).toEqual(new Set(['point','path','area','object']));
 });
 it('keeps mock local geometry separate from GIS and never invents survey metadata',()=>{
  expect(SITE.asset.isMock).toBe(true);expect(SITE.asset.captureDate).toBeUndefined();expect(SITE.asset.accuracy).toBeUndefined();expect(SITE.georeferencing.gisAnchor).toBeNull();
  for(const r of RECORDS)expect(r.sourceType).toBe('mock');
 });
 it('traces multiple evidence items through findings and opportunities to a proposal',()=>{
  const issue=RECORDS.find(r=>r.id==='I001')!;expect(issue.evidenceIds).toEqual(['E001','E002','E003']);
  const opportunity=RECORDS.find(r=>r.kind==='DesignOpportunity')!;if(opportunity.kind==='DesignOpportunity')expect(opportunity.findingIds).toEqual(['I001','IN001']);
  const proposal=RECORDS.find(r=>r.kind==='Proposal')!;if(proposal.kind==='Proposal')expect(proposal.opportunityIds).toEqual(['O001']);
  const s=reduce(initialState,{type:'select',id:'I001'});expect(s.layers).toContain('evidence');expect(highlightedRecordIds(s)).toEqual(['I001','E001','E002','E003']);
 });
 it('compares resources without manufacturing findings',()=>{
  const s=reduce(reduce(initialState,{type:'compare',id:'R001'}),{type:'compare',id:'R003'});
  expect(s.compareIds).toEqual(['R001','R003']);expect(s.selectedId).toBeNull();expect(relatedFindings(s.compareIds).map(r=>r.id)).toContain('I001');expect(RECORDS.filter(r=>r.kind==='Issue')).toHaveLength(1);
 });
 it('applies all five guided steps atomically and returns to clean free exploration',()=>{
  let s=reduce(initialState,{type:'start'});
  for(let i=0;i<5;i++){const step=STORY.steps[i];expect(s.layers).toEqual(step.layers);expect(s.selectedId).toBe(step.selectedId);expect(s.proposalVisible).toBe(step.proposalVisible);if(i<4)s=reduce(s,{type:'next'});}
  s=reduce(s,{type:'exit'});expect(s.mode).toBe('free');expect(s.selectedId).toBeNull();expect(s.proposalVisible).toBe(false);expect(s.compareIds).toEqual([]);expect(visibleAnnotations(s).every(a=>a.layer==='context')).toBe(true);
 });
 it('pauses for free observation, restores the same step, and supports skip/reset',()=>{
  let s=reduce(reduce(initialState,{type:'start'}),{type:'next'});s=reduce(s,{type:'pause'});s=reduce(s,{type:'select',id:'E003'});expect(s.paused).toBe(true);
  s=reduce(s,{type:'resume'});expect(s.step).toBe(1);expect(s.paused).toBe(false);expect(s.selectedId).toBe('R001');expect(s.layers).toEqual(STORY.steps[1].layers);
  s=reduce(s,{type:'skip'});expect(s.step).toBe(4);s=reduce(s,{type:'reset'});expect(s.step).toBe(0);expect(s.proposalVisible).toBe(false);
 });
 it('filters layers/themes and never renders a hidden intervention',()=>{
  let s=reduce(initialState,{type:'select',id:'P001'});expect(visibleAnnotations(s).some(a=>a.futureOnly)).toBe(false);
  s=reduce(s,{type:'proposal',visible:true});expect(visibleAnnotations(s).filter(a=>a.futureOnly)).toHaveLength(3);
  s=reduce(s,{type:'proposal',visible:false});expect(visibleAnnotations(s).some(a=>a.futureOnly)).toBe(false);
  s=reduce(s,{type:'theme',theme:'society'});expect(s.selectedId).toBeNull();expect(visibleAnnotations(s).every(a=>RECORDS.find(r=>r.id===a.recordId)?.theme!=='society')).toBe(true);
 });
 it('opens a theme deterministically and hides the physical proposal when its theme is off',async()=>{
  let s=reduce(initialState,{type:'topic',theme:'society'});s=reduce(s,{type:'topic',theme:'society'});expect(s.layers).toEqual(['context','resources']);expect(s.themes).toEqual(['society']);
  const model=await loadSiteModel(SITE.asset,new AbortController().signal),annotations=createAnnotations(model);
  s=reduce(initialState,{type:'skip'});annotations.update(s);expect(model.proposal.visible).toBe(true);
  s=reduce(s,{type:'theme',theme:'society'});annotations.update(s);expect(model.proposal.visible).toBe(false);model.dispose();
 });
 it('reports missing and failed GLB assets instead of silently substituting a mock',async()=>{
  await expect(loadSiteModel({...SITE.asset,assetType:'glb'},new AbortController().signal)).rejects.toThrow('模型资源未配置');
 });
 it('uses the shared camera controller with local bounds without changing macro defaults',()=>{
  // No DOM event simulation: exercise the configurable camera math with a minimal event target.
  const canvas={addEventListener:()=>{},removeEventListener:()=>{}} as unknown as HTMLCanvasElement;
  const old=globalThis.matchMedia;globalThis.matchMedia=(()=>({matches:false})) as unknown as typeof matchMedia;
  const rig=new CameraRig(new PerspectiveCamera(),canvas,{initial:SITE_HOME,limits:{minDistance:10,maxDistance:140,minPolar:.2,maxPolar:1.3},boundTarget:t=>{t[0]=Math.max(-30,Math.min(30,t[0]));}});
  rig.desired.target[0]=100;rig.boundTarget();expect(rig.desired.target[0]).toBe(30);rig.zoom(.001);expect(rig.desired.distance).toBe(10);rig.update(0,0);expect(rig.camera.position.y).toBeGreaterThan(0);rig.dispose();globalThis.matchMedia=old;
 });
});
describe('rectangular minimap indicator',()=>{
 it('keeps perpendicular adjacent edges and fits the frame at all camera headings/scales',()=>{
  for(const distance of [23,75,1080])for(const angle of [-2,0,.6,2]){
   const p=miniViewport([2,0,-1],distance,angle,.88,38,16/9);const a=[p[1][0]-p[0][0],p[1][1]-p[0][1]],b=[p[2][0]-p[1][0],p[2][1]-p[1][1]];
   expect(a[0]*b[0]+a[1]*b[1]).toBeCloseTo(0,6);expect(p[0][0]+p[2][0]).toBeCloseTo(p[1][0]+p[3][0],8);
   for(const [x,y] of p){expect(x).toBeGreaterThanOrEqual(3.99);expect(x).toBeLessThanOrEqual(MINI_MAP.width-3.99);expect(y).toBeGreaterThanOrEqual(3.99);expect(y).toBeLessThanOrEqual(MINI_MAP.height-3.99);}
  }
 });
});
