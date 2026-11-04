/** Tab-local DEMO results, separate from actual field records and the database. */
export interface DemoRecord {
 site:'ezhou'|'quarry';status:'DEMO ANALYSIS';computedAt:string;
 connected?:number;unconnected?:number;threshold?:number;overlapMeters?:number;
}
export type DemoRecords=Partial<Record<DemoRecord['site'],DemoRecord>>;
export const RECORD_KEY='xiangjiang-v4-demo-analysis';
export function parseRecords(raw:string|null):DemoRecords{
 try{const value=JSON.parse(raw??'{}'),result:DemoRecords={};if(!value||typeof value!=='object')return result;
 for(const site of ['ezhou','quarry'] as const){const r=value[site];if(!r||r.site!==site||r.status!=='DEMO ANALYSIS'||typeof r.computedAt!=='string')continue;
 if(site==='ezhou'&&(!Number.isInteger(r.connected)||!Number.isInteger(r.unconnected)||r.connected<0||r.unconnected<0||r.connected+r.unconnected!==12))continue;
 if(site==='quarry'&&(!Number.isFinite(r.threshold)||r.threshold<0||r.threshold>90||!Number.isFinite(r.overlapMeters)||r.overlapMeters<0))continue;
 result[site]={site,status:'DEMO ANALYSIS',computedAt:r.computedAt,...(site==='ezhou'?{connected:r.connected,unconnected:r.unconnected}:{threshold:r.threshold,overlapMeters:r.overlapMeters})};}
 return result;
 }catch{return {}}
}
export function readRecords():DemoRecords{try{return parseRecords(sessionStorage.getItem(RECORD_KEY))}catch{return {}}}
export function saveRecord(record:DemoRecord){try{sessionStorage.setItem(RECORD_KEY,JSON.stringify({...readRecords(),[record.site]:record}))}catch{/* Storage unavailable: the live computed analysis remains usable. */}}
