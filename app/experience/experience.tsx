'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowRight,RotateCcw,Sun,Moon,X,Compass,Play,Pause,Info,ChevronLeft,MapPin,Layers,BookOpen,SlidersHorizontal} from 'lucide-react';
import {CAMERA_PRESETS,PLACES} from '@/src/experience/config';
import {MINI_MAP,miniPoint,worldPoint} from '@/src/experience/minimap';
import {project} from '@/src/experience/geo';
import type {ExperienceEngine} from '@/src/experience/engine';
import styles from './experience.module.css';
import {PlaceDetail,AtlasLibrary,type DetailTab} from './place-detail';
import {FocusLabel} from './focus-label';
import infoStyles from './information.module.css';
import {SUBTYPES,subtypeOf,focusState} from '@/src/atlas/information';
import {LayerPanel} from './layer-panel';
import {LayerSymbol} from './layer-symbol';
import {LAYER_VISUALS} from '@/src/atlas/visuals';
import {CameraControls} from './camera-controls';
import {recordById} from '@/src/atlas/catalog';
import {MAP_OBJECTS,layersForObjects,visibleObjects} from '@/src/atlas/objects';
import type {LayerId,OverlayState,ProposalScenario} from '@/src/atlas/types';
import {SHOWCASE_PLACES,studentMarkerCount,visibleStudentWorks,worksForPlace,showcaseStats,type ThemeFilter} from '@/src/student-works/catalog';
import {StudentWorkShowcase,StudentWorkExhibition,type CourseIndexView} from './student-work-showcase';
import {selectionGroup} from '@/src/student-works/selection';
import {preferredWorkPlace} from '@/src/student-works/relationships';
import {activeSceneDetail} from './panel-selection';
import workStyles from './student-work-showcase.module.css';



