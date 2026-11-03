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

export const COURSES: readonly Course[] = [2026, 2025, 2024].map(year => ({
  id: `social-innovation-design-${year}`,
  title: `${year} 社会创新设计`,
  year,
  // The project brief supplied this description; no unverified syllabus claims.
  description: '本课程以湘江及沿岸场域为研究对象，探索生态、文化与社会创新设计的可能性。',
  themes: STUDENT_THEMES,
  studentWorkIds: STUDENT_WORKS.filter(work => work.year === year).map(work => work.id),
  sourceUrl: year === 2026 ? 'https://pinwall.cn/workFolder/1725' : year === 2025 ? 'https://pinwall.cn/workFolder/1583' : 'https://pinwall.cn/workFolder/1445',
}));
export const DEFAULT_COURSE = COURSES[0];
export const ALL_COURSES: Course = {id:'all-courses',title:'历年全部课程成果',year:0,description:'2024、2025、2026 社会创新设计课程成果汇总；年份采用提供的课程工作簿，不等同于作品上传时间。',themes:STUDENT_THEMES,studentWorkIds:STUDENT_WORKS.map(work=>work.id),sourceUrl:'https://pinwall.cn/workFolder/1725'};
export const COURSE_OPTIONS = [...COURSES, ALL_COURSES];
export const courseById = (id:string) => COURSE_OPTIONS.find(course=>course.id===id) ?? DEFAULT_COURSE;

/** Reuse the existing title/member/place search, with an explicit course boundary. */
export function courseWorks(course: Course = DEFAULT_COURSE, theme: ThemeFilter = 'all', query = '') {
  const members = new Set(course.studentWorkIds);
  return visibleStudentWorks(theme, query, course.id).filter(work => members.has(work.id));
}
export function courseStats(course: Course = DEFAULT_COURSE, theme: ThemeFilter = 'all', query = '') {
  return statsForWorks(courseWorks(course, theme, query));
}
