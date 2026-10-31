import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {DEFAULT_COURSE, COURSES, ALL_COURSES, courseWorks, courseStats} from '@/src/student-works/courses';
import {STUDENT_THEMES, STUDENT_WORKS, showcaseStats, statsForWorks, visibleStudentWorks, worksForPlace} from '@/src/student-works/catalog';
import {StudentWorkShowcase, StudentWorkExhibition} from '@/app/experience/student-work-showcase';
import {StudentWorkReportLinks} from '@/app/experience/student-work-media';
import {selectionGroup} from '@/src/student-works/selection';
import {workPlaceIds} from '@/src/student-works/relationships';
import {DESIGN_PROPOSALS} from '@/src/atlas/proposals';

describe('one course dataset for the design directory and lecture showcase', () => {
  it('uses all existing identities, themes, covers, locations and media without converting Proposals', () => {
    expect(COURSES).toHaveLength(3);
    expect(courseWorks()).toEqual(STUDENT_WORKS.filter(w=>w.year===2026));
    expect(DEFAULT_COURSE.themes).toEqual(STUDENT_THEMES);
    expect(new Set(DEFAULT_COURSE.studentWorkIds).size).toBe(39);
    expect(DEFAULT_COURSE.studentWorkIds.some(id => DESIGN_PROPOSALS.some(p => p.id === id))).toBe(false);
    expect(courseStats()).toMatchObject({total:39, places:14, pending:11});
  });
  it.each(['all', ...STUDENT_THEMES] as const)('keeps %s totals and search identical across both entry points', theme => {
    for (const query of ['', '橘子洲', '王子轩', '不存在的搜索词']) {
      expect(courseStats(DEFAULT_COURSE, theme, query)).toEqual(showcaseStats(theme, query));
      expect(courseWorks(DEFAULT_COURSE, theme, query)).toEqual(visibleStudentWorks(theme, query));
    }
  });
  it('isolates course membership and counts a multi-place work once even with duplicate membership IDs', () => {
    const work = STUDENT_WORKS.find(w => workPlaceIds(w).length > 1)!;
    const course = {...DEFAULT_COURSE, studentWorkIds:[work.id, work.id]};
    expect(courseWorks(course)).toEqual([work]);
    expect(courseStats(course).total).toBe(1);
    expect(courseStats(course).places).toBe(new Set(workPlaceIds(work)).size);
    expect(statsForWorks([work, {...STUDENT_WORKS[0], id:'test-pending', placeId:null, placeIds:[]}]).pending).toBe(1);
  });
  it('keeps every source-backed work in each place group, including shared places with different themes', () => {
    for (const place of ['juzizhou', 'ezhou']) {
      const works = worksForPlace(place);
      expect(selectionGroup(works[0].id, 'all', '', place)).toEqual(works);
    }
    const shared = worksForPlace('juzizhou');
    expect(new Set(shared.map(w => w.theme)).size).toBeGreaterThan(1);
    for (const work of courseWorks().filter(w => !workPlaceIds(w).length)) {
      expect(selectionGroup(work.id, 'all', '')).toContain(work);
    }
  });
  it('renders the same course summary in both layouts, square source covers and readable multi-place actions', () => {
    const noop=()=>{};
    const props={theme:'all' as const,query:'',view:'works' as const,expanded:true,selectedPlace:null,active:true,loaded:true,onTheme:noop,onQuery:noop,onView:noop,onExpanded:noop,onLocate:noop,onWork:noop,onClose:noop,onOverview:noop};
    for (const integrated of [true,false]) {
      const html=renderToStaticMarkup(createElement(StudentWorkShowcase,{...props,integrated}));
      expect(html).toContain(DEFAULT_COURSE.title);
      expect(html).toContain('UNLOCATED');
      expect(html).not.toContain('选择课程');
      for(const work of courseWorks())expect(html).toContain(work.coverImage!);
      for(const p of DESIGN_PROPOSALS)expect(html).not.toContain(p.title);
    }
    const work=STUDENT_WORKS.find(w=>workPlaceIds(w).length>1)!;
    const html=renderToStaticMarkup(createElement(StudentWorkExhibition,{works:[work],placeName:'多地点',ready:true,integrated:true,onLocate:noop,onClose:noop}));
    expect((html.match(/aria-pressed=/g)??[]).length).toBe(workPlaceIds(work).length);
    expect(html).not.toMatch(/<iframe|<video/);
    const fallback=renderToStaticMarkup(createElement(StudentWorkReportLinks,{work:{...work,pdfUrl:null,media:[]}}));
    expect(fallback).toContain(`href="${work.pinwallUrl}"`);
    expect(fallback).not.toContain('查看 PDF');
  });
});
