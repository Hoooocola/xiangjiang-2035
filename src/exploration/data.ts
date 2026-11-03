import {MAP_PLACES} from '@/src/places/registry';
import {project,unproject,type Coordinate} from '@/src/experience/geo';
export const COVER_CLASSES=[{code:10,label:'林地',color:'#6c9174'},{code:20,label:'灌丛',color:'#c5aa65'},{code:30,label:'草地',color:'#a4b780'},{code:40,label:'农田',color:'#c4b587'},{code:50,label:'建成区',color:'#bd9490'},{code:60,label:'裸地',color:'#c1b6a7'},{code:80,label:'水体',color:'#69a4b6'}] as const;
export type ExplorationState={cover:number; lens:boolean; shore:boolean;roads:boolean;culture:boolean;services:boolean;commerce:boolean;walk:boolean;focusId?:string|null;analysisRadius?:number|null};
export const EMPTY_EXPLORATION:ExplorationState={cover:0,lens:false,shore:false,roads:false,culture:false,services:false,commerce:false,walk:false};
export type CoverMeta={width:number;height:number;bounds:number[];nodata:number;sha256:string;rowOrder:string;classes:number[]};
export type LensReading={coordinate:Coordinate|null;code:number;label:string;status:'ready'|'nodata'|'loading'|'unavailable'};
export function sampleCover(meta:CoverMeta,values:Uint8Array,coordinate:Coordinate){const [west,south,east,north]=meta.bounds,[lon,lat]=coordinate;if(lon<west||lon>=east||lat>north||lat<=south)return 0;const col=Math.floor((lon-west)/(east-west)*meta.width),row=Math.floor((north-lat)/(north-south)*meta.height);return values[row*meta.width+col]??0;}
export function coverLabel(code:number){return COVER_CLASSES.find(c=>c.code===code)?.label??'NoData / 无有效分类';}
export const readingAt=(meta:CoverMeta,values:Uint8Array,x:number,z:number):LensReading=>{const coordinate=unproject([x,z]),code=sampleCover(meta,values,coordinate);return {coordinate,code,label:coverLabel(code),status:code?'ready':'nodata'};};
export const EXPLORATION_DATASETS=[
 {layer:'geography',entries:['河流岸线 · OSM','道路与桥梁 · OSM','地形高程 · 已有DEM']},
 {layer:'ecology',entries:['土地覆盖 · ESA WorldCover 2021','历史水体 · 规划中','生物记录聚合 · 规划中']},
 {layer:'culture',entries:['文化地点 · 现有地点注册','文化设施 · 规划中','地方故事 · 已有资料索引']},
 {layer:'society',entries:['人口分布 · 规划中','公共服务 · DEMO节点','步行关系 · DEMO近邻路段']},
 {layer:'economy',entries:['商业设施 · DEMO节点','产业边界 · 规划中','夜间灯光 · 规划中']},
];
export const DEMO_NODES=[
 {id:'public-1',kind:'services',name:'滨江公共服务示意点',coordinate:[112.974,28.190] as Coordinate},
 {id:'public-2',kind:'services',name:'街区公共服务示意点',coordinate:[112.980,28.199] as Coordinate},
 {id:'public-3',kind:'services',name:'江岸公共服务示意点',coordinate:[112.972,28.181] as Coordinate},
 {id:'shop-1',kind:'commerce',name:'临江商业示意点',coordinate:[112.977,28.185] as Coordinate},
 {id:'shop-2',kind:'commerce',name:'街区商业示意点',coordinate:[112.983,28.195] as Coordinate},
 {id:'shop-3',kind:'commerce',name:'街角商业示意点',coordinate:[112.978,28.205] as Coordinate},
].map(node=>({...node,source:'V3 确定性DEMO配置，不是设施调查',precision:'示意点，不对应真实设施位置',placeIds:['city'],description:'用于讨论公共服务、商业与路网关系的固定演示锚点，不作研究结论。'}));
export const CULTURE_NODES=MAP_PLACES.filter(p=>['橘子洲','开福寺','岳麓山'].includes(p.name)).map(p=>({id:p.id,name:p.name,coordinate:p.coordinate,source:p.source??[p.note],precision:p.note,placeIds:[p.id],description:p.description}));
export const DEMO_FOCUS=project([112.975,28.191]);
