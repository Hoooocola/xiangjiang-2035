import {CULTURE_NODES, DEMO_NODES, type ExplorationState} from './data';
import type {Coordinate} from '../experience/geo';

export type NodeKind = 'culture' | 'services' | 'commerce';
export interface ResourceNode {
 id:string; kind:NodeKind; name:string; coordinate:Coordinate; category:string;
 source:string[]; precision:string; description:string; demo:boolean; placeId?:string;
}
export const RESOURCE_NODES:ResourceNode[] = [
 ...CULTURE_NODES.map(n=>({...n,kind:'culture' as const,category:'文化景观 / 地点索引',source:Array.isArray(n.source)?n.source:[n.source],demo:false,placeId:n.id})),
 ...DEMO_NODES.map(n=>({...n,kind:n.kind as 'services'|'commerce',category:n.kind==='services'?'公共服务示意节点':'商业服务示意节点',source:[n.source],demo:true})),
];
export const ANALYSIS_RADII=[500,1000,2000,3000] as const;
export const MAP_BOUNDS=[112.73,27.92,113.08,28.49] as const;
export function usableCoordinate(p:readonly number[]|null|undefined):p is Coordinate {
 return !!p&&p.length===2&&p.every(Number.isFinite)&&p[0]>=MAP_BOUNDS[0]&&p[0]<=MAP_BOUNDS[2]&&p[1]>=MAP_BOUNDS[1]&&p[1]<=MAP_BOUNDS[3];
}
const radians=(v:number)=>v*Math.PI/180;
/** Great-circle centre-to-point distance, metres. Never a walking-distance claim. */
export function distanceMeters(a:Coordinate,b:Coordinate):number {
 const dlat=radians(b[1]-a[1]),dlon=radians(b[0]-a[0]);
 const h=Math.sin(dlat/2)**2+Math.cos(radians(a[1]))*Math.cos(radians(b[1]))*Math.sin(dlon/2)**2;
 return 6371008.8*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
}
export function destination(center:Coordinate,metres:number,bearing:number):Coordinate {
 const d=metres/6371008.8,lat=radians(center[1]),lon=radians(center[0]);
 const phi=Math.asin(Math.sin(lat)*Math.cos(d)+Math.cos(lat)*Math.sin(d)*Math.cos(bearing));
 return [(lon+Math.atan2(Math.sin(bearing)*Math.sin(d)*Math.cos(lat),Math.cos(d)-Math.sin(lat)*Math.sin(phi)))*180/Math.PI,phi*180/Math.PI];
}
export function activeNodes(state:ExplorationState):ResourceNode[] {
 return RESOURCE_NODES.filter(n=>state[n.kind]&&usableCoordinate(n.coordinate));
}
export function focusedNode(state:ExplorationState):ResourceNode|undefined {
 return activeNodes(state).find(n=>n.id===state.focusId);
}
export function analyzeResources(centerId:string,radius:number) {
 const center=RESOURCE_NODES.find(n=>n.id===centerId&&n.kind==='culture');
 if(!center||!usableCoordinate(center.coordinate)||!ANALYSIS_RADII.some(r=>r===radius))return null;
 const candidates=RESOURCE_NODES.filter(n=>n.kind!=='culture'&&usableCoordinate(n.coordinate)).map(n=>({...n,distanceMeters:distanceMeters(center.coordinate,n.coordinate)}));
 const matches=candidates.filter(n=>n.distanceMeters<=radius).sort((a,b)=>a.distanceMeters-b.distanceMeters||a.id.localeCompare(b.id));
 return {center,radius,matches,services:matches.filter(n=>n.kind==='services').length,commerce:matches.filter(n=>n.kind==='commerce').length,candidateCount:candidates.length,
  method:'WGS84 球面大圆直线距离 ≤ 半径；R=6,371,008.8m；按节点ID去重',
  question:matches.length?`在${center.name}周边${radius}m演示范围内，公共服务样本${matches.filter(n=>n.kind==='services').length}个、商业样本${matches.filter(n=>n.kind==='commerce').length}个；这种示意分布提示现场调查应如何比较不同人群的实际使用便利性？`:`${center.name}周边${radius}m内未命中当前6个DEMO设施样本。应如何补充真实设施调查，以核实滨江文化空间的实际使用便利性？`,
  limitation:'演示数据 / 非真实研究结论。数量是示意样本数，不是设施普查；直线邻近不等于步行可达或服务不足。'};
}
export type ResourceAnalysis=NonNullable<ReturnType<typeof analyzeResources>>;
export function stateAnalysis(state:ExplorationState) {
 return focusedNode(state)&&state.analysisRadius?analyzeResources(state.focusId!,state.analysisRadius):null;
}
export function analysisBoundary(center:Coordinate,radius:number):Coordinate[] {
 return Array.from({length:65},(_,i)=>destination(center,radius,i/64*Math.PI*2));
}

export interface ScreenNode {id:string;kind:NodeKind;x:number;y:number}
/** Bounded nine-node overview. Clusters preserve all IDs and stay within one theme. */
export function clusterScreenNodes(points:ScreenNode[],selected:string|null|undefined,threshold=44) {
 const groups:{point:ScreenNode;ids:string[]}[]=[];
 for(const point of [...points].sort((a,b)=>Number(b.id===selected)-Number(a.id===selected)||a.id.localeCompare(b.id))){
  const group=point.id===selected?undefined:groups.find(g=>g.point.kind===point.kind&&g.point.id!==selected&&Math.hypot(point.x-g.point.x,point.y-g.point.y)<threshold);
  if(group)group.ids.push(point.id);else groups.push({point,ids:[point.id]});
 }
 return groups;
}
