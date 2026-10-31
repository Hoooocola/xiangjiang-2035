import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {STUDENT_WORKS, showcaseStats, worksForPlace} from '@/src/student-works/catalog';
import {workPlaceIds, preferredWorkPlace} from '@/src/student-works/relationships';
import {selectionGroup} from '@/src/student-works/selection';
import {findPinwallVideos} from '@/src/student-works/video';
import {findPinwallPdfs} from '@/src/student-works/pdf';
import {resolveWorkVideo} from '@/src/student-works/video-resolver';
import {StudentWorkExhibition} from '@/app/experience/student-work-showcase';
import {StudentWorkMediaLinks} from '@/app/experience/student-work-media';
import type {StudentWork, StudentWorkMedia} from '@/src/student-works/types';

const video: Extract<StudentWorkMedia, {type:'video'}> = {type:'video', id:'demoMovie', title:'独立测试视频',
  sourceUrl:'https://pinwall.cn/project/66171', provider:'Pinwall / OSS', accessStatus:'verified', embedStatus:'unverified',
  loginRequired:'no', checkedAt:'2026-10-30', evidence:'独立单元测试 fixture，非正式媒体记录'};
const fixture: StudentWork = {...STUDENT_WORKS[0], media:[video]};

describe('source-backed multi-location course selection', () => {
  it('keeps Excel primary location and includes the author-described additional hubs', () => {
    expect(STUDENT_WORKS[0].placeId).toBe('tongguan');
    expect(STUDENT_WORKS[0].originalSite).toBe('铜官窑');
    expect(workPlaceIds(STUDENT_WORKS[0])).toEqual(['tongguan', 'juzizhou', 'ezhou']);
    expect(worksForPlace('juzizhou').map(w => w.id)).toContain(STUDENT_WORKS[0].id);
    expect(worksForPlace('ezhou')).toHaveLength(4);
    expect(showcaseStats()).toMatchObject({total:24,mapped:20,pending:4,places:13,partiallyMapped:0});
    expect(worksForPlace('student-yuxiang')).toHaveLength(2);
    expect(worksForPlace('site-025')).toHaveLength(1);
  });
  it('uses the selected marker context instead of jumping back to the first work primary site', () => {
    expect(preferredWorkPlace(STUDENT_WORKS[0],'juzizhou')).toBe('juzizhou');
    expect(preferredWorkPlace(STUDENT_WORKS[0],'ezhou')).toBe('ezhou');
    expect(preferredWorkPlace(STUDENT_WORKS[0],'not-related')).toBe('tongguan');
    expect(selectionGroup(STUDENT_WORKS[0].id,'all','','juzizhou').map(w=>w.id)).toEqual(worksForPlace('juzizhou').map(w=>w.id));
    expect(selectionGroup(STUDENT_WORKS[0].id,'all','','ezhou')).toHaveLength(4);
    expect(selectionGroup(STUDENT_WORKS[0].id,'all','','tongguan')).toHaveLength(1);
    expect(workPlaceIds({...fixture,placeId:'tongguan',placeIds:['tongguan','tongguan']})).toEqual(['tongguan']);
  });
});

describe('video attachment evidence and on-demand links', () => {
  it('deduplicates real video attachments, decodes fresh signatures and rejects icons/unsafe URLs', () => {
    const url='https://oss.pinwall.cn/video/demoMovie.mp4?Expires=1&amp;Signature=current';
    expect(findPinwallVideos(`<button @click="downAttach('${url}')">播放</button><img data-video="${url}">`))
      .toEqual([{id:'demoMovie',resourcePath:'/video/demoMovie.mp4',url:url.replaceAll('&amp;','&')}]);
    for (const page of ['<button>播放视频</button>','https://evil.example/video/clip.mp4','https://oss.pinwall.cn/video/../private.mp4','https://oss.pinwall.cn/video/clip.mp4.exe']) {
      expect(findPinwallVideos(page)).toEqual([]);
    }
  });
  it('keeps two reports of one work selectable without duplicating repeated attachment markup', () => {
    expect(findPinwallPdfs('https://oss.pinwall.cn/pdf/first.pdf?Signature=one https://oss.pinwall.cn/pdf/first.pdf?Signature=two https://oss.pinwall.cn/pdf/second.pdf')
      .map(pdf=>pdf.id)).toEqual(['first','second']);
    const actual=STUDENT_WORKS.find(work=>work.id==='pinwall-66187')!;
    expect(actual.media?.filter(item=>item.type==='pdf')).toHaveLength(2);
    const html=renderToStaticMarkup(createElement(StudentWorkExhibition,{works:[actual],placeName:'渔人码头',ready:true,onClose:()=>{}}));
    expect(html).toContain('查看 PDF（2）');
    expect(html).not.toContain('另有地点未绑定');
    for(const pdf of actual.media!.filter(item=>item.type==='pdf'))expect(html).toContain(pdf.url);
  });
  it('renders no invalid entry for works without videos and no players/preloads even for multiple videos', () => {
    expect(renderToStaticMarkup(createElement(StudentWorkMediaLinks,{work:{...fixture,media:[]}}))).toBe('');
    const work={...fixture,media:[video,{...video,id:'secondMovie',title:'第二段'}]};
    const html=renderToStaticMarkup(createElement(StudentWorkExhibition,{works:[work],placeName:'独立测试',ready:true,onClose:()=>{}}));
    expect(html).toContain('观看视频（2）');
    expect(html).toContain('href="https://pinwall.cn/project/66171"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toMatch(/<video|<iframe|<source|as="video"|autoplay|Expires=/i);
    expect(renderToStaticMarkup(createElement(StudentWorkMediaLinks,{work:{...fixture,media:[{...video,sourceUrl:'javascript:alert(1)'}]}}))).toBe('');
  });
  it('resolves only registered IDs and requests only a one-byte Range, never a full video', async () => {
    const request=vi.fn().mockResolvedValueOnce(new Response('https://oss.pinwall.cn/video/demoMovie.mp4?Signature=fresh'))
      .mockResolvedValueOnce(new Response(null,{headers:{'content-type':'video/mp4'}}));
    expect(await resolveWorkVideo(fixture,'unknown',request)).toBeNull();
    expect(request).not.toHaveBeenCalled();
    expect(await resolveWorkVideo(fixture,'demoMovie',request)).toContain('Signature=fresh');
    expect(request.mock.calls[1][1]).toMatchObject({headers:{Range:'bytes=0-0'},redirect:'error',cache:'no-store'});
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('returns a source fallback for missing attachments, oversized pages and non-video/login responses', async () => {
    expect(await resolveWorkVideo(fixture,'demoMovie',vi.fn().mockResolvedValue(new Response('暂无附件')))).toBeNull();
    const large=vi.fn().mockResolvedValue(new Response('x'.repeat(1024*1024+1)));
    expect(await resolveWorkVideo(fixture,'demoMovie',large)).toBeNull();
    expect(large).toHaveBeenCalledTimes(1);
    const login=vi.fn().mockResolvedValueOnce(new Response('https://oss.pinwall.cn/video/demoMovie.mp4'))
      .mockResolvedValueOnce(new Response(null,{headers:{'content-type':'text/html'}}));
    expect(await resolveWorkVideo(fixture,'demoMovie',login)).toBeNull();
  });
});
