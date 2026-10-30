import legacy from '../places/legacy-proposals.json';
import {RECORDS} from './catalog';
import type {AtlasRecord} from './types';
import {PLACES} from '../experience/config';
/** Existing Proposal records only: StudentWork never becomes a Proposal implicitly. */
const unlocated:AtlasRecord[]=legacy.filter(p=>!p.coordinateVerified).map(p=>({id:p.id,kind:'Proposal',placeId:p.placeIds[0],placeIds:p.placeIds,title:p.title,year:p.year,author:'旧交互原型 · 团队信息未核验',themes:['旧原型恢复'],summary:`从原型保留的方案资料：${p.originalPlace}。地点坐标尚未核验，仅供阅读。`,body:['保留原型中的方案与地点文字关联；缺少可靠坐标时不生成地图标记或空间介入几何。'],dataStatus:'demo',state:'DEMO / 旧原型归档 · 地点待核验',sourceIds:['legacy-prototype'],evidenceIds:[],relatedIds:[],objectIds:[]}));
export const DESIGN_PROPOSALS=[...RECORDS.filter(r=>r.kind==='Proposal'),...unlocated];
export const designRecordById=(id:string)=>RECORDS.find(r=>r.id===id)??unlocated.find(r=>r.id===id);
export function proposalPlaceIds(record:AtlasRecord){return [...new Set(record.placeIds??[record.placeId])].filter(id=>PLACES.some(p=>p.id===id));}
