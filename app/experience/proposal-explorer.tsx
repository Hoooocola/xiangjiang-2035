'use client';
import {useState} from 'react';
import {X,ArrowUpRight,ChevronLeft} from 'lucide-react';
import {DESIGN_PROPOSALS,proposalPlaceIds} from '@/src/atlas/proposals';
import {PLACES} from '@/src/experience/config';
import styles from './proposal-explorer.module.css';
export function ProposalExplorer({selectedId,placeId,onSelect,onPlace,onClose,onDetails,onCourse}:{selectedId:string|null;placeId:string|null;onSelect:(id:string)=>void;onPlace:(id:string)=>void;onClose:()=>void;onDetails:(id:string)=>void;onCourse:()=>void}){
 const [scope,setScope]=useState('all');const selected=DESIGN_PROPOSALS.find(p=>p.id===selectedId);const items=DESIGN_PROPOSALS.filter(p=>scope==='all'||proposalPlaceIds(p).includes(scope));
 return <aside className={styles.explorer} aria-label="设计方案目录" data-information-panel>
 <header><div><small>DESIGN RESPONSES</small><h2>{selected?'设计回应':'从研究到设计'}</h2></div><button onClick={onClose} aria-label="关闭设计方案模式"><X size={19}/></button></header>
 <p className={styles.context}>设计者对问题的回应 · 概念与已实施状态分别标明</p>
 <label className={styles.filter}>地点<select aria-label="方案地点筛选" value={scope} onChange={e=>setScope(e.target.value)}><option value="all">全部地点</option>{PLACES.filter(p=>DESIGN_PROPOSALS.some(r=>proposalPlaceIds(r).includes(p.id))).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 {selected?<article className={styles.selected}><button className={styles.back} onClick={()=>onSelect('')}><ChevronLeft size={14}/>返回方案目录</button><small>{selected.dataStatus==='demo'?'DEMO / 概念演示':'公开资料'} · {selected.year}</small><h3>{selected.title}</h3><p className={styles.author}>{selected.author}</p><p>{selected.summary}</p><p className={styles.status}>{selected.state}</p><div className={styles.places} aria-label="方案关联地点">{proposalPlaceIds(selected).map(id=><button key={id} aria-pressed={placeId===id} onClick={()=>onPlace(id)}>{PLACES.find(p=>p.id===id)!.name}<ArrowUpRight size={13}/></button>)}</div>{!proposalPlaceIds(selected).length&&<p className={styles.status}>尚无可核验关联地点；仅阅读方案，不生成地图标记。</p>}<button className={styles.detail} onClick={()=>onDetails(selected.id)}>查看方案详情 <ArrowUpRight size={14}/></button></article>:<ol className={styles.list}>{items.map((p,i)=><li key={p.id}><span>{String(i+1).padStart(2,'0')}</span><button onClick={()=>onSelect(p.id)}><small>{p.dataStatus==='demo'?'DEMO / 概念演示':'公开资料'} · {p.year}</small><strong>{p.title}</strong><em>{proposalPlaceIds(p).length?`${proposalPlaceIds(p).length} 个关联地点`:'未绑定地点'}</em></button></li>)}</ol>}
 {!selected&&!items.length&&<p className={styles.status}>该地点尚未编入设计方案。</p>}
 <footer><span>学生课程成果为独立展示，不自动转为正式方案。</span><button onClick={onCourse}>浏览课程成果 <ArrowUpRight size={13}/></button></footer>
 </aside>;
}
