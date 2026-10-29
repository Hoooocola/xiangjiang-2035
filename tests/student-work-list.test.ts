import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {StudentWorkExhibition} from '@/app/experience/student-work-showcase';
import {STUDENT_WORKS, worksForPlace} from '@/src/student-works/catalog';

describe('place work list', () => {
  it.each([1,2,3,5,10])('renders all %i works with unchanged report and cover identity', count => {
    const works = STUDENT_WORKS.slice(0, count);
    const html = renderToStaticMarkup(createElement(StudentWorkExhibition, {works, placeName:'独立测试', ready:true, onClose:()=>{}}));
    expect(html.match(/data-work-id=/g)).toHaveLength(count);
    for (const work of works) {
      expect(html).toContain(`data-work-id="${work.id}"`);
      expect(html).toContain(`href="${work.pdfUrl ?? work.pinwallUrl}"`);
      expect(html).toContain(work.members.join('、'));
      expect(html).toContain(work.theme);
      expect(html).toContain(work.coverImage!);
    }
    expect(html).not.toContain('下一件作品');
    expect(html).not.toContain('上一件作品');
    expect(html).not.toContain('NEXT PROJECT');
  });
  it('shows Orange Isle works including source-backed multi-location projects in one list', () => {
    const works = worksForPlace('juzizhou');
    const html = renderToStaticMarkup(createElement(StudentWorkExhibition, {works, placeName:'橘子洲', ready:true, onClose:()=>{}}));
    expect(works).toHaveLength(3);
    expect(html).toContain('橘子洲全部作品列表');
    expect(html).toContain('江岸接力——橘洲文脉共编系统');
    expect(html).toContain('栖亭·共栖之江');
    expect(html).toContain('湘江多元水岸交通系统设计');
    expect(html).toContain('03');
  });
});
