import {describe,it,expect} from 'vitest';
import {PLACE_REGISTRY,MAP_PLACES,PENDING_PLACES} from '../src/places/registry';
import {RECORDS,recordsFor,LAYERS} from '../src/atlas/catalog';
import {DEMO_FEATURES,DEMO_RECORDS} from '../src/atlas/demo-v21';
import {visibleObjects,MAP_OBJECTS} from '../src/atlas/objects';
describe('V2.1 recoverable content and independent layer visibility',()=>{
 it('deduplicates places and keeps unknown coordinates out of the rendered registry',()=>{
  expect(MAP_PLACES).toHaveLength(31);expect(new Set(PLACE_REGISTRY.map(p=>p.id)).size).toBe(PLACE_REGISTRY.length);
  expect(PENDING_PLACES[0].coordinates).toBeNull();expect(MAP_PLACES.some(p=>p.id==='jiefangyuan')).toBe(false);
  expect(recordsFor('ezhou','Proposal')).toHaveLength(0);
  for(const p of MAP_PLACES)for(const id of [...p.relatedResearchIds,...p.relatedProposalIds])expect(RECORDS.some(r=>r.id===id&&(r.placeIds??[r.placeId]).includes(p.id)),id).toBe(true);
 });
 it('preserves sourced mock examples without inventing an economy dataset',()=>{
  expect(LAYERS.map(l=>l.id)).toEqual(['geography','ecology','culture','society','economy','proposal']);expect(DEMO_FEATURES.some(f=>f.layer==='economy')).toBe(false);
  for(const f of DEMO_FEATURES){expect(f.isMock).toBe(true);expect(f.sourceLabel).toContain('模拟研究资料');expect(RECORDS.some(r=>r.id===f.recordId&&r.dataStatus==='demo')).toBe(true);expect(MAP_PLACES.some(p=>p.id===f.placeId)).toBe(true);}
  for(const r of DEMO_RECORDS)expect(r.state).toContain('DEMO DATA');
 });
 it('disabling ecology preserves society and availability counts do not depend on switches',()=>{
  const state={layers:['ecology','society'] as const,placeId:null,proposal:null,selectedObjectIds:[],showDemo:true};
  const both=visibleObjects({...state,layers:[...state.layers]});const society=visibleObjects({...state,layers:['society']});
  expect(both.some(o=>o.layer==='ecology')).toBe(true);expect(society).toEqual(both.filter(o=>o.layer==='society'));
  const available=MAP_OBJECTS.filter(o=>o.layer==='ecology').length;expect(available).toBe(7);expect(visibleObjects({...state,layers:[]})).toHaveLength(0);expect(available).toBe(7);
 });
});
