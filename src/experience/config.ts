import { project } from './geo';
export type CameraPose = { target: [number,number,number]; distance: number; azimuth: number; polar: number };
export const OVERVIEW_POSE: CameraPose = {target:[-55,0,-4],distance:1080,azimuth:0.05,polar:0.24};
export const CAMERA_PRESETS: {id:string;mode:'macro'|'research'|'place';name:string;description:string;pose:CameraPose}[] = [
  {id:'research',mode:'research',name:'研究 · 空间阅读',description:'所选资料范围；未选择时阅读长沙核心河段',pose:{target:[2,0,-1],distance:58,azimuth:.38,polar:1.12}},
  {id:'macro',mode:'macro',name:'宏观 · 湘江全段',description:'铜官窑至昭山，阅读沿江联系',pose:OVERVIEW_POSE},
  {id:'place',mode:'place',name:'地点 · 近景观察',description:'聚焦当前地点；未选择时观察长沙东岸',pose:{target:[8,0,-3],distance:38,azimuth:-.65,polar:1.08}},
];
export {MAP_PLACES as PLACES} from '../places/registry';
import type {Place} from '../places/registry';
export type {Place} from '../places/registry';
export function placePose(place:Place):CameraPose {const [x,z]=project(place.coordinate);if(place.id==='zhaoshan')return {target:[x+11,0,z-16],distance:110,azimuth:-.45,polar:.65};const distance=Math.max(30,place.distance*.85);return {target:[x+distance*.12,0,z-distance*.06],distance,azimuth:.45,polar:1.05};}
export const CAMERA_LIMITS = {minDistance:18,maxDistance:1200,minPolar:.18,maxPolar:1.18};
