'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowRight,Plus,Minus,RotateCcw,Sun,Moon,X,Compass,Play,Pause,Info,ChevronLeft,ChevronRight,MapPin,Layers,BookOpen,SlidersHorizontal} from 'lucide-react';
import {CAMERA_PRESETS,PLACES} from '@/src/experience/config';
import {MINI_MAP,miniPoint,worldPoint} from '@/src/experience/minimap';
import {project} from '@/src/experience/geo';
import type {ExperienceEngine} from '@/src/experience/engine';
import styles from './experience.module.css';
import {PlaceDetail,AtlasLibrary,type DetailTab} from './place-detail';
import {LayerPanel} from './layer-panel';
import {LAYERS,recordById} from '@/src/atlas/catalog';
import {MAP_OBJECTS,layersForObjects,visibleObjects} from '@/src/atlas/objects';
import type {LayerId,OverlayState,ProposalScenario} from '@/src/atlas/types';
import {profileFor} from '@/src/atlas/places';

export default function Experience({initialPlace}:{initialPlace?:string}){
 const host=useRef<HTMLDivElement>(null),engine=useRef<ExperienceEngine|null>(null),markers=useRef(new Map<string,HTMLButtonElement>());
 const [loaded,setLoaded]=useState(false),[progress,setProgress]=useState(0),[loadingLabel,setLoadingLabel]=useState('准备一段湘江之旅');
 const [error,setError]=useState(''),[started,setStarted]=useState(false),[night,setNight]=useState(true),[moving,setMoving]=useState(false);
 const [overview,setOverview]=useState(false),[freeExplore,setFreeExplore]=useState(false),[drawer,setDrawer]=useState<'places'|'views'|'about'|null>(null),[selected,setSelected]=useState<string|null>(null);
 const [detailOpen,setDetailOpen]=useState(false),[detailTab,setDetailTab]=useState<DetailTab>('overview'),[recordId,setRecordId]=useState<string|null>(null);
 const [atlasPanel,setAtlasPanel]=useState<'layers'|'library'|null>(null),[layers,setLayers]=useState<LayerId[]>([]),[proposal,setProposal]=useState<ProposalScenario|null>(null),[objectIds,setObjectIds]=useState<string[]>([]);
 const [preset,setPreset]=useState(0),[mapPaths,setMapPaths]=useState<string[]>([]),[toolsOpen,setToolsOpen]=useState(false);
 const [metrics,setMetrics]=useState<{fps:number;calls:number;triangles:number;geometries:number;buildings:number;knownHeight:number;trees:number}|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null),drawerCloseRef=useRef<HTMLButtonElement>(null),previousOverview=useRef(false);
 useEffect(()=>{
  if(!host.current)return;const target=host.current,controller=new AbortController();let disposed=false,instance:ExperienceEngine|null=null;
  import('@/src/experience/engine').then(({createExperience})=>createExperience(target,markers.current,{
   progress:(n,label)=>{if(disposed)return;if(n<0)setError(label);else{setProgress(n);setLoadingLabel(label);}},ready:()=>{if(!disposed)setLoaded(true);},motion:(v)=>{if(!disposed)setMoving(v);},metrics:(v)=>{if(!disposed)setMetrics(v);},minimap:(paths)=>{if(!disposed)setMapPaths(paths);},
  },controller.signal)).then(e=>{instance=e;if(disposed)e.dispose();else {engine.current=e;if(initialPlace&&PLACES.some(p=>p.id===initialPlace)){setStarted(true);setSelected(initialPlace);e.focus(initialPlace);}}}).catch(e=>{if(!disposed&&e.name!=='AbortError')setError(e.message||'三维场景载入失败，请刷新后重试。');});
  return()=>{disposed=true;controller.abort();instance?.dispose();engine.current=null;};
 },[initialPlace]);
 useEffect(()=>{if(drawer)drawerCloseRef.current?.focus({preventScroll:true});else if(selected&&!moving)closeRef.current?.focus({preventScroll:true});},[drawer,selected,moving]);
 const overlayState:OverlayState={layers,proposal,selectedObjectIds:objectIds,placeId:selected};
 useEffect(()=>{engine.current?.setOverlays({layers,proposal,selectedObjectIds:objectIds,placeId:selected});},[loaded,layers,proposal,objectIds,selected]);
 const begin=()=>{setStarted(true);setDrawer(null);engine.current?.start();};
 const reset=()=>{setAtlasPanel(null);setRecordId(null);setProposal(null);setObjectIds([]);setFreeExplore(false);setDetailOpen(false);setSelected(null);setRecordId(null);setProposal(null);setObjectIds([]);setAtlasPanel(null);setOverview(false);setDrawer(null);setPreset(0);engine.current?.reset();};
 const focus=(id:string)=>{setAtlasPanel(null);if(id!==selected){setRecordId(null);setProposal(null);setObjectIds([]);setDetailTab('overview');}if(!selected)previousOverview.current=overview;setStarted(true);setDetailOpen(false);setSelected(id);setOverview(false);setDrawer(null);engine.current?.focus(id);};
 const closePlace=()=>{setRecordId(null);setProposal(null);setObjectIds([]);setDetailOpen(false);setSelected(null);setRecordId(null);setProposal(null);setObjectIds([]);setAtlasPanel(null);setOverview(previousOverview.current);engine.current?.back();};
 const showOverview=()=>{setAtlasPanel(null);setRecordId(null);setProposal(null);setObjectIds([]);setStarted(true);setDetailOpen(false);setSelected(null);setRecordId(null);setProposal(null);setObjectIds([]);setAtlasPanel(null);setDrawer(null);setOverview(true);engine.current?.overview();};
 const changeTheme=(value:boolean)=>{engine.current?.theme(value);setNight(value);};
 const revealObjects=(ids:string[])=>{setObjectIds(ids);setLayers(current=>Array.from(new Set([...current,...layersForObjects(ids)])));};
 const openRecord=(id:string|null)=>{if(!id){setRecordId(null);setProposal(null);setObjectIds([]);return;}const r=recordById(id);if(!r)return;if(selected!==r.placeId)focus(r.placeId);setStarted(true);setAtlasPanel(null);setDrawer(null);setDetailOpen(true);setRecordId(id);if(id!==proposal?.proposalId)setProposal(null);setDetailTab(r.kind==='ResearchProject'||r.kind==='ResearchSession'?'research':r.kind==='FieldRecord'?'evidence':['Proposal','DesignOpportunity'].includes(r.kind)?'design':'questions');revealObjects(r.objectIds);};
 const openObject=(id:string)=>{const o=MAP_OBJECTS.find(o=>o.id===id);if(!o)return;if(o.recordId){openRecord(o.recordId);return;}else{if(selected!==o.placeId)focus(o.placeId);setAtlasPanel(null);setDetailTab('overview');setRecordId(null);setProposal(null);setDetailOpen(true);}revealObjects([o.id]);};
 const changeProposal=(view:ProposalScenario['view'])=>{const record=recordId?recordById(recordId):undefined;if(record?.kind!=='Proposal'||record.placeId!==selected)return;setProposal({proposalId:record.id,view});revealObjects(record.objectIds);};

 const place=PLACES.find(p=>p.id===selected);
 const currentLabel=place?.name??(overview?'湘江全段':freeExplore?'沿江自由探索':'长沙核心河段');
 const miniPlaces=PLACES.filter(p=>['tongguan','juzizhou','zhaoshan'].includes(p.id));
 return <main className={`${styles.experience} ${night?styles.night:''} ${started?styles.exploring:''} ${drawer?styles.drawerOpen:''} ${detailOpen||atlasPanel?styles.reading:''}`} onKeyDown={e=>{if(e.key==='Escape'){if(atlasPanel)setAtlasPanel(null);else if(drawer)setDrawer(null);else if(detailOpen)setDetailOpen(false);else if(selected)closePlace();else engine.current?.stop();}else if(e.key==='Home'&&e.target instanceof HTMLCanvasElement){e.preventDefault();reset();}}}>
  <div ref={host} className={styles.scene}/><div className={styles.vignette}/>
  <header className={styles.header}>
   <button className={styles.wordmark} onClick={reset} aria-label="湘江 2035，返回核心河段" disabled={!loaded}><span>湘江 <b>2035</b></span><small>将来的江来 · A LIVING ATLAS</small></button>
   <a className={styles.platformLink} href="/create-research">研究平台 <ArrowUpRight size={18}/></a>
  </header>
  {loaded&&<div className={styles.atlasToolbar} aria-label="知识地图工具"><button aria-expanded={atlasPanel==='layers'} onClick={()=>{setStarted(true);setDrawer(null);setAtlasPanel(atlasPanel==='layers'?null:'layers');}}><SlidersHorizontal size={15}/>图层 <small>{layers.length}</small></button><button aria-expanded={atlasPanel==='library'} onClick={()=>{setStarted(true);setDrawer(null);setAtlasPanel(atlasPanel==='library'?null:'library');}}><BookOpen size={15}/>资料</button></div>}

  <div className={`${styles.markers} ${selected?styles.hasSelection:''}`} aria-label="地图地点">
   {PLACES.map(p=><button key={p.id} ref={el=>{if(el)markers.current.set(p.id,el);else markers.current.delete(p.id);}} className={`${styles.marker} ${selected===p.id?styles.selectedMarker:''}`} onClick={()=>focus(p.id)} aria-label={`探索${p.name}`} style={{visibility:'hidden'}} disabled={!loaded} data-place={p.id}><i/><span>{p.name}<small>{p.en}</small></span></button>)}
  </div>
  <div className={styles.knowledgeMarkers} aria-label="空间资料对象">{MAP_OBJECTS.map(o=><button key={o.id} ref={el=>{if(el)markers.current.set('object:'+o.id,el);else markers.current.delete('object:'+o.id);}} style={{visibility:'hidden','--object-color':LAYERS.find(l=>l.id===o.layer)!.color} as React.CSSProperties} className={`${styles.objectMarker} ${objectIds.includes(o.id)?styles.activeObject:''}`} onClick={()=>openObject(o.id)} aria-label={`空间对象：${o.title}`}><i/><span>{o.title}<small>{o.dataStatus==='demo'?'演示 / 非实测':'公开资料 / 地点级索引'}</small></span></button>)}</div>
  {atlasPanel==='layers'&&<LayerPanel state={overlayState} onToggle={id=>setLayers(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])} onObject={openObject} onClose={()=>setAtlasPanel(null)}/>}
  {atlasPanel==='library'&&<AtlasLibrary onOpen={openRecord} onClose={()=>setAtlasPanel(null)}/>}
  <div className={styles.metrics} data-testid="atlas-state">{JSON.stringify({place:selected,layers,proposal,record:recordId,objects:visibleObjects(overlayState).map(o=>o.id),detailOpen,objectIds})}</div>
  <section className={`${styles.intro} ${started?styles.introHidden:''}`} aria-label="开始探索" aria-hidden={started} inert={started}>
   <p className={styles.eyebrow}>CHANGSHA, CHINA <span>28°11′ N · 112°58′ E</span></p>
   <h1>一条江，<br/><span>一种未来。</span></h1>
   <p className={styles.subtitle}>湘江生态文化与社会创新地图</p>
   <button className={styles.start} onClick={begin} disabled={!loaded||!!error}><span className={styles.startCircle}><ArrowRight size={24}/></span><span>{loaded?'开始探索':'正在构建湘江'}<small>{loaded?'START THE EXPERIENCE':`${String(progress).padStart(2,'0')} / 100`}</small></span></button>
  </section>
  {!loaded&&!error&&<div className={styles.loading} role="status" aria-live="polite"><span>{loadingLabel}</span><div><i style={{width:`${progress}%`}}/></div></div>}
  {error&&<section className={styles.error} role="alert"><h2>暂时无法展开这段湘江</h2><p>{error}</p><button onClick={()=>window.location.reload()}>重新载入 <RotateCcw size={15}/></button><a href="/create-research">进入研究平台 <ArrowUpRight size={15}/></a></section>}
  {place&&detailOpen&&!atlasPanel&&!drawer&&!moving&&<PlaceDetail key={place.id} place={place} onClose={()=>setDetailOpen(false)} onMap={()=>{setDetailOpen(false);engine.current?.focus(place.id);}} tab={detailTab} onTab={setDetailTab} recordId={recordId} onRecord={openRecord} proposal={proposal} onProposal={changeProposal}/>}
  {place&&!detailOpen&&!atlasPanel&&!drawer&&!moving&&<aside className={styles.placePanel} aria-label={`${place.name}地点信息`}>
   <button ref={closeRef} className={styles.close} onClick={closePlace} aria-label="关闭地点并返回原视角"><X size={20}/></button>
   <p className={styles.eyebrow}>FIELD NOTES <span>/ {place.index}</span></p><small className={styles.placeEnglish}>{place.en}</small><h2>{place.name}</h2>
   <p className={styles.category}>{place.category}</p><p className={styles.description}>{place.description}</p>
   <div className={styles.location}><span>{place.coordinate[1].toFixed(4)}° N</span><span>{place.coordinate[0].toFixed(4)}° E</span></div>
   <p className={styles.dataNote}>{place.note}</p>{place.id==='ezhou'&&<Link className={styles.siteEntry} href="/experience/sites/ezhou">进入三维研究现场 <ArrowUpRight size={15}/><small>概念场景 · 非真实扫描</small></Link>}<p className={styles.dataNote}>{profileFor(place.id).tags.join(' · ')}</p><button className={styles.detailEntry} onClick={()=>setDetailOpen(true)}>进入地点详情 <ArrowRight size={14}/></button><button className={styles.textButton} onClick={closePlace}><ChevronLeft size={16}/> 返回原视角</button>
  </aside>}
  {drawer&&<aside className={styles.drawer} aria-label={drawer==='places'?'地点列表':drawer==='views'?'镜头预设':'关于此地图'}>
   <button ref={drawerCloseRef} className={styles.close} onClick={()=>setDrawer(null)} aria-label="关闭面板"><X size={20}/></button>
   <p className={styles.eyebrow}>{drawer==='places'?'PLACES ALONG THE RIVER':drawer==='views'?'PERSPECTIVES':'ABOUT THE ATLAS'}</p>
   <h2>{drawer==='places'?'沿江探索':drawer==='views'?'观察视角':'关于湘江 2035'}</h2>
   {drawer==='places'?<div className={styles.placeList}>{PLACES.map(p=><button key={p.id} onClick={()=>focus(p.id)} aria-pressed={selected===p.id}><span>{p.index}</span><div>{p.name}<small>{p.category}</small></div><ArrowUpRight size={19}/></button>)}</div>:drawer==='views'?<div className={styles.placeList}>{CAMERA_PRESETS.map((p,i)=><button key={p.id} aria-pressed={preset===i} onClick={()=>{setPreset(i);setFreeExplore(false);setStarted(true);setDetailOpen(false);setSelected(null);setRecordId(null);setProposal(null);setObjectIds([]);setAtlasPanel(null);setOverview(false);engine.current?.preset(i);setDrawer(null);}}><span>0{i+1}</span><div>{p.name}<small>{p.description}</small></div><ArrowUpRight size={19}/></button>)}</div>:<div className={styles.about}><p>以真实地点为索引，连接湘江的生态、文化与社会创新。此版本是三维空间体验 Demo。</p><p>河岸与核心建筑轮廓来自 OpenStreetMap；外围建筑与道路补充自 Overture Maps。外围采用轮廓推导的简化体量，未知高度为估算。树木根据 OSM 与 ESA WorldCover 林地范围布置；山体来自公开高程瓦片，并做了河岸平顺处理。鹅洲标记采用公开地名近似坐标，尚非测绘定位。</p><p>© OpenStreetMap contributors, Overture Maps Foundation；East Asian Buildings。© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium。地形：Mapzen / USGS。</p><p>坐标来源 WGS84，尚未完成 CGCS2000 基准校准。小地图采用真实河岸轮廓旋转排列，左北右南；紫色矩形为随镜头旋转和缩放的近似视野指示；全段时适配小地图范围，不是透视投影的测绘边界。</p><p>拖动平移；右键或 Shift 拖动旋转；滚轮缩放；方向键旋转，Home 重置，Esc 返回。</p></div>}
  </aside>}
  <div className={`${styles.bottomDock} ${!started?styles.dockIntro:''}`}>
   <div className={styles.themeSwitch} role="group" aria-label="昼夜模式">
    <button aria-label="切换日间" aria-pressed={!night} onClick={()=>changeTheme(false)} disabled={!loaded}><Sun size={23} strokeWidth={1.3}/></button>
    <button aria-label="切换夜间" aria-pressed={night} onClick={()=>changeTheme(true)} disabled={!loaded}><Moon size={23} strokeWidth={1.3}/></button>
   </div>
   <div className={styles.miniMap} aria-label="湘江范围导航">
    <svg viewBox={`0 0 ${MINI_MAP.width} ${MINI_MAP.height}`} aria-label="湘江河岸与当前视野" role="img" onClick={e=>{if(!loaded)return;const r=e.currentTarget.getBoundingClientRect(),[x,z]=worldPoint((e.clientX-r.left)/r.width*MINI_MAP.width,(e.clientY-r.top)/r.height*MINI_MAP.height);setStarted(true);setFreeExplore(true);setDetailOpen(false);setSelected(null);setRecordId(null);setProposal(null);setObjectIds([]);setAtlasPanel(null);setOverview(false);setDrawer(null);engine.current?.navigate(x,z);}}>
     <defs><clipPath id="river-minimap-clip"><rect x="0" y="0" width="340" height="108"/></clipPath></defs>
     <g clipPath="url(#river-minimap-clip)"><g className={styles.miniRiver}>{mapPaths.map((d,i)=><path key={i} d={d} fillRule="evenodd"/>)}</g><path data-minimap-view className={styles.miniView}/><circle data-minimap-center r="2.2" className={styles.miniCenter}/></g>
    </svg>
    {miniPlaces.map(p=>{const [x,y]=miniPoint(...project(p.coordinate));return <button key={p.id} className={styles.miniStop} style={{left:`${x/MINI_MAP.width*100}%`,top:`${y/MINI_MAP.height*100}%`}} onClick={()=>focus(p.id)} disabled={!loaded} aria-label={`小地图：${p.name}`} aria-pressed={selected===p.id}><i/><span>{p.id==='juzizhou'?'长沙':p.name.replace('附近','')}</span></button>;})}
    <span className={styles.miniNorth}>N</span><span className={styles.mapLocation}>{moving?'镜头移动中':currentLabel}</span>
   </div>
   <div className={styles.utilities}>
    <button onClick={()=>{setStarted(true);if(moving)engine.current?.stop();else{setFreeExplore(false);setDetailOpen(false);setSelected(null);setRecordId(null);setProposal(null);setObjectIds([]);setAtlasPanel(null);setOverview(false);engine.current?.tour();}}} aria-label={moving?'停止镜头运动':'播放沿江巡游'} disabled={!loaded}>{moving?<Pause size={18}/>:<Play size={18}/>}</button>
    <button onClick={()=>{setAtlasPanel(null);setDrawer(drawer==='views'?null:'views');}} aria-label="选择镜头预设" disabled={!loaded}><Layers size={18}/></button>
    <button onClick={()=>{setAtlasPanel(null);setDrawer(drawer==='about'?null:'about');}} aria-label="关于地图与数据"><Info size={18}/></button>
   </div>
  </div>
  <nav className={styles.mainNav} aria-label="地图导航">
   <button disabled={!loaded} onClick={showOverview} aria-pressed={overview}><span>湘江全段<small>THE RIVER CORRIDOR</small></span><i><Compass size={20} strokeWidth={1}/></i></button>
   <button disabled={!loaded} aria-expanded={drawer==='places'} onClick={()=>{setAtlasPanel(null);setDrawer(drawer==='places'?null:'places');}}><span>地点探索<small>EXPLORE THE PLACES</small></span><i><MapPin size={20} strokeWidth={1}/></i></button>
  </nav>
  {loaded&&!error&&<div className={styles.cameraControls} aria-label="镜头控制">
   <button className={styles.compassButton} onClick={()=>setToolsOpen(!toolsOpen)} aria-expanded={toolsOpen} aria-label="展开镜头控制"><span>N</span><Compass size={30} strokeWidth={1} data-compass/></button>
   {toolsOpen&&<div className={styles.cameraTools}><button onClick={()=>engine.current?.orbit(-.22)} aria-label="向左旋转"><ChevronLeft size={18}/></button><button onClick={()=>engine.current?.orbit(.22)} aria-label="向右旋转"><ChevronRight size={18}/></button><button onClick={()=>engine.current?.zoom(.8)} aria-label="放大"><Plus size={18}/></button><button onClick={()=>engine.current?.zoom(1.25)} aria-label="缩小"><Minus size={18}/></button></div>}
   <button onClick={reset} aria-label="重置镜头"><RotateCcw size={17} strokeWidth={1.3}/></button>
  </div>}
  <div className={styles.attribution}><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noreferrer">Overture Maps</a> · <a href="https://esa-worldcover.org/en" target="_blank" rel="noreferrer">ESA WorldCover</a> · <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Mapzen / USGS</a></div>
  <div className={styles.edition}>XIANGJIANG 2035 / FUNCTIONAL DEMO 04</div>
  <div className={styles.metrics} data-testid="scene-metrics">{JSON.stringify(metrics)}</div><div className={styles.motionStatus} role="status" aria-live="polite">{moving?'镜头移动中，可拖动打断':loaded?'场景已就绪':loadingLabel}</div>
 </main>;
}
