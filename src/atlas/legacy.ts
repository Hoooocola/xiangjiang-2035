import proposals from '../places/legacy-proposals.json';
import type {AtlasRecord} from './types';
export const LEGACY_RECORDS:AtlasRecord[]=proposals.filter(p=>p.coordinateVerified).map(p=>({
 id:p.id,legacyId:p.originalId,placeId:p.placeIds[0],placeIds:p.placeIds,kind:'Proposal',title:p.title,year:p.year,author:'旧交互原型 · 示例团队信息未核验',themes:['旧原型恢复'],summary:`从原型恢复的地点—方案关联：${p.originalPlace}。仅验证界面与资料关系，不是已核实的历史设计成果。`,body:[`原始路径：${p.source}；原始记录 ID：${p.originalId}。`,'原文件没有提供可验证的完整方案附件、研究证据或空间介入边界；因此不生成虚构方案模型。'],dataStatus:'demo',state:'DEMO DATA / 模拟研究资料 · 旧原型归档',sourceIds:['legacy-prototype'],evidenceIds:[],relatedIds:[],objectIds:[],proposalType:'Spatial Installation'
}));
