'use client';
import {X,ArrowUpRight,LocateFixed,ChevronLeft,ChevronRight} from 'lucide-react';
import type {MapObject} from '@/src/atlas/types';
import {SUBTYPES,subtypeOf} from '@/src/atlas/information';
import {SOURCES} from '@/src/atlas/places';
import styles from './information.module.css';
export function FocusLabel({object,onClose,onFocus,onReturn,onDetails,step,steps,onStep}:{object:MapObject;onClose:()=>void;onFocus:()=>void;onReturn:()=>void;onDetails:()=>void;step:number|null;steps:number;onStep:(n:number)=>void}){
 const subtype=SUBTYPES.find(s=>s.id===subtypeOf(object));
 return <aside className={styles.explanation} aria-label={`${object.title}空间解释`} data-information-panel>
  <header><small>{step===null?'OBJECT / 空间解释':`GUIDED / ${step+1} — ${steps}`}</small><button aria-label="关闭空间解释" onClick={onClose}><X size={18}/></button></header>
  <p className={styles.type}>{subtype?.label} · {subtype?.form}{object.dataStatus==='demo'?' · DEMO / 非实测':''}</p>
  <h2>{object.title}</h2><p className={styles.summary}>{object.summary??object.precision}</p>
  {object.metric&&<p className={styles.metric}><strong>{object.metric.value}<small>{object.metric.unit}</small></strong><span>{object.metric.label}</span></p>}
  <p className={styles.precision}>{object.precision}</p>
  <div className={styles.sources}>{object.sourceIds.map(id=>{const source=SOURCES.find(s=>s.id===id);return source?.url?<a key={id} href={id==='osm'&&object.sourceFeatureIds?.[0]?`https://www.openstreetmap.org/${object.sourceFeatureIds[0]}`:source.url} target="_blank" rel="noreferrer">{id==='osm'?'OpenStreetMap':source.title}<ArrowUpRight size={11}/></a>:<span key={id}>{source?.title??id}</span>;})}{object.year&&<span>提取／资料年份 {object.year}</span>}</div>
  {object.sourceFeatureIds?.length&&<details className={styles.provenance}><summary>几何来源 · {object.sourceFeatureIds.length} 个要素</summary>{object.sourceFeatureIds.map(id=><a key={id} href={`https://www.openstreetmap.org/${id}`} target="_blank" rel="noreferrer">{id}</a>)}</details>}
  <nav aria-label="空间解释操作"><button onClick={onFocus}><LocateFixed size={14}/>聚焦对象</button><button onClick={onReturn}>返回原视角</button><button onClick={onDetails}>{object.recordId?'查看资料':'地点档案'}<ArrowUpRight size={13}/></button></nav>
  {step!==null&&<div className={styles.guide}><button disabled={step===0} onClick={()=>onStep(step-1)}><ChevronLeft size={15}/>上一节</button><span>{step+1} / {steps}</span><button disabled={step===steps-1} onClick={()=>onStep(step+1)}>下一节<ChevronRight size={15}/></button></div>}
 </aside>;
}
