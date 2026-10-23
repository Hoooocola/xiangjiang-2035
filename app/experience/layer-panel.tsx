'use client';
import {X} from 'lucide-react';
import {LAYERS} from '@/src/atlas/catalog';
import {visibleObjects,MAP_OBJECTS} from '@/src/atlas/objects';
import type {LayerId,OverlayState} from '@/src/atlas/types';
import styles from './atlas.module.css';
export function LayerPanel({state,onToggle,onObject,onClose}:{state:OverlayState;onToggle:(id:LayerId)=>void;onObject:(id:string)=>void;onClose:()=>void}){
 const visible=visibleObjects(state);
 return <aside className={`${styles.panel} ${styles.leftPanel}`} aria-label="数据图层"><header><div><small>LAYERS / 空间资料</small><h2>数据图层</h2></div><button onClick={onClose} aria-label="关闭数据图层"><X size={20}/></button></header><div className={styles.body}><p className={styles.hint}>按当前地点筛选；多个图层可同时开启。底图始终保留。</p>{LAYERS.map(l=><label key={l.id} className={styles.layerRow}><input type="checkbox" checked={state.layers.includes(l.id)} onChange={()=>onToggle(l.id)}/><i style={{background:l.color}}/><span><strong>{l.label}</strong><small>{l.description}</small></span><em>{MAP_OBJECTS.filter(o=>o.layer===l.id&&(!state.placeId||o.placeId===state.placeId)).length}</em></label>)}<p className={styles.notice}>未来情景属于具体设计方案。请从资料 → 方案进入，在方案内选择基线或介入；图层开关不代表时间切换。</p><h3>当前可见对象 · {visible.length}</h3><p className={styles.hint}>全段尺度隐藏细小标签；点选对象可聚焦。</p>{visible.length?visible.map(o=><button className={styles.objectRow} key={o.id} onClick={()=>onObject(o.id)}><span>{o.title}</span><small>{o.dataStatus==='demo'?'演示':'公开资料'} · {o.precision}</small></button>):<p className={styles.empty}>没有可见对象。可开启图层或切换到鹅洲样板；这不代表该区域没有研究。</p>}</div></aside>;
}
