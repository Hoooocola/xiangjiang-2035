import {STUDENT_THEMES, STUDENT_WORKS, statsForWorks, visibleStudentWorks, type ThemeFilter} from './catalog';
import type {StudentTheme} from './types';

/** Course membership does not convert StudentWork into an Atlas Proposal. */
export interface Course {
  id: string;
  title: string;
  year: number;
  description: string;
  themes: readonly StudentTheme[];
  studentWorkIds: readonly string[];
  sourceUrl: string;
}

export const COURSES: readonly Course[] = [{
  id: 'social-innovation-design-2026',
  title: '2026 社会创新设计',
  year: 2026,
  // The project brief supplied this description; no unverified syllabus claims.
  description: '本课程以湘江及沿岸场域为研究对象，探索生态、文化与社会创新设计的可能性。',
  themes: STUDENT_THEMES,
  studentWorkIds: STUDENT_WORKS.map(work => work.id),
  sourceUrl: 'https://pinwall.cn/workFolder/1725',
}];
export const DEFAULT_COURSE = COURSES[0];

/** Reuse the existing title/member/place search, with an explicit course boundary. */
export function courseWorks(course: Course = DEFAULT_COURSE, theme: ThemeFilter = 'all', query = '') {
  const members = new Set(course.studentWorkIds);
  return visibleStudentWorks(theme, query).filter(work => members.has(work.id));
}
export function courseStats(course: Course = DEFAULT_COURSE, theme: ThemeFilter = 'all', query = '') {
  return statsForWorks(courseWorks(course, theme, query));
}
