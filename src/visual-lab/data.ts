import {quarryHeight,slopeDegrees} from '../place-research/analysis';
import type{QuarryAsset,LocalPoint}from'../place-research/types';
export type LabScene='E-03'|'P-02'|'P-03';export type LabMode='entity'|'reveal'|'technical';
export const SECTION_OFFSETS=[-240,-180,-120,-60,0,60,120,180,240];
export function sectionSamples(asset:QuarryAsset,offset:number,axis:'east-west'|'north-south'='north-south'){
 return Array.from({length:161},(_,i)=>{const distance=-400+i*5,x=axis==='north-south'?offset:distance,z=axis==='north-south'?distance:offset;return{distance,x,z,height:quarryHeight(x,z,asset.outline),water:quarryHeight(x,z,asset.outline)===0}});
}
export const ECO_ZONES:{id:string;name:string;kind:'vegetation'|'rock';ring:LocalPoint[]}[]=[
 {id:'eco-01',name:'生态研究区 01',kind:'vegetation',ring:[[-365,-300],[-245,-365],[-135,-335],[-115,-245],[-195,-175],[-315,-190],[-390,-235]]},
 {id:'rock-01',name:'裸露岩壁研究区',kind:'rock',ring:[[-235,-180],[-165,-250],[-70,-240],[5,-195],[-35,-135],[-125,-110],[-195,-125]]}
];
export function insideRing(x:number,z:number,ring:LocalPoint[]){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[a,b]=ring[i],[c,d]=ring[j];if((b>z)!=(d>z)&&x<(c-a)*(z-b)/(d-b)+a)hit=!hit}return hit}
export function zoneStats(asset:QuarryAsset,ring:LocalPoint[],crowns:{x:number;z:number;radius:number}[],cell=4){
 let count=0,covered=0,min=90,max=0;const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
 for(let x=Math.min(...xs)+cell/2;x<Math.max(...xs);x+=cell)for(let z=Math.min(...zs)+cell/2;z<Math.max(...zs);z+=cell){if(!insideRing(x,z,ring))continue;count++;const s=slopeDegrees(x,z,asset.outline);min=Math.min(min,s);max=Math.max(max,s);if(crowns.some(c=>Math.hypot(c.x-x,c.z-z)<=c.radius))covered++}
 return{areaHa:count*cell*cell/10000,coverPercent:count?covered/count*100:0,minSlope:min,maxSlope:max,cells:count,cell};
}
