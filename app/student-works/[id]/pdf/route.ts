import {STUDENT_WORKS} from '@/src/student-works/catalog';
import {findPinwallPdf, findPinwallPdfs} from '@/src/student-works/pdf';

export const dynamic = 'force-dynamic';
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const work = STUDENT_WORKS.find(item => item.id === id);
  if (!work) return new Response('作品不存在', {status: 404});
  let destination = work.projectUrl;
  const attachment = new URL(request.url).searchParams.get('attachment');
  try {
    const response = await fetch(work.projectUrl, {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    // Cap the upstream page before parsing; no authenticated proxy or PDF storage.
    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let page = '', size = 0;
      try {
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 1024 * 1024) break;
          page += decoder.decode(value, {stream: true});
        }
        if (size <= 1024 * 1024) destination = (attachment ? findPinwallPdfs(page).find(pdf => pdf.id === attachment)?.url : findPinwallPdf(page)) ?? destination;
      } finally { await reader.cancel(); }
    }
  } catch { /* Upstream outage or no attachment: retain the original work page. */ }
  return new Response(null, {status: 302, headers: {
    Location: destination, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer',
  }});
}
