'use client';
import {useEffect,useReducer,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,ChevronLeft,ChevronRight,RotateCcw,Plus,Minus,Pause,Play,SkipForward,X,Box,Leaf,FileText,TriangleAlert,Sparkles,Layers,LocateFixed} from 'lucide-react';
import {SITE,STORY,ANNOTATIONS,recordById} from '@/src/spatial/data';
import {annotationStyles,themeLabels} from '@/src/spatial/styles';
import {explorerReducer,initialState,highlightedRecordIds,visibleAnnotations} from '@/src/spatial/controller';
import type {SemanticLayer,Theme} from '@/src/spatial/types';
import type {SiteEngine} from '@/src/spatial/engine';
import {InfoPanel} from './info-panel';
import styles from './site.module.css';
const icons={Box,Leaf,FileText,TriangleAlert,Sparkles};
export default function SiteExplorer(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<SiteEngine|null>(null),markers=useRef(new Map<string,HTMLButtonElement>());
 const [state,dispatch]=useReducer(explorerReducer,initialState),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[panel,setPanel]=useState(false),[moving,setMoving]=useState(false);
 const [metrics,setMetrics]=useState<{fps:number;calls:number;geometries:number}|null>(null);
 useEffect(()=>{const controller=new AbortController();let instance:SiteEngine|null=null,disposed=false;
  import('@/src/spatial/engine').then(({createSiteEngine})=>createSiteEngine(host.current!,markers.current,{ready:()=>{if(!disposed)setLoaded(true);},select:id=>{dispatch({type:'select',id});setPanel(true);},interact:()=>dispatch({type:'pause'}),motion:setMoving,error:setError,metrics:setMetrics},controller.signal)).then(e=>{instance=e;if(disposed)e.dispose();else engine.current=e;}).catch(e=>{if(!disposed&&e.name!=='AbortError')setError(e.message||'无法加载三维场景');});
  return ()=>{disposed=true;controller.abort();instance?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>{engine.current?.apply(state);},[state,loaded]);
 const step=STORY.steps[state.step],highlighted=new Set(highlightedRecordIds(state));
 const close=()=>{setPanel(false);dispatch({type:'select',id:null});};
 const showStep=(type:'start'|'next'|'previous'|'skip'|'reset'|'resume')=>{const index=type==='start'||type==='reset'?0:type==='next'?Math.min(4,state.step+1):type==='previous'?Math.max(0,state.step-1):type==='skip'?4:state.step;dispatch({type});setPanel(STORY.steps[index].selectedId!==null);};
 const select=(id:string)=>{dispatch({type:'select',id});setPanel(true);};
 return <main className={styles.explorer} onKeyDown={e=>{if(e.key==='Escape'){if(panel)close();else if(state.mode==='guided')dispatch({type:'exit'});}}}>
  <div className={styles.scene} ref={host}/><div className={styles.shade}/>
  <header className={styles.header}><Link href="/experience?place=ezhou" className={styles.return}><ArrowLeft size={16}/><span>返回湘江地图<small>鹅洲 / PLACE 04</small></span></Link><div className={styles.identity}><small>SPATIAL RESEARCH EXPLORER</small><h1>{SITE.name}</h1></div><div className={styles.prototype}>三维概念场景 · 非真实扫描<small>Prototype 3D Scene · Not a Real Scan</small></div></header>
  <nav className={styles.layerNav} aria-label="研究信息层级">{Object.entries(annotationStyles).map(([key,s])=>{const Icon=icons[s.icon];return <button key={key} aria-pressed={state.layers.includes(key as SemanticLayer)} disabled={!loaded} style={{'--semantic':s.color} as React.CSSProperties} onClick={()=>{dispatch({type:'layer',layer:key as SemanticLayer});setPanel(key!=='context');}}><Icon size={18} strokeWidth={1.4}/><span>{s.label}<small>{s.en}</small></span></button>;})}</nav>
  <div className={styles.annotations} aria-label="现场空间标注">{ANNOTATIONS.map(a=>{const r=recordById(a.recordId)!,s=annotationStyles[a.layer],Icon=icons[s.icon];return <button key={a.id} ref={el=>{if(el)markers.current.set(a.id,el);else markers.current.delete(a.id);}} className={`${styles.marker} ${highlighted.has(r.id)?styles.selected:''}`} data-shape={s.shape} aria-label={`空间标注：${r.title}`} style={{visibility:'hidden','--semantic':s.color} as React.CSSProperties} onClick={()=>select(r.id)}><i><Icon size={14}/></i><span>{r.id}<strong>{r.title.replace(r.id+' · ','')}</strong></span></button>;})}</div>
  {panel&&<InfoPanel state={state} dispatch={dispatch} onClose={close}/>}
  {loaded&&!panel&&state.mode==='free'&&<section className={styles.welcome}><p>FICTIONAL RESEARCH SCENARIO / DEMO ONLY</p><h2>从空间，读懂研究。</h2><p>观察河岸、路径与公共空间，再叠加资源和证据。<br/>场景与研究链均为假设情景。</p><div className={styles.themeEntries}>{Object.entries(themeLabels).map(([id,name])=><button key={id} onClick={()=>{dispatch({type:'topic',theme:id as Theme});setPanel(true);}}>{name}<ArrowRight size={12}/></button>)}</div></section>}
  {state.mode==='guided'&&<section className={styles.guideCopy} aria-live="polite"><small>{String(state.step+1).padStart(2,'0')} / 05 · {step.verb}</small><h2>{step.title}</h2><p>{step.description}</p>{state.paused&&<p className={styles.pauseNote}>已暂停 · 可自由观察。继续将恢复本步骤的镜头与资料。</p>}</section>}
  <div className={styles.camera} aria-label="局部相机控制"><button aria-label="向左旋转现场" onClick={()=>engine.current?.orbit(-.25)} disabled={!loaded}><ChevronLeft size={17}/></button><button aria-label="向右旋转现场" onClick={()=>engine.current?.orbit(.25)} disabled={!loaded}><ChevronRight size={17}/></button><button aria-label="放大现场" onClick={()=>engine.current?.zoom(.8)} disabled={!loaded}><Plus size={17}/></button><button aria-label="缩小现场" onClick={()=>engine.current?.zoom(1.25)} disabled={!loaded}><Minus size={17}/></button><button aria-label="重置局部视角" onClick={()=>engine.current?.reset()} disabled={!loaded}><RotateCcw size={16}/></button><button aria-label="打开研究资料列表" onClick={()=>{dispatch({type:'select',id:null});setPanel(true);}} disabled={!loaded}><Layers size={16}/></button></div>
  <div className={styles.guideBar}>
   {state.mode==='free'?<><button className={styles.start} onClick={()=>showStep('start')} disabled={!loaded}><Play size={16}/>开始引导式研究<ArrowRight size={18}/></button><small>5 个空间步骤 · 可随时退出</small></>:<><div className={styles.progress} aria-label={`引导进度 ${state.step+1} / 5`}>{STORY.steps.map((s,i)=><i key={s.id} data-active={i<=state.step}/>)}</div><div className={styles.guideControls}><button onClick={()=>showStep('previous')} disabled={state.step===0}><ChevronLeft size={16}/>上一步</button><button onClick={()=>state.paused?showStep('resume'):dispatch({type:'pause'})}>{state.paused?<Play size={15}/>:<Pause size={15}/>} {state.paused?'继续引导':'暂停观察'}</button><button onClick={()=>showStep('next')} disabled={state.step===4}>下一步<ChevronRight size={16}/></button><button onClick={()=>showStep('skip')} disabled={state.step===4} aria-label="跳到方案步骤"><SkipForward size={16}/></button><button onClick={()=>showStep('reset')} aria-label="重新开始引导"><RotateCcw size={15}/></button><button onClick={()=>{dispatch({type:'exit'});setPanel(false);}}><X size={15}/>退出引导</button></div></>}
  </div>
  <div className={styles.legend} aria-label="空间标注图例"><span><LocateFixed size={12}/>点</span><span>— 路径</span><span>▱ 区域</span><span><Box size={12}/>对象轮廓</span><small>语义由图标、文字和类别色共同标识</small></div>
  <div className={styles.status} role="status">{error?'加载失败':!loaded?'正在构建概念研究现场':moving?'镜头移动中 · 拖动可暂停':state.proposalVisible?'方案情景 · 概念介入':'自由观察 · 拖动旋转 / Shift 平移 / 滚轮缩放'}</div>
  {!loaded&&!error&&<div className={styles.loading}>构建河岸、路径与公共空间…</div>}
  {error&&<section className={styles.error} role="alert"><h2>暂时无法打开研究现场</h2><p>{error}</p><button onClick={()=>window.location.reload()}>重新载入</button><Link href="/experience?place=ezhou">返回鹅洲地图</Link></section>}
  <output className={styles.debug} data-testid="site-state">{JSON.stringify({...state,visible:visibleAnnotations(state).map(a=>a.id),highlighted:[...highlighted],metrics})}</output>
 </main>;
}
