/** Course showcase only: deliberately separate from AtlasRecord and field data. */
export type StudentTheme =
  | '立体交通与网络系统'
  | '社区生活与在地共创'
  | '湘江的生态文旅'
  | '产业规划与场景营造';

export interface StudentWork {
  id: string;
  sequence: number;
  title: string;
  members: string[];
  theme: StudentTheme;
  originalSite: string;
  originalSiteType: string;
  placeId: string | null;
  locationNote: string;
  reviewNotes: string[];
  projectUrl: string;
  pdfUrl: string | null;
  coverImage: string | null;
  coverSource: string | null;
  coverStatus: 'verified' | 'missing' | 'unverified';
  pinwallUrl: string;
  source: { file: string; sha256: string; sheet: string; row: number };
}
