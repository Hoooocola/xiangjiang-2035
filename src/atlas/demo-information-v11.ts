import pilot from './pilot-features.json';
import type {Coordinate} from '../experience/geo';
import type {AtlasRecord,LayerId,MapObject} from './types';

/** Concept fixtures inherit a mapped island outline, never an invented cadastral rectangle. */
const island=(pilot as MapObject[]).find(f=>f.id==='pilot-park-16734077')!;
function clipLatitude(ring:Coordinate[],latitude:number,above:boolean):Coordinate[]{
 const out:Coordinate[]=[];
 for(let i=0;i<ring.length-1;i++){
  const a=ring[i],b=ring[i+1],inside=(p:Coordinate)=>above?p[1]>=latitude:p[1]<=latitude;
  if(inside(a))out.push(a);
  if(inside(a)!==inside(b)){const t=(latitude-a[1])/(b[1]-a[1]);out.push([a[0]+t*(b[0]-a[0]),latitude]);}
 }
 if(out.length)out.push([...out[0]]);return out;
}
const band=(south:number,north:number)=>clipLatitude(clipLatitude(island.geometry.coordinates,south,true),north,false);
const centerAt=(latitude:number):Coordinate=>{
 const xs:number[]=[];const ring=island.geometry.coordinates;
 for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if((a[1]<=latitude&&b[1]>latitude)||(b[1]<=latitude&&a[1]>latitude))xs.push(a[0]+(latitude-a[1])/(b[1]-a[1])*(b[0]-a[0]));}
 xs.sort((a,b)=>a-b);return [(xs[0]+xs.at(-1)!)/2,latitude];
};
const point=(lat:number):MapObject['geometry']=>({type:'Point',coordinates:[centerAt(lat)]});
const path=(south:number,north:number):MapObject['geometry']=>({type:'LineString',coordinates:Array.from({length:9},(_,i)=>centerAt(south+(north-south)*i/8))});
const area=(south:number,north:number):MapObject['geometry']=>({type:'Polygon',coordinates:band(south,north)});
const make=(id:string,layer:LayerId,subtype:string,title:string,shortDescription:string,geometry:MapObject['geometry'],anchorLatitude:number):MapObject=>({
 id:`v11-${id}`,title,layer,subtype,shortDescription,summary:shortDescription,
 placeId:'juzizhou',placeIds:['juzizhou'],recordId:`v11-record-${id}`,sourceIds:['demo-v11','osm'],sourceFeatureIds:['relation/16734077'],
 dataStatus:'demo',geometry,anchor:centerAt(anchorLatitude),surface:'park',form:geometry.type==='Point'?'point':geometry.type==='Polygon'?'area':'line',
 precision:'以 OSM 洲岛公园轮廓约束的概念位置；不是实测、导航路线或生态边界',
 time:'概念演示 · 尚未采集',researchStatus:'未实施调查',
});
export const INFORMATION_DEMOS:MapObject[]=[
 make('vegetation','ecology','observation','滨岸植被观察示例','以橘子洲中段的概念观察点，演示树荫、植被与滨水活动的关联。可用于讨论未来记录什么；尚无物种清单或实地观察结果。',point(28.190),28.190),
 make('ecological-link','ecology','corridor','沿江生态连接路径示例','沿洲岛内部绘制一条概念连接路径，帮助比较南北绿地之间的空间关系。这条线不是经认定的生态廊道，也不代表动物迁移路线。',path(28.184,28.199),28.1915),
 make('habitat','ecology','habitat','滨水生境观察区域示例','从已映射洲岛范围中截取一段，演示未来生境观察的选区方式。高亮表示拟讨论区域，不表示湿地认定、保护等级或物种分布。',area(28.188,28.195),28.1915),
 make('life-history','culture','memory','地方生活史','以橘子洲及周边滨水空间为线索，展示居民生活、地方记忆、日常活动与历史资料如何关联到具体位置。此处是文化资料组织演示，尚未导入访谈、老照片或真实历史事件记录。',point(28.1857),28.1857),
 make('daily-culture','culture','daily','滨水日常文化活动','用一段概念散步路径讨论晨间活动、驻足与沿江交往如何被记录。路线只用于组织后续观察，不声称这些活动已在此被调查或证实。',path(28.181,28.189),28.185),
 make('spatial-memory','culture','memory','历史空间记忆','将洲岛的一段空间作为历史照片和旧地图的未来关联范围，帮助比较不同时间的滨水生活。当前没有叠加历史边界，也没有编造具体事件。',area(28.195,28.200),28.1975),
 make('walking','society','activity','居民慢行活动路线示例','沿洲岛内部设置概念步行序列，演示如何把通行与停留记录串联起来。实际可达性和居民使用方式仍需现场核验，此线不用于导航。',path(28.180,28.197),28.1885),
 make('space-use','society','activity','滨水公共空间使用观察','在洲岛中段圈定概念观察范围，比较未来可记录的通行、休憩和活动时段。尚未采集人数、访谈或使用冲突证据。',area(28.185,28.189),28.187),
 make('service','society','service','公共服务设施触点示例','在洲岛内部放置一个拟议的信息服务位置，演示设施、使用者与周边路径的关联。该点不是现有设施清单，也不代表已经提供服务。',point(28.194),28.194),
 make('commerce','economy','industry','沿江商业活动节点示例','以一个概念节点演示滨水经营活动如何与地点关联。这里只定义未来需核验的经营类型与空间关系，没有商户名称、营收或客流统计。',point(28.183),28.183),
 make('tourism','economy','tourism','滨水旅游服务分布示例','用概念路径串联拟议服务位置，讨论旅游服务与洲岛步行体验的关系。路径不是实际商户或运营网络，后续需补充经营主体与服务范围。',path(28.183,28.196),28.1895),
 make('operations','economy','operation','公共空间运营指标模板','将运营记录模板关联到一段洲岛空间，演示指标、单位、时间和统计范围的组织方式。客流、收入及用电值均未填写，不把示例当作经营结果。',area(28.189,28.193),28.191),
 make('slow-service','proposal','intervention','滨江慢行服务系统概念','以一条概念服务连接线讨论到达、行走与反馈之间的联系。它表达服务设计意图，尚未核验路线、设施条件或实施许可。',path(28.182,28.199),28.1905),
 make('public-touchpoint','proposal','intervention','滨水公共服务触点设计','以一个拟议触点演示环境说明、活动提示和维护反馈如何进入步行体验。位置为概念示意，没有新增真实设施或建设承诺。',point(28.192),28.192),
 make('culture-guide','proposal','intervention','文化导览与信息服务概念','将未来文化资料入口与一段洲岛步行空间相连，讨论导览内容和路径的配合。当前不提供已完成的导览服务，内容需经研究与授权后补充。',path(28.181,28.188),28.1845),
];
export const INFORMATION_DEMO_RECORDS:AtlasRecord[]=INFORMATION_DEMOS.map(f=>({
 id:f.recordId!,kind:f.layer==='proposal'?'Proposal':f.layer==='society'?'FieldRecord':'ResearchProject',
 placeId:f.placeId,placeIds:f.placeIds,title:f.title,year:2026,author:'交互演示编辑（非调查团队）',themes:[{geography:'基础地理',ecology:'生态',culture:'文化',society:'社会',economy:'经济',proposal:'设计方案'}[f.layer]],
 summary:f.shortDescription!,body:[f.shortDescription!,f.precision,'2026 为示例编制年份，不是调查年份。模拟材料不构成真实田野证据。指标、观察时间、受访者及经济数值均未填入。'],
 dataStatus:'demo',state:'DEMO DATA / 模拟研究资料 · 未实施调查',sourceIds:f.sourceIds,evidenceIds:[],relatedIds:[],objectIds:[f.id],
 ...(f.layer==='proposal'?{proposalType:f.id==='v11-culture-guide'?'Information / Interaction Design' as const:'Service Design' as const}:{}),
}));
