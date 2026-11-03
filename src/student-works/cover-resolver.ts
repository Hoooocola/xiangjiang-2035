import assets from './assets.json';
type CoverAsset={coverImage?:string;coverSource?:string;matchEvidence?:{folderUrl?:string}};
const catalog=assets as Record<string,CoverAsset>;

/** Resolve the public publisher's current URL; never buffer, copy or proxy image bytes. */
export async function resolveWorkCover(id:string,request:typeof fetch=fetch):Promise<string|null>{
  const asset=catalog[id];
  if(!asset?.coverSource||!asset.coverImage?.startsWith('https://'))return null;
  const folder=asset.matchEvidence?.folderUrl?.match(/^https:\/\/pinwall\.cn\/workFolder\/(\d+)$/)?.[1];
  if(!folder)return null;
  const expected=new URL(asset.coverSource);
  if(expected.origin!=='https://oss.pinwall.cn'||!expected.pathname.startsWith('/images/'))return null;
  const response=await request(`https://pinwall.cn/website/topics/getTopicAndArtifactById?limit=1000&offset=0&topicId=${folder}&score=0`,{next:{revalidate:120},redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok||!response.body)return null;
  const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024)return null;text+=decoder.decode(value,{stream:true});}}
  finally{await reader.cancel();}
  const data=JSON.parse(text) as {data?:{rows?:{artifacts?:{Id?:number|string;profileImage?:string}[]}}};
  const row=data.data?.rows?.artifacts?.find(item=>String(item.Id)===id.replace('pinwall-',''));
  if(!row?.profileImage)return null;
  const url=new URL(row.profileImage);
  // A changed cover must be reviewed rather than silently substituting another image.
  if(url.origin!==expected.origin||url.pathname!==expected.pathname||url.username||url.password)return null;
  const expiry=Number(url.searchParams.get('Expires'));
  if(url.searchParams.has('Expires')&&(!Number.isFinite(expiry)||expiry*1000<Date.now()+5000))return null;
  return url.href;
}
