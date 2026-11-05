import * as THREE from 'three';
import {overlayViewport,projectOverlay,positionMarker} from '../spatial/overlay';
import type {ResearchModel} from './model';
import type {IslandAsset,IslandStudy,QuarryAsset} from './types';
let islandPromise:Promise<[IslandAsset,IslandStudy]>|undefined,quarryPromise:Promise<QuarryAsset>|undefined;
async function read<T>(path:string):Promise<T>{const r=await fetch(path);if(!r.ok)throw Error('场地数据暂不可用，请重试');return r.json() as Promise<T>}
/** CPU source cache only. GPU resources are owned by a single active site and disposed on exit. */
export function loadIsland(){return islandPromise??=Promise.all([read<IslandAsset>('/data/research/ezhou.json'),read<IslandStudy>('/data/research/ezhou-study.json')]).catch(e=>{islandPromise=undefined;throw e})}
export function loadQuarry(){return quarryPromise??=read<QuarryAsset>('/data/research/quarry.json').catch(e=>{quarryPromise=undefined;throw e})}
export async function createIsland(height:(x:number,z:number)=>number):Promise<ResearchModel>{const [assets,models]=await Promise.all([loadIsland(),import('./model')]);return models.buildIsland(...assets,height)}
export async function createQuarry():Promise<ResearchModel>{const [asset,models]=await Promise.all([loadQuarry(),import('./model')]);return models.buildQuarry(asset)}
const projections=new WeakMap<ResearchModel,{elements:Map<string,HTMLElement>;point:THREE.Vector3;world:THREE.Vector3}>();
export function projectResearchLabels(model:ResearchModel,camera:THREE.Camera,host:HTMLElement){
 const layer=host.parentElement?.querySelector<HTMLElement>('[data-research-markers]');if(!layer)return;let cache=projections.get(model);if(!cache){cache={elements:new Map(),point:new THREE.Vector3(),world:new THREE.Vector3()};projections.set(model,cache)}
 const view=overlayViewport(host,layer),occupied:[number,number][]=[],selected=layer.querySelector('[aria-pressed=true]')?.getAttribute('data-research-node');model.root.updateWorldMatrix(true,false);const lr=layer.getBoundingClientRect(),panels=Array.from(host.parentElement?.querySelectorAll<HTMLElement>('[data-side-panel]:not([hidden]):not([aria-hidden=true])')??[]).map(el=>el.getBoundingClientRect());
 for(const[id,p]of [...model.anchors].sort((a,b)=>Number(b[0]===selected)-Number(a[0]===selected))){let el=cache.elements.get(id);if(!el?.isConnected){el=layer.querySelector<HTMLElement>(`[data-research-node="${id}"]`)??undefined;if(el)cache.elements.set(id,el)}if(!el)continue;
 cache.world.copy(p).applyMatrix4(model.root.matrixWorld);projectOverlay(cache.world,camera,view,cache.point);const{x,y,z}=cache.point;const obscured=panels.some(r=>x+lr.left>r.left-24&&x+lr.left<r.right+24&&y+lr.top>r.top-24&&y+lr.top<r.bottom+24);
 const visible=z>-1&&z<1&&x>24&&x<view.width-24&&y>112&&y<view.height-120&&!obscured&&(!occupied.some(([a,b])=>Math.hypot(a-x,b-y)<36)||selected===id);if(visible)occupied.push([x,y]);positionMarker(el,cache.point);el.style.visibility=visible?'visible':'hidden';el.dataset.edge=x>view.width-220?'right':'left';
 }
}
