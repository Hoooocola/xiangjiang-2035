import {visibleStudentWorks, type ThemeFilter} from './catalog';
import type {StudentWork} from './types';

/** A course selection never manufactures a place for an unlocated source row. */
export function selectionGroup(workId: string | null, theme: ThemeFilter, query: string): StudentWork[] {
  const visible = visibleStudentWorks(theme, query);
  const selected = visible.find(work => work.id === workId);
  if (!selected) return [];
  return visible.filter(work => selected.placeId ? work.placeId === selected.placeId : !work.placeId && work.originalSite === selected.originalSite);
}

export function adjacentWorkId(works: readonly StudentWork[], selectedId: string, direction: -1 | 1): string | null {
  if (!works.length) return null;
  const index = works.findIndex(work => work.id === selectedId);
  if (index < 0) return works[0].id;
  return works[(index + direction + works.length) % works.length].id;
}
