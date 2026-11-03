import {analyzeYanghu} from '../../../src/spatial-data/analysis';
import {validBounds} from '../../../src/spatial-data/geometry';
import {getLayer,listLayers,loadLayer,objectDetails,regionLayers,studyArea} from '../../../src/spatial-data/service';
export const runtime='nodejs';
export async function GET(request:Request){
 const q=new URL(request.url).searchParams,action=q.get('action')??'layers';
 try{
  const raw=q.get('bbox'),bbox=raw?raw.split(',').map(Number):undefined;
  if(bbox&&(!validBounds(bbox)||bbox[2]-bbox[0]>.5||bbox[3]-bbox[1]>.5))throw new Error('bbox must be a valid WGS84 window <=0.5 degrees');
  const id=q.get('layerId')??'',ids=q.get('layers')?.split(',').filter(Boolean);
  let result:unknown;
  if(action==='layers')result=listLayers();
  else if(action==='study-area')result=await studyArea();
  else if(action==='layer')result={layer:getLayer(id),data:await loadLayer(id,validBounds(bbox)?bbox:undefined)};
  else if(action==='object')result={layer:getLayer(id),object:await objectDetails(id,q.get('id')??'')};
  else if(action==='region'){if(!validBounds(bbox)||!ids?.length||ids.length>5)throw new Error('region requires bbox and 1–5 layers');result=await regionLayers(ids,bbox);}
  else if(action==='analysis'){if(q.get('studyAreaId')&&q.get('studyAreaId')!=='yanghu')throw new Error('Only the audited yanghu pilot is available');result=await analyzeYanghu(ids,q.has('bufferMeters')?Number(q.get('bufferMeters')):100);}
  else throw new Error('Unknown action');
  return Response.json(result,{headers:{'Cache-Control':'public, max-age=300'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid spatial query'},{status:400});}
}
