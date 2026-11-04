import * as THREE from 'three';
import type {ResearchModel} from './model';
import type {IslandAsset,IslandStudy,QuarryAsset} from './types';
let islandPromise:Promise<[IslandAsset,IslandStudy]>|undefined,quarryPromise:Promise<QuarryAsset>|undefined;
async function read<T>(path:string):Promise<T>{const r=await fetch(path);if(!r.ok)throw Error('场地数据暂不可用，请重试');return r.json() as Promise<T>}
/** CPU source cache only. GPU resources are owned by a single active site and disposed on exit. */
export function loadIsland(){return islandPromise??=Promise.all([read<IslandAsset>('/data/research/ezhou.json'),read<IslandStudy>('/data/research/ezhou-study.json')]).catch(e=>{islandPromise=undefined;throw e})}
export function loadQuarry(){return quarryPromise??=read<QuarryAsset>('/data/research/quarry.json').catch(e=>{quarryPromise=undefined;throw e})}
export async function createIsland(height:(x:number,z:number)=>number):Promise<ResearchModel>{const [assets,models]=await Promise.all([loadIsland(),import('./model')]);return models.buildIsland(...assets,height)}
export async function createQuarry():Promise<ResearchModel>{const [asset,models]=await Promise.all([loadQuarry(),import('./model')]);return models.buildQuarry(asset)}
export function projectResearchLabels(model:ResearchModel,camera:THREE.Camera,host:HTMLElement){const w=host.clientWidth,h=host.clientHeight,v=new THREE.Vector3();for(const [id,p]of model.anchors){const el=host.parentElement?.querySelector<HTMLElement>(`[data-research-node="${id}"]`);if(!el)continue;v.copy(p).project(camera);const x=(v.x+1)*w/2,y=(1-v.y)*h/2;el.style.transform=`translate3d(${x}px,${y}px,0)`;el.style.visibility=v.z>-1&&v.z<1&&x>35&&x<w-35&&y>125&&y<h-135?'visible':'hidden';}}
