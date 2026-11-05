import type {IslandStudy,LocalPoint,QuarryAsset} from './types';
/** Connectivity is graph reachability, never a prewritten count or distance buffer. */
export function connectedHomes(study:IslandStudy){
 const adjacency=new Map<string,string[]>();for(const edge of study.edges){adjacency.set(edge.from,[...(adjacency.get(edge.from)??[]),edge.to]);adjacency.set(edge.to,[...(adjacency.get(edge.to)??[]),edge.from]);}
 const reachable=new Set(study.serviceIds),queue=[...reachable];while(queue.length){for(const id of adjacency.get(queue.shift()!)??[])if(!reachable.has(id)){reachable.add(id);queue.push(id);}}
 const homes=study.nodes.filter(n=>n.kind==='home');return {connected:homes.filter(n=>reachable.has(n.id)).map(n=>n.id),unconnected:homes.filter(n=>!reachable.has(n.id)).map(n=>n.id)};
}
/** Local reconstruction coordinates in metres, no GIS registration or surveyed elevations. */
export function quarryRadius(angle:number,outline:LocalPoint[]){let nearest=0,delta=Infinity;for(let i=0;i<outline.length;i++){const a=Math.atan2(outline[i][1],outline[i][0]),d=Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)));if(d<delta){delta=d;nearest=i;}}const a=outline[nearest],next=outline[(nearest+(Math.atan2(Math.sin(angle-Math.atan2(a[1],a[0])),Math.cos(angle-Math.atan2(a[1],a[0])))>=0?1:outline.length-1))%outline.length];const cross=(p:LocalPoint,q:LocalPoint)=>p[0]*q[1]-p[1]*q[0];const ray:LocalPoint=[Math.cos(angle),Math.sin(angle)],edge:LocalPoint=[next[0]-a[0],next[1]-a[1]],den=cross(ray,edge);return Math.abs(den)<1e-8?Math.hypot(...a):Math.abs(cross(a,edge)/den);}
export function quarryHeight(x:number,z:number,outline:LocalPoint[]){
 const angle=Math.atan2(z,x),r=Math.hypot(x,z),shore=quarryRadius(angle,outline);if(r<shore)return 0;
 const rim=47+12*Math.sin(angle*2+.4)+7*Math.cos(angle*5),width=49+12*Math.sin(angle*3-.6)+8*Math.cos(angle*7),t=(r-shore)/width;
 if(t>=1)return rim+Math.sin(x*.026)*Math.cos(z*.019)*7+Math.min(18,(t-1)*5);
 const rise=t<.18?t/.18*.12:t<.62?.12+(t-.18)/.44*.62:t<.73?.74+(t-.62)/.11*.025:.765+(t-.73)/.27*.235;
 const fractured=(Math.sin(x*.17+z*.09)+.5*Math.sin(x*.37-z*.21))*.8*Math.sin(t*Math.PI);
 return Math.max(0,rim*rise+fractured);
}
export function slopeDegrees(x:number,z:number,outline:LocalPoint[]){const d=2,dx=(quarryHeight(x+d,z,outline)-quarryHeight(x-d,z,outline))/(2*d),dz=(quarryHeight(x,z+d,outline)-quarryHeight(x,z-d,outline))/(2*d);return Math.atan(Math.hypot(dx,dz))*180/Math.PI;}
export function analyzePaths(asset:QuarryAsset,threshold:number){if(!Number.isFinite(threshold)||threshold<0||threshold>90)throw Error('坡度参数范围为0–90°');return asset.paths.map(path=>{let total=0,overlap=0;const hits:LocalPoint[]=[];for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(length/2));for(let j=0;j<steps;j++){const t=(j+.5)/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;total+=length/steps;if(slopeDegrees(x,z,asset.outline)>threshold){overlap+=length/steps;hits.push([x,z]);}}}return {id:path.id,name:path.name,totalMeters:total,overlapMeters:overlap,hits};});}
export function profile(asset:QuarryAsset,axis:'east-west'|'north-south'){return Array.from({length:161},(_,i)=>{const distance=-400+i*5,x=axis==='east-west'?distance:0,z=axis==='north-south'?distance:0;return {distance,height:quarryHeight(x,z,asset.outline),water:Math.hypot(x,z)<quarryRadius(Math.atan2(z,x),asset.outline)};});}

export function traceConnection(study:IslandStudy,id:string){
 const queue=[...study.serviceIds],previous=new Map<string,{node:string;edge:string}>(),seen=new Set(queue);
 while(queue.length){const current=queue.shift()!;for(const e of study.edges){const next=e.from===current?e.to:e.to===current?e.from:null;if(next&&!seen.has(next)){seen.add(next);previous.set(next,{node:current,edge:e.id});queue.push(next)}}}
 if(!seen.has(id))return {connected:false,nodeIds:[id],edgeIds:[] as string[],serviceId:null};
 const nodeIds=[id],edgeIds:string[]=[];let current=id;while(previous.has(current)){const p=previous.get(current)!;edgeIds.unshift(p.edge);nodeIds.unshift(p.node);current=p.node;}
 return {connected:true,nodeIds,edgeIds,serviceId:current};
}
export function slopeDistribution(asset:QuarryAsset,cell=24){
 const bins=[{min:0,max:10,count:0},{min:10,max:20,count:0},{min:20,max:35,count:0},{min:35,max:50,count:0},{min:50,max:90,count:0}],samples:{point:LocalPoint;bin:number}[]=[];
 for(let x=-480+cell/2;x<480;x+=cell)for(let z=-480+cell/2;z<480;z+=cell){if(Math.hypot(x,z)<quarryRadius(Math.atan2(z,x),asset.outline))continue;const angle=slopeDegrees(x,z,asset.outline),bin=Math.max(0,bins.findIndex((b,i)=>angle>=b.min&&(angle<b.max||i===4)));bins[bin].count++;samples.push({point:[x,z],bin})}
 return {bins:bins.map(b=>({...b,area:b.count*cell*cell,percent:b.count/samples.length*100})),samples,cell,total:samples.length};
}
export function accessRoute(asset:QuarryAsset,from:string,blocked?:string){
 const graph=asset.access;if(!graph)return {connected:false,length:0,rise:0,nodes:[] as string[],edges:[] as string[]};
 const distances=new Map([[from,0]]),previous=new Map<string,{node:string;edge:string}>(),pending=new Set(graph.nodes.map(n=>n.id));
 const length=(points:LocalPoint[])=>points.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
 while(pending.size){const current=[...pending].sort((a,b)=>(distances.get(a)??Infinity)-(distances.get(b)??Infinity))[0],d=distances.get(current);if(d===undefined)break;pending.delete(current);for(const edge of graph.edges){if(edge.id===blocked)continue;const next=edge.from===current?edge.to:edge.to===current?edge.from:null;if(!next)continue;const candidate=d+length(edge.points);if(candidate<(distances.get(next)??Infinity)){distances.set(next,candidate);previous.set(next,{node:current,edge:edge.id})}}}
 const target=graph.entryId;if(!distances.has(target))return {connected:false,length:0,rise:0,nodes:[from],edges:[]};const nodes=[target],edges:string[]=[];let current=target;while(previous.has(current)){const p=previous.get(current)!;nodes.unshift(p.node);edges.unshift(p.edge);current=p.node;}
 const elevations=nodes.map(id=>{const p=graph.nodes.find(n=>n.id===id)!.point;return quarryHeight(...p,asset.outline)});return {connected:true,length:distances.get(target)!,rise:Math.max(...elevations)-Math.min(...elevations),nodes,edges};
}
