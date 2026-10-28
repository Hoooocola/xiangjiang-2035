/** Approval diagram only. Reads the production sampler; never writes source GIS or scene settings. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {terrainSampler, type TerrainGrid} from '../../src/experience/terrain';
import {connectedAreas} from '../../src/experience/aoi';
import {project, polygons, type SceneData} from '../../src/experience/geo';

const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const grid=read('public/data/terrain.json') as TerrainGrid;
const data=read('public/data/xiangjiang.geojson') as SceneData;
const areas=read('src/experience/aoi/focus-areas.json');
const terrain=terrainSampler(grid),connected=connectedAreas(terrain.distance,areas);
const box={x:-80,z:-60,w:145,h:120},step=.5,pad=10;
const cols=box.w/step+pad*2,rows=box.h/step+pad*2;
const weights=new Float32Array(cols*rows),inside=new Uint8Array(cols*rows),distance=new Float32Array(cols*rows);
let candidateOutside=0,currentStrong=0,candidateStrong=0,support=0;
for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
 const i=r*cols+c,x=box.x+(c-pad+.5)*step,z=box.z+(r-pad+.5)*step;
 weights[i]=terrain.importance(x,z);inside[i]=weights[i]>0?1:0;distance[i]=inside[i]?1e6:0;
}
// Approximate inward distance to the EXISTING sampled support, 50 m cells.
// Padding ensures the review frame is not mistaken for an AOI edge.
const diagonal=Math.SQRT2;
for(let r=1;r<rows;r++)for(let c=1;c<cols-1;c++){
 const i=r*cols+c;distance[i]=Math.min(distance[i],distance[i-1]+1,distance[i-cols]+1,distance[i-cols-1]+diagonal,distance[i-cols+1]+diagonal);
}
for(let r=rows-2;r>=0;r--)for(let c=cols-2;c>0;c--){
 const i=r*cols+c;distance[i]=Math.min(distance[i],distance[i+1]+1,distance[i+cols]+1,distance[i+cols-1]+diagonal,distance[i+cols+1]+diagonal);
}
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const candidate=Array.from(distance,(v,i)=>inside[i]?smooth(Math.max(0,v-.5)*step/2):0);
for(let r=pad;r<rows-pad;r++)for(let c=pad;c<cols-pad;c++){
 const i=r*cols+c;support+=inside[i];currentStrong+=weights[i]>=.8?1:0;candidateStrong+=candidate[i]>=.8?1:0;
 if(candidate[i]>0&&!inside[i])candidateOutside++;
}
if(candidateOutside)throw new Error('Candidate escaped existing support');
const W=688,H=W*box.h/box.w;
const sx=(x:number)=>(x-box.x)/box.w*W,sy=(z:number)=>(z-box.z)/box.h*H;
const path=(rings:number[][][])=>rings.map(r=>r.map(([x,z],i)=>`${i?'L':'M'}${sx(x).toFixed(2)},${sy(z).toFixed(2)}`).join('')+'Z').join('');
const geoPath=(rings:[number,number][][])=>path(rings.map(r=>r.map(project)));
const intersects=(rings:number[][][])=>{const all=rings.flat();return all.some(([x,z])=>x>=box.x&&x<=box.x+box.w&&z>=box.z&&z<=box.z+box.h);};
function heat(values:ArrayLike<number>){
 let s='';
 for(let r=pad;r<rows-pad;r++){
  let c=pad;
  while(c<cols-pad){const q=Math.ceil(values[r*cols+c]*10);let e=c+1;while(e<cols-pad&&Math.ceil(values[r*cols+e]*10)===q)e++;
   if(q)s+=`<rect x="${((c-pad)*step/box.w*W).toFixed(2)}" y="${((r-pad)*step/box.h*H).toFixed(2)}" width="${((e-c)*step/box.w*W+.06).toFixed(2)}" height="${(step/box.h*H+.06).toFixed(2)}" fill="#b7a078" opacity="${(q*.065).toFixed(3)}"/>`;
   c=e;
  }
 }
 return s;
}
function contour(mask:(i:number)=>boolean){let s='';for(let r=pad;r<rows-pad;r++)for(let c=pad;c<cols-pad;c++){
 const i=r*cols+c;if(!mask(i))continue;const x=(c-pad)*step/box.w*W,y=(r-pad)*step/box.h*H,k=step/box.w*W;
 if(!mask(i-1))s+=`M${x},${y}v${k}`;if(!mask(i+1))s+=`M${x+k},${y}v${k}`;
 if(!mask(i-cols))s+=`M${x},${y}h${k}`;if(!mask(i+cols))s+=`M${x},${y+k}h${k}`;
}return s;}
let waters='',parks='',roads='',buildings='';
for(const f of data.features){const p=f.properties;
 if(f.geometry.type==='LineString'){
  if(!/^(motorway|trunk|primary|secondary|tertiary)/.test(p.highway??''))continue;
  const ps=f.geometry.coordinates.map(project);if(!intersects([ps]))continue;
  roads+=`<path d="${ps.map(([x,z],i)=>`${i?'L':'M'}${sx(x).toFixed(2)},${sy(z).toFixed(2)}`).join('')}"/>`;
 }else for(const rings of polygons(f)){
  const ps=rings.map(r=>r.map(project));if(!intersects(ps))continue;
  const d=geoPath(rings);
  if(p.water==='river'||p.waterway==='riverbank')waters+=`<path d="${d}"/>`;
  else if(p.leisure==='park'||p.natural==='wood'||p.landuse==='forest')parks+=`<path d="${d}"/>`;
  else if(p.building||p['building:part'])buildings+=`<path d="${d}"/>`;
 }
}
const local=connected.filter(a=>a.polygons.some(intersects));
let extensions='',labels='';
for(const a of local){extensions+=a.polygons.map(p=>`<path d="${path(p)}"/>`).join('');
 if(!['橘子洲','岳麓山','后湖','开福寺','西湖公园'].includes(a.area.name))continue;
 const points=a.polygons.flat(2),x=points.reduce((v,p)=>v+p[0],0)/points.length,z=points.reduce((v,p)=>v+p[1],0)/points.length;
 labels+=`<g transform="translate(${sx(x)},${sy(z)})"><circle r="3.5" fill="#153d44"/><text x="8" y="-6" font-size="13" paint-order="stroke" stroke="#f4f1e9" stroke-width="4" stroke-linejoin="round">${a.area.name}</text></g>`;
}
const boundary=contour(i=>!!inside[i]),core=contour(i=>weights[i]>=.999),band=contour(i=>candidate[i]>=.999);
function map(values:ArrayLike<number>,isCandidate:boolean){return `<rect width="${W}" height="${H}" fill="#ece9e2"/>
 <g clip-path="url(#clip)">${heat(values)}<g fill="#9ba78c" opacity=".6" fill-rule="evenodd">${parks}</g><g fill="#657174" opacity=".28">${buildings}</g><g fill="none" stroke="#615f57" stroke-width=".6" opacity=".65">${roads}</g><g fill="#497c85" stroke="#f5f1e8" stroke-width=".6" fill-rule="evenodd">${waters}</g><g class="extensions" fill="none" stroke="#8b70a1" stroke-width="1.3" stroke-dasharray="4 3">${extensions}</g><path d="${boundary}" fill="none" stroke="#264f46" stroke-width="1.8"/><path d="${isCandidate?band:core}" fill="none" stroke="${isCandidate?'#b78745':'#728d91'}" stroke-width="1" stroke-dasharray="4 3"/>${labels}</g>
 <text x="22" y="28" font-size="13" fill="#254745">N ↑</text><g transform="translate(22,${H-25})"><path d="M0,-4v8M0,0h${10/box.w*W}m0,-4v8" stroke="#254745"/><text x="0" y="-9" font-size="12">1 km</text></g>`;}
const map1=map(weights,false),map2=map(candidate,true);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1520" height="1030" viewBox="0 0 1520 1030"><defs><clipPath id="clip"><rect width="${W}" height="${H}"/></clipPath></defs><style>text{font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#263d3a}</style><rect width="1520" height="1030" fill="#f6f3ed"/><text x="48" y="45" font-size="12" letter-spacing="3">XIANGJIANG 2035 · V4 / BOUNDARY REVIEW 01</text><text x="48" y="88" font-size="29">同一地理范围，建立清晰的主体材质分区</text><text x="48" y="119" font-size="15">金色表示主体资格，不表示整片铺装；本图不是最终配色，也不是新的三维 Style Frame。</text>
 <text x="48" y="166" font-size="20">01 现状：长距离渐变</text><text x="784" y="166" font-size="20">02 推荐候选：外边界不动，向内约 200 m 混合</text>
 <g transform="translate(48,187)">${map1}</g><g transform="translate(784,187)">${map2}</g>
 <text x="48" y="790" font-size="14">现有沿江权重：距河 900 m 内强调，至 2600 m 逐渐减弱；叠加相连场域。</text>
 <text x="784" y="790" font-size="14">外围仍为背景；原来弱化的内侧地带将变为更完整的主体。</text>
 <path d="M48,826h35" stroke="#264f46" stroke-width="3"/><text x="94" y="831" font-size="14">现有支持范围外边界（两图相同）</text><path d="M480,826h35" stroke="#8b70a1" stroke-width="2" stroke-dasharray="4 3"/><text x="526" y="831" font-size="14">已有相连场域几何</text><path d="M900,826h35" stroke="#b78745" stroke-width="2" stroke-dasharray="4 3"/><text x="946" y="831" font-size="14">候选短混合带内缘</text>
 <rect x="48" y="863" width="1424" height="108" rx="8" fill="#e9e4d9"/><text x="70" y="894" font-size="18">这次只需判断：是否接受右图的主体宽度，以及向内收短的混合方式？</text><text x="70" y="925" font-size="15">水体保持水材质，绿地保持植被材质；建筑、硬质地面、道路分别表现，不把整片区域染成米黄色。</text><text x="70" y="951" font-size="13">审阅网格 50 m；继承现有地理采样精度。200 m 是待验收候选，不是测绘边界。图框仅为审阅窗口。</text>
 <text x="48" y="1003" font-size="12">来源：项目内 OSM 河岸／路网／建筑及现有 terrain + focus-areas；未修改生产场景、地点坐标或 AOI。</text></svg>`;
fs.writeFileSync('public/v4-boundary-review/boundary.svg',svg);
const metadata={bounds:box,cellMeters:50,inwardBlendMeters:200,supportCells:support,currentStrongCells:currentStrong,candidateStrongCells:candidateStrong,candidateOutsideCells:candidateOutside,localAreas:local.map(a=>a.area.name),note:'Cell counts include water and vegetation; not hardscape areas. Existing sampler > 0 defines support; no new geographic domain.',inputs:Object.fromEntries(['public/data/terrain.json','public/data/xiangjiang.geojson','src/experience/aoi/focus-areas.json'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
fs.writeFileSync('docs/v4/boundary-review-metadata.json',JSON.stringify(metadata,null,2));
console.log(JSON.stringify(metadata,null,2));
