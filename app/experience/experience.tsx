'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight,Plus,Minus,RotateCcw,Sun,Moon,X,Compass,Play,Pause,Info,ChevronLeft,ChevronRight,Layers,MousePointer2} from 'lucide-react';
import {CAMERA_PRESETS,PLACES} from '@/src/experience/config';
import type {ExperienceEngine} from '@/src/experience/engine';
import styles from './experience.module.css';

export default function Experience(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<ExperienceEngine|null>(null),markers=useRef(new Map<string,HTMLButtonElement>());
 const [loaded,setLoaded]=useState(false),[progress,setProgress]=useState(0),[loadingLabel,setLoadingLabel]=useState('准备一段湘江之旅');
 const [error,setError]=useState(''),[started,setStarted]=useState(false),[night,setNight]=useState(false),[moving,setMoving]=useState(false);
 const [overview,setOverview]=useState(false),[drawer,setDrawer]=useState<'places'|'views'|'about'|null>(null),[selected,setSelected]=useState<string|null>(null),[preset,setPreset]=useState(0);
 const [metrics,setMetrics]=useState<{fps:number;calls:number;triangles:number;geometries:number;buildings:number;knownHeight:number;trees:number}|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null),drawerCloseRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!host.current)return;const target=host.current,controller=new AbortController();let disposed=false,instance:ExperienceEngine|null=null;
  import('@/src/experience/engine').then(({createExperience})=>createExperience(target,markers.current,{
   progress:(n,label)=>{if(disposed)return;if(n<0)setError(label);else{setProgress(n);setLoadingLabel(label);}},ready:()=>{if(!disposed)setLoaded(true);},motion:(v)=>{if(!disposed)setMoving(v);},metrics:(v)=>{if(!disposed)setMetrics(v);},
  },controller.signal)).then(e=>{instance=e;if(disposed)e.dispose();else engine.current=e;}).catch(e=>{if(!disposed&&e.name!=='AbortError')setError(e.message||'三维场景载入失败，请刷新后重试。');});
  return()=>{disposed=true;controller.abort();instance?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>{if(drawer)drawerCloseRef.current?.focus({preventScroll:true});else if(selected)closeRef.current?.focus({preventScroll:true});},[drawer,selected]);
 const begin=()=>{setStarted(true);setDrawer(null);engine.current?.start();};
 const reset=()=>{setSelected(null);setOverview(false);setDrawer(null);setPreset(0);engine.current?.reset();};
 const focus=(id:string)=>{setStarted(true);setSelected(id);setDrawer(null);engine.current?.focus(id);};
 const closePlace=()=>{setSelected(null);engine.current?.back();};
 const place=PLACES.find(p=>p.id===selected);
 return <main className={`${styles.experience} ${night?styles.night:''} ${started?styles.exploring:''}`} onKeyDown={e=>{if(e.key==='Escape'){setDrawer(null);if(selected)closePlace();else engine.current?.stop();}}}>
  <div ref={host} className={styles.scene}/>
  <div className={styles.vignette}/>
  <header className={styles.header}>
   <button className={styles.wordmark} onClick={reset} aria-label="湘江 2035，返回核心河段" disabled={!loaded}><span>湘江 <b>2035</b></span><small>XIANGJIANG · A LIVING ATLAS</small></button>
   <nav aria-label="地图导航" className={styles.nav}>
    <button disabled={!loaded} className={overview?styles.active:''} onClick={()=>{setStarted(true);setSelected(null);setDrawer(null);setOverview(true);engine.current?.overview();}}><span>全段概览</span><small>OVERVIEW</small></button>
    <button disabled={!loaded} aria-expanded={drawer==='places'} onClick={()=>setDrawer(drawer==='places'?null:'places')}><span>地点探索</span><small>EXPLORE</small></button>
    <button className={styles.theme} disabled={!loaded} onClick={()=>{engine.current?.theme(!night);setNight(!night);}} aria-label={night?'切换日间':'切换夜间'} aria-pressed={night}>{night?<Moon size={17}/>:<Sun size={18}/>}<span>{night?'夜':'昼'}</span></button>
   </nav>
  </header>
  <div className={`${styles.markers} ${selected?styles.hasSelection:''}`} aria-label="地图地点">
   {PLACES.map(p=><button key={p.id} ref={el=>{if(el)markers.current.set(p.id,el);else markers.current.delete(p.id);}} className={`${styles.marker} ${selected===p.id?styles.selectedMarker:''}`} onClick={()=>focus(p.id)} aria-label={`探索${p.name}`} style={{visibility:'hidden'}} disabled={!loaded} data-place={p.id}><i/><span>{p.name}<small>{p.en}</small></span></button>)}
  </div>
  <section className={`${styles.intro} ${started?styles.introHidden:''}`} aria-label="开始探索" aria-hidden={started} inert={started}>
   <p className={styles.eyebrow}><span/> CHANGSHA, CHINA <span className={styles.coords}>28°11′ N · 112°58′ E</span></p>
   <h1>一条江，<br/>一种<span>未来。</span></h1>
   <p className={styles.subtitle}>山水之间，重新认识一座城。<br/><span>湘江生态文化与社会创新地图</span></p>
   <button className={styles.start} onClick={begin} disabled={!loaded||!!error}><span className={styles.startCircle}><ArrowRight size={24}/></span><span>{loaded?'开始探索':'正在构建湘江'}<small>{loaded?'START THE EXPERIENCE':`${String(progress).padStart(2,'0')} / 100`}</small></span></button>
  </section>
  {!loaded&&!error&&<div className={styles.loading} role="status" aria-live="polite"><span>{loadingLabel}</span><div><i style={{width:`${progress}%`}}/></div></div>}
  {error&&<section className={styles.error} role="alert"><h2>暂时无法展开这段湘江</h2><p>{error}</p><button onClick={()=>window.location.reload()}>重新载入 <RotateCcw size={15}/></button><a href="/create-research">进入研究平台 <ArrowUpRight size={15}/></a></section>}
  {started&&!place&&!drawer&&<div className={styles.caption} key={overview?'overview':'core'}><p>{overview?'THE RIVER CORRIDOR':'THE HEART OF CHANGSHA'}</p><h2>{overview?'从铜官窑，到昭山。':'山 · 水 · 洲 · 城'}</h2><span>{overview?'沿一条江，连接不同的研究现场。':'长沙核心河段 / 橘子洲与湘江两岸'}</span>{overview&&<button onClick={reset}>回到长沙核心河段 <ArrowRight size={15}/></button>}</div>}
  {place&&<aside className={styles.placePanel} aria-label={`${place.name}地点信息`}>
   <button ref={closeRef} className={styles.close} onClick={closePlace} aria-label="关闭地点并返回原视角"><X size={20}/></button>
   <p className={styles.eyebrow}>FIELD NOTES <span>/ {place.index}</span></p><small className={styles.placeEnglish}>{place.en}</small><h2>{place.name}</h2>
   <p className={styles.category}>{place.category}</p><p className={styles.description}>{place.description}</p>
   <div className={styles.location}><span>{place.coordinate[1].toFixed(4)}° N</span><span>{place.coordinate[0].toFixed(4)}° E</span></div>
   <p className={styles.dataNote}>{place.note}</p><button className={styles.textButton} onClick={closePlace}><ChevronLeft size={16}/> 返回原视角</button>
  </aside>}
  {drawer&&<aside className={styles.drawer} aria-label={drawer==='places'?'地点列表':drawer==='views'?'镜头预设':'关于此地图'}>
   <button ref={drawerCloseRef} className={styles.close} onClick={()=>setDrawer(null)} aria-label="关闭面板"><X size={20}/></button>
   <p className={styles.eyebrow}>{drawer==='places'?'PLACES ALONG THE RIVER':drawer==='views'?'A DIFFERENT PERSPECTIVE':'ABOUT THIS ATLAS'}</p>
   <h2>{drawer==='places'?'沿江，遇见。':drawer==='views'?'看江的方式。':'一条持续生长的江。'}</h2>
   {drawer==='places'?<div className={styles.placeList}>{PLACES.map(p=><button key={p.id} onClick={()=>focus(p.id)}><span>{p.index}</span><div>{p.name}<small>{p.category}</small></div><ArrowUpRight size={20}/></button>)}</div>:drawer==='views'?<div className={styles.placeList}>{CAMERA_PRESETS.map((p,i)=><button key={p.id} aria-pressed={preset===i} onClick={()=>{setPreset(i);setStarted(true);setSelected(null);setOverview(false);engine.current?.preset(i);setDrawer(null);}}><span>0{i+1}</span><div>{p.name}<small>{p.description}</small></div>{preset===i?<span className={styles.current}>当前</span>:<ArrowUpRight size={20}/>}</button>)}</div>:<div className={styles.about}><p>以真实地点为索引，连接湘江的生态、文化与社会创新。此版本是三维空间体验 Demo，研究内容将逐步接入。</p><p>河岸与核心建筑轮廓来自 OpenStreetMap；外围建筑与道路补充自 Overture Maps。外围采用轮廓推导的简化白模，未知高度为估算。树木根据 OSM 与 ESA WorldCover 林地范围布置；山体来自公开高程瓦片，并做了河岸平顺处理。鹅洲标记仍待校准。</p><p>数据署名：© OpenStreetMap contributors, Overture Maps Foundation；East Asian Buildings。© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium。地形：Mapzen / USGS。</p><p>坐标来源 WGS84。尚未完成 CGCS2000 基准校准，不用于测绘。拖动平移，右键或 Shift 拖动旋转，滚轮缩放；方向键旋转，Home 重置，Esc 关闭面板。</p><a href="/create-research">进入原有研究平台 <ArrowUpRight size={17}/></a></div>}
  </aside>}
  {loaded&&!error&&<>
   <div className={styles.cameraControls} aria-label="镜头控制">
    <button onClick={()=>engine.current?.orbit(-.25)} aria-label="向左旋转"><ChevronLeft size={18}/></button><button onClick={()=>engine.current?.orbit(.25)} aria-label="向右旋转"><ChevronRight size={18}/></button><span/>
    <button onClick={()=>engine.current?.zoom(.82)} aria-label="放大"><Plus size={18}/></button><button onClick={()=>engine.current?.zoom(1.22)} aria-label="缩小"><Minus size={18}/></button><button onClick={reset} aria-label="重置镜头"><RotateCcw size={16}/></button>
   </div>
   <div className={styles.compass} data-compass aria-hidden="true"><span>N</span><Compass size={32} strokeWidth={1}/></div>
  </>}
  <footer className={styles.footer}>
   <div className={styles.chapter}><span>01 — 06</span><i/><span>{overview?'湘江研究全段':'长沙 · 核心河段'}</span></div>
   <div className={styles.hint}><MousePointer2 size={13}/><span>拖动探索</span><i/><span>滚轮缩放</span><i/><span>Shift + 拖动旋转</span></div>
   <div className={styles.footerActions}><button disabled={!loaded} aria-label={moving?'停止镜头运动':'播放沿江巡游'} onClick={()=>{setStarted(true);if(moving)engine.current?.stop();else {setSelected(null);setDrawer(null);setOverview(false);engine.current?.tour();}}}>{moving?<Pause size={14}/>:<Play size={14}/>}<span>{moving?'停止镜头':'沿江巡游'}</span></button><button disabled={!loaded} onClick={()=>setDrawer(drawer==='views'?null:'views')} aria-label="选择镜头预设"><Layers size={15}/></button><button onClick={()=>setDrawer(drawer==='about'?null:'about')} aria-label="关于地图与数据"><Info size={15}/></button></div>
  </footer>
  <div className={styles.attribution}><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a><span> · </span><a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noreferrer">Overture Maps</a><span> · </span><a href="https://esa-worldcover.org/en" target="_blank" rel="noreferrer">ESA WorldCover</a><span> · </span><a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Mapzen / USGS</a></div>
  <span className={styles.edition}>XIANGJIANG 2035 / SPATIAL EXPERIENCE 02</span>
  <output className={styles.metrics} data-testid="scene-metrics" aria-hidden="true">{metrics?JSON.stringify(metrics):'loading'}</output>
  <span className={styles.motionStatus} role="status" aria-live="polite">{moving?'镜头移动中，可拖动打断':loaded?'场景已就绪':''}</span>
 </main>;
}
