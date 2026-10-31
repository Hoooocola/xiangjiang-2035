import source from './source.json';
import locations from './locations.json';
import assets from './assets.json';
import locationReview from './location-review.json';
import videoSources from './media.json';
import {workPlaceIds} from './relationships';
import {MAP_PLACES} from '@/src/places/registry';
import type {Place} from '@/src/places/registry';
import type {StudentTheme, StudentWork, StudentWorkMedia} from './types';

export const STUDENT_THEMES: readonly StudentTheme[] = [
  '立体交通与网络系统', '社区生活与在地共创', '湘江的生态文旅', '产业规划与场景营造',
];
export type ThemeFilter = StudentTheme | 'all';
type WorkAsset = {
  coverImage?: string | null;
  coverSource?: string | null;
  coverStatus?: StudentWork['coverStatus'];
  hasPdf: boolean;
  status: string;
  sha256?: string;
};
function assetStatus(value: string): StudentWork['coverStatus'] {
  return value === 'verified' || value === 'missing' ? value : 'unverified';
}
const media: Record<string, WorkAsset> = Object.fromEntries(Object.entries(assets).map(([id, asset]) => [id, {...asset, coverStatus: assetStatus(asset.coverStatus)}]));
type VideoAsset = Omit<Extract<StudentWorkMedia, {type:'video'}>, 'type' | 'checkedAt'>;
const videoMedia = videoSources as Record<string, {checkedAt:string;pdfs?:{id:string}[];videos:VideoAsset[]}>;
type SourceWork = Omit<StudentWork, 'coverImage' | 'coverSource' | 'coverStatus' | 'pinwallUrl'>;
export const STUDENT_WORKS: readonly StudentWork[] = (source as SourceWork[]).map(work => ({
  ...work,
  placeIds: workPlaceIds({...work, placeIds: (locationReview as Record<string, {placeIds: string[]}>)[work.id]?.placeIds ?? work.placeIds}),
  media: [
    ...(videoMedia[work.id]?.pdfs?.length ? videoMedia[work.id].pdfs!.map((pdf, index) => ({type:'pdf' as const, id:pdf.id, url:`/student-works/${work.id}/pdf?attachment=${encodeURIComponent(pdf.id)}`, label:`报告 ${index+1}`})) :
      media[work.id]?.hasPdf ? [{type:'pdf' as const, url:`/student-works/${work.id}/pdf`, label:'完整报告'}] : []),
    ...(videoMedia[work.id]?.videos ?? []).map(video => ({...video, type:'video' as const, checkedAt:videoMedia[work.id].checkedAt})),
  ],
  coverImage: media[work.id]?.coverStatus === 'verified' && media[work.id]?.coverImage
    ? `${media[work.id].coverImage}?v=${media[work.id].sha256?.slice(0, 12) ?? 'verified'}` : null,
  coverSource: media[work.id]?.coverSource ?? null,
  coverStatus: media[work.id]?.coverStatus ?? 'unverified',
  pinwallUrl: work.projectUrl,
  // Resolve fresh expiring Pinwall attachment URLs on the server, never store a signed URL.
  pdfUrl: media[work.id]?.hasPdf ? `/student-works/${work.id}/pdf` : null,
}));

const extraPlaces: Place[] = locations.filter(location=>!MAP_PLACES.some(place=>place.id===location.id)).map((location, index) => ({
  id: location.id, name: location.name, en: 'STUDENT WORK / COURSE SHOWCASE',
  coordinate: location.coordinate as [number, number], index: `S${index + 1}`,
  category: '课程成果 / 地点导航', siteCategory: location.siteCategory as Place['siteCategory'],
  description: `此处关联社会创新设计课程作品。作品的原选址与研究范围以作者资料为准。`,
  note: location.precision, distance: 44, overview: true,
  relatedResearchIds: [], relatedProposalIds: [], source: [location.source],
  verificationStatus: 'approximate',
}));

/** New navigation points exist only while the explicit showcase mode is enabled. */
export const SHOWCASE_PLACES: readonly Place[] = [...MAP_PLACES, ...extraPlaces];
export function worksForTheme(theme: ThemeFilter): StudentWork[] {
  return STUDENT_WORKS.filter(work => theme === 'all' || work.theme === theme);
}
export function visibleStudentWorks(theme: ThemeFilter = 'all', query = ''): StudentWork[] {
  const search = query.trim().toLocaleLowerCase();
  return worksForTheme(theme).filter(work => !search || [work.title, work.originalSite, ...work.members,
    ...workPlaceIds(work).map(id => SHOWCASE_PLACES.find(place => place.id === id)?.name ?? '')].join(' ').toLocaleLowerCase().includes(search));
}
export function worksForPlace(placeId: string, theme: ThemeFilter = 'all', query = ''): StudentWork[] {
  return visibleStudentWorks(theme, query).filter(work => workPlaceIds(work).includes(placeId));
}
export function showcaseStats(theme: ThemeFilter = 'all', query = '') {
  return statsForWorks(visibleStudentWorks(theme, query));
}
/** Shared by the lecture showcase and the course-based design directory. */
export function statsForWorks(works: readonly StudentWork[]) {
  return {
    total: works.length,
    mapped: works.filter(work => workPlaceIds(work).length).length,
    places: new Set(works.flatMap(workPlaceIds)).size,
    pending: works.filter(work => !workPlaceIds(work).length).length,
    partiallyMapped: works.filter(work => workPlaceIds(work).length && work.pendingLocationNames?.length).length,
    pendingSites: new Set(works.filter(work => !workPlaceIds(work).length).map(work => work.originalSite)).size,
    covers: works.filter(work => work.coverImage && work.coverStatus === 'verified').length,
    pdfs: works.filter(work => work.pdfUrl).length,
  };
}

export function studentMarkerCount(placeId: string, theme: ThemeFilter, query = ''): number {
  return worksForPlace(placeId, theme, query).length;
}
