import {afterEach, describe, expect, it, vi} from 'vitest';
import {GET} from '@/app/student-works/[id]/pdf/route';

afterEach(() => vi.unstubAllGlobals());
const request = new Request('http://localhost/student-works/pinwall-66171/pdf');

describe('course work PDF endpoint', () => {
  it('returns the current upstream PDF and forbids caching expiring links', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('<a href="https://oss.pinwall.cn/pdf/work.pdf?Expires=123&amp;Signature=test">PDF</a>'));
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(request, {params: Promise.resolve({id: 'pinwall-66171'})});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://oss.pinwall.cn/pdf/work.pdf?Expires=123&Signature=test');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(fetchMock.mock.calls[0][0]).toBe('https://pinwall.cn/project/66171');
  });

  it('falls back to the exact source project page on upstream failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    const response = await GET(request, {params: Promise.resolve({id: 'pinwall-66171'})});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://pinwall.cn/project/66171');
  });

  it('does not turn unknown IDs into an arbitrary network request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await GET(request, {params: Promise.resolve({id: 'https://evil.example'})})).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens the source project when an upstream page has no supported attachment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<p>No PDF</p>')));
    const response = await GET(request, {params: Promise.resolve({id: 'pinwall-66171'})});
    expect(response.headers.get('Location')).toBe('https://pinwall.cn/project/66171');
  });
});
