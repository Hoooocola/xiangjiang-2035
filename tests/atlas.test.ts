import {describe,it,expect} from 'vitest';
import {RECORDS,SCENARIOS,recordById,researchYears} from '../src/atlas/catalog';
import {SOURCES,EZHOU_COORDINATE} from '../src/atlas/places';
import {EZHOU_BOUNDARY} from '../src/atlas/ezhou-boundary';
import {MAP_OBJECTS,visibleObjects,layersForObjects} from '../src/atlas/objects';
import {inRing,project} from '../src/experience/geo';
import {PLACES} from '../src/experience/config';
import type {OverlayState} from '../src/atlas/types';
const state:OverlayState={layers:['geography','ecology','culture','society','research','proposal'],scenario:'today',placeId:'ezhou',selectedObjectIds:[],proposalVisible:true};
describe('knowledge map data contract',()=>{
 it('resolves every relationship, source, place and spatial reference',()=>{
  expect(new Set(RECORDS.map(r=>r.id)).size).toBe(RECORDS.length);
  for(const r of RECORDS){expect(PLACES.some(p=>p.id===r.placeId)).toBe(true);for(const id of [...r.relatedIds,...r.evidenceIds])expect(recordById(id),`${r.id} → ${id}`).toBeDefined();for(const id of r.sourceIds)expect(SOURCES.some(s=>s.id===id)).toBe(true);for(const id of r.objectIds)expect(MAP_OBJECTS.some(o=>o.id===id&&o.placeId===r.placeId)).toBe(true);}
  for(const o of MAP_OBJECTS){if(o.recordId)expect(recordById(o.recordId)).toBeDefined();for(const id of o.sourceIds)expect(SOURCES.some(s=>s.id===id)).toBe(true);}
 });
 it('keeps the Ezhou marker inside the actual source island and retains legacy mapping separately',()=>{expect(inRing(...project(EZHOU_COORDINATE),EZHOU_BOUNDARY.map(project))).toBe(true);expect(PLACES.find(p=>p.id==='ezhou')?.coordinate).toEqual(EZHOU_COORDINATE);});
 it('keeps all demo points and route vertices on the source island',()=>{for(const o of MAP_OBJECTS.filter(o=>o.geometry.type!=='Polygon'))for(const c of o.geometry.coordinates)expect(inRing(...project(c),EZHOU_BOUNDARY.map(project)),o.id).toBe(true);});
 it('never shows future objects in Today, including when selected',()=>{expect(visibleObjects({...state,selectedObjectIds:['proposal-arrival']}).every(o=>o.scenario==='both')).toBe(true);});
 it('honors layer, place and scenario switches without removing other enabled layers',()=>{
  expect(visibleObjects({...state,layers:['ecology','culture']}).map(o=>o.layer)).toEqual(['ecology','culture']);
  expect(visibleObjects({...state,placeId:'juzizhou'})).toHaveLength(0);
  expect(visibleObjects({...state,scenario:'2035'}).filter(o=>o.layer==='proposal')).toHaveLength(4);
  expect(visibleObjects({...state,scenario:'2035',proposalVisible:false}).filter(o=>o.layer==='proposal')).toHaveLength(0);
 });
 it('separates gaps, issues, conflicts, opportunities and proposals with a traceable path',()=>{
  const conflict=recordById('conflict-use')!;expect(conflict.dataStatus).toBe('demo');expect(conflict.relatedIds).toContain('opportunity-care');
  expect(recordById('opportunity-care')!.relatedIds).toContain('proposal-care');expect(recordById('proposal-care')!.proposalType).toBe('Product-Service System');
  expect(layersForObjects(conflict.objectIds)).toEqual(['ecology','society']);
  for(const id of conflict.evidenceIds)expect(recordById(id)?.kind).toBe('FieldRecord');
  expect(recordById('issue-water')!.dataStatus).toBe('public');expect(recordById('issue-water')!.sourceIds).toContain('water2026');
 });
 it('does not invent future cohorts or present concept geometry as surveyed evidence',()=>{
  expect(researchYears('ezhou')).toEqual([2026,2024,2018]);
  for(const s of SCENARIOS)for(const id of s.proposalIds)expect(recordById(id)?.dataStatus).toBe('demo');
  for(const o of MAP_OBJECTS.filter(o=>o.scenario==='2035')){expect(o.dataStatus).toBe('demo');expect(o.precision).toContain('非实测');}
 });
});
