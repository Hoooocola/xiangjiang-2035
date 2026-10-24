import { project } from './geo';
export type CameraPose = { target: [number,number,number]; distance: number; azimuth: number; polar: number };
export const CAMERA_PRESETS: {id:string;name:string;description:string;pose:CameraPose}[] = [
  {id:'river',name:'沿江 · 纵深',description:'南向北，洲岛与两岸同框',pose:{target:[2,0,-1],distance:75,azimuth:0.38,polar:1.00}},
  {id:'city',name:'隔江 · 望城',description:'从岳麓一侧看东岸城市',pose:{target:[1,0,-3],distance:65,azimuth:-0.9,polar:0.94}},
  {id:'island',name:'洲岛 · 全貌',description:'较高视点阅读河道与洲岛',pose:{target:[0,0,-1],distance:100,azimuth:0.12,polar:0.40}},
];
export const OVERVIEW_POSE: CameraPose = {target:[-55,0,-4],distance:1080,azimuth:0.05,polar:0.24};
export {MAP_PLACES as PLACES} from '../places/registry';
import type {Place} from '../places/registry';
export type {Place} from '../places/registry';
export function placePose(place:Place):CameraPose {const [x,z]=project(place.coordinate);if(place.id==='zhaoshan')return {target:[x+11,0,z-16],distance:110,azimuth:-.45,polar:.65};return {target:[x+place.distance*.09,0,z-place.distance*.04],distance:place.distance,azimuth:0.45,polar:0.88};}
export const CAMERA_LIMITS = {minDistance:23,maxDistance:1200,minPolar:0.18,maxPolar:1.02};
