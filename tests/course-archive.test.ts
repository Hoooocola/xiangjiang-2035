import {describe,it,expect} from 'vitest';
import {STUDENT_WORKS,BASE_STUDENT_WORKS,SHOWCASE_PLACES} from '@/src/student-works/catalog';
import {COURSES,ALL_COURSES,courseWorks,courseStats} from '@/src/student-works/courses';
import original from '@/src/student-works/source.json';
import media from '@/src/student-works/media.json';
import audit from '@/src/student-works/archive-media-audit.json';
import report from '@/docs/v2.6/import-report.json';
import {workPlaceIds} from '@/src/student-works/relationships';

describe('V2.6 workbook reconciliation',()=>{
 it('imports both source sheets without double counting and separates real course years',()=>{
  expect(report.sheets.map(s=>s.name)).toEqual(['历年作业整理','原始收集']);
  expect(STUDENT_WORKS).toHaveLength(51);expect(new Set(STUDENT_WORKS.map(w=>w.projectUrl)).size).toBe(51);
  expect(COURSES.map(c=>courseStats(c).total)).toEqual([39,2,10]);expect(courseStats(ALL_COURSES)).toMatchObject({total:51,mapped:33,pending:18,places:14});
  for(const c of COURSES)expect(courseWorks(c).every(w=>w.year===c.year&&w.courseId===c.id)).toBe(true);
 });
 it('preserves all 24 earlier stable identities, authors, themes and reviewed site text',()=>{
  expect(BASE_STUDENT_WORKS).toHaveLength(24);
  for(const row of original){const current=STUDENT_WORKS.find(w=>w.id===row.id)!;for(const key of ['title','members','theme','originalSite','originalSiteType','source']as const)expect(current[key]).toEqual(row[key]);}
  expect(report.newProjects).toBe(27);expect(report.preservedMetadataDifferences).toHaveLength(2);
 });
 it('matches only named existing navigation points and preserves source-backed multi-place or unlocated works',()=>{
  for(const w of STUDENT_WORKS)for(const id of workPlaceIds(w))expect(SHOWCASE_PLACES.some(p=>p.id===id)).toBe(true);
  expect(workPlaceIds(STUDENT_WORKS.find(w=>w.id==='pinwall-66171')!)).toEqual(['tongguan','juzizhou','ezhou']);
  for(const id of ['pinwall-55735','pinwall-55758','pinwall-62168','pinwall-62188'])expect(workPlaceIds(STUDENT_WORKS.find(w=>w.id===id)!)).toEqual([]);
 });
 it('binds all 64 current PDFs and 17 videos using each actual detail page, without signatures',()=>{
  expect(audit).toHaveLength(51);for(const a of audit){expect(a.page.status).toBe('200');expect(a.titleMatch).toBe(true);expect(a.membersMatch).toBe(true);}
  const files=STUDENT_WORKS.flatMap(w=>w.media??[]);expect(files.filter(m=>m.type==='pdf')).toHaveLength(64);expect(files.filter(m=>m.type==='video')).toHaveLength(17);
  for(const w of STUDENT_WORKS){expect(new Set(w.media?.map(m=>m.id)).size).toBe(w.media?.length);expect(w.media?.map(m=>m.order)).toEqual((w.media??[]).map(m=>m.order).slice().sort((a,b)=>(a??0)-(b??0)));}
  expect(JSON.stringify(media)).not.toMatch(/Signature=|Expires=|OSSAccessKeyId|https?:\/\/[^/]+:[^/]+@/);
  expect(report.unavailableAttachments).toMatchObject([{workId:'pinwall-66198',status:'404'}]);expect(report.retiredAttachments).toMatchObject([{workId:'pinwall-66190',id:'csZzG22RP2wasbnQXSDx'}]);
 });
});
