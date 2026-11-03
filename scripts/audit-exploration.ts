/** Offline inventory only. Does not download, modify or move research data. */
import fs from 'node:fs';
import {RESOURCE_NODES} from '../src/exploration/relations';
import {unproject} from '../src/experience/geo';
import {RECORDS} from '../src/atlas/catalog';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
type Feature={geometry:{type:string;coordinates:unknown};properties:Record<string,unknown>};
const files=['public/data/xiangjiang.geojson','public/data/environment.json'];
const features:Feature[]=files.flatMap(p=>read(p).features);
function bounds(coordinates:unknown):number[]|null {
 const points:number[][]=[];function visit(v:unknown){if(!Array.isArray(v))return;if(typeof v[0]==='number'&&typeof v[1]==='number')points.push(v as number[]);else v.forEach(visit);}visit(coordinates);
 if(!points.length)return null;const b=[Infinity,Infinity,-Infinity,-Infinity];for(const [x,y]of points){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}return b.map(x=>+x.toFixed(7));
}
const shore=features.filter(f=>f.properties.water==='river'||f.properties.waterway==='riverbank');
const roads=features.filter(f=>f.properties.highway&&f.geometry.type==='LineString');
const bridges=roads.filter(f=>f.properties.bridge&&f.properties.bridge!=='no');
const grid=read('public/data/terrain.json'),cover=read('public/data/spatial/worldcover-2021-texture.json');
const terrainCorners=[unproject([grid.x0,grid.z0]),unproject([grid.x0+(grid.width-1)*grid.dx,grid.z0+(grid.height-1)*grid.dz])];
const subset=(kind:string)=>RESOURCE_NODES.filter(n=>n.kind===kind);
const unavailable=(id:string,name:string,file:string,source:string,status='尚未实现')=>({id,name,status,file,source,count:0,bounds:null,interaction:'仅状态说明，没有伪装的图层开关'});
const inventory=[
 {id:'geography.shore',name:'河流岸线',status:'已接入真实数据',file:files,source:'OpenStreetMap / ODbL-1.0；数据原署名保留',count:shore.length,bounds:bounds(shore.map(f=>f.geometry.coordinates)),interaction:'沿真实河流多边形边界批量细线；核心窗口按现有预算裁剪，非全河段测绘岸线'},
 {id:'geography.roads',name:'道路桥梁',status:'已接入真实数据',file:files,source:'OSM / Overture；异质精度，下载年不是调查年',count:roads.length,bridgeFeatures:bridges.length,bounds:bounds(roads.map(f=>f.geometry.coordinates)),interaction:'主路/支路/桥梁分批，核心窗口最多14,000线段；有几何可作距离参照，但未构建连通步行拓扑、通行限制或路径成本'},
 {id:'geography.terrain',name:'地形高程',status:'已接入真实数据',file:'public/data/terrain.json',source:grid.source,count:grid.width*grid.height,bounds:bounds(terrainCorners),interaction:'已有DEM与渲染地面；等高线/剖面尚未实现'},
 {id:'ecology.cover',name:'土地覆盖',status:'已接入真实数据',file:['public/data/spatial/worldcover-2021-core.tif','public/data/spatial/worldcover-2021-core.bin','public/data/spatial/worldcover-2021-texture.json'],source:'ESA WorldCover 2021 v200 / CC BY4.0；约10m',count:cover.width*cover.height,classes:cover.classes,bounds:cover.bounds,interaction:'真实像元B渐显+C坐标显影镜；无裁剪中不存在的湿地90类，无面积或跨年变化推断'},
 unavailable('ecology.history-water','历史水体','无时间序列文件','现有河流/WorldCover单期不能替代历史水体序列'),
 {id:'ecology.observations',name:'生物观察记录',status:'已接入真实数据（API；地图尚未实现）',file:['public/data/spatial/gbif-core.geojson','data/spatial/gbif-query.json','src/spatial-data/service.ts'],source:'GBIF公开受限快照；逐条CC BY4.0 / CC0，≤1000m报告误差保留',count:read('public/data/spatial/gbif-core.geojson').features.length,bounds:bounds(read('public/data/spatial/gbif-core.geojson').features.map((f:Feature)=>f.geometry.coordinates)),interaction:'查询/洋湖分析API已有；三维聚合、按类群筛选和点击记录尚未实现，不显示正常开关'},
 {id:'culture.heritage',name:'文化遗产/文化地点',status:'已接入真实数据（地点级索引）',file:['src/places/registry.ts','src/places/index.ts','src/exploration/relations.ts'],source:subset('culture').map(n=>({name:n.name,source:n.source,precision:n.precision})),count:subset('culture').length,bounds:bounds(subset('culture').map(n=>n.coordinate)),interaction:'注册地点定位、聚合、取景、来源和原资料入口；不是完整遗产普查或新建筑精确识别'},
 unavailable('culture.facilities','文化设施分类','src/places；无本轮独立设施数据集','现有文化地点不能冒充博物馆/图书馆完整分类'),
 {id:'culture.stories',name:'地方历史与故事',status:'已接入示意数据（既有研究资料索引）',file:['src/atlas/catalog.ts','src/atlas/demo-v21.ts','src/atlas/demo-information-v11.ts'],source:'既有RECORDS，保留public/demo声明；不能将课程提案当成历史事实',count:RECORDS.filter(r=>r.themes.includes('文化')||r.id==='demo-culture').length,bounds:bounds(RESOURCE_NODES.filter(n=>n.id==='juzizhou').map(n=>n.coordinate)),interaction:'通过顶部资料及地点资料访问，研究数据与作品关系未删；未新增时空历史故事专用图层'},
 unavailable('society.population','人口分布','无可计算人口栅格/统计边界','无真实人口数据，未随机补点'),
 {id:'society.services',name:'公共服务设施',status:'已接入示意数据',file:['src/exploration/data.ts','src/exploration/relations.ts'],source:'3个既有V3固定DEMO点，不是调查设施',count:subset('services').length,bounds:bounds(subset('services').map(n=>n.coordinate)),interaction:'44px标记、列表定位、范围取景、信息来源；可按球面直线距离计算示意样本数'},
 {id:'society.walk','name':'步行可达性',status:'已接入示意数据（非可达性计算）',file:['src/exploration/render.ts',...files],source:'已有道路；东岸研究窗口112.975E/28.191N周围600m近邻路段',count:null,bounds:bounds([[112.975-.0062,28.191-.0054],[112.975+.0062,28.191+.0054]]),interaction:'仅DEMO道路参照；没有最短路/等时圈/完整可达性。V3.1资源分析是另一个明确命名的直线距离计算'},
 {id:'economy.commerce',name:'商业服务设施',status:'已接入示意数据',file:['src/exploration/data.ts','src/exploration/relations.ts'],source:'3个既有V3固定DEMO点，不是商户名录',count:subset('commerce').length,bounds:bounds(subset('commerce').map(n=>n.coordinate)),interaction:'可发现标记、列表定位、范围取景与按坐标的距离筛选'},
 unavailable('economy.industry','产业空间','无可信园区/产业用地独立数据','未将基础建筑轮廓当作产业边界'),
 unavailable('economy.nightlights','夜间灯光','无遥感夜光栅格','场景建筑窗灯是美术表达，不是夜光观测数据'),
];
const extra={name:'水质断面月报（不是历史水域范围）',file:'public/data/spatial/water-quality-2025-11.json',count:read('public/data/spatial/water-quality-2025-11.json').records.length,source:'湖南省生态环境厅2025-11公开事实表',status:'真实数据API / 坐标未核验 / 不上三维地图',bounds:null};
console.log(JSON.stringify({generatedAt:'2026-11-03',coordinateSystem:'WGS84，bounds=[west,south,east,north]；null不是零覆盖',inventory,extra},null,2));
