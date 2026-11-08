import type {PerspectiveCamera,Object3D,Mesh} from 'three';import type {CameraPose} from '../experience/config';
export interface InspectAnchor{id:string;world:number[];selector:string}
export interface SceneInspection{pose:CameraPose;projection:number[];view:number[];anchors:InspectAnchor[];viewport:{x:number;y:number;width:number;height:number};visuals?:{name:string;visible:boolean;color?:string}[]}
declare global{interface Window{__xiangjiangInspect?:{read:()=>SceneInspection;frame:(pose:CameraPose)=>void}}}
/** Explicit opt-in QA, no render-loop logging or production UI. Only public
 * scene coordinates and camera state; never auth, records or user data. */
export function attachInspection(host:HTMLElement,camera:PerspectiveCamera,pose:()=>CameraPose,anchors:()=>InspectAnchor[],frame:(p:CameraPose)=>void,root?:()=>Object3D|undefined){
 if(!new URLSearchParams(location.search).has('inspect'))return()=>{};
 const api={read:()=>{const r=host.getBoundingClientRect(),visuals:{name:string;visible:boolean;color?:string}[]=[];root?.()?.traverse(o=>{if(/^(home-focus:|study-path:|slope-bin:|profile-cursor|study-edge:)/.test(o.name)){const m=(o as Mesh).material,material=Array.isArray(m)?m[0]:m;visuals.push({name:o.name,visible:o.visible,color:material&&'color'in material?(material.color as {getHexString:()=>string}).getHexString():undefined})}});return {visuals,pose:pose(),projection:[...camera.projectionMatrix.elements],view:[...camera.matrixWorldInverse.elements],anchors:anchors(),viewport:{x:r.x,y:r.y,width:r.width,height:r.height}}},frame:(p:CameraPose)=>{if(p.target.length===3&&[...p.target,p.distance,p.azimuth,p.polar].every(Number.isFinite)&&p.distance>0&&p.distance<=1200)frame(p)}};
 window.__xiangjiangInspect=api;return()=>{if(window.__xiangjiangInspect===api)delete window.__xiangjiangInspect};
}
