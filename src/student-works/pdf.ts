/** Only Pinwall's own PDF attachment origin is allowed, never user-provided URLs. */
export function findPinwallPdf(page: string): string | null {
  const candidates = page.match(/https:\/\/oss\.pinwall\.cn\/pdf\/[^\s"'<>]+/g) ?? [];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate.replaceAll('&amp;', '&'));
      if (url.protocol === 'https:' && url.hostname === 'oss.pinwall.cn' &&
          /^\/pdf\/[A-Za-z0-9_-]+\.pdf$/.test(url.pathname) && !url.username && !url.password && !url.port) {
        return url.href;
      }
    } catch { /* Malformed attachment markup falls back to the project page. */ }
  }
  return null;
}
