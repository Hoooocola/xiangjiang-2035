'use client';
import {useState} from 'react';
import {X,ChevronDown,ArrowUpRight} from 'lucide-react';
import {LAYERS} from '@/src/atlas/catalog';
import {visibleObjects,MAP_OBJECTS} from '@/src/atlas/objects';
import {SUBTYPES,isAvailable,subtypeOf} from '@/src/atlas/information';
import type {LayerId,OverlayState} from '@/src/atlas/types';
import styles from './information.module.css';
const english:Record<LayerId,string>={geography:'GEOGRAPHY',ecology:'ECOLOGY',culture:'CULTURE',society:'SOCIETY',economy:'ECONOMY',proposal:'PROPOSAL'};
export function LayerPanel({state,onToggle,onObject,onClose,scope,onScope,selectedPlace,onSubtype,onDemo,onGuide,onClear}:{scope:'all'|'place';onScope:(scope:'all'|'place')=>void;selectedPlace?:string;state:OverlayState;onToggle:(id:LayerId)=>void;onObject:(id:string)=>void;onClose:()=>void;onSubtype:(id:string)=>void;onDemo:(value:boolean)=>void;onGuide:()=>void;onClear:()=>void}){
 const [expanded,setExpanded]=useState<LayerId[]>(state.layers);
 const visible=visibleObjects(state),inventory=MAP_OBJECTS.filter(o=>isAvailable(o,{...state,showDemo:true}));
 const toggleExpanded=(id:LayerId)=>setExpanded(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
 return <aside className={styles.directory} aria-label="数据图层" data-information-panel data-information-directory>
  <header><div><small>SPATIAL INFORMATION / 01</small><h2>阅读这段湘江</h2></div><button onClick={onClose} aria-label="关闭数据图层"><X size={18}/></button></header>
  <div className={styles.directoryTools}>
   <label className={styles.scope}><span>阅读范围</span><select aria-label="图层资料范围" value={scope} onChange={e=>onScope(e.target.value as 'all'|'place')}><option value="all">全部地点</option><option value="place" disabled={!selectedPlace}>{selectedPlace??'当前地点'}</option></select></label>
   <label className={styles.demo}><input type="checkbox" checked={state.showDemo===true} onChange={e=>onDemo(e.target.checked)}/><span>DEMO 示例<small>{state.showDemo?'已显示 · 非实测资料':'默认关闭 · 开启后可体验模拟主题'}</small></span><span className={styles.count}>{inventory.filter(o=>o.isMock).length}</span></label>
  </div>
  <div className={styles.directoryBody}>
   <p className={styles.hint}>选择具体条目，镜头将带你到它的空间。</p>
   {LAYERS.map((l,index)=>{
    const all=inventory.filter(o=>o.layer===l.id),available=all.filter(o=>isAvailable(o,state));
    const enabled=state.layers.includes(l.id),open=expanded.includes(l.id);
    const pending=SUBTYPES.filter(s=>s.layer===l.id&&!all.some(o=>subtypeOf(o)===s.id));
    return <section key={l.id} className={styles.category} style={{'--category-color':`var(--layer-${l.id})`} as React.CSSProperties}>
     <div className={styles.categoryHeading}>
      <button className={styles.expandCategory} aria-expanded={open} aria-controls={`category-${l.id}`} onClick={()=>toggleExpanded(l.id)}><span className={styles.ordinal}>{String(index+1).padStart(2,'0')}</span><span><strong>{l.label}</strong><small>{english[l.id]}</small></span><span className={styles.count}>{available.length||`${all.length} 示例`}</span><ChevronDown size={13}/></button>
      <button className={styles.layerSwitch} role="switch" aria-checked={enabled} aria-label={`显示${l.label}`} onClick={()=>{onToggle(l.id);if(!enabled&&!open)toggleExpanded(l.id);}}><span/></button>
     </div>
     {open&&<div id={`category-${l.id}`} className={styles.subtypes}>
      {SUBTYPES.filter(s=>s.layer===l.id&&all.some(o=>subtypeOf(o)===s.id)).map(sub=>{
       const objects=available.filter(o=>subtypeOf(o)===sub.id),total=all.filter(o=>subtypeOf(o)===sub.id).length;
       const active=enabled&&(state.subtypes?.includes(sub.id)??true);
       return <section key={sub.id}>
        <label className={styles.subtype}><input type="checkbox" checked={objects.length>0&&active} disabled={!objects.length} aria-label={`显示${sub.label}`} onChange={()=>onSubtype(sub.id)}/><span>{sub.label}</span><small>{objects.length?`${sub.form} · ${objects.length}`:`${total} DEMO`}</small></label>
        {!objects.length?<p className={styles.pending}>开启上方 DEMO 示例后查看</p>:active&&<div className={styles.objects}>{objects.map(o=><button key={o.id} aria-pressed={state.selectedObjectIds.includes(o.id)} onClick={()=>onObject(o.id)}><i aria-hidden="true"/><span>{o.title}</span>{o.isMock&&<small>DEMO</small>}<ArrowUpRight size={12}/></button>)}</div>}
       </section>;
      })}
      {pending.length>0&&<details className={styles.unavailable}><summary>尚无资料的子类 <span>{pending.length}</span></summary>{pending.map(sub=><p key={sub.id}><strong>{sub.label}</strong><span>{sub.note??'尚未编入资料'}</span></p>)}</details>}
     </div>}
    </section>;
   })}
  </div>
  <footer><button onClick={onGuide}>空间导读 <ArrowUpRight size={13}/></button><button onClick={onClear} disabled={!state.layers.length}>清除图层</button><small>{visible.length} 个空间对象可见</small></footer>
 </aside>;
}
