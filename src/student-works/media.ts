import type {StudentWork, StudentWorkMedia} from './types';
export type WorkVideo = Extract<StudentWorkMedia, {type:'video'}>;

export function videosForWork(work: StudentWork): WorkVideo[] {
  return (work.media ?? []).filter((item): item is WorkVideo => {
    if (item.type !== 'video') return false;
    try {
      const url = new URL(item.sourceUrl);
      return url.protocol === 'https:' && !url.username && !url.password && !url.port;
    } catch { return false; }
  });
}

/** A distinct on-demand route per attachment; signatures are never stored in the catalog. */
export function videoOpenUrl(work: StudentWork, video: WorkVideo): string {
  return videosForWork(work).some(item=>item.id===video.id) && video.accessStatus !== 'unavailable'
    ? `/student-works/${work.id}/video/${encodeURIComponent(video.id)}` : work.pinwallUrl;
}
