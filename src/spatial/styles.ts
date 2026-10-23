import type {SemanticLayer,Theme} from './types';
/** One semantic vocabulary for UI icons, markers, geometry and legend. Form is independent. */
export const annotationStyles:Record<SemanticLayer,{label:string;en:string;color:string;icon:'Box'|'Leaf'|'FileText'|'TriangleAlert'|'Sparkles';shape:'square'|'circle'|'document'|'diamond'|'hex';code:string}>={
 context:{label:'现场',en:'Context',color:'#b7c8cc',icon:'Box',shape:'square',code:'C'},
 resources:{label:'资源',en:'Resources',color:'#a4cfb2',icon:'Leaf',shape:'circle',code:'R'},
 evidence:{label:'证据',en:'Evidence',color:'#9dbbfa',icon:'FileText',shape:'document',code:'E'},
 findings:{label:'发现',en:'Findings',color:'#efbf83',icon:'TriangleAlert',shape:'diamond',code:'F'},
 proposal:{label:'方案',en:'Proposal',color:'#c3a6ed',icon:'Sparkles',shape:'hex',code:'P'},
};
export const themeLabels:Record<Theme,string>={ecology:'生态',culture:'文化',society:'社会活动',field:'田野研究'};
export const formLabels={point:'点',path:'路径',area:'区域',object:'对象'};
