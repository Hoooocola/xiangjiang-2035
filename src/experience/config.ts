import { project, type Coordinate } from './geo';
export type CameraPose = { target: [number,number,number]; distance: number; azimuth: number; polar: number };
export const CAMERA_PRESETS: {id:string;name:string;description:string;pose:CameraPose}[] = [
  {id:'river',name:'沿江 · 纵深',description:'南向北，洲岛与两岸同框',pose:{target:[2,0,-1],distance:75,azimuth:0.38,polar:1.00}},
  {id:'city',name:'隔江 · 望城',description:'从岳麓一侧看东岸城市',pose:{target:[1,0,-3],distance:65,azimuth:-0.9,polar:0.94}},
  {id:'island',name:'洲岛 · 全貌',description:'较高视点阅读河道与洲岛',pose:{target:[0,0,-1],distance:100,azimuth:0.12,polar:0.40}},
];
export const OVERVIEW_POSE: CameraPose = {target:[-55,0,-4],distance:1080,azimuth:0.05,polar:0.24};
export interface Place {id:string;name:string;en:string;coordinate:Coordinate;index:string;category:string;description:string;note:string;distance:number;overview?:boolean}
export const PLACES: Place[] = [
 {id:'juzizhou',name:'橘子洲',en:'ORANGE ISLE',coordinate:[112.9559,28.1857],index:'01',category:'洲岛 / 公共空间',description:'江水在这里分为两道。沿着洲岛展开的步行空间，将城市日常、江岸生态与长沙的文化记忆联系在一起。',note:'真实河岸轮廓 · 场域导览，非研究结论',distance:44},
 {id:'yuelu',name:'岳麓山',en:'YUELU MOUNTAIN',coordinate:[112.929,28.186],index:'02',category:'山水 / 文化景观',description:'从湘江西岸向山麓延伸，山、城、洲与江构成长沙的空间关系。这里预留山麓生态与文化研究的入口。',note:'全球公开高程模型 · 河岸做了视觉平顺处理',distance:62},
 {id:'city',name:'长沙东岸',en:'THE CITY WATERFRONT',coordinate:[112.975,28.197],index:'03',category:'城市 / 滨水生活',description:'街巷、桥梁与沿江空间共同塑造城市的边界。从真实道路和建筑轮廓出发，观察城市如何面向湘江。',note:'OSM 建筑轮廓 · 未知高度为估算体量',distance:43},
 {id:'ezhou',name:'鹅洲',en:'E ZHOU',coordinate:[112.874,28.057],index:'04',category:'洲岛 / 待校准场域',description:'保留旧项目的鹅洲研究入口。原有地点坐标是开发演示值，需要实地与权威 GIS 数据校准后，才可用于定位研究记录。',note:'DEMO：标记坐标未校准，不代表精确位置',distance:100,overview:true},
 {id:'tongguan',name:'铜官窑附近',en:'TONGGUAN · NORTH',coordinate:[112.811,28.434],index:'05',category:'研究范围 / 北端',description:'本轮研究范围的北端参考。沿湘江向南，串联城市、洲岛与沿岸文化景观。',note:'范围示意点 · 非遗址精确边界',distance:85,overview:true},
 {id:'zhaoshan',name:'昭山附近',en:'ZHAOSHAN · SOUTH',coordinate:[112.939,27.963],index:'06',category:'研究范围 / 南端',description:'本轮研究范围的南端参考，与铜官窑附近共同界定湘江研究长廊。',note:'范围示意点 · 非景区精确边界',distance:85,overview:true},
];
export function placePose(place:Place):CameraPose {const [x,z]=project(place.coordinate);if(place.id==='zhaoshan')return {target:[x+11,0,z-16],distance:110,azimuth:-.45,polar:.65};return {target:[x,0,z],distance:place.distance,azimuth:0.45,polar:0.65};}
export const CAMERA_LIMITS = {minDistance:23,maxDistance:1200,minPolar:0.18,maxPolar:1.02};
