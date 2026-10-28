import {LAYER_VISUALS} from '@/src/atlas/visuals';
import type {LayerId} from '@/src/atlas/types';

export function LayerSymbol({layer,size=16}:{layer:LayerId;size?:number}){
 const shape=LAYER_VISUALS[layer].shape;
 return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{flexShrink:0,color:`var(--layer-${layer},${LAYER_VISUALS[layer].day})`}}>
  {shape==='square'?<rect x="3" y="3" width="14" height="14"/>:shape==='leaf'?<><path d="M3 17C1 5 7 2 17 3C19 13 13 19 3 17Z" fill="currentColor" fillOpacity=".16"/><path d="m4 16 9-9"/></>:shape==='diamond'?<path d="m10 2 8 8-8 8-8-8Z" fill="currentColor" fillOpacity=".22"/>:shape==='route'?<><path d="M4 5c14-6-2 16 12 10" strokeDasharray="2 2"/><circle cx="4" cy="5" r="2"/><circle cx="16" cy="15" r="2"/></>:shape==='document'?<><path d="M5 2h7l4 4v12H5Z"/><path d="M11 2v5h5M8 11h5M8 14h5"/></>:<path d="m10 3 8 14H2Z" fill="currentColor" fillOpacity=".22"/>}
 </svg>;
}
