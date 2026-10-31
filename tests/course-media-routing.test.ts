import {afterEach,describe,it,expect,vi} from 'vitest';
import {GET} from '@/app/student-works/[id]/pdf/route';
import {STUDENT_WORKS} from '@/src/student-works/catalog';
import {videoOpenUrl} from '@/src/student-works/media';
const params=(id:string)=>({params:Promise.resolve({id})});
afterEach(()=>vi.unstubAllGlobals());
describe('audited attachment navigation',()=>{
 it('keeps non-PDF attachments distinct and respects the original archive access restriction',()=>{
  const external=STUDENT_WORKS.flatMap(w=>w.media??[]).filter(m=>m.type==='external');
  expect(external).toHaveLength(3);
  const archive=external.find(m=>m.kind==='archive')!;
  expect(archive.accessStatus).toBe('unavailable');expect(archive.openUrl).toBe('https://pinwall.cn/project/66187');
  for(const item of external.filter(m=>m.kind==='interactive')){expect(item.openUrl).toMatch(/^https:\/\/h5\.pinwall\.cn\//);expect(item.accessStatus).toBe('verified');}
 });
 it('resolves each of a real three-report work by its own registered attachment identity',async()=>{
  const w=STUDENT_WORKS.find(w=>w.id==='pinwall-55734')!;
  const reports=w.media!.filter(m=>m.type==='pdf');expect(reports).toHaveLength(3);
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(reports.map(m=>m.sourceUrl).join(' '))));
  for(const report of reports){const r=await GET(new Request('https://example.test'+report.url),params(w.id));expect(r.status).toBe(302);expect(r.headers.get('location')).toBe(report.sourceUrl);}
 });
 it('retains an original-page fallback for retired, unavailable and cross-work report identities',async()=>{
  const request=vi.fn();vi.stubGlobal('fetch',request);
  for(const [id,attachment]of [['pinwall-66190','csZzG22RP2wasbnQXSDx'],['pinwall-66198',null],['pinwall-55734','another-project-file']]){
   const r=await GET(new Request('https://example.test/student-works/'+id+'/pdf'+(attachment?'?attachment='+attachment:'')),params(id!));
   expect(r.status).toBe(302);expect(r.headers.get('location')).toBe('https://pinwall.cn/project/'+id!.replace('pinwall-',''));
  }
  expect(request).not.toHaveBeenCalled();
 });
 it('gives every verified video a distinct on-demand route rather than one shared page link',()=>{
  const videos=STUDENT_WORKS.flatMap(work=>(work.media??[]).filter(m=>m.type==='video').map(video=>video.type==='video'?videoOpenUrl(work,video):''));
  expect(videos).toHaveLength(17);expect(new Set(videos).size).toBe(17);for(const url of videos)expect(url).toMatch(/^\/student-works\/pinwall-\d+\/video\/[A-Za-z0-9_-]+$/);
 });
});
