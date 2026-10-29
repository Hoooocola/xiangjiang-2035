import {STUDENT_WORKS} from '@/src/student-works/catalog';
import {resolveWorkVideo} from '@/src/student-works/video-resolver';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store', 'Referrer-Policy':'no-referrer'};

export async function GET(_request: Request, {params}: {params: Promise<{id:string;videoId:string}>}) {
  const {id, videoId} = await params;
  const work = STUDENT_WORKS.find(item => item.id === id);
  if (!work || !work.media?.some(item => item.type === 'video' && item.id === videoId)) {
    return new Response('作品视频不存在', {status:404, headers});
  }
  try {
    const destination = await resolveWorkVideo(work, videoId);
    if (destination) return new Response(null, {status:302, headers:{...headers, Location:destination}});
  } catch { /* A usable source link must remain available on network/login/attachment failure. */ }
  // URL comes from the fixed course allowlist, never from query parameters.
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>视频暂时无法打开</title><body style="background:#081d24;color:#e3eef0;font:16px/1.8 system-ui;padding:8vw;max-width:640px"><h1>视频暂时无法打开</h1><p>来源网站可能响应超时、附件已变更或需要登录。请在原作品页面查看视频；地图仍保留在之前的标签页。</p><a style="color:#b395db" href="${work.projectUrl}" rel="noreferrer">打开 Pinwall 原作品页面 ↗</a></body></html>`,
    {status:502, headers:{...headers, 'Content-Type':'text/html; charset=utf-8', 'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'", 'X-Content-Type-Options':'nosniff'}});
}
