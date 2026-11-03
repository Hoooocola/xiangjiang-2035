import {describe, expect, it} from 'vitest';
import {MAP_PLACES} from '@/src/places/registry';
import {SHOWCASE_PLACES, STUDENT_THEMES, BASE_STUDENT_WORKS as STUDENT_WORKS, showcaseStats, worksForTheme, worksForPlace} from '@/src/student-works/catalog';
import {findPinwallPdf} from '@/src/student-works/pdf';
import {workPlaceIds} from '@/src/student-works/relationships';

describe('course showcase source and place relationships', () => {
  it('keeps all 24 source rows, author groups and stable project IDs', () => {
    expect(STUDENT_WORKS).toHaveLength(24);
    expect(new Set(STUDENT_WORKS.map(work => work.id)).size).toBe(24);
    for (const work of STUDENT_WORKS) {
      expect(work.source.row).toBe(work.sequence + 4);
      expect(work.source.sha256).toBe('7e8be5b13c2ccfb2610da156d0c8cdbf7936d6d0e1922c0c2d4bb93bc1d97af8');
      expect(work.members.length).toBeGreaterThan(0);
      expect(work.projectUrl).toBe(`https://pinwall.cn/project/${work.id.replace('pinwall-', '')}`);
      expect(STUDENT_THEMES).toContain(work.theme);
    }
  });

  it('resolves every mapped work without duplicating places or changing the baseline registry', () => {
    expect(new Set(SHOWCASE_PLACES.map(place => place.id)).size).toBe(SHOWCASE_PLACES.length);
    for (const work of STUDENT_WORKS.filter(work => work.placeId)) {
      for (const id of workPlaceIds(work)) expect(SHOWCASE_PLACES.some(place => place.id === id)).toBe(true);
    }
    expect(worksForPlace('ezhou')).toHaveLength(4);
    expect(worksForPlace('site-011')).toHaveLength(5);
    expect(worksForPlace('baxi')).toHaveLength(2);
    expect(MAP_PLACES.some(place => place.id.startsWith('student-'))).toBe(false);
    for (const place of SHOWCASE_PLACES) {
      expect(place.coordinate.every(Number.isFinite)).toBe(true);
    }
  });

  it('computes themes, map locations and pending works from the same filtered set', () => {
    expect(STUDENT_THEMES.map(theme => worksForTheme(theme).length)).toEqual([5, 17, 10, 7]);
    for (const theme of ['all', ...STUDENT_THEMES] as const) {
      const stats = showcaseStats(theme);
      expect(stats.mapped + stats.pending).toBe(stats.total);
      expect(stats.places).toBe(new Set(worksForTheme(theme).flatMap(workPlaceIds)).size);
    }
    expect(showcaseStats()).toMatchObject({total: 39, mapped: 28, places: 14, pending: 11, partiallyMapped:0});
    expect(worksForPlace('ezhou', '立体交通与网络系统')).toHaveLength(2);
  });

  it('applies teacher-revised sites and source-backed navigation for both endpoints', () => {
    const eighteen = STUDENT_WORKS.find(work => work.sequence === 18)!;
    expect(eighteen.originalSite).toBe('巴溪洲');
    expect(eighteen.title).toContain('巴溪洲');
    expect(eighteen.placeId).toBe('baxi');
    expect(eighteen.reviewNotes).toEqual([]);
    const nineteen = STUDENT_WORKS.find(work => work.sequence === 19)!;
    expect(nineteen.originalSite).toBe('渔人码头和裕湘纱厂');
    expect(nineteen.placeId).toBe('site-011');
    expect(workPlaceIds(nineteen)).toEqual(['site-011','student-yuxiang']);
    expect(nineteen.pendingLocationNames).toBeUndefined();
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
