import type {StudentWork} from './types';

/** Compatibility for existing source rows; explicit IDs are deduplicated for counts. */
export function workPlaceIds(work: Pick<StudentWork, 'placeId' | 'placeIds'>): string[] {
  return [...new Set(work.placeIds ?? (work.placeId ? [work.placeId] : []))];
}

export const CORRIDOR_GROUP = 'xiangjiang-corridor';
export const isCorridorWork = (work: Pick<StudentWork, 'spatialScope'>) => work.spatialScope === 'corridor';
export const isPendingWork = (work: Pick<StudentWork, 'placeId' | 'placeIds' | 'spatialScope'>) => !workPlaceIds(work).length && !isCorridorWork(work);

export function groupAtPlace(works: readonly StudentWork[], selected: StudentWork, placeId?: string | null): StudentWork[] {
  const active = preferredWorkPlace(selected, placeId);
  if (placeId === CORRIDOR_GROUP || (!active && isCorridorWork(selected))) return works.filter(isCorridorWork);
  return works.filter(work => active ? workPlaceIds(work).includes(active) :
    isPendingWork(work) && work.originalSite === selected.originalSite);
}

export function preferredWorkPlace(work: Pick<StudentWork, 'placeId' | 'placeIds'>, context?: string | null): string | null {
  const ids = workPlaceIds(work);
  return context && ids.includes(context) ? context : ids[0] ?? null;
}
