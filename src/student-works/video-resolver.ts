import type {StudentWork} from './types';
import {findPinwallVideos} from './video';

/** No video bytes are proxied or buffered; resolve only on an explicit navigation. */
export async function resolveWorkVideo(work: StudentWork, videoId: string, request: typeof fetch = fetch): Promise<string | null> {
  if (!work.media?.some(item => item.type === 'video' && item.id === videoId)) return null;
  const page = await request(work.projectUrl, {cache:'no-store', redirect:'error', signal:AbortSignal.timeout(8000)});
  if (!page.ok || !page.body) return null;
  const reader = page.body.getReader();
  const decoder = new TextDecoder();
  let text = '', bytes = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024 * 1024) return null;
      text += decoder.decode(value, {stream:true});
    }
  } finally { await reader.cancel(); }
  const video = findPinwallVideos(text).find(item => item.id === videoId);
  if (!video) return null;
  // OSS signatures include the HTTP method: a GET-signed attachment can reject HEAD.
  // Probe a single byte and immediately cancel, including when an origin ignores Range.
  const response = await request(video.url, {headers:{Range:'bytes=0-0'}, cache:'no-store', redirect:'error', signal:AbortSignal.timeout(5000)});
  await response.body?.cancel();
  return response.ok && response.headers.get('content-type')?.startsWith('video/') ? video.url : null;
}
