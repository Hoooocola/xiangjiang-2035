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

/** Default to the original page: public source navigation survives server-side resolver timeouts. */
export function videoOpenUrl(work: StudentWork, video: WorkVideo): string {
  return videosForWork(work).some(item=>item.id===video.id) ? video.sourceUrl : work.pinwallUrl;
}
