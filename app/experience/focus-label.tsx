'use client';
import {useEffect,useRef} from 'react';
import {X,ArrowUpRight,LocateFixed,ChevronLeft,ChevronRight} from 'lucide-react';
import type {InformationFeature} from '@/src/atlas/types';
import {SUBTYPES,subtypeOf} from '@/src/atlas/information';
import {SOURCES} from '@/src/atlas/places';
import styles from './information.module.css';
const english={geography:'GEOGRAPHY',ecology:'ECOLOGY',culture:'CULTURE',society:'SOCIETY',economy:'ECONOMY',proposal:'PROPOSAL'};
export function FocusLabel({object,onClose,onFocus,onReturn,onDetails,onPlace,step,steps,onStep,ready=true,onExitStart}:{object:InformationFeature;onClose:()=>void;onFocus:()=>void;onReturn:()=>void;onDetails:()=>void;onPlace:()=>void;step:number|null;steps:number;onStep:(n:number)=>void;ready?:boolean;onExitStart:()=>void}){
 const root=useRef<HTMLElement>(null),exit=useRef<Animation|null>(null);
 useEffect(()=>()=>exit.current?.cancel(),[]);
 const dismiss=(action:()=>void)=>{
  if(exit.current)return;onExitStart();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!root.current){action();return;}
  exit.current=root.current.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-out',fill:'forwards'});
  exit.current.onfinish=action;
 };
 const subtype=SUBTYPES.find(s=>s.id===subtypeOf(object));
 return <aside ref={root} className={styles.explanation} aria-label={`${object.title}空间解释`} data-information-panel data-information-explanation data-ready={ready} style={{'--category-color':`var(--layer-${object.layer})`} as React.CSSProperties}>
  <header><span className={styles.type}>{english[object.layer]}<small>{subtype?.label} / {subtype?.form}</small></span><button aria-label="关闭空间解释" onClick={()=>dismiss(onClose)}><X size={19}/></button></header>
  <div className={styles.explanationContent} key={object.id}>
   <h2>{object.title}</h2><p className={styles.summary}>{object.shortDescription}</p>
   {object.metric&&<p className={styles.metric}><strong>{object.metric.value}<small>{object.metric.unit}</small></strong><span>{object.metric.label}</span></p>}
   <p className={styles.sourceStatus}>{object.isMock?<><span>DEMO DATA</span> / 模拟研究资料</>:<><span>PUBLIC SOURCE</span> / 公开资料</>}</p>
   <nav className={styles.readMore} aria-label="深入资料"><button onClick={onDetails}>查看{object.recordId?'关联资料':'空间来源'} <ArrowUpRight size={14}/></button>{object.recordId&&<button onClick={onPlace}>地点档案 <ArrowUpRight size={14}/></button>}</nav>
   <details className={styles.provenance} id={`source-${object.id}`}><summary>来源与空间精度</summary>
    <p>{object.precision}</p>
    {object.isMock&&<p>概念演示，未实施调查；位置与内容不构成真实研究结论。</p>}
    <div className={styles.sources}>{object.sourceIds.map(id=>{const source=SOURCES.find(s=>s.id===id);return source?.url?<a key={id} href={id==='osm'&&object.sourceFeatureIds?.[0]?`https://www.openstreetmap.org/${object.sourceFeatureIds[0]}`:source.url} target="_blank" rel="noreferrer">{id==='osm'?'OpenStreetMap（几何参考）':source.title}<ArrowUpRight size={11}/></a>:<span key={id}>{source?.title??id}</span>;})}{object.year&&<span>提取／资料年份 {object.year}</span>}{object.time&&<span>{object.time}</span>}</div>
    {object.sourceFeatureIds?.map(id=><a className={styles.sourceId} key={id} href={`https://www.openstreetmap.org/${id}`} target="_blank" rel="noreferrer">{id}</a>)}
   </details>
  </div>
  <nav className={styles.focusActions} aria-label="空间解释操作"><button onClick={()=>dismiss(onReturn)}><ChevronLeft size={15}/>返回原视角</button><button onClick={onFocus}><LocateFixed size={14}/>重新聚焦</button></nav>
  {step!==null&&<div className={styles.guide}><button disabled={step===0} onClick={()=>onStep(step-1)}><ChevronLeft size={15}/>上一节</button><span>{step+1} / {steps}</span><button disabled={step===steps-1} onClick={()=>onStep(step+1)}>下一节<ChevronRight size={15}/></button></div>}
 </aside>;
}
