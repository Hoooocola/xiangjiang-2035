import {describe,it,expect,vi} from 'vitest';
import {resolveWorkCover} from '@/src/student-works/cover-resolver';
import {STUDENT_WORKS,BASE_STUDENT_WORKS} from '@/src/student-works/catalog';
const json=(url:string,id=62175)=>new Response(JSON.stringify({data:{rows:{artifacts:[{Id:id,profileImage:url}]}}}));
const source='https://oss.pinwall.cn/images/BEaswYkdW5BC8d4wTtAe.png';
describe('public publisher cover URL refresh',()=>{
 it('keeps 24 existing local covers and resolves every new cover through its own route',()=>{
  expect(BASE_STUDENT_WORKS.every(w=>w.coverImage?.startsWith('/student-works/pinwall-')&&w.coverImage.includes('.webp'))).toBe(true);
  const external=STUDENT_WORKS.filter(w=>!BASE_STUDENT_WORKS.includes(w));expect(external).toHaveLength(27);
  for(const w of external)expect(w.coverImage).toBe(`/student-works/${w.id}/cover`);
 });
 it('accepts the matching project image and current public signature without fetching image bytes',async()=>{
  const url=source+'?Expires='+Math.floor(Date.now()/1000+3600)+'&Signature=public-fixture';const request=vi.fn(async(input:RequestInfo|URL)=>{expect(String(input)).toContain('topicId=1642');return json(url);});
  expect(await resolveWorkCover('pinwall-62175',request)).toBe(url);expect(request).toHaveBeenCalledTimes(1);
  expect(String(request.mock.calls[0][0])).toContain('topicId=1642');
 });
 it('rejects mismatched, changed, expired and external images instead of borrowing another cover',async()=>{
  for(const url of ['https://untrusted.example/image.png','https://oss.pinwall.cn/images/another.png',source+'?Expires=1'])expect(await resolveWorkCover('pinwall-62175',async()=>json(url))).toBeNull();
  expect(await resolveWorkCover('pinwall-62175',async()=>json(source,62189))).toBeNull();
  const request=vi.fn();expect(await resolveWorkCover('pinwall-00000',request)).toBeNull();expect(request).not.toHaveBeenCalled();
 });
});
