import {EZHOU_COORDINATE} from './places';
import {EZHOU_BOUNDARY} from './ezhou-boundary';
import type {MapObject,OverlayState} from './types';
const shared={placeId:'ezhou',sourceIds:['demo'],dataStatus:'demo' as const,precision:'示意位置 · 非实测',scenario:'both' as const};
export const MAP_OBJECTS:MapObject[]=[
 {...shared,id:'island-outline',title:'鹅洲轮廓 · OSM',layer:'geography',sourceIds:['osm'],dataStatus:'public',geometry:{type:'Polygon',coordinates:EZHOU_BOUNDARY},anchor:EZHOU_COORDINATE,precision:'OSM 水域内洞，非地籍边界'},
 {...shared,id:'ecology-context',title:'生态议题 · 地点级参考',layer:'ecology',recordId:'issue-water',sourceIds:['water2026','osm'],dataStatus:'public',geometry:{type:'Polygon',coordinates:EZHOU_BOUNDARY},anchor:[112.945371,28.0189],precision:'以洲岛关联公开议题，不是污染范围或保护红线'},
 {...shared,id:'culture-index',title:'地方生活史 · 资料索引',layer:'culture',recordId:'research-2024',sourceIds:['walk2024'],dataStatus:'public',geometry:{type:'Point',coordinates:[[112.9474,28.0143]]},anchor:[112.9474,28.0143],precision:'地点级索引，不表示报道采访点'},
 {...shared,id:'society-route',title:'活动观察路线 · 演示',layer:'society',recordId:'conflict-use',geometry:{type:'LineString',coordinates:[[112.944540,28.0207],[112.946701,28.0161],[112.948727,28.0117],[112.950613,28.0078]]},anchor:[112.946701,28.0161]},
 {...shared,id:'research-index',title:'历年研究 · 地点索引',layer:'research',recordId:'research-2018',sourceIds:['study2018'],dataStatus:'public',geometry:{type:'Point',coordinates:[[112.946407,28.0167]]},anchor:[112.946407,28.0167],precision:'地点级关联，没有原始 GPS'},
 {...shared,id:'field-demo',title:'观察记录模板 · 演示',layer:'research',recordId:'field-template',geometry:{type:'Point',coordinates:[[112.950315,28.0086]]},anchor:[112.950315,28.0086]},
 {...shared,id:'proposal-arrival',title:'到达说明触点 · 概念',layer:'proposal',recordId:'proposal-care',scenario:'2035',geometry:{type:'Point',coordinates:[[112.944540,28.0207]]},anchor:[112.944540,28.0207]},
 {...shared,id:'proposal-route',title:'轻行服务连接线 · 概念',layer:'proposal',recordId:'proposal-care',scenario:'2035',geometry:{type:'LineString',coordinates:[[112.944540,28.0207],[112.946701,28.0161],[112.948727,28.0117],[112.950613,28.0078]]},anchor:[112.946701,28.0161]},
 {...shared,id:'proposal-rest',title:'环境说明触点 · 概念',layer:'proposal',recordId:'proposal-care',scenario:'2035',geometry:{type:'Point',coordinates:[[112.948727,28.0117]]},anchor:[112.948727,28.0117]},
 {...shared,id:'proposal-feedback',title:'维护反馈触点 · 概念',layer:'proposal',recordId:'proposal-care',scenario:'2035',geometry:{type:'Point',coordinates:[[112.950613,28.0078]]},anchor:[112.950613,28.0078]},
];
export function visibleObjects(state:OverlayState){return MAP_OBJECTS.filter(o=>state.layers.includes(o.layer)&&(!state.placeId||o.placeId===state.placeId)&&(o.scenario==='both'||state.scenario==='2035'&&state.proposalVisible));}
export function layersForObjects(ids:string[]){return Array.from(new Set(MAP_OBJECTS.filter(o=>ids.includes(o.id)).map(o=>o.layer)));}
