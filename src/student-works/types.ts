/** Course showcase only: deliberately separate from AtlasRecord and field data. */
export type StudentTheme =
  | '立体交通与网络系统'
  | '社区生活与在地共创'
  | '湘江的生态文旅'
  | '产业规划与场景营造';

export type StudentWorkMedia =
  | {type: 'external'; id: string; title: string; kind: 'archive' | 'interactive'; sourceUrl: string; openUrl: string; order: number; accessStatus: 'verified' | 'unverified' | 'unavailable'; evidence: string}
  | {type: 'pdf'; id?: string; url: string; label?: string; title?: string; order?: number; sourceUrl?: string; sourcePageUrl?: string; resourcePath?: string; provider?: string; accessStatus?: 'verified' | 'unverified' | 'unavailable'}
  | {
    type: 'video'; id: string; title: string; sourceUrl: string;
    provider: string; embedUrl?: string; posterUrl?: string; order?: number; sourcePageUrl?: string; resourcePath?: string;
    accessStatus: 'verified' | 'unverified' | 'unavailable';
    embedStatus: 'supported' | 'blocked' | 'unverified';
    loginRequired: 'yes' | 'no' | 'unknown';
    checkedAt: string; evidence: string;
  };

export interface StudentWork {
  id: string;
  courseId?: string;
  year?: number;
  level?: string;
  description?: string;
  sequence: number;
  title: string;
  members: string[];
  theme: StudentTheme;
  originalSite: string;
  originalSiteType: string;
  placeId: string | null;
  /** Excel primary location remains placeId; only source-backed additional locations belong here. */
  placeIds?: readonly string[];
  /** Named locations confirmed by the teacher but still lacking a verified navigation point. */
  pendingLocationNames?: readonly string[];
  media?: readonly StudentWorkMedia[];
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
