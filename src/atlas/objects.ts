import {INFORMATION_DEMOS} from './demo-information-v11';
import {recordById} from './catalog';
import {subtypeOf} from './information';
import pilot from './pilot-features.json';
import {isVisible} from './information';
import {DEMO_FEATURES} from './demo-v21';
import {EZHOU_COORDINATE} from './places';
import {EZHOU_BOUNDARY} from './ezhou-boundary';
import type {MapObject,OverlayState,InformationFeature} from './types';
const shared={placeId:'ezhou',sourceIds:['demo'],dataStatus:'demo' as const,precision:'示意位置 · 非实测'};
const RAW_OBJECTS:MapObject[]=[
 ...INFORMATION_DEMOS,
 ...(pilot as MapObject[]),
 ...DEMO_FEATURES,
 {...shared,id:'island-outline',title:'鹅洲轮廓 · OSM',layer:'geography',sourceIds:['osm'],dataStatus:'public',geometry:{type:'Polygon',coordinates:EZHOU_BOUNDARY},anchor:EZHOU_COORDINATE,precision:'OSM 水域内洞，非地籍边界'},
 {...shared,id:'ecology-context',title:'生态议题 · 地点级参考',layer:'ecology',recordId:'issue-water',sourceIds:['water2026','osm'],dataStatus:'public',geometry:{type:'Polygon',coordinates:EZHOU_BOUNDARY},anchor:[112.945371,28.0189],precision:'以洲岛关联公开议题，不是污染范围或保护红线'},
 {...shared,id:'culture-index',title:'地方生活史 · 资料索引',layer:'culture',recordId:'research-2024',sourceIds:['walk2024'],dataStatus:'public',geometry:{type:'Point',coordinates:[[112.9474,28.0143]]},anchor:[112.9474,28.0143],precision:'地点级索引，不表示报道采访点'},
 {...shared,id:'society-route',title:'活动观察路线 · 演示',layer:'society',recordId:'conflict-use',geometry:{type:'LineString',coordinates:[[112.944540,28.0207],[112.946701,28.0161],[112.948727,28.0117],[112.950613,28.0078]]},anchor:[112.946701,28.0161]},
 {...shared,id:'research-index',title:'历年研究 · 地点索引',layer:'ecology',recordId:'research-2018',sourceIds:['study2018'],dataStatus:'public',geometry:{type:'Point',coordinates:[[112.946407,28.0167]]},anchor:[112.946407,28.0167],precision:'地点级关联，没有原始 GPS'},
 {...shared,id:'field-demo',title:'观察记录模板 · 演示',layer:'society',recordId:'field-template',geometry:{type:'Point',coordinates:[[112.950315,28.0086]]},anchor:[112.950315,28.0086]},
 {...shared,id:'proposal-arrival',title:'到达说明触点 · 概念',layer:'proposal',recordId:'proposal-care',proposalId:'proposal-care',geometry:{type:'Point',coordinates:[[112.944540,28.0207]]},anchor:[112.944540,28.0207]},
 {...shared,id:'proposal-route',title:'轻行服务连接线 · 概念',layer:'proposal',recordId:'proposal-care',proposalId:'proposal-care',geometry:{type:'LineString',coordinates:[[112.944540,28.0207],[112.946701,28.0161],[112.948727,28.0117],[112.950613,28.0078]]},anchor:[112.946701,28.0161]},
 {...shared,id:'proposal-rest',title:'环境说明触点 · 概念',layer:'proposal',recordId:'proposal-care',proposalId:'proposal-care',geometry:{type:'Point',coordinates:[[112.948727,28.0117]]},anchor:[112.948727,28.0117]},
 {...shared,id:'proposal-feedback',title:'维护反馈触点 · 概念',layer:'proposal',recordId:'proposal-care',proposalId:'proposal-care',geometry:{type:'Point',coordinates:[[112.950613,28.0078]]},anchor:[112.950613,28.0078]},
];
const legacySubtypes:Record<string,string>={'illustrative-study-area':'context','planned-observation-route':'activity','content-index':'memory'};
export const MAP_OBJECTS:InformationFeature[]=RAW_OBJECTS.map(o=>{
 const record=o.recordId?recordById(o.recordId):undefined;
 const subtype=o.subtype&&legacySubtypes[o.subtype]?(o.layer==='proposal'?'intervention':o.layer==='geography'?'reference':o.layer==='society'?'activity':o.layer==='ecology'?'context':'memory'):subtypeOf(o);
 const shortDescription=o.shortDescription??o.summary??record?.summary??(o.id==='island-outline'?'展示开放地图中的鹅洲轮廓，帮助理解洲岛与湘江两岸的位置关系。它是公开水域几何形成的参考范围，不是地籍边界。':`${o.title}用于关联当前地点与空间资料。${o.precision}。`);
 return {...o,subtype,shortDescription,category:o.layer,geometryType:o.geometry.type,relatedPlaceIds:o.placeIds??[o.placeId],sourceStatus:o.dataStatus==='demo'?'mock':'public',isMock:o.dataStatus==='demo',relatedEvidenceIds:record?.evidenceIds??[],relatedProposalIds:record?.kind==='Proposal'?[record.id]:[]};
});
export function visibleObjects(state:OverlayState){return MAP_OBJECTS.filter(o=>isVisible(o,state));}
export function layersForObjects(ids:string[]){return Array.from(new Set(MAP_OBJECTS.filter(o=>ids.includes(o.id)).map(o=>o.layer)));}
