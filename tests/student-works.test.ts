import {describe, expect, it} from 'vitest';
import {MAP_PLACES} from '@/src/places/registry';
import {SHOWCASE_PLACES, STUDENT_THEMES, STUDENT_WORKS, showcaseStats, worksForTheme, worksForPlace} from '@/src/student-works/catalog';
import {findPinwallPdf} from '@/src/student-works/pdf';

describe('course showcase source and place relationships', () => {
  it('keeps all 24 source rows, author groups and stable project IDs', () => {
    expect(STUDENT_WORKS).toHaveLength(24);
    expect(new Set(STUDENT_WORKS.map(work => work.id)).size).toBe(24);
    for (const work of STUDENT_WORKS) {
      expect(work.source.row).toBe(work.sequence + 4);
      expect(work.source.sha256).toBe('67019f943b93f702fe77032b3656ead6bf3b75fe113a15d68bce99c53945f726');
      expect(work.members.length).toBeGreaterThan(0);
      expect(work.projectUrl).toBe(`https://pinwall.cn/project/${work.id.replace('pinwall-', '')}`);
      expect(STUDENT_THEMES).toContain(work.theme);
    }
  });

  it('resolves every mapped work without duplicating places or changing the baseline registry', () => {
    expect(new Set(SHOWCASE_PLACES.map(place => place.id)).size).toBe(SHOWCASE_PLACES.length);
    for (const work of STUDENT_WORKS.filter(work => work.placeId)) {
      expect(SHOWCASE_PLACES.some(place => place.id === work.placeId)).toBe(true);
    }
    expect(worksForPlace('ezhou')).toHaveLength(3);
    expect(worksForPlace('site-011')).toHaveLength(3);
    expect(MAP_PLACES.some(place => place.id.startsWith('student-'))).toBe(false);
    for (const place of SHOWCASE_PLACES) {
      expect(place.coordinate.every(Number.isFinite)).toBe(true);
    }
  });

  it('computes themes, map locations and pending works from the same filtered set', () => {
    expect(STUDENT_THEMES.map(theme => worksForTheme(theme).length)).toEqual([5, 9, 7, 3]);
    for (const theme of ['all', ...STUDENT_THEMES] as const) {
      const stats = showcaseStats(theme);
      expect(stats.mapped + stats.pending).toBe(stats.total);
      expect(stats.places).toBe(new Set(worksForTheme(theme).flatMap(work => work.placeId ? [work.placeId] : [])).size);
    }
    expect(showcaseStats()).toMatchObject({total: 24, mapped: 16, places: 11, pending: 8});
    expect(worksForPlace('ezhou', '立体交通与网络系统')).toHaveLength(1);
  });

  it('retains ambiguous and conflicting original spreadsheet data', () => {
    const eighteen = STUDENT_WORKS.find(work => work.sequence === 18)!;
    expect(eighteen.originalSite).toBe('大王山');
    expect(eighteen.title).toContain('巴溪洲');
    expect(eighteen.reviewNotes.length).toBeGreaterThan(0);
    const nineteen = STUDENT_WORKS.find(work => work.sequence === 19)!;
    expect(nineteen.originalSite).toBe('渔人码头到裕湘…');
    expect(nineteen.placeId).toBeNull();
    expect(nineteen.reviewNotes).toHaveLength(2);
  });
});

describe('Pinwall expiring PDF attachment resolution', () => {
  it('decodes a current attachment link without persisting signed URLs', () => {
    expect(findPinwallPdf('<a data-pdf="https://oss.pinwall.cn/pdf/AbC123.pdf?Expires=123&amp;Signature=test">PDF</a>'))
      .toBe('https://oss.pinwall.cn/pdf/AbC123.pdf?Expires=123&Signature=test');
    expect(JSON.stringify(STUDENT_WORKS)).not.toMatch(/OSSAccessKeyId|Signature=|Expires=/);
  });
  it('rejects external hosts, malformed paths, and pages without a PDF', () => {
    expect(findPinwallPdf('https://evil.example/pdf/file.pdf')).toBeNull();
    expect(findPinwallPdf('https://oss.pinwall.cn/pdf/../../private.pdf')).toBeNull();
    expect(findPinwallPdf('https://oss.pinwall.cn/pdf/file.pdf.exe')).toBeNull();
    expect(findPinwallPdf('<p>暂无附件</p>')).toBeNull();
  });
});
