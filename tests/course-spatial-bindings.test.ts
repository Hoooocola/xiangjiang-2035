import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import reference from '../src/student-works/workbook-reference.json';
import {STUDENT_WORKS,SHOWCASE_PLACES,statsForWorks,visibleStudentWorks,STUDENT_THEMES} from '../src/student-works/catalog';
import {workPlaceIds,isCorridorWork,isPendingWork,groupAtPlace} from '../src/student-works/relationships';
import {StudentWorkShowcase} from '../app/experience/student-work-showcase';
import {ALL_COURSES} from '../src/student-works/courses';
describe('Pinwall IDs and spatial categories',()=>{
 it('matches all 51 source IDs and course years exactly without duplicates or invalid place IDs',()=>{
  expect(reference.rows).toHaveLength(51);expect(new Set(reference.rows.map(r=>r.url)).size).toBe(51);
  expect(new Set(STUDENT_WORKS.map(w=>w.id)).size).toBe(51);
  for(const row of reference.rows){const matched=STUDENT_WORKS.filter(w=>w.id==='pinwall-'+row.url.split('/').pop());expect(matched).toHaveLength(1);expect(matched[0].year).toBe(Number(row.year));for(const id of workPlaceIds(matched[0]))expect(SHOWCASE_PLACES.some(p=>p.id===id)).toBe(true)}
 });
 it('treats the five corridor works as bound without creating fictitious map coordinates',()=>{
  const global=STUDENT_WORKS.filter(isCorridorWork);expect(global.map(w=>w.id).sort()).toEqual(['pinwall-55735','pinwall-55784','pinwall-60496','pinwall-60519','pinwall-62181']);
  expect(global.every(w=>!isPendingWork(w)&&workPlaceIds(w).length===0)).toBe(true);
  expect(SHOWCASE_PLACES.some(p=>p.id==='xiangjiang-corridor')).toBe(false);
  expect(groupAtPlace(STUDENT_WORKS,global[0])).toEqual(global);
 });
 it('retains unresolved locations, confirmed corridor endpoints and multi-location links independently',()=>{
  expect(isPendingWork(STUDENT_WORKS.find(w=>w.id==='pinwall-55792')!)).toBe(true);
  expect(workPlaceIds(STUDENT_WORKS.find(w=>w.id==='pinwall-66187')!)).toEqual(['site-011','student-yuxiang']);
  expect(workPlaceIds(STUDENT_WORKS.find(w=>w.id==='pinwall-66193')!)).toEqual(['ezhou']);
  expect(workPlaceIds(STUDENT_WORKS.find(w=>w.id==='pinwall-66171')!)).toEqual(['tongguan','juzizhou','ezhou']);
  expect(workPlaceIds({placeId:'legacy',placeIds:[]})).toEqual([]);
 });
 it('derives marker groups and every count from identical year, theme and query filters',()=>{
  for(const year of['social-innovation-design-2024','social-innovation-design-2025','social-innovation-design-2026','all-courses'])for(const theme of['all',...STUDENT_THEMES]as const)for(const query of['','湘江整体','鹅洲','不存在']){
   const works=visibleStudentWorks(theme,query,year),stats=statsForWorks(works),ids=new Set(works.flatMap(workPlaceIds));
   expect(stats.mapped+stats.pending).toBe(works.length);expect(stats.pointPlaces).toBe(ids.size);expect(stats.places).toBe(ids.size+Number(works.some(isCorridorWork)));
   for(const id of ids)expect(works.some(w=>workPlaceIds(w).includes(id))).toBe(true);
  }
 });
 it('offers the global work list in integrated design and omits standalone demo controls',()=>{
  const noop=()=>{},html=renderToStaticMarkup(createElement(StudentWorkShowcase,{course:ALL_COURSES,integrated:true,theme:'all',query:'',view:'places',expanded:true,selectedPlace:null,active:true,loaded:true,onTheme:noop,onQuery:noop,onView:noop,onExpanded:noop,onLocate:noop,onWork:noop,onClose:noop,onOverview:noop}));
  expect(html).toContain('湘江整体');expect(html).not.toContain('独立课程演示');
 });
});
