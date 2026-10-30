'use client';
import {useState,useRef,useEffect} from 'react';
import Link from 'next/link';
import {X,ArrowUpRight,MapPin,ChevronLeft} from 'lucide-react';
import type {Place} from '@/src/experience/config';
import {profileFor,sourceById,STATUS_LABEL} from '@/src/atlas/places';
import {RECORDS,KIND_LABEL,recordById,recordsFor,researchYears} from '@/src/atlas/catalog';
import type {AtlasRecord,ProposalScenario} from '@/src/atlas/types';
import styles from './atlas.module.css';
export type DetailTab='overview'|'research'|'evidence'|'questions'|'design';
const tabs:[DetailTab,string][]=[['overview','地点概况'],['research','已有研究'],['evidence','田野证据'],['questions','问题与缺口'],['design','设计方案']];
export function Sources({ids}:{ids:string[]}){return <div>{ids.map(id=>{const s=sourceById(id);return <p key={id} className={styles.source}><small>{STATUS_LABEL[s.status]} · {s.year}</small>{s.url?<a href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={13}/></a>:s.title}<small>{s.author}</small></p>;})}</div>;}
export function RecordCard({record,onOpen}:{record:AtlasRecord;onOpen:(id:string)=>void}){return <button className={styles.recordCard} onClick={()=>onOpen(record.id)}><small>{record.dataStatus==='demo'?'示例编制 ':''}{record.year} · {KIND_LABEL[record.kind]} · {record.dataStatus==='demo'?'DEMO DATA / 模拟研究资料':'公开资料'}</small><strong>{record.title}</strong><span>{record.summary}</span><em>查看资料 →</em></button>;}
export function PlaceDetail({place,onClose,onMap,tab,onTab,recordId,onRecord,proposal,onProposal}:{place:Place;onClose:()=>void;onMap:()=>void;tab:DetailTab;onTab:(tab:DetailTab)=>void;recordId:string|null;onRecord:(id:string|null)=>void;proposal:ProposalScenario|null;onProposal:(view:ProposalScenario['view'])=>void}){
 const [year,setYear]=useState('all');const p=profileFor(place.id),record=recordId?recordById(recordId):undefined,body=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{close.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{body.current?.scrollTo(0,0);},[recordId,tab,year]);
 const renderCards=(items:AtlasRecord[])=>items.length?items.map(r=><RecordCard key={r.id} record={r} onOpen={onRecord}/>):<p className={styles.empty}>该栏目尚未编入资料。没有记录不等于这个地点从未被研究。</p>;
 return <aside className={styles.panel} aria-label={`${place.name}地点详情`}>
  <header><div><small>PLACE / 地点档案</small><h2>{place.name}</h2></div><button ref={close} onClick={onClose} aria-label="关闭地点详情"><X size={20}/></button></header>
  <div className={styles.tabs} role="tablist" aria-label="地点资料栏目">{tabs.map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>{onRecord(null);onTab(id);}}>{label}</button>)}</div>
  <div ref={body} className={styles.body} role="tabpanel">
   {record?<article>
    <button className={styles.back} onClick={()=>onRecord(null)}><ChevronLeft size={14}/>返回栏目</button><p className={styles.badge}>{record.dataStatus==='demo'?'DEMO DATA / 模拟研究资料':'公开资料 · 保留原始语境'}</p>
    <small>{KIND_LABEL[record.kind]} · {record.dataStatus==='demo'?'示例编制 ':''}{record.year}{record.gapType?` · ${record.gapType}`:''}</small><h3 className={styles.recordTitle}>{record.title}</h3>
    <p>{record.summary}</p><p className={styles.notice}>{record.state}</p><dl className={styles.meta}><dt>作者 / 团队</dt><dd>{record.author}</dd>{record.course&&<><dt>课程 / 项目</dt><dd>{record.course}</dd></>}{record.proposalType&&<><dt>设计类型</dt><dd>{record.proposalType}</dd></>}<dt>主题</dt><dd>{record.themes.join('、')||'地点研究与设计'}</dd></dl>
    {record.body.map((t,i)=><p key={i}>{t}</p>)}
    {record.kind==='Proposal'&&record.objectIds.length>0&&<section className={styles.scenarioBox}><h3>方案情景比较</h3><p>仅叠加当前方案的概念触点与路线。基础地理及研究资料保持可见。</p><div role="group" aria-label="当前方案情景"><button className={styles.primary} aria-pressed={proposal?.proposalId!==record.id||proposal.view==='baseline'} onClick={()=>onProposal('baseline')}>基线场景</button><button className={styles.primary} aria-pressed={proposal?.proposalId===record.id&&proposal.view==='intervention'} onClick={()=>onProposal('intervention')}>方案介入</button></div><p className={styles.notice}>概念演示 · 非未来预测或施工方案。切换地点或离开此资料后退出方案情景。</p></section>}
    {record.objectIds.length>0&&<button className={styles.primary} onClick={onMap}><MapPin size={14}/>定位关联空间</button>}
    {record.evidenceIds.length>0&&<><h3>关联证据</h3>{renderCards(record.evidenceIds.map(recordById).filter((r):r is AtlasRecord=>!!r))}</>}
    {record.relatedIds.length>0&&<><h3>继续探索</h3>{renderCards(record.relatedIds.map(recordById).filter((r):r is AtlasRecord=>!!r))}</>}
    <h3>来源与数据状态</h3><Sources ids={record.sourceIds}/>
   </article>:<>
    {tab==='overview'&&<><p className={styles.notice}>{place.category} · 定位：{place.verificationStatus}<br/>{place.note}</p><p>{place.description}</p>{place.id==='ezhou'&&<Link className={styles.external} href="/experience/sites/ezhou">进入三维研究现场 · 概念场景 <ArrowUpRight size={14}/></Link>}<div className={styles.tags}>{p.tags.map(t=><span key={t}>{t}</span>)}</div><h3>地点概况</h3><p>{p.overview}</p>{[['自然生态',p.ecology],['历史文化',p.culture],['社会活动',p.society]].map(([title,text])=><details className={styles.topic} key={title}><summary>{title}</summary><p>{text}</p></details>)}<p className={styles.notice}>{p.locationNote}</p><button className={styles.primary} onClick={()=>onTab('research')}>查看已有研究 <ArrowUpRight size={14}/></button><h3>资料来源</h3><Sources ids={p.sourceIds}/></>}
    {tab==='research'&&<><h3>研究时间轴</h3><p className={styles.hint}>公开材料与演示项目分别标记；没有虚构未来届次。</p><label className={styles.filter}>研究年份<select aria-label="研究年份" value={year} onChange={e=>setYear(e.target.value)}><option value="all">全部年份</option>{researchYears(place.id).map(y=><option key={y} value={y}>{y}</option>)}</select></label>{renderCards(recordsFor(place.id,'ResearchProject').filter(r=>year==='all'||r.year===Number(year)).sort((a,b)=>b.year-a.year))}<h3>关联研究活动</h3>{renderCards(recordsFor(place.id,'ResearchSession').filter(r=>year==='all'||r.year===Number(year)))}</>}
    {tab==='evidence'&&<><h3>田野记录与文献证据</h3><p className={styles.hint}>文献报道、待采集模板和真实现场记录不能互相替代。本样板没有导入私有田野数据。</p>{renderCards(recordsFor(place.id,'FieldRecord'))}<a className={styles.external} href="/create-research">进入原研究平台开展采集 <ArrowUpRight size={13}/></a></>}
    {tab==='questions'&&<>{(['ResearchGap','Issue','Conflict','Insight'] as const).map(kind=><section key={kind}><h3>{KIND_LABEL[kind]}</h3>{renderCards(recordsFor(place.id,kind))}</section>)}</>}
    {tab==='design'&&<><h3>设计机会</h3>{renderCards(recordsFor(place.id,'DesignOpportunity'))}<h3>设计方案</h3>{renderCards(recordsFor(place.id,'Proposal'))}</>}
   </>}
  </div><footer><button onClick={onMap}><MapPin size={14}/>在地图中查看</button><button onClick={onClose}>收起详情</button></footer>
 </aside>;
}
export function AtlasLibrary({onOpen,onClose}:{onOpen:(id:string)=>void;onClose:()=>void}){
 const [kind,setKind]=useState('research');
 const items=RECORDS.filter(r=>kind==='research'?r.kind==='ResearchProject':kind==='questions'?['Issue','Conflict','ResearchGap'].includes(r.kind):['Proposal','DesignOpportunity'].includes(r.kind));
 return <aside className={styles.library} aria-label="资料索引" data-information-panel>
  <header><div><small>THE RESEARCH INDEX</small><h2>沿江的研究与线索</h2></div><button onClick={onClose} aria-label="关闭资料索引"><X size={19}/></button></header>
  <nav className={styles.indexTabs} aria-label="资料分类">{[['research','研究'],['questions','问题'],['design','方案']].map(([id,label])=><button key={id} aria-pressed={kind===id} onClick={()=>setKind(id)}>{label}</button>)}</nav>
  <p className={styles.indexHint}>从标题进入阅读，沿关联回到空间。</p>
  <ol className={styles.indexList}>{items.map((r,i)=><li key={r.id}><span className={styles.indexNumber}>{String(i+1).padStart(2,'0')}</span><div><small>{r.dataStatus==='demo'?'DEMO · 模拟研究资料':'公开资料'} · {r.year}</small><button onClick={()=>onOpen(r.id)}>{r.title}<ArrowUpRight size={14}/></button><details><summary>摘要与关联</summary><p>{r.summary}</p><p>{r.placeIds?.length??1} 个关联地点 · {r.sourceIds.length} 项来源</p></details></div></li>)}</ol>
  {!items.length&&<p className={styles.empty}>此分类尚无资料。</p>}
 </aside>;
}
