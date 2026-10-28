import {RECORDS} from './catalog';
import {MAP_OBJECTS} from './objects';
import type {AtlasRecord,MapObject} from './types';

/** Reverse relations reuse a spatial feature; they never duplicate Place markers. */
export function recordsForFeature(id:string):AtlasRecord[]{
 const feature=MAP_OBJECTS.find(o=>o.id===id);
 return RECORDS.filter(r=>r.objectIds.includes(id)||r.id===feature?.recordId);
}
export function placesForFeature(feature:MapObject){return [...new Set(feature.placeIds??[feature.placeId])];}
export function featuresForRecord(record:AtlasRecord){return MAP_OBJECTS.filter(f=>record.objectIds.includes(f.id));}
export function validateInformationFeature(feature:MapObject):string[]{
 const errors:string[]=[];
 if(!feature.sourceIds.length)errors.push('缺少来源');
 if(!feature.precision)errors.push('缺少空间精度说明');
 if(feature.surface==='model'&&!feature.sourceFeatureIds?.length)errors.push('模型对象缺少来源绑定');
 if(feature.metric&&(!Number.isFinite(feature.metric.value)||!feature.metric.unit||!feature.metric.scope||!feature.year))errors.push('指标缺少数值、单位、统计范围或时间');
 const rings=feature.geometry.polygons??(feature.geometry.type==='Polygon'?[[feature.geometry.coordinates,...feature.geometry.holes??[]]]:[]);
 for(const polygon of rings)for(const ring of polygon){if(ring.length<4||ring[0][0]!==ring.at(-1)![0]||ring[0][1]!==ring.at(-1)![1])errors.push('区域边界未闭合');}
 const coords=[feature.anchor,...feature.geometry.coordinates,...(feature.geometry.paths??[]).flat(),...rings.flat(2)];
 if(coords.some(c=>c.length!==2||!c.every(Number.isFinite)||Math.abs(c[0])>180||Math.abs(c[1])>90))errors.push('无效 WGS84 坐标');
 return errors;
}
