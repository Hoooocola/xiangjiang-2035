'use client';
import {X,ChevronDown} from 'lucide-react';
import {LayerSymbol} from './layer-symbol';
import {LAYERS} from '@/src/atlas/catalog';
import {visibleObjects,MAP_OBJECTS} from '@/src/atlas/objects';
import {SUBTYPES,isAvailable,subtypeOf} from '@/src/atlas/information';
import type {LayerId,OverlayState} from '@/src/atlas/types';
import styles from './information.module.css';
export function LayerPanel({state,onToggle,onObject,onClose,scope,onScope,selectedPlace,onSubtype,onDemo,onGuide,onClear}:{scope:'all'|'place';onScope:(scope:'all'|'place')=>void;selectedPlace?:string;state:OverlayState;onToggle:(id:LayerId)=>void;onObject:(id:string)=>void;onClose:()=>void;onSubtype:(id:string)=>void;onDemo:(value:boolean)=>void;onGuide:()=>void;onClear:()=>void}){
 const visible=visibleObjects(state);
 return <aside className={styles.directory} aria-label="数据图层" data-information-panel>
  <header><div><small>SPATIAL INFORMATION</small><h2>阅读这段湘江</h2></div><button onClick={onClose} aria-label="关闭数据图层"><X size={19}/></button></header>
  <div className={styles.directoryBody}>
   <label className={styles.scope}>范围<select aria-label="图层资料范围" value={scope} onChange={e=>onScope(e.target.value as 'all'|'place')}><option value="all">全部地点</option><option value="place" disabled={!selectedPlace}>{selectedPlace??'当前地点'}</option></select></label>
   <p className={styles.hint}>底图常驻。选择对象查看解释，点击“聚焦”移动镜头。</p>
   {LAYERS.map(l=>{const available=MAP_OBJECTS.filter(o=>o.layer===l.id&&isAvailable(o,state));return <details key={l.id} className={styles.category} open={state.layers.includes(l.id)}>
    <summary><label><input type="checkbox" aria-label={`显示${l.label}`} checked={state.layers.includes(l.id)} onChange={()=>onToggle(l.id)}/><LayerSymbol layer={l.id}/><strong>{l.label}</strong></label><span>{available.length||'待补充'}</span><ChevronDown size={12}/></summary>
    <div className={styles.subtypes}>{SUBTYPES.filter(s=>s.layer===l.id).map(sub=>{const objects=available.filter(o=>subtypeOf(o)===sub.id);return <section key={sub.id}>
     <label className={styles.subtype}><input type="checkbox" checked={objects.length>0&&state.layers.includes(l.id)&&(state.subtypes?.includes(sub.id)??true)} disabled={!objects.length} aria-label={`显示${sub.label}`} onChange={()=>onSubtype(sub.id)}/><span>{sub.label}</span><small>{objects.length?sub.form:'待补充'}</small></label>
     {!objects.length?<p className={styles.pending}>{sub.note??'暂无经核验的空间资料'}</p>:state.layers.includes(l.id)&&(state.subtypes?.includes(sub.id)??true)&&<div className={styles.objects}>{objects.map(o=><button key={o.id} aria-pressed={state.selectedObjectIds.includes(o.id)} onClick={()=>onObject(o.id)}><span>{o.title}</span>{o.dataStatus==='demo'&&<small>DEMO</small>}</button>)}</div>}
    </section>;})}</div>
   </details>;})}
   <label className={styles.demo}><input type="checkbox" checked={state.showDemo===true} onChange={e=>onDemo(e.target.checked)}/>显示示例资料 <small>非实测，默认关闭</small></label>
   <p className={styles.hint}>研究、证据与问题仍保留在“资料”和地点档案中。公园边界不代表湿地生态范围。</p>
  </div>
  <footer><button onClick={onGuide}>开始空间导读 →</button><button onClick={onClear} disabled={!state.layers.length}>清除图层</button><small>已显示 {visible.length} 个对象</small></footer>
 </aside>;
}
