/** Only actual Pinwall attachment URLs qualify; player icons are not evidence. */
export function findPinwallVideos(page: string): {id: string; url: string; resourcePath: string}[] {
  const found = new Map<string, {id: string; url: string; resourcePath: string}>();
  for (const raw of page.match(/https:\/\/oss\.pinwall\.cn\/video\/[^\s"'<>]+/g) ?? []) {
    try {
      const url = new URL(raw.replaceAll('&amp;', '&'));
      const match = url.pathname.match(/^\/video\/([A-Za-z0-9_-]{1,128})\.(mp4|webm|m4v|mov)$/);
      if (url.protocol === 'https:' && url.hostname === 'oss.pinwall.cn' && match && !url.username && !url.password && !url.port) {
        found.set(url.pathname, {id: match[1], url: url.href, resourcePath: url.pathname});
      }
    } catch { /* Ignore malformed markup; never infer iframe URLs. */ }
  }
  return [...found.values()];
}
