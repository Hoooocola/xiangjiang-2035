import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import assets from '@/src/student-works/assets.json';
import {BASE_STUDENT_WORKS as STUDENT_WORKS, visibleStudentWorks, showcaseStats} from '@/src/student-works/catalog';
import {adjacentWorkId, selectionGroup} from '@/src/student-works/selection';
import {workPlaceIds} from '@/src/student-works/relationships';

describe('official course cover identity', () => {
  it('uses the folder project cover matched by ID, title and the complete author group', () => {
    expect(STUDENT_WORKS).toHaveLength(24);
    for (const work of STUDENT_WORKS) {
      const asset = assets[work.id as keyof typeof assets] as typeof assets['pinwall-66171'];
      expect(work.coverStatus).toBe('verified');
      expect(asset.matchEvidence.projectId).toBe(work.id.replace('pinwall-', ''));
      expect(asset.matchEvidence.titleMatch).toBe(true);
      expect(asset.matchEvidence.membersMatch).toBe(true);
      expect(asset.matchEvidence.publisherMatch).toBe(true);
      expect(asset.matchEvidence.pinwallMembers.slice().sort()).toEqual(work.members.slice().sort());
      expect(asset.matchEvidence.originalSite).toBe(work.originalSite);
      expect(new URL(work.coverSource!).pathname).toMatch(/^\/images\/[^/]+\.(png|jpg)$/);
      expect(work.pinwallUrl).toBe(work.projectUrl);
      expect(work.pdfUrl).toMatch(/^\/student-works\/pinwall-\d+\/pdf$/);
    }
  });

  it('keeps native square cover assets traceable and separate from report pages', () => {
    for (const work of STUDENT_WORKS) {
      const asset = assets[work.id as keyof typeof assets] as typeof assets['pinwall-66171'];
      expect(asset.matchEvidence.originalSize[0]).toBe(asset.matchEvidence.originalSize[1]);
      const data = readFileSync(`public${new URL(work.coverImage!, 'http://localhost').pathname}`);
      expect(data.subarray(8, 12).toString()).toBe('WEBP');
      expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
    }
    expect(showcaseStats().covers).toBe(39);
  });
});

describe('editorial selection and retained filtering', () => {
  it('searches actual project authors and keeps filtered map counts consistent', () => {
    const result = visibleStudentWorks('all', '王子轩');
    expect(result.map(work => work.id)).toEqual(['pinwall-66172']);
    expect(showcaseStats('all', '王子轩')).toMatchObject({total: 1, mapped: 1, places: 1});
    expect(visibleStudentWorks('立体交通与网络系统', '王子轩')).toHaveLength(0);
  });

  it('switches within the selected place and never includes neighboring places', () => {
    const works = selectionGroup('pinwall-66172', 'all', '');
    expect(works.map(work => work.id)).toEqual(['pinwall-66171','pinwall-66172','pinwall-66179','pinwall-62175','pinwall-62189','pinwall-66200']);
    expect(adjacentWorkId(works, 'pinwall-66172', 1)).toBe('pinwall-66179');
    expect(adjacentWorkId(works, 'pinwall-66200', 1)).toBe('pinwall-66171');
    expect(adjacentWorkId(works, 'pinwall-66172', -1)).toBe('pinwall-66171');
    expect(works.every(work => workPlaceIds(work).includes('juzizhou'))).toBe(true);
  });

  it('keeps unlocated original sites separate and does not fabricate a map place', () => {
    const works = selectionGroup('pinwall-66181', 'all', '');
    expect(works).toHaveLength(4);
    expect(works.every(work => work.placeId === null && work.originalSite === '文津码头')).toBe(true);
    expect(selectionGroup('pinwall-66187', 'all', '')).toHaveLength(5);
    expect(selectionGroup('pinwall-66172', '立体交通与网络系统', '')).toHaveLength(0);
    expect(selectionGroup(null, 'all', '')).toHaveLength(0);
  });
});
