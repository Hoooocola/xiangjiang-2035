import {Vector3,type Camera} from 'three';
import {project} from '../experience/geo';
import {overlayViewport,projectOverlay,positionMarker} from '../spatial/overlay';
import {activeNodes,clusterScreenNodes,stateAnalysis,type ScreenNode,type ResourceNode} from './relations';
import type {ExplorationState} from './data';

/** Positions only: no React render loop, listeners, meshes, or duplicated renderer. */
export function createResourceMarkers(elements:Map<string,HTMLButtonElement>,height:(x:number,z:number)=>number){
 const point=new Vector3();let previous:ExplorationState|undefined,active:ResourceNode[]=[],matched:Set<string>|null=null,focusId:string|null=null;
 return (state:ExplorationState,camera:Camera,width:number,viewportHeight:number,host?:HTMLElement)=>{
  const layer=elements.values().next().value?.parentElement;const view=host&&layer?overlayViewport(host,layer):{left:0,top:0,width,height:viewportHeight};
  if(previous!==state){previous=state;active=activeNodes(state);focusId=active.some(n=>n.id===state.focusId)?state.focusId!:null;const analysis=stateAnalysis(state);matched=analysis?new Set([analysis.center.id,...analysis.matches.map(n=>n.id)]):null;}
  const projected:ScreenNode[]=[];
  for(const node of active){
   if(matched&&!matched.has(node.id))continue;
   const [x,z]=project(node.coordinate);projectOverlay(point.set(x,height(x,z)+.18,z),camera,view,point);
   const px=point.x,py=point.y;
   if(point.z>-1&&point.z<1&&px>24&&px<width-24&&py>128&&py<viewportHeight-140)projected.push({id:node.id,kind:node.kind,x:px,y:py});
  }
  const groups=clusterScreenNodes(projected,focusId),shown=new Set(groups.map(g=>g.point.id));
  for(const node of active){const el=elements.get('resource:'+node.id);if(el)el.style.visibility=shown.has(node.id)?'visible':'hidden';}
  for(const {point:p,ids} of groups){
   const el=elements.get('resource:'+p.id);if(!el)continue;
   point.set(p.x,p.y,0);positionMarker(el,point);
   el.dataset.selected=String(focusId===p.id);el.dataset.dim=String(!!focusId&&focusId!==p.id&&!matched);el.dataset.edge=p.x>width-220?'right':'left';
   const members=ids.join(',');if(el.dataset.members!==members){el.dataset.members=members;el.dataset.cluster=String(ids.length>1);const count=el.querySelector<HTMLElement>('[data-resource-count]');if(count)count.textContent=ids.length>1?String(ids.length):'';el.setAttribute('aria-label',ids.length>1?`定位${nodeName(p.id)}等${ids.length}个${p.kind==='culture'?'文化':p.kind==='services'?'公共服务':'商业'}地点`:`定位${nodeName(p.id)}`);}
  }
  function nodeName(id:string){return active.find(n=>n.id===id)?.name??id;}
 };
}
