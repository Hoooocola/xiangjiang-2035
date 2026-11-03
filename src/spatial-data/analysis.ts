import {createHash} from 'node:crypto';
import {contains,distanceToLine,geometryBounds} from './geometry';
import {getLayer,loadLayer,studyArea} from './service';
import type {AnalysisResult,Collection,Position,Raster} from './types';
// Build tools may normalize equivalent floating-point literals. Canonicalize before hashing.
export function canonicalEvidence(value:unknown):string{if(typeof value==='number')return JSON.stringify(Math.round(value*1e9)/1e9);if(Array.isArray(value))return '['+value.map(canonicalEvidence).join(',')+']';if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonicalEvidence(v)).join(',')+'}';return JSON.stringify(value);}
export const DEFAULT_INPUTS=['ecology.worldcover.2021','geography.roads.existing','ecology.gbif.snapshot'];
export async function analyzeYanghu(inputLayerIds=DEFAULT_INPUTS,bufferMeters=100):Promise<AnalysisResult>{
 const ids=[...new Set(inputLayerIds)].sort();if(ids.length<1||ids.length>5||!ids.includes('ecology.worldcover.2021'))throw new Error('Analysis requires WorldCover and at most five known inputs');ids.forEach(getLayer);
 if(!Number.isFinite(bufferMeters)||bufferMeters<10||bufferMeters>1000)throw new Error('bufferMeters must be 10–1000');
 const area=await studyArea();if(area.geometry.type!=='Polygon')throw new Error('Study polygon missing');const rings=area.geometry.coordinates,bounds=geometryBounds(area.geometry);
 const raster=await loadLayer('ecology.worldcover.2021',bounds) as Raster|null;if(!raster)throw new Error('No raster coverage');
 const roadData=ids.includes('geography.roads.existing')?await loadLayer('geography.roads.existing',[bounds[0]-.011,bounds[1]-.01,bounds[2]+.011,bounds[3]+.01]) as Collection:{features:[]};
 const roads=roadData.features.filter(f=>f.geometry.type==='LineString').map(f=>f.geometry.coordinates as Position[]);
 const indexedRoads=roads.map(line=>({line,bounds:geometryBounds({type:'LineString',coordinates:line})}));
 const lonPad=bufferMeters/(111320*Math.cos(bounds[3]*Math.PI/180)),latPad=bufferMeters/111320;
 const counts:Record<string,number>={},nearRoadCounts:Record<string,number>={};let inside=0,nodata=0,nearRoad=0;
 const [w,s,e,n]=raster.bounds,dx=(e-w)/raster.width,dy=(n-s)/raster.height;
 for(let row=0;row<raster.height;row++)for(let col=0;col<raster.width;col++){
  const p:Position=[w+(col+.5)*dx,n-(row+.5)*dy];if(!contains(p,rings))continue;inside++;const code=raster.values[row*raster.width+col];if(code===raster.nodata){nodata++;continue;}counts[code]=(counts[code]??0)+1;
  if(indexedRoads.some(({line,bounds:b})=>p[0]>=b[0]-lonPad&&p[0]<=b[2]+lonPad&&p[1]>=b[1]-latPad&&p[1]<=b[3]+latPad&&distanceToLine(p,line)<=bufferMeters)){nearRoad++;nearRoadCounts[code]=(nearRoadCounts[code]??0)+1;}
 }
 const birds=ids.includes('ecology.gbif.snapshot')?(await loadLayer('ecology.gbif.snapshot',bounds) as Collection).features.filter(f=>f.geometry.type==='Point'&&contains(f.geometry.coordinates,rings)):[];
 const uniqueObservationCoordinates=new Set(birds.map(f=>JSON.stringify(f.geometry.coordinates))).size;
 const proximity=birds.map(f=>{const distance=roads.length?Math.min(...roads.map(l=>distanceToLine(f.geometry.coordinates as Position,l))):null;const u=Number(f.properties.coordinateUncertaintyInMeters);return {id:f.id,distanceMeters:distance===null?null:Math.round(distance),uncertaintyMeters:u,withinBuffer:distance===null?'not-computed':distance+u<=bufferMeters?'supported':distance-u>bufferMeters?'outside':'uncertain'};});
 const params={bufferMeters,pixelInclusion:'centre-in-polygon, holes excluded',distanceMethod:'local equirectangular point-to-segment metres',scope:'existing OSM park polygon',inputLayerIds:ids};
 const sources=[...ids.map(id=>getLayer(id).source),getLayer('geography.yanghu.study-area').source];
 const analysisId='yanghu-'+createHash('sha256').update(canonicalEvidence({params,sources,counts,nearRoadCounts,proximity})).digest('hex').slice(0,16);
 return {analysisId,studyAreaId:'yanghu',inputLayerIds:ids,sourceReferences:sources,analysisMethod:'Native WorldCover pixel-centre polygon mask + road distance buffer overlap + uncertainty-aware observation proximity',parameters:params,spatialObservation:[`洋湖OSM公园范围包含${inside}个网格中心，其中${nodata}个为无数据。`,`道路查询窗口含${roads.length}条候选线段；${nearRoad}个有效分类像元中心落在道路${bufferMeters}m邻近范围。`,`当前受限GBIF样本中${birds.length}条落入研究面（${uniqueObservationCoordinates}个唯一坐标）；不能外推完整物种分布。`],candidateResearchQuestion:'道路邻近的不同土地覆盖地块如何被使用？应在何处开展路径可达性、生态边界与活动方式的现场核验？',limitations:['空间邻近不证明活动破坏生态或其他因果关系','2021土地覆盖、2026下载道路与跨年生物记录不可当同年调查','OSM公园不是法定湿地范围；网格中心近似带来边界像元误差','道路不是完整步行网络，重复平行几何不作为独立道路数量解释','GBIF是前100条受限样本；未知精度已排除，距离结合误差判读；多条同坐标记录不代表独立地点','水质断面坐标未核验，不能声称覆盖洋湖','未提供通用跨年变化结论；可比方法与时期须独立审核'],evidenceReferences:['/data/spatial/worldcover-2021-core.tif','/data/spatial/yanghu-study-area.geojson',...proximity.map(x=>`/api/spatial-data?action=object&layerId=ecology.gbif.snapshot&id=${x.id}`)],verificationStatus:'requires-field-verification',metrics:{uniqueObservationCoordinates,insidePixelCount:inside,nodataPixelCount:nodata,classPixelCounts:counts,approximatePixelAreaM2:dx*dy*111320**2*Math.cos((s+n)/2*Math.PI/180),roadBufferPixelCount:nearRoad,roadBufferClassCounts:nearRoadCounts,observationProximity:proximity,dataGaps:['unverified-water-station-coordinates','incomplete-walking-network','field-validation','complete-biodiversity-inventory']}};
}
