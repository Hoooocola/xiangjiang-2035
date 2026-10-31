import {resolveWorkCover} from '@/src/student-works/cover-resolver';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!/^pinwall-\d+$/.test(id))return new Response('作品不存在',{status:404});
  let url:string|null=null;
  try{url=await resolveWorkCover(id);}catch{/* Keep the explicit unavailable cover state. */}
  return url?new Response(null,{status:302,headers:{Location:url,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}}):new Response('原站封面暂不可用',{status:503,headers:{'Cache-Control':'no-store'}});
}