export default function Experience({initialPlace,studentShowcase:initialStudentShowcase=false}:{initialPlace?:string;studentShowcase?:boolean}){
 const [layers,setLayers]=useState<LayerId[]>(initialStudentShowcase?['proposal']:[]);
 const studentShowcase=layers.includes('proposal');
 const navigationPlaces=SHOWCASE_PLACES;
 const [workTheme,setWorkTheme]=useState<ThemeFilter>('all'),[worksOpen,setWorksOpen]=useState(studentShowcase);
 const [workQuery,setWorkQuery]=useState(''),[workView,setWorkView]=useState<CourseIndexView>('places'),[workIndexOpen,setWorkIndexOpen]=useState(false),[courseWorkId,setCourseWorkId]=useState<string|null>(null);
 const host=useRef<HTMLDivElement>(null),engine=useRef<ExperienceEngine|null>(null),markers=useRef(new Map<string,HTMLButtonElement>());
 const [loaded,setLoaded]=useState(false),[progress,setProgress]=useState(0),[loadingLabel,setLoadingLabel]=useState('准备一段湘江之旅');
 const [error,setError]=useState(''),[started,setStarted]=useState(studentShowcase),[night,setNight]=useState(true),[moving,setMoving]=useState(false);
 const [overview,setOverview]=useState(true),[freeExplore,setFreeExplore]=useState(false),[drawer,setDrawer]=useState<'places'|'views'|'about'|null>(null),[selected,setSelected]=useState<string|null>(null);
 const [detailOpen,setDetailOpen]=useState(false),[detailTab,setDetailTab]=useState<DetailTab>('overview'),[recordId,setRecordId]=useState<string|null>(null);
 const [atlasPanel,setAtlasPanel]=useState<'layers'|'library'|null>(null),[proposal,setProposal]=useState<ProposalScenario|null>(null),[objectIds,setObjectIds]=useState<string[]>([]);
 const [showDemo,setShowDemo]=useState(false),[subtypes,setSubtypes]=useState(['shoreline','bridge','context','memory','activity','intervention']),[guidedStep,setGuidedStep]=useState<number|null>(null);
 const objectAction=useRef<(id:string)=>void>(()=>{});
 const informationContext=useRef<{selected:string|null;overview:boolean;freeExplore:boolean;proposal:ProposalScenario|null}|null>(null);
 const [informationReady,setInformationReady]=useState(true);
 const [layerScope,setLayerScope]=useState<'all'|'place'>('all');
 const [preset,setPreset]=useState(0),[mapPaths,setMapPaths]=useState<string[]>([]);
 const [metrics,setMetrics]=useState<{fps:number;calls:number;triangles:number;geometries:number;buildings:number;knownHeight:number;trees:number}|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null),drawerCloseRef=useRef<HTMLButtonElement>(null),previousOverview=useRef(false);
 useEffect(()=>{
  if(!host.current)return;const target=host.current,controller=new AbortController();let disposed=false,instance:ExperienceEngine|null=null;
  import('@/src/experience/engine').then(({createExperience})=>createExperience(target,markers.current,{
   informationReady:value=>{if(!disposed)setInformationReady(value);},object:id=>objectAction.current(id),interact:()=>setGuidedStep(null),progress:(n,label)=>{if(disposed)return;if(n<0)setError(label);else{setProgress(n);setLoadingLabel(label);}},ready:()=>{if(!disposed)setLoaded(true);},motion:(v)=>{if(!disposed)setMoving(v);},metrics:(v)=>{if(!disposed)setMetrics(v);},minimap:(paths)=>{if(!disposed)setMapPaths(paths);},
  },controller.signal,SHOWCASE_PLACES)).then(e=>{instance=e;if(disposed)e.dispose();else {engine.current=e;if(initialStudentShowcase)e.overview();if(initialPlace&&SHOWCASE_PLACES.some(p=>p.id===initialPlace)){setStarted(true);setSelected(initialPlace);e.focus(initialPlace);}}}).catch(e=>{if(!disposed&&e.name!=='AbortError')setError(e.message||'三维场景载入失败，请刷新后重试。');});
  return()=>{disposed=true;controller.abort();instance?.dispose();engine.current=null;};
 },[initialPlace,initialStudentShowcase]);
 useEffect(()=>{if(drawer)drawerCloseRef.current?.focus({preventScroll:true});else if(selected&&!moving)closeRef.current?.focus({preventScroll:true});},[drawer,selected,moving]);
 const overlayState:OverlayState={layers,proposal,selectedObjectIds:objectIds,placeId:proposal||layerScope==='place'?selected:null,showDemo,subtypes};
 useEffect(()=>{engine.current?.setOverlays({layers,proposal,selectedObjectIds:objectIds,placeId:proposal||layerScope==='place'?selected:null,showDemo,subtypes});},[loaded,layers,proposal,objectIds,selected,layerScope,showDemo,subtypes]);
 const begin=()=>{setStarted(true);setOverview(false);setDrawer(null);engine.current?.start();};
 const clearRecord=()=>{informationContext.current=null;setRecordId(null);setProposal(null);setObjectIds([]);setGuidedStep(null);};
 const closeCourseWork=()=>{setCourseWorkId(null);setWorksOpen(true);setDetailOpen(false);clearRecord();setSelected(null);setAtlasPanel(null);setDrawer(null);if(selected)engine.current?.back();else engine.current?.stop();setOverview(previousOverview.current);};
 const openCourseWork=(id:string,contextPlace?:string)=>{const work=visibleStudentWorks(workTheme,workQuery).find(item=>item.id===id);if(!work)return;const target=preferredWorkPlace(work,contextPlace);clearRecord();setStarted(true);setDetailOpen(false);setAtlasPanel(null);setDrawer(null);setWorksOpen(false);setCourseWorkId(id);if(target){if(!selected)previousOverview.current=overview;setSelected(target);setOverview(false);if(selected!==target)engine.current?.focus(target);}else{setSelected(null);engine.current?.clearPlaceSelection();}};
 const changeWorkFilter=(theme:ThemeFilter,query:string)=>{setWorkTheme(theme);setWorkQuery(query);if(courseWorkId&&!visibleStudentWorks(theme,query).some(item=>item.id===courseWorkId)){setCourseWorkId(null);setSelected(null);setDetailOpen(false);setWorksOpen(true);clearRecord();engine.current?.clearPlaceSelection();}};
 const reset=()=>{if(studentShowcase){setCourseWorkId(null);setWorksOpen(true);}setAtlasPanel(null);clearRecord();setFreeExplore(false);setDetailOpen(false);setSelected(null);setOverview(false);setDrawer(null);setPreset(0);engine.current?.reset();};
 const focus=(id:string)=>{if(studentShowcase){const work=worksForPlace(id,workTheme,workQuery)[0];if(work){openCourseWork(work.id,id);return;}setCourseWorkId(null);setWorksOpen(false);}setAtlasPanel(null);if(id!==selected){clearRecord();setDetailTab('overview');}if(!selected)previousOverview.current=overview;setStarted(true);setDetailOpen(false);setSelected(id);setOverview(false);setDrawer(null);engine.current?.focus(id);};
 const closePlace=()=>{if(studentShowcase){closeCourseWork();return;}clearRecord();setDetailOpen(false);setSelected(null);setAtlasPanel(null);setOverview(previousOverview.current);engine.current?.back();};
 const showOverview=()=>{if(studentShowcase){setCourseWorkId(null);setWorksOpen(true);}setAtlasPanel(null);clearRecord();setStarted(true);setDetailOpen(false);setSelected(null);setDrawer(null);setOverview(true);engine.current?.overview();};
 const changeTheme=(value:boolean)=>{engine.current?.theme(value);setNight(value);};
 const revealObjects=(ids:string[])=>{setObjectIds(ids);setLayers(current=>Array.from(new Set([...current,...layersForObjects(ids)])));setSubtypes(current=>Array.from(new Set([...current,...MAP_OBJECTS.filter(o=>ids.includes(o.id)).map(subtypeOf)])));};
 const openRecord=(id:string|null)=>{if(!id){clearRecord();return;}setCourseWorkId(null);setWorksOpen(false);const r=recordById(id);if(!r)return;if(selected!==r.placeId)setSelected(r.placeId);setStarted(true);setAtlasPanel(null);setDrawer(null);setDetailOpen(true);setRecordId(id);if(id!==proposal?.proposalId)setProposal(null);setDetailTab(r.kind==='ResearchProject'||r.kind==='ResearchSession'?'research':r.kind==='FieldRecord'?'evidence':['Proposal','DesignOpportunity'].includes(r.kind)?'design':'questions');revealObjects(r.objectIds);};
 const focusInformation=(id:string,directoryOpen=false)=>{informationContext.current??={selected,overview,freeExplore,proposal};setOverview(false);setFreeExplore(false);engine.current?.focusSpatialInformation(id,{directoryOpen});};
 const openObject=(id:string,autoFocus=false)=>{const o=MAP_OBJECTS.find(o=>o.id===id);if(!o)return;setCourseWorkId(null);setWorksOpen(false);engine.current?.stop();setStarted(true);setDetailOpen(false);setDrawer(null);setRecordId(null);setGuidedStep(null);if(o.proposalId){setSelected(o.placeId);setProposal({proposalId:o.proposalId,view:'intervention'});}else setProposal(null);revealObjects([id]);const keepDirectory=window.innerWidth>=1100&&atlasPanel==='layers';if(window.innerWidth<1100)setAtlasPanel(null);if(autoFocus)focusInformation(id,keepDirectory);};
 useEffect(()=>{objectAction.current=id=>openObject(id);});
 const reconcile=(next:OverlayState)=>{const visible=new Set(visibleObjects(next).map(o=>o.id));if(objectIds.some(id=>!visible.has(id))){engine.current?.clearInformationFocus();informationContext.current=null;}setObjectIds(ids=>ids.filter(id=>visible.has(id)));setGuidedStep(null);};
 const toggleLayer=(id:LayerId)=>{const enabled=layers.includes(id),next=enabled?layers.filter(x=>x!==id):[...layers,id];setLayers(next);if(id==='proposal'){setWorksOpen(!enabled);if(enabled&&courseWorkId){setCourseWorkId(null);setDetailOpen(false);clearRecord();setSelected(null);engine.current?.clearPlaceSelection();}}reconcile({...overlayState,layers:next});};
 const openCourseLayer=()=>{if(!studentShowcase)toggleLayer('proposal');setWorksOpen(true);setCourseWorkId(null);setDetailOpen(false);clearRecord();setSelected(null);setStarted(true);setAtlasPanel(null);setDrawer(null);engine.current?.clearPlaceSelection();};
 const toggleSubtype=(id:string)=>{const layer=SUBTYPES.find(s=>s.id===id)?.layer;if(!layer)return;const next=subtypes.includes(id)&&layers.includes(layer)?subtypes.filter(x=>x!==id):Array.from(new Set([...subtypes,id]));const nextLayers=Array.from(new Set([...layers,layer]));setLayers(nextLayers);setSubtypes(next);reconcile({...overlayState,layers:nextLayers,subtypes:next});};
 const demoVisibility=(value:boolean)=>{setShowDemo(value);reconcile({...overlayState,showDemo:value});};
 const changeScope=(scope:'all'|'place')=>{setLayerScope(scope);reconcile({...overlayState,placeId:scope==='place'?selected:null});};
 const guideIds=[MAP_OBJECTS.find(o=>o.subtype==='shoreline')?.id,'pilot-juzizhou-bridge','pilot-contour-100','pilot-park-16734077'].filter((id):id is string=>!!id&&MAP_OBJECTS.some(o=>o.id===id));
 const guide=(step:number)=>{const id=guideIds[step];if(!id)return;setCourseWorkId(null);setWorksOpen(false);setStarted(true);setAtlasPanel(null);setDetailOpen(false);setDrawer(null);setLayerScope('all');setProposal(null);setRecordId(null);setGuidedStep(step);revealObjects([id]);focusInformation(id);};
 const closeExplanation=(preserveView=false)=>{setObjectIds([]);setGuidedStep(null);if(preserveView)engine.current?.stop();else{engine.current?.clearInformationFocus();informationContext.current=null;}};
 const clearLayers=()=>{setCourseWorkId(null);setWorksOpen(false);if(studentShowcase){setSelected(null);setDetailOpen(false);engine.current?.clearPlaceSelection();}informationContext.current=null;setLayers([]);setObjectIds([]);setGuidedStep(null);setProposal(null);engine.current?.clearInformationFocus();};
 const currentObject=visibleObjects(overlayState).find(o=>objectIds.includes(o.id));
 const sceneFocus=focusState(overlayState,MAP_OBJECTS,guidedStep);
 const changeProposal=(view:ProposalScenario['view'])=>{const record=recordId?recordById(recordId):undefined;if(record?.kind!=='Proposal'||record.placeId!==selected)return;setLayerScope('place');setProposal({proposalId:record.id,view});revealObjects(record.objectIds);};

 const courseGroup=selectionGroup(courseWorkId,workTheme,workQuery,selected);
 const courseWork=courseGroup.find(work=>work.id===courseWorkId);
 const rightDetail=activeSceneDetail({detailOpen,objectId:currentObject?.id,courseWorkId:courseWork?.id,atlasPanel,drawer});
 const place=navigationPlaces.find(p=>p.id===selected);
 const currentLabel=place?.name??(overview?'湘江全段':freeExplore?'沿江自由探索':'长沙核心河段');
 const miniPlaces=navigationPlaces.filter(p=>['tongguan','juzizhou','zhaoshan'].includes(p.id));
 return <main data-work-open={rightDetail==='course'} style={{...Object.fromEntries(Object.entries(LAYER_VISUALS).map(([id,v])=>[`--layer-${id}`,night?v.night:v.day])),'--information-rgb':night?'8,23,28':'246,249,248'} as React.CSSProperties} className={`${styles.experience} ${studentShowcase?workStyles.mode:''} ${night?styles.night:''} ${started?styles.exploring:''} ${drawer?styles.drawerOpen:''} ${detailOpen||atlasPanel?styles.reading:''} ${currentObject?styles.objectReading:''}`} onKeyDown={e=>{if(e.key==='Escape'){if(studentShowcase&&courseWorkId&&!detailOpen){closeCourseWork();}else if(worksOpen){setWorksOpen(false);}else if(detailOpen){setDetailOpen(false);}else if(currentObject){closeExplanation();}else if(atlasPanel)setAtlasPanel(null);else if(drawer)setDrawer(null);else if(detailOpen)setDetailOpen(false);else if(selected)closePlace();else engine.current?.stop();}else if(e.key==='Home'&&e.target instanceof HTMLCanvasElement){e.preventDefault();reset();}}}>
  <div ref={host} className={styles.scene}/><div className={`${styles.vignette} ${studentShowcase?workStyles.sceneVeil:''}`}/>
  <header className={styles.header}>
   <button className={styles.wordmark} onClick={reset} aria-label="湘江 2035，返回核心河段" disabled={!loaded}><span>湘江 <b>2035</b></span><small>将来的江来 · A LIVING ATLAS</small></button>
   <nav className={styles.headerActions} aria-label="知识地图工具">
    <button disabled={!loaded} aria-expanded={atlasPanel==='layers'} onClick={()=>{setStarted(true);setDrawer(null);setAtlasPanel(atlasPanel==='layers'?null:'layers');}}><SlidersHorizontal size={16}/>图层 <small>{layers.length}</small></button><button disabled={!loaded} aria-expanded={atlasPanel==='library'} onClick={()=>{setStarted(true);setDrawer(null);setAtlasPanel(atlasPanel==='library'?null:'library');}}><BookOpen size={16}/>资料</button>
    {studentShowcase&&<button onClick={()=>toggleLayer('proposal')}>关闭设计方案</button>}
    <a className={styles.platformLink} href="/create-research">研究平台 <ArrowUpRight size={16}/></a>
   </nav>
  </header>

  <div className={`${styles.markers} ${selected?styles.hasSelection:''}`} aria-label="地图地点">
   {navigationPlaces.map(p=><button key={p.id} ref={el=>{if(el)markers.current.set(p.id,el);else markers.current.delete(p.id);}} className={`${styles.marker} ${selected===p.id?styles.selectedMarker:''} ${studentShowcase&&studentMarkerCount(p.id,workTheme,workQuery)>0?workStyles.workMarker:''}`} aria-pressed={selected===p.id} hidden={!PLACES.some(place=>place.id===p.id)&&(!studentShowcase||studentMarkerCount(p.id,workTheme,workQuery)===0)} onClick={()=>focus(p.id)} aria-label={studentShowcase&&studentMarkerCount(p.id,workTheme,workQuery)>0?`${p.name}，${studentMarkerCount(p.id,workTheme,workQuery)}个课程作品`:`探索${p.name}`} style={{visibility:'hidden'}} disabled={!loaded} data-place={p.id} data-category={p.siteCategory}><i aria-hidden="true"/>{studentShowcase&&studentMarkerCount(p.id,workTheme,workQuery)>0&&<em>{studentMarkerCount(p.id,workTheme,workQuery)}</em>}<span>{p.name}<small>{studentShowcase&&studentMarkerCount(p.id,workTheme,workQuery)>0?`${studentMarkerCount(p.id,workTheme,workQuery)} 个课程作品`:p.category}</small></span></button>)}
  </div>
  <div className={styles.knowledgeMarkers} data-has-selection={objectIds.length>0} aria-label="空间资料对象">{MAP_OBJECTS.map(o=><button key={o.id} ref={el=>{if(el)markers.current.set('object:'+o.id,el);else markers.current.delete('object:'+o.id);}} style={{visibility:'hidden','--object-color':`var(--layer-${o.layer})`} as React.CSSProperties} data-layer={o.layer} className={`${styles.objectMarker} ${objectIds.includes(o.id)?styles.activeObject:''}`} onPointerEnter={()=>engine.current?.hoverObject(o.id)} onPointerLeave={()=>engine.current?.hoverObject(null)} onFocus={()=>engine.current?.hoverObject(o.id)} onBlur={()=>engine.current?.hoverObject(null)} onClick={()=>openObject(o.id)} aria-pressed={objectIds.includes(o.id)} aria-label={`空间对象：${o.title}`}><i><LayerSymbol layer={o.layer} size={19}/></i><span>{o.title}<small>{o.dataStatus==='demo'?'DEMO DATA / 模拟研究资料':o.subtype?'公开空间资料':'公开资料 / 地点级索引'}</small></span></button>)}</div>
  {studentShowcase&&!atlasPanel&&!drawer&&<StudentWorkShowcase theme={workTheme} query={workQuery} view={workView} expanded={workIndexOpen} selectedPlace={selected} active={worksOpen&&!courseWorkId&&!detailOpen} loaded={loaded} onTheme={value=>changeWorkFilter(value,workQuery)} onQuery={value=>changeWorkFilter(workTheme,value)} onView={setWorkView} onExpanded={setWorkIndexOpen} onLocate={focus} onWork={openCourseWork} onClose={()=>setWorksOpen(false)} onOverview={showOverview}/>}
  {studentShowcase&&courseWork&&rightDetail==='course'&&<StudentWorkExhibition works={courseGroup} placeName={place?.name??courseWork.originalSite} ready={loaded&&!moving} onClose={closeCourseWork} onArchive={place?()=>{setDetailOpen(true);setDetailTab('overview');setRecordId(null);}:undefined}/>}

  {atlasPanel==='layers'&&<LayerPanel courseStats={showcaseStats()} onCourseOpen={openCourseLayer} scope={selected?layerScope:'all'} onScope={changeScope} selectedPlace={place?.name} state={overlayState} onToggle={toggleLayer} onSubtype={toggleSubtype} onDemo={demoVisibility} onGuide={()=>guide(0)} onClear={clearLayers} onObject={id=>openObject(id,true)} onClose={()=>setAtlasPanel(null)}/>}
  {atlasPanel==='library'&&<AtlasLibrary onOpen={openRecord} onClose={()=>setAtlasPanel(null)}/>}
  {currentObject&&rightDetail==='object'&&<FocusLabel key={currentObject.id} object={currentObject} ready={informationReady} onExitStart={()=>engine.current?.stop()} onPlace={()=>{setAtlasPanel(null);setSelected(currentObject.placeId);setRecordId(null);setDetailTab('overview');setDetailOpen(true);}} onClose={()=>closeExplanation()} onFocus={()=>{setAtlasPanel(null);focusInformation(currentObject.id);}} onReturn={()=>{const context=informationContext.current;closeExplanation(true);setRecordId(null);setDetailOpen(false);setProposal(context?.proposal??null);if(context){setSelected(context.selected);setOverview(context.overview);setFreeExplore(context.freeExplore);}informationContext.current=null;engine.current?.returnFromFocus();}} onDetails={()=>{setAtlasPanel(null);setGuidedStep(null);if(currentObject.recordId)openRecord(currentObject.recordId);else{const details=document.getElementById(`source-${currentObject.id}`) as HTMLDetailsElement|null;if(details){details.open=true;details.scrollIntoView({block:'nearest'});}}}} step={guidedStep} steps={guideIds.length} onStep={guide}/>}
  {!atlasPanel&&layers.length>0&&!detailOpen&&<div className={infoStyles.legend} aria-label="当前图层图例">{SUBTYPES.filter(sub=>visibleObjects(overlayState).some(o=>subtypeOf(o)===sub.id)).map(sub=><span key={sub.id} style={{color:`var(--layer-${sub.layer})`}}>{sub.label}<small>{sub.form}</small></span>)}</div>}
  <div className={styles.metrics} data-testid="atlas-state">{JSON.stringify({place:selected,layers,proposal,record:recordId,objects:visibleObjects(overlayState).map(o=>o.id),detailOpen,objectIds,showDemo,subtypes,sceneFocus,informationReady,moving})}</div>
  <section className={`${styles.intro} ${started?styles.introHidden:''}`} aria-label="开始探索" aria-hidden={started} inert={started}>
   <p className={styles.eyebrow}>CHANGSHA, CHINA <span>28°11′ N · 112°58′ E</span></p>
   <h1>一条江<br/><span>另一种未来</span></h1>
   <p className={styles.subtitle}>湘江生态、文化与社会创新数字地图：<br/>基于D—E—C<span className={styles.heroPhrase}>产品总值指标</span>的设计平台</p>
   <button className={styles.start} onClick={begin} disabled={!loaded||!!error}><span className={styles.startCircle}><ArrowRight size={24}/></span><span>{loaded?'开始探索':'正在构建湘江'}<small>{loaded?'START THE EXPERIENCE':`${String(progress).padStart(2,'0')} / 100`}</small></span></button>
  </section>
  {!loaded&&!error&&<div className={styles.loading} role="status" aria-live="polite"><span>{loadingLabel}</span><div><i style={{width:`${progress}%`}}/></div></div>}
  {error&&<section className={styles.error} role="alert"><h2>暂时无法展开这段湘江</h2><p>{error}</p><button onClick={()=>window.location.reload()}>重新载入 <RotateCcw size={15}/></button><a href="/create-research">进入研究平台 <ArrowUpRight size={15}/></a></section>}
  {place&&rightDetail==='place'&&!moving&&<PlaceDetail key={place.id} place={place} onClose={()=>setDetailOpen(false)} onMap={()=>{setDetailOpen(false);const ids=visibleObjects(overlayState).filter(o=>objectIds.includes(o.id)).map(o=>o.id);if(ids.length)engine.current?.focusObjects(ids);else engine.current?.focus(place.id);}} tab={detailTab} onTab={setDetailTab} recordId={recordId} onRecord={openRecord} proposal={proposal} onProposal={changeProposal}/>}
  {place&&!currentObject&&!detailOpen&&!atlasPanel&&!drawer&&!moving&&!courseWork&&<aside className={styles.placePanel} aria-label={`${place.name}地点信息`}>
   <button ref={closeRef} className={styles.close} onClick={closePlace} aria-label="关闭地点并返回原视角"><X size={20}/></button>
   <p className={styles.eyebrow}>FIELD NOTES <span>/ {place.index}</span></p><small className={styles.placeEnglish}>{place.en}</small><h2>{place.name}</h2>
   <p className={styles.category}>{place.category}</p><p className={styles.description}>{place.description}</p>
   <div className={styles.location}><span>{place.coordinate[1].toFixed(4)}° N</span><span>{place.coordinate[0].toFixed(4)}° E</span></div>
   <p className={styles.dataNote}>{place.note}</p>{place.id==='ezhou'&&<Link className={styles.siteEntry} href="/experience/sites/ezhou">进入三维研究现场 <ArrowUpRight size={15}/><small>概念场景 · 非真实扫描</small></Link>}<p className={styles.dataNote}>{`关联研究 ${place.relatedResearchIds.length} · 关联方案 ${place.relatedProposalIds.length}（含明确标记的演示资料）`}</p><button className={styles.detailEntry} onClick={()=>{setDetailTab(studentShowcase?'design':'overview');setDetailOpen(true);}}>{studentShowcase?'查看地点作品':'进入地点详情'} <ArrowRight size={14}/></button><button className={styles.textButton} onClick={closePlace}><ChevronLeft size={16}/> 返回原视角</button>
  </aside>}
  {drawer&&<aside className={styles.drawer} aria-label={drawer==='places'?'地点列表':drawer==='views'?'镜头预设':'关于此地图'}>
   <button ref={drawerCloseRef} className={styles.close} onClick={()=>setDrawer(null)} aria-label="关闭面板"><X size={20}/></button>
   <p className={styles.eyebrow}>{drawer==='places'?'PLACES ALONG THE RIVER':drawer==='views'?'PERSPECTIVES':'ABOUT THE ATLAS'}</p>
   <h2>{drawer==='places'?'沿江探索':drawer==='views'?'观察视角':'关于湘江 2035'}</h2>
   {drawer==='places'?<div className={styles.placeList}>{navigationPlaces.map(p=><button key={p.id} onClick={()=>focus(p.id)} aria-pressed={selected===p.id}><span>{p.index}</span><div>{p.name}<small>{p.category}</small></div><ArrowUpRight size={19}/></button>)}</div>:drawer==='views'?<div className={styles.placeList}>{CAMERA_PRESETS.map((p,i)=><button key={p.id} aria-pressed={preset===i} onClick={()=>{setPreset(i);setFreeExplore(false);setStarted(true);setDetailOpen(p.mode==='research'&&!!recordId);if(p.mode==='macro'){setSelected(null);clearRecord();}setAtlasPanel(null);setOverview(p.mode==='macro');engine.current?.preset(i);setDrawer(null);}}><span>0{i+1}</span><div>{p.name}<small>{p.description}</small></div><ArrowUpRight size={19}/></button>)}</div>:<div className={styles.about}><p>以真实地点为索引，连接湘江的生态、文化与社会创新。此版本是三维空间体验 Demo。</p><p>河岸与核心建筑轮廓来自 OpenStreetMap；外围建筑与道路补充自 Overture Maps。外围采用轮廓推导的简化体量，未知高度为估算。树木根据 OSM 与 ESA WorldCover 林地范围布置；山体来自公开高程瓦片，并做了河岸平顺处理。鹅洲标记采用公开地名近似坐标，尚非测绘定位。</p><p>© OpenStreetMap contributors, Overture Maps Foundation；East Asian Buildings。© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium。地形：Mapzen / USGS。</p><p>坐标来源 WGS84，尚未完成 CGCS2000 基准校准。小地图采用真实河岸轮廓旋转排列，左北右南；紫色矩形为随镜头旋转和缩放的近似视野指示；全段时适配小地图范围，不是透视投影的测绘边界。</p><p>拖动平移；右键或 Shift 拖动旋转；滚轮缩放；方向键旋转，Home 重置，Esc 返回。</p></div>}
  </aside>}
  <div className={`${styles.bottomDock} ${!started?styles.dockIntro:''}`}>
   <div className={styles.themeSwitch} role="group" aria-label="昼夜模式">
    <button aria-label="切换日间" aria-pressed={!night} onClick={()=>changeTheme(false)} disabled={!loaded}><Sun size={23} strokeWidth={1.3}/></button>
    <button aria-label="切换夜间" aria-pressed={night} onClick={()=>changeTheme(true)} disabled={!loaded}><Moon size={23} strokeWidth={1.3}/></button>
   </div>
   <div className={styles.miniMap} aria-label="湘江范围导航">
    <svg viewBox={`0 0 ${MINI_MAP.width} ${MINI_MAP.height}`} aria-label="湘江河岸与当前视野" role="img" onClick={e=>{if(!loaded)return;const r=e.currentTarget.getBoundingClientRect(),[x,z]=worldPoint((e.clientX-r.left)/r.width*MINI_MAP.width,(e.clientY-r.top)/r.height*MINI_MAP.height);setStarted(true);setFreeExplore(true);setDetailOpen(false);setSelected(null);clearRecord();setAtlasPanel(null);setOverview(false);setDrawer(null);engine.current?.navigate(x,z);}}>
     <defs><clipPath id="river-minimap-clip"><rect x="0" y="0" width="340" height="108"/></clipPath></defs>
     <g clipPath="url(#river-minimap-clip)"><g className={styles.miniRiver}>{mapPaths.map((d,i)=><path key={i} d={d} fillRule="evenodd"/>)}</g><path data-minimap-view className={styles.miniView}/><circle data-minimap-center r="2.2" className={styles.miniCenter}/></g>
    </svg>
    {miniPlaces.map(p=>{const [x,y]=miniPoint(...project(p.coordinate));return <button key={p.id} className={styles.miniStop} style={{left:`${x/MINI_MAP.width*100}%`,top:`${y/MINI_MAP.height*100}%`}} onClick={()=>focus(p.id)} disabled={!loaded} aria-label={`小地图：${p.name}`} aria-pressed={selected===p.id}><i/><span>{p.id==='juzizhou'?'长沙':p.name.replace('附近','')}</span></button>;})}
    <span className={styles.miniNorth}>N</span><span className={styles.mapLocation}>{moving?'镜头移动中':currentLabel}</span>
   </div>
   <div className={styles.utilities}>
    {moving&&!currentObject&&<button className={styles.skipTour} onClick={()=>{setOverview(false);engine.current?.skip();}} aria-label="跳过导览，进入核心河段">跳过</button>}
    <button onClick={()=>{setStarted(true);if(moving)engine.current?.stop();else{setFreeExplore(false);setDetailOpen(false);setSelected(null);clearRecord();setAtlasPanel(null);setOverview(false);engine.current?.tour();}}} aria-label={moving?'停止镜头运动':'播放沿江巡游'} disabled={!loaded}>{moving?<Pause size={18}/>:<Play size={18}/>}</button>
    <button onClick={()=>{setAtlasPanel(null);setDrawer(drawer==='views'?null:'views');}} aria-label="选择镜头预设" disabled={!loaded}><Layers size={18}/></button>
    <button onClick={()=>{setAtlasPanel(null);setDrawer(drawer==='about'?null:'about');}} aria-label="关于地图与数据"><Info size={18}/></button>
   </div>
  </div>
  <nav className={styles.mainNav} aria-label="地图导航">
   <button disabled={!loaded} onClick={showOverview} aria-pressed={overview}><span>湘江全段<small>THE RIVER CORRIDOR</small></span><i><Compass size={20} strokeWidth={1}/></i></button>
   <button disabled={!loaded} aria-expanded={drawer==='places'} onClick={()=>{setAtlasPanel(null);setDrawer(drawer==='places'?null:'places');}}><span>地点探索<small>EXPLORE THE PLACES</small></span><i><MapPin size={20} strokeWidth={1}/></i></button>
  </nav>
  {loaded&&!error&&<CameraControls onReset={reset} actions={{pan:(x,y)=>engine.current?.pan(x,y),orbit:v=>engine.current?.orbit(v),zoom:f=>engine.current?.zoom(f),dragMode:mode=>engine.current?.dragMode(mode)}}/>}
  <div className={styles.attribution}><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noreferrer">Overture Maps</a> · <a href="https://esa-worldcover.org/en" target="_blank" rel="noreferrer">ESA WorldCover</a> · <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Mapzen / USGS</a></div>
  <div className={styles.edition}>XIANGJIANG 2035 / SPATIAL INFORMATION V1.1</div>
  <div className={styles.metrics} data-testid="scene-metrics">{JSON.stringify(metrics)}</div><div className={styles.motionStatus} role="status" aria-live="polite">{moving?'镜头移动中，可拖动打断':loaded?'场景已就绪':loadingLabel}</div>
 </main>;
}
