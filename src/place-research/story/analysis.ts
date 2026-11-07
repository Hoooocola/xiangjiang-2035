import {project} from '../../experience/geo';
import {quarryHeight,slopeDegrees,accessRoute} from '../analysis';
import {insideRing,ECO_ZONES} from '../../visual-lab/data';
import type {IslandAsset,IslandStudy,LocalPoint,QuarryAsset} from '../types';
import type {Grid,Zone,StoryConfig,Governance,StoryInput} from './types';
export function gridIndex(g:Grid,p:LocalPoint){const x=Math.floor((p[0]-g.minX)/g.cell),z=Math.floor((p[1]-g.minZ)/g.cell);return x<0||z<0||x>=g.width||z>=g.depth?-1:z*g.width+x}
export function heightAt(g:Grid,p:LocalPoint){return g.heights[gridIndex(g,p)]??null}
export function neighbours(g:Grid,i:number){const x=i%g.width,z=Math.floor(i/g.width);return [x>0?i-1:-1,x<g.width-1?i+1:-1,z>0?i-g.width:-1,z<g.depth-1?i+g.width:-1]}
/** Shore-seeded connectivity rejects enclosed depressions. No shoreline-distance buffers. */
export function floodAnalysis(g:Grid,level:number,margin:number){
 if(!Number.isFinite(level)||!Number.isFinite(margin)||margin<0)throw Error('Invalid relative water input');
 const connected=(h:number)=>{const seen=new Uint8Array(g.heights.length),queue:number[]=[];g.heights.forEach((v,i)=>{if(v!==null&&v<=h&&neighbours(g,i).some(n=>n<0||g.heights[n]===null)){seen[i]=1;queue.push(i)}});for(let k=0;k<queue.length;k++)for(const n of neighbours(g,queue[k]))if(n>=0&&!seen[n]&&g.heights[n]!==null&&g.heights[n]!<=h){seen[n]=1;queue.push(n)}return seen};
 const wet=connected(level),warning=connected(level+margin),zones:Zone[]=g.heights.map((h,i)=>h===null?'outside':wet[i]?'flooded':warning[i]||h<=level+margin?'caution':'stable');
 const counts={flooded:0,caution:0,stable:0};for(const z of zones)if(z!=='outside')counts[z]++;
 return {zones,counts,areaHa:Object.fromEntries(Object.entries(counts).map(([z,n])=>[z,n*g.cell*g.cell/10000])) as Record<Exclude<Zone,'outside'>,number>,level,margin};
}
export type Flood=ReturnType<typeof floodAnalysis>;
export const zoneAt=(g:Grid,f:Flood,p:LocalPoint):Zone=>f.zones[gridIndex(g,p)]??'outside';
export const localPoint=(g:Grid,c:[number,number]):LocalPoint=>{const p=project(c);return [p[0]*100-g.centreProjectMeters[0],p[1]*100-g.centreProjectMeters[1]]};
export const lineLength=(ps:LocalPoint[])=>ps.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-ps[i][0],p[1]-ps[i][1]),0);
export function sampleLine(ps:LocalPoint[],spacing=5){const a:{point:LocalPoint;length:number;from:LocalPoint;to:LocalPoint}[]=[];for(let i=1;i<ps.length;i++){const p=ps[i-1],q=ps[i],length=Math.hypot(q[0]-p[0],q[1]-p[1]),n=Math.max(1,Math.ceil(length/spacing));for(let j=0;j<n;j++){const at=(t:number):LocalPoint=>[p[0]+(q[0]-p[0])*t,q[1]+(q[1]-p[1])*t];a.push({point:at((j+.5)/n),length:length/n,from:at(j/n),to:at((j+1)/n)})}}return a}
export interface RoadEdge{id:string;from:number;to:number;points:LocalPoint[];length:number;bridge:boolean}
export interface Roads{nodes:LocalPoint[];edges:RoadEdge[];gate:number;source:string}
/** Existing OSM polylines, snapped within 8m. Geometry connectivity is not a traffic approval. */
export function roadGraph(asset:IslandAsset,g:Grid):Roads{
 const nodes:LocalPoint[]=[],edges:RoadEdge[]=[];
 const node=(p:LocalPoint)=>{const i=nodes.findIndex(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<8);if(i>=0)return i;nodes.push(p);return nodes.length-1};
 for(const [index,f]of asset.features.entries()){
  if(!f.properties.highway||f.geometry.type!=='LineString')continue;
  const ps=(f.geometry.coordinates as [number,number][]).map(c=>localPoint(g,c));
  for(let j=1;j<ps.length;j++){const from=node(ps[j-1]),to=node(ps[j]);if(from===to)continue;edges.push({id:`osm-${index}-${j}`,from,to,points:[nodes[from],nodes[to]],length:lineLength([nodes[from],nodes[to]]),bridge:f.properties.bridge==='yes'})}
 }
 const bridges=edges.filter(e=>e.bridge),ends=bridges.flatMap(e=>[e.from,e.to]);const gate=ends.sort((a,b)=>Math.abs(nodes[b][0])-Math.abs(nodes[a][0]))[0]??0;
 return {nodes,edges,gate,source:'既有 OSM 路网 / 8m 节点归并，桥面高程及通行条件未知'};
}
export function nearestRoad(r:Roads,p:LocalPoint){let id=-1,distance=Infinity;r.nodes.forEach((q,i)=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<distance){id=i;distance=d}});return{id,distance}}
export function roadRoute(r:Roads,start:number,end:number,blocked?:string){
 const dist=new Map([[start,0]]),prev=new Map<number,{node:number;edge:RoadEdge}>(),pending=new Set(r.nodes.map((_,i)=>i)),adj=new Map<number,{to:number;edge:RoadEdge}[]>();
 for(const e of r.edges){if(e.id===blocked)continue;for(const[a,b]of[[e.from,e.to],[e.to,e.from]])adj.set(a,[...(adj.get(a)??[]),{to:b,edge:e}])}
 while(pending.size){let current=-1,best=Infinity;for(const n of pending)if((dist.get(n)??Infinity)<best){current=n;best=dist.get(n)!}if(current<0)break;pending.delete(current);if(current===end)break;for(const a of adj.get(current)??[]){const d=best+a.edge.length;if(d<(dist.get(a.to)??Infinity)){dist.set(a.to,d);prev.set(a.to,{node:current,edge:a.edge})}}}
 if(!dist.has(end))return {connected:false,length:0,edges:[] as RoadEdge[],points:[] as LocalPoint[]};
 const edges:RoadEdge[]=[],points:LocalPoint[]=[r.nodes[end]];let c=end;while(c!==start&&prev.has(c)){const p=prev.get(c)!;edges.unshift(p.edge);points.unshift(r.nodes[p.node]);c=p.node}return{connected:c===start,length:dist.get(end)!,edges,points};
}
export function floodedLength(g:Grid,f:Flood,points:LocalPoint[]){return sampleLine(points).reduce((n,s)=>n+(zoneAt(g,f,s.point)==='flooded'?s.length:0),0)}
export function governanceAnalysis(study:IslandStudy,g:Grid,f:Flood,r:Roads,config:StoryConfig,scenario:Governance,blocked=false){
 const cfg=config.governance.find(c=>c.id===scenario)!,homes=study.nodes.filter(n=>n.kind==='home'),block=blocked?r.edges.find(e=>e.bridge)?.id:undefined;
 const facilities=cfg.candidateIds.map(id=>{const c=config.candidates.find(v=>v.id===id)!,node=study.nodes.find(n=>n.id===c.nodeId)!,point=localPoint(g,node.coordinate);return {...c,...cfg.facilityRoles?.[id],point,zone:zoneAt(g,f,point),road:nearestRoad(r,point)}});
 const links=homes.map(h=>{const point=localPoint(g,h.coordinate),zone=zoneAt(g,f,point),near=nearestRoad(r,point);let candidates=facilities;
  if(scenario==='D'){const wanted=zone==='flooded'?'candidate-c':zone==='caution'?'candidate-a':'candidate-b';candidates=facilities.filter(c=>c.id===wanted)}
  const options=candidates.map(c=>{const route=roadRoute(r,near.id,c.road.id,block);return{facility:c,route,distance:route.connected?(Math.hypot(point[0]-c.point[0],point[1]-c.point[1])<.01?0:near.distance+route.length+c.road.distance):Infinity}}).sort((a,b)=>a.distance-b.distance),best=options[0];
  const connected=!!best?.route.connected&&near.distance<=150&&best.facility.road.distance<=150,points=connected?(best.distance===0?[point]:[point,...best.route.points,best.facility.point]):[];
  return{id:h.id,units:h.serviceUnits??0,point,zone,facility:best?.facility.id??'',connected,distance:connected?lineLength(points):0,points,edgeIds:best?.route.edges.map(e=>e.id)??[],method:scenario==='D'?(zone==='flooded'?'sealed':zone==='caution'?'sewer':'local'):scenario==='A'?'sewer':scenario==='B'?'sealed':'local'};
 });
 const pipeLinks=links.filter(l=>l.connected&&l.method!=='sealed'),transport=facilities.map(c=>{const route=roadRoute(r,c.road.id,r.gate,block);return{facility:c.id,connected:route.connected&&c.road.distance<=150,points:route.connected?[c.point,...route.points]:[],edges:route.edges}});
 const pipeEdges=new Map<string,RoadEdge>(),transportEdges=new Map<string,RoadEdge>();for(const l of pipeLinks)for(const id of l.edgeIds){const e=r.edges.find(e=>e.id===id)!;pipeEdges.set(id,e)}
 for(const t of transport)for(const e of t.edges)transportEdges.set(e.id,e);for(const link of links.filter(l=>l.connected&&l.method==='sealed'))for(const id of link.edgeIds){const edge=r.edges.find(e=>e.id===id)!;transportEdges.set(id,edge)}
 // A has an explicitly hypothetical off-island direction along bridge geometry; never a river outfall.
 if(scenario==='A'||scenario==='D')for(const t of transport.filter(t=>scenario==='A'||t.facility==='candidate-a'))for(const e of t.edges)pipeEdges.set(e.id,e);
 const connectors=new Map<string,LocalPoint[]>();for(const l of pipeLinks){for(const ps of [l.points.slice(0,2),l.points.slice(-2)]){if(ps.length<2)continue;const key=ps.map(p=>p.map(n=>n.toFixed(3)).join(',')).sort().join('|');connectors.set(key,ps)}}
 const transportAttachments=new Map<string,LocalPoint[]>();const attach=(ps:LocalPoint[])=>{if(ps.length<2)return;const key=ps.map(p=>p.map(n=>n.toFixed(3)).join(',')).sort().join('|');transportAttachments.set(key,ps)};for(const l of links.filter(l=>l.connected&&l.method==='sealed')){attach(l.points.slice(0,2));attach(l.points.slice(-2))}for(const c of facilities.filter(c=>c.road.distance<=150))attach([c.point,r.nodes[c.road.id]]);const transportConnectors=[...transportAttachments.values()];
 const pipeConnectors=[...connectors.values()],pipeMeters=[...pipeEdges.values()].reduce((n,e)=>n+e.length,0)+pipeConnectors.reduce((n,ps)=>n+lineLength(ps),0),transportMeters=[...transportEdges.values()].reduce((n,e)=>n+e.length,0)+transportConnectors.reduce((n,ps)=>n+lineLength(ps),0),affectedRouteMeters=[...transportEdges.values()].filter(e=>!e.bridge).reduce((n,e)=>n+floodedLength(g,f,e.points),0);
 return {scenario,name:cfg.name,facilities,links,transport,pipeEdges:[...pipeEdges.values()],pipeConnectors,transportEdges:[...transportEdges.values()],transportConnectors,covered:links.filter(l=>l.connected).length,units:links.filter(l=>l.connected).reduce((n,l)=>n+l.units,0),pipeMeters,transportMeters,affectedRouteMeters,affectedFacilities:facilities.filter(c=>c.zone==='flooded').length,cautionFacilities:facilities.filter(c=>c.zone==='caution').length,dependencies:cfg.dependencies,offIslandConnected:transport.every(t=>t.connected),blockedEdge:block??null};
}
export type GovernanceResult=ReturnType<typeof governanceAnalysis>;
/** Continuous terrain-following intervals; all lengths computed, not authored result values. */
export function quarryRoutes(asset:QuarryAsset,config:StoryConfig,input:Pick<StoryInput,'slopeMin'|'slopeMax'|'route'|'blocked'>){
 if(input.slopeMin<0||input.slopeMax>90||input.slopeMin>input.slopeMax)throw Error('坡度区间无效');
 const access=accessRoute(asset,'west',input.blocked?'access-entry':undefined),entry=asset.access?.nodes.find(n=>n.id===asset.access?.entryId)?.point;
 return config.quarryRoutes.map(s=>{const paths=s.paths.map(p=>{let length=0,steep=0,eco=0,water=0;const slopeSegments:LocalPoint[][]=[],ecoSegments:LocalPoint[][]=[];let sr:LocalPoint[]|null=null,er:LocalPoint[]|null=null;for(const sample of sampleLine(p.points,2)){const h1=quarryHeight(...sample.from,asset.outline),h2=quarryHeight(...sample.to,asset.outline),distance=Math.hypot(sample.length,h2-h1),angle=slopeDegrees(...sample.point,asset.outline),hit=angle>=input.slopeMin&&angle<=input.slopeMax,inEco=insideRing(...sample.point,ECO_ZONES[0].ring);length+=distance;if(hit){steep+=distance;if(!sr){sr=[sample.from];slopeSegments.push(sr)}sr.push(sample.to)}else sr=null;if(inEco){eco+=distance;if(!er){er=[sample.from];ecoSegments.push(er)}er.push(sample.to)}else er=null;if(quarryHeight(...sample.point,asset.outline)<.1)water+=distance}
  const target=asset.nodes.find(n=>n.id===p.to),connected=!!entry&&!!target&&Math.hypot(p.points[0][0]-entry[0],p.points[0][1]-entry[1])<1&&Math.hypot(p.points.at(-1)![0]-target.point[0],p.points.at(-1)![1]-target.point[1])<1;
  return{...p,length,planar:lineLength(p.points),steep,eco,water,slopeSegments,ecoSegments,connected:connected&&access.connected};});return{id:s.id,name:s.name,paths,length:paths.reduce((n,p)=>n+p.length,0),steep:paths.reduce((n,p)=>n+p.steep,0),eco:paths.reduce((n,p)=>n+p.eco,0),water:paths.reduce((n,p)=>n+p.water,0),connected:paths.filter(p=>p.connected).length,access};});
}
