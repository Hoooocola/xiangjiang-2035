import type {Coordinate} from '../experience/geo';
export const EZHOU_COORDINATE:Coordinate=[112.9481,28.0099];
export type Source={id:string;title:string;url?:string;year:number;author:string;status:'public'|'demo'|'approximate'};
export const SOURCES:Source[]=[
 {id:'demo-v11',title:'DEMO DATA / 模拟研究资料 · 空间信息 V1.1',year:2026,author:'概念演示编辑；编制年份，非调查年份；未实施调查',status:'demo'},
 {id:'terrain-dem',title:'Mapzen / Tilezen 高程瓦片 · 本地 320 × 512 网格',url:'https://registry.opendata.aws/terrain-tiles/',year:2026,author:'Mapzen / USGS；2026-10-21 提取，不代表采集年份',status:'public'},
 {id:'demo-v21',title:'DEMO DATA / 模拟研究资料 · V2.1 独立示例集',year:2026,author:'src/atlas/demo-v21.ts · 编辑示意，未实施调查',status:'demo'},
 {id:'legacy-prototype',title:'旧 HTML 原型中的 9 条方案记录（原型演示，不是核实成果）',year:2026,author:'prototype-html/js/data.js · Git 3bf2d3e，内容与首次归档一致',status:'demo'},
 {id:'gazetteer',title:'公开地名目录：Ezhou / 鹅洲',url:'https://fallingrain.com/world/CH/11/Ezhou.html',year:2026,author:'Falling Rain 地名目录；2026-10-22 核对',status:'approximate'},
 {id:'osm',title:'OpenStreetMap 河道与洲岛轮廓',url:'https://www.openstreetmap.org/relation/8727387',year:2026,author:'OpenStreetMap contributors',status:'public'},
 {id:'walk2024',title:'“洲”游长沙：鹅洲走读报道',url:'https://xjzb.icswb.com/h/106002/20240618/875653.html',year:2024,author:'长沙晚报 · 邬伟、周游、李金',status:'public'},
 {id:'study2018',title:'赴鹅洲岛开展砂石行业现状调研',url:'https://www.csust.edu.cn/qjxy/info/1111/8138.htm',year:2018,author:'长沙理工大学汽机学院社会实践团',status:'public'},
 {id:'water2026',title:'鹅洲岛污水处理设施建设专题调研',url:'https://zx.zxy.hunanzx.gov.cn/szxapp/1/193/content_1124300.html',year:2026,author:'政协融媒 · 长正',status:'public'},
 {id:'demo',title:'功能演示资料集 v1（非实地研究）',year:2026,author:'湘江生态文化与社会创新地图 · Demo 编辑',status:'demo'},
];
export const sourceById=(id:string)=>SOURCES.find(s=>s.id===id)!;
export const STATUS_LABEL={public:'公开资料',demo:'演示数据 · 非实地结论',approximate:'近似定位 · 非测绘'};
export interface PlaceProfile {id:string;tags:string[];overview:string;ecology:string;culture:string;society:string;sourceIds:string[];locationNote:string;legacyPlaceId?:string}
export const PROFILES:PlaceProfile[]=[
 {id:'ezhou',tags:['洲岛','地方生活','生态体验','功能样板'],overview:'鹅洲位于湘江长沙南段、坪塘一带。这里以公开报道作为地点认识的起点，演示如何把资料、研究问题与设计构想放回同一处空间。',ecology:'2024 年公开走读记录了岛上的林木、湿地与耕地景观。本页没有现场物种调查或水质测量数据。',culture:'从渡船到桥梁，出行方式的变化提供了一条理解洲岛生活史的线索。地方传说与居民口述仍需原始材料核验。',society:'公开走读报道涉及居民生活、农业和休闲活动；这些是报道时点的描述，并非当前实时统计。',sourceIds:['walk2024','gazetteer','osm'],locationNote:'采用公开地名坐标 112.9481, 28.0099，并与 OSM 洲岛轮廓核对；为近似地点标记，不是地籍边界。',legacyPlaceId:'30000000-0000-4000-8000-000000000001'},
 {id:'juzizhou',tags:['洲岛','公共空间','城市记忆'],overview:'从洲岛与两岸的空间关系开始阅读长沙。此处先提供基础地点导航，研究库待补充。',ecology:'底图保留河道、洲岛及绿地轮廓；没有把底图颜色解释为生态质量评价。',culture:'文化专题资料尚未编入；不以地标名称替代研究结论。',society:'公共空间的使用方式有待田野观察。本地点尚无公开导入的田野记录。',sourceIds:['osm'],locationNote:'OSM 河岸背景上的地点参考标记，非实测研究范围。'},
];
export function profileFor(id:string):PlaceProfile{return PROFILES.find(p=>p.id===id)??{id,tags:['地点导航','资料待补'],overview:'该地点已接入空间导航。地点档案与研究资料将随实际研究逐步积累。',ecology:'尚未编入生态专题资料。',culture:'尚未编入历史文化专题资料。',society:'尚未编入社会活动专题资料。',sourceIds:['osm'],locationNote:'范围参考标记，不代表精确研究边界。'};}
