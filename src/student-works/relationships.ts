import type {StudentWork} from './types';

/** Compatibility for existing source rows; explicit IDs are deduplicated for counts. */
export function workPlaceIds(work: Pick<StudentWork, 'placeId' | 'placeIds'>): string[] {
  return [...new Set([...(work.placeId ? [work.placeId] : []), ...(work.placeIds ?? [])])];
}

export function groupAtPlace(works: readonly StudentWork[], selected: StudentWork, placeId?: string | null): StudentWork[] {
  const active = preferredWorkPlace(selected, placeId);
  return works.filter(work => active ? workPlaceIds(work).includes(active) :
    !workPlaceIds(work).length && work.originalSite === selected.originalSite);
}

export function preferredWorkPlace(work: Pick<StudentWork, 'placeId' | 'placeIds'>, context?: string | null): string | null {
  const ids = workPlaceIds(work);
  return context && ids.includes(context) ? context : ids[0] ?? null;
}
