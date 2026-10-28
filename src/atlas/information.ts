import type {LayerId,MapObject,OverlayState} from './types';

export interface InformationSubtype {id:string;layer:LayerId;label:string;form:string;note?:string}
export const SUBTYPES:InformationSubtype[]=[
 {id:'shoreline',layer:'geography',label:'岸线',form:'线'},
 {id:'bridge',layer:'geography',label:'桥梁',form:'对象'},
 {id:'contour',layer:'geography',label:'高程与地形',form:'线'},
 {id:'cover',layer:'geography',label:'已映射公园范围',form:'面',note:'OSM 公园范围，不是完整土地利用分类'},
 {id:'landuse',layer:'geography',label:'土地利用',form:'面',note:'待补充核验后的用地分类'},
 {id:'road',layer:'geography',label:'道路',form:'线'},
 {id:'reference',layer:'geography',label:'地理资料',form:'面'},
 {id:'wetland',layer:'ecology',label:'湿地生态范围',form:'面',note:'洋湖现有公园边界不等于湿地生态边界；待核验'},
 {id:'corridor',layer:'ecology',label:'生态廊道',form:'路径',note:'待补充有依据的廊道路线与范围'},
 {id:'observation',layer:'ecology',label:'生态观测',form:'点',note:'待补充采样时间、指标与坐标'},
 {id:'context',layer:'ecology',label:'生态资料与范围参考',form:'面'},
 {id:'heritage',layer:'culture',label:'物质文化',form:'对象'},
 {id:'intangible',layer:'culture',label:'非物质文化',form:'活动'},
 {id:'memory',layer:'culture',label:'历史记忆与日常文化',form:'资料'},
 {id:'population',layer:'society',label:'人口与社区',form:'统计区域'},
 {id:'service',layer:'society',label:'公共服务与交通',form:'网络'},
 {id:'activity',layer:'society',label:'日常活动与研究证据',form:'点 / 路径'},
 {id:'industry',layer:'economy',label:'产业空间',form:'区域',note:'待补充真实产业范围'},
 {id:'operation',layer:'economy',label:'经营与运营',form:'指标',note:'待补充指标、单位、时间、统计范围和来源'},
 {id:'logistics',layer:'economy',label:'产业与物流网络',form:'网络',note:'待补充节点与连接依据'},
 {id:'intervention',layer:'proposal',label:'设计介入与服务关系',form:'方案'},
];
export const subtypeOf=(o:MapObject)=>o.subtype??({geography:'reference',ecology:'context',culture:'memory',society:'activity',economy:'industry',proposal:'intervention'}[o.layer]);
/** Selection, visibility and camera intent are independent. No implicit camera commands. */
export function isAvailable(o:MapObject,state:OverlayState){return (o.dataStatus!=='demo'||state.showDemo===true)&&(!state.placeId||(o.placeIds??[o.placeId]).includes(state.placeId));}
export function isVisible(o:MapObject,state:OverlayState){return isAvailable(o,state)&&state.layers.includes(o.layer)&&(!state.subtypes||state.subtypes.includes(subtypeOf(o)))&&(!o.proposalId||state.proposal?.proposalId===o.proposalId&&state.proposal.view==='intervention'&&!!state.placeId&&(o.placeIds??[o.placeId]).includes(state.placeId));}
export type SceneFocusState={mode:'base'|'layers'|'object'|'guided';primaryId:string|null;step:number};
export function focusState(state:OverlayState,objects:MapObject[],guidedStep:number|null=null):SceneFocusState{
 const primaryId=objects.find(o=>state.selectedObjectIds.includes(o.id)&&isVisible(o,state))?.id??null;
 return {mode:guidedStep!==null?'guided':primaryId?'object':state.layers.length?'layers':'base',primaryId,step:guidedStep??0};
}
