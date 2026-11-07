// Crop existing licensed context, without altering the island or analytical terrain.
import fs from 'node:fs';import clip from 'polygon-clipping';import {ShapeUtils,Vector2} from 'three';
const read=p=>JSON.parse(fs.readFileSync(p)),river=read('public/data/research/ezhou-river-context.json'),grid=read('public/data/terrain.json'),context=read('public/data/context.json'),studyGrid=read('public/data/research/ezhou-relative-grid.json'),centre=studyGrid.centreProjectMeters.map(n=>n/100);
const inside=(x,z,ring)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[a,b]=ring[i],[c,d]=ring[j];if((b>z)!=(d>z)&&x<(c-a)*(z-b)/(d-b)+a)hit=!hit}return hit};
function sample(values,x,z){const u=Math.max(0,Math.min(grid.width-1.001,(x-grid.x0)/grid.dx)),v=Math.max(0,Math.min(grid.height-1.001,(z-grid.z0)/grid.dz)),a=Math.floor(u),b=Math.floor(v),i=b*grid.width+a,f=u-a,t=v-b;return(values[i]*(1-f)+values[i+1]*f)*(1-t)+(values[i+grid.width]*(1-f)+values[i+grid.width+1]*f)*t}
const height=(x,z)=>{const d=sample(grid.riverDistance,x,z)/10,t=Math.max(0,Math.min(1,(d-2.5)/3));return Math.max(0,(sample(grid.elevations,x,z)/10-42))*t*t*(3-2*t)};
const positions=[],mask=[...river.features.flatMap(f=>f.geometry),[studyGrid.ring]];
for(let x=-4000;x<4000;x+=80)for(let z=-4000;z<4000;z+=80){
 const cell=[[[x,z],[x+80,z],[x+80,z+80],[x,z+80],[x,z]]];
 const clipped=clip.difference(cell,...mask);
 for(const polygon of clipped){const rings=polygon.map(r=>r.slice(0,-1).map(p=>new Vector2(p[0],p[1]))),flat=rings.flat(),tri=ShapeUtils.triangulateShape(rings[0],rings.slice(1));for(const t of tri)for(const i of t){const p=flat[i];positions.push(p.x,height(p.x/100+centre[0],p.y/100+centre[1]),p.y)}}
}
const buildings=context.buildings.filter(b=>Math.abs((b[0]-centre[0])*100)<2400&&Math.abs((b[1]-centre[1])*100)<3100&&!inside((b[0]-centre[0])*100,(b[1]-centre[1])*100,studyGrid.ring)).map(b=>[(b[0]-centre[0])*100,(b[1]-centre[1])*100,b[2]*100,b[3]*100,b[4],b[5],height(b[0],b[1])]);
const data={state:'RECONSTRUCTED visual context / not analysis terrain',source:context.source,license:context.license,attribution:context.attribution,method:'80m sampled existing visual DEM; existing Overture oriented boxes cropped to surrounding banks. Heights are inherited display estimates.',positions,buildings};fs.writeFileSync('public/data/research/ezhou-bank-context.json',JSON.stringify(data));console.log({triangles:positions.length/9,buildings:buildings.length});
