import {describe,it,expect} from 'vitest';
import {MAP_OBJECTS,visibleObjects} from '../src/atlas/objects';
import {INFORMATION_DEMOS,INFORMATION_DEMO_RECORDS} from '../src/atlas/demo-information-v11';
import {SUBTYPES} from '../src/atlas/information';
import {LAYERS,recordById} from '../src/atlas/catalog';
import {SOURCES} from '../src/atlas/places';
import {validateInformationFeature} from '../src/atlas/registry';
import type {OverlayState} from '../src/atlas/types';
const all:OverlayState={layers:LAYERS.map(l=>l.id),selectedObjectIds:[],proposal:null,placeId:null,showDemo:true,subtypes:SUBTYPES.map(s=>s.id)};
describe('V1.1 editorial information data',()=>{
 it('exposes each fixture as a functional, sourced and explicitly mock information object',()=>{
  expect(INFORMATION_DEMOS).toHaveLength(15);
  for(const category of ['ecology','culture','society','economy','proposal'])expect(INFORMATION_DEMOS.filter(f=>f.layer===category)).toHaveLength(3);
  const visible=new Set(visibleObjects(all).map(f=>f.id));
  for(const f of INFORMATION_DEMOS){
   expect(visible.has(f.id)).toBe(true);expect(validateInformationFeature(f)).toEqual([]);
   expect(f.dataStatus).toBe('demo');expect(f.shortDescription!.length).toBeGreaterThan(35);
   const record=recordById(f.recordId!)!;expect(record.objectIds).toContain(f.id);expect(record.dataStatus).toBe('demo');
   expect(record.state).toContain('未实施调查');expect(record.body.join('')).toContain('不是调查年份');
  }
  expect(INFORMATION_DEMO_RECORDS.every(r=>r.evidenceIds.length===0)).toBe(true);
  expect(visibleObjects({...all,showDemo:false}).every(f=>!f.isMock)).toBe(true);
 });
 it('every object has a registered subtype, explanation, status and place relation',()=>{
  expect(new Set(MAP_OBJECTS.map(f=>f.id)).size).toBe(MAP_OBJECTS.length);
  for(const f of MAP_OBJECTS){
   expect(SUBTYPES.some(s=>s.id===f.subtype&&s.layer===f.layer),f.id).toBe(true);
   expect(f.shortDescription.length,f.id).toBeGreaterThan(15);
   expect(f.relatedPlaceIds).toContain(f.placeId);
   expect(f.sourceIds.every(id=>SOURCES.some(s=>s.id===id))).toBe(true);
  }
 });
 it('keeps demo points, paths and bounded areas inside their mapped island',()=>{
  const ring=MAP_OBJECTS.find(f=>f.id==='pilot-park-16734077')!.geometry.coordinates;
  const inside=([x,y]:number[])=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const [ax,ay]=ring[i],[bx,by]=ring[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
  }return hit;};
  for(const f of INFORMATION_DEMOS){expect(inside(f.anchor),f.id).toBe(true);if(f.geometry.type!=='Polygon')for(const p of f.geometry.coordinates)expect(inside(p),f.id).toBe(true);else{expect(f.geometry.coordinates.length).toBeGreaterThan(5);expect(f.sourceFeatureIds).toContain('relation/16734077');}}
 });
});
