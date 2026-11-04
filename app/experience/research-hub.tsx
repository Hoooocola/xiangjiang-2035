'use client';
import {useEffect,useState,useEffectEvent,useRef,type RefObject} from 'react';
import type {ExperienceEngine} from '@/src/experience/engine';
import {INITIAL_RESEARCH,type IslandStudy,type ResearchState} from '@/src/place-research/types';
import {loadIsland} from '@/src/place-research/runtime';
import {ResearchPanel} from './research-panel';
import styles from './research.module.css';
export function ResearchHub({engine,onClose,onActive,autoEnter=false}:{engine:RefObject<ExperienceEngine|null>;onClose:()=>void;onActive:(active:boolean)=>void;autoEnter?:boolean}){
 const [state,setState]=useState<ResearchState>({site:'ezhou',...INITIAL_RESEARCH}),[active,setActive]=useState(false),[study,setStudy]=useState<IslandStudy>(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const close=()=>{engine.current?.researchExit();onActive(false);onClose()};
 const mounted=useRef(true);useEffect(()=>{mounted.current=true;const instance=engine.current;return()=>{mounted.current=false;instance?.researchExit()}},[engine]);
 const enter=async(guided=false)=>{setBusy(true);setError('');try{const [,data]=await loadIsland();if(!mounted.current)return;await engine.current?.researchEnter();if(!mounted.current)return;setStudy(data);setState(s=>{const next={...s,guided};engine.current?.researchState(next,false);return next});setActive(true);onActive(true);}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'场地载入失败')}finally{if(mounted.current)setBusy(false)}};
 const autoStart=useEffectEvent(()=>{void enter()});
 const didEnter=useRef(false);useEffect(()=>{if(autoEnter&&!didEnter.current){didEnter.current=true;autoStart()}},[autoEnter]);
 if(active&&study)return <ResearchPanel state={state} study={study} onChange={(next,move)=>{setState(next);engine.current?.researchState(next,move)}} onExit={close} onNode={id=>engine.current?.researchNode(id)} onGraph={next=>engine.current?.researchGraph(next)}/>;
 return <><aside className={styles.hub} aria-label="双场地研究入口" data-information-panel><header><small>TWO SITES / ONE RESEARCH LOGIC</small><button onClick={close} aria-label="关闭地点研究入口">×</button></header><h2>从地点，发现问题。</h2><p>Context → Resources → Evidence → Findings → Proposal</p><article><small>01 / REAL + RECONSTRUCTED</small><h3>鹅洲岛</h3><p>洲岛生活与生态保护 · 固定代表点和模拟污水网络。</p><button disabled={busy} onClick={()=>void enter(false)}>进入鹅洲场地研究 →</button><a href="https://www.openstreetmap.org/relation/8727387" target="_blank" rel="noreferrer">岸线地理来源 ↗</a></article><article><small>02 / RECONSTRUCTED · 定位待核实</small><h3>坪塘深坑</h3><p>岩壁、水潭与公众活动 · 独立重建，不嵌入未经确认的地图位置。</p><a href="/experience/research/quarry">进入矿坑重建研究 →</a></article><button disabled={busy} onClick={()=>void enter(true)}>开始双场地研究演示 →</button><p>建议约 3–4 分钟，自主点击下一步，可随时退出。</p>{error&&<p role="alert" className={styles.error}>{error}</p>}</aside>{busy&&<div className={styles.loading} role="status">按需载入鹅洲地理骨架与局部模型…</div>}</>;
}
