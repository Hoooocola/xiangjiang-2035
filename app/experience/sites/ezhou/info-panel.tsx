'use client';
import {useEffect,useRef} from 'react';
import {X,ArrowUpRight,LocateFixed,ChevronLeft} from 'lucide-react';
import {ANNOTATIONS,RECORDS,recordById} from '@/src/spatial/data';
import {annotationStyles,themeLabels,formLabels} from '@/src/spatial/styles';
import {relatedFindings} from '@/src/spatial/controller';
import type {ExplorerState,ResearchRecord} from '@/src/spatial/types';
import type {Action} from '@/src/spatial/controller';
import styles from './site.module.css';
// Action is kept with the controller; the panel only dispatches public state transitions.
export function InfoPanel({state,dispatch,onClose}:{state:ExplorerState;dispatch:(action:Action)=>void;onClose:()=>void}){
 const record=recordById(state.selectedId),body=useRef<HTMLDivElement>(null);
 useEffect(()=>{body.current?.scrollTo(0,0);},[state.selectedId]);
 const open=(id:string)=>dispatch({type:'select',id});
 const cards=(ids:string[])=>ids.map(recordById).filter((r):r is ResearchRecord=>!!r).map(r=><button key={r.id} className={styles.card} onClick={()=>open(r.id)}><small style={{color:annotationStyles[r.layer].color}}>{r.kind} · {r.id}</small><strong>{r.title}</strong><span>{r.summary}</span><ArrowUpRight size={14}/></button>);
 const list=RECORDS.filter(r=>state.layers.includes(r.layer)&&r.layer!=='context'&&state.themes.includes(r.theme));
 const suggestions=relatedFindings(state.compareIds);
 return <aside className={styles.panel} data-site-panel aria-label={record?'研究资料详情':'研究资料列表'}>
  <header><div><small>{record?`${record.kind} / ${record.id}`:'RESEARCH INDEX'}</small><h2>{record?'研究资料':'探索现场资料'}</h2></div><button onClick={onClose} aria-label="关闭研究面板"><X size={19}/></button></header>
  <div className={styles.panelBody} ref={body}>
   {record?<article>
    <button className={styles.back} onClick={()=>dispatch({type:'select',id:null})}><ChevronLeft size={14}/>返回资料列表</button>
    <span className={styles.mock}>MOCK · 仅供原型验证</span><h3 className={styles.title}>{record.title}</h3><p>{record.summary}</p><p className={styles.notice}>{record.status}</p>
    <dl className={styles.meta}><dt>资料类型</dt><dd>{record.kind==='Evidence'?record.evidenceType:record.kind}</dd><dt>来源</dt><dd>{record.source}</dd><dt>时间</dt><dd>{record.timeLabel}</dd><dt>所属研究</dt><dd>{record.researchId} · 滨水通行假设情景</dd><dt>位置</dt><dd>局部概念坐标 · 未地理配准</dd></dl>
    {record.body.map(p=><p key={p}>{p}</p>)}
    {'interpretation' in record&&<section className={styles.explanation}><h4>研究者的解释 · 待验证</h4><p>{record.interpretation}</p>{record.kind==='ResearchGap'&&<small>{record.gapType}</small>}</section>}
    {record.kind==='Evidence'&&record.evidenceType==='Photograph'&&!record.media&&<p className={styles.notice}>无现场影像 · 当前以概念模型定位设施。未使用虚构照片冒充实拍。</p>}
    {record.kind==='DesignOpportunity'&&<><h4>潜在设计方向</h4><ul>{record.directions.map(d=><li key={d}>{d}</li>)}</ul><h4>关联问题与洞察</h4>{cards(record.findingIds)}</>}
    {record.kind==='Proposal'&&<section className={styles.proposalBox}><h4>比较设计介入</h4><p>{record.proposalType}</p><div className={styles.segment}><button aria-pressed={!state.proposalVisible} onClick={()=>dispatch({type:'proposal',visible:false})}>基线场景</button><button aria-pressed={state.proposalVisible} onClick={()=>dispatch({type:'proposal',visible:true})}>方案情景</button></div><p>基线也是概念模型，不代表鹅洲真实现状。</p><h4>来自设计机会</h4>{cards(record.opportunityIds)}</section>}
    {record.evidenceIds.length>0&&<><h4>关联证据 · 可逐条核查</h4>{cards(record.evidenceIds)}</>}
    {record.kind==='Evidence'&&<><h4>关联研究发现</h4>{cards(record.findingIds)}</>}
    {record.relatedIds.length>0&&<><h4>继续探索</h4>{cards(record.relatedIds.filter(id=>!('findingIds' in record&&record.findingIds.includes(id))&&!('opportunityIds' in record&&record.opportunityIds.includes(id))))}</>}
   </article>:<>
    <p className={styles.hint}>按语义层与主题筛选。可同时叠加两项资料，自主观察空间关系。</p>
    <div className={styles.themes} aria-label="研究主题">{Object.entries(themeLabels).map(([id,label])=><label key={id}><input type="checkbox" checked={state.themes.includes(id as keyof typeof themeLabels)} onChange={()=>dispatch({type:'theme',theme:id as keyof typeof themeLabels})}/>{label}</label>)}</div>
    {state.compareIds.length>0&&<section className={styles.compare}><h4>叠加比较 · {state.compareIds.length} 项</h4><p>同时高亮只表示空间关联，不自动判定冲突。可以打开以下人工整理的解释，也可继续自行观察。</p>{cards(suggestions.map(r=>r.id))}</section>}
    {list.length?list.map(r=><div className={styles.listRow} key={r.id}><button className={styles.card} onClick={()=>open(r.id)}><small style={{color:annotationStyles[r.layer].color}}>{r.id} · {annotationStyles[r.layer].label} · {ANNOTATIONS.filter(a=>a.recordId===r.id).map(a=>formLabels[a.form]).join(' / ')}</small><strong>{r.title}</strong><span>{r.summary}</span></button><label className={styles.compareCheck}><input type="checkbox" aria-label={`叠加比较：${r.title}`} checked={state.compareIds.includes(r.id)} onChange={()=>dispatch({type:'compare',id:r.id})}/>叠加比较</label></div>):<p className={styles.empty}>当前筛选下暂无资料。开启一个信息层或更换主题；资料缺失不等于真实场地没有相关资源。</p>}
   </>}
  </div>
  <footer><button onClick={()=>dispatch({type:'focus'})} disabled={!record}><LocateFixed size={15}/>聚焦空间</button><button onClick={onClose}>收起，继续观察</button></footer>
 </aside>;
}
