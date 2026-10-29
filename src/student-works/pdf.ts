/** Only Pinwall's own PDF attachment origin is allowed, never user-provided URLs. */
export function findPinwallPdf(page: string): string | null {
  return findPinwallPdfs(page)[0]?.url ?? null;
}

/** Preserve multiple reports for the same work without mixing attachments between projects. */
export function findPinwallPdfs(page: string): {id:string;url:string}[] {
  const found = new Map<string, {id:string;url:string}>();
  const candidates = page.match(/https:\/\/oss\.pinwall\.cn\/pdf\/[^\s"'<>]+/g) ?? [];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate.replaceAll('&amp;', '&'));
      if (url.protocol === 'https:' && url.hostname === 'oss.pinwall.cn' &&
          /^\/pdf\/[A-Za-z0-9_-]+\.pdf$/.test(url.pathname) && !url.username && !url.password && !url.port) {
        found.set(url.pathname, {id:url.pathname.slice(5, -4), url:url.href});
      }
    } catch { /* Malformed attachment markup falls back to the project page. */ }
  }
  return [...found.values()];
}
