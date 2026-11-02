'use client';
import {useState} from 'react';
import {X,ChevronDown,ArrowUpRight} from 'lucide-react';
import {LAYERS} from '@/src/atlas/catalog';
import {visibleObjects,MAP_OBJECTS} from '@/src/atlas/objects';
import {SUBTYPES,isAvailable,subtypeOf} from '@/src/atlas/information';
import type {LayerId,OverlayState} from '@/src/atlas/types';
import {LANDCOVER_STYLE} from '@/src/experience/real-geodata/landcover';
import {GBIF_GROUPS} from '@/src/experience/real-geodata/gbif';
import styles from './information.module.css';

const english:Record<LayerId,string>={geography:'GEOGRAPHY',ecology:'ECOLOGY',culture:'CULTURE',society:'SOCIETY',economy:'ECONOMY',proposal:'PROPOSAL'};

/** 真实数据图层定义：整合进五大分类，而非独立区块。 */
type RealGeoKey='landcover'|'roads'|'observations';
const REAL_GEO_DEFS:{key:RealGeoKey;layer:LayerId;label:string;hint:string}[]=[
  {key:'roads',layer:'geography',label:'道路网络',hint:'OpenStreetMap · 真实道路几何'},
  {key:'landcover',layer:'ecology',label:'土地覆盖',hint:'ESA WorldCover 2021 · 10m'},
  {key:'observations',layer:'ecology',label:'生物观察记录',hint:'GBIF · 质量筛选后的观测'},
];

export function LayerPanel(props:{
  state:OverlayState;
  onToggle:(id:LayerId)=>void;
  onObject:(id:string)=>void;
  onClose:()=>void;
  scope:'all'|'place';
  onScope:(scope:'all'|'place')=>void;
  selectedPlace?:string;
  onSubtype:(id:string)=>void;
  onDemo:(value:boolean)=>void;
  onClear:()=>void;
  onRealGeo:(key:'landcover'|'roads'|'observations'|'analysis')=>void;
  onAnalyze:()=>void;
  onSelectLandcoverClass:(code:number|null)=>void;
  landcoverClass:number|null;
  landcoverCodes:number[];
  gbifStats:{total:number;clusters:number;yearMin:number|null;yearMax:number|null}|null;
}){
  const {state,onToggle,onObject,onClose,scope,onScope,selectedPlace,onSubtype,onDemo,onClear,onRealGeo,onAnalyze,onSelectLandcoverClass,landcoverClass,landcoverCodes,gbifStats}=props;
  const [expanded,setExpanded]=useState<LayerId[]>(state.layers);
  const visible=visibleObjects(state),inventory=MAP_OBJECTS.filter(o=>isAvailable(o,{...state,showDemo:true}));
  const toggleExpanded=(id:LayerId)=>setExpanded(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
  const realGeo=state.realGeo??{landcover:false,roads:false,observations:false,analysis:false};

  const realGeoFor=(layer:LayerId)=>REAL_GEO_DEFS.filter(d=>d.layer===layer);

  return <aside className={styles.directory} aria-label="数据图层" data-information-panel data-information-directory>
    <header><div><small>SPATIAL INFORMATION</small><h2>空间信息</h2><p className={styles.directorySubhead}>选择图层，查看湘江沿岸的地理、生态与社会信息。</p></div><button onClick={onClose} aria-label="关闭数据图层"><X size={18}/></button></header>
    <details className={styles.directoryTools}><summary>范围设置 <span>全部地点 · 当前地点</span></summary>
      <label className={styles.scope}><span>阅读范围</span><select aria-label="图层资料范围" value={scope} onChange={e=>onScope(e.target.value as 'all'|'place')}><option value="all">全部地点</option><option value="place" disabled={!selectedPlace}>{selectedPlace??'当前地点'}</option></select></label>
      <label className={styles.demo}><input type="checkbox" checked={state.showDemo===true} onChange={e=>onDemo(e.target.checked)}/><span>DEMO 示例<small>{state.showDemo?'已显示 · 非实测资料':'默认关闭 · 开启后可体验模拟主题'}</small></span><span className={styles.count}>{inventory.filter(o=>o.isMock).length}</span></label>
    </details>
    <div className={styles.directoryBody}>
      <p className={styles.hint}>选择具体条目，镜头将带你到它的空间。</p>
      {LAYERS.filter(l=>l.id!=='proposal').map((l,index)=>{
        const all=inventory.filter(o=>o.layer===l.id),available=all.filter(o=>isAvailable(o,state));
        const enabled=state.layers.includes(l.id),open=expanded.includes(l.id);
        const pending=SUBTYPES.filter(s=>s.layer===l.id&&!all.some(o=>subtypeOf(o)===s.id));
        const realItems=realGeoFor(l.id);
        return <section key={l.id} className={styles.category} style={{'--category-color':`var(--layer-${l.id})`} as React.CSSProperties}>
          <div className={styles.categoryHeading}>
            <button className={styles.expandCategory} aria-expanded={open} aria-controls={`category-${l.id}`} onClick={()=>toggleExpanded(l.id)}><span className={styles.ordinal}>{String(index+1).padStart(2,'0')}</span><span><strong>{l.label}</strong><small>{english[l.id]}</small></span><span className={styles.count}>{available.length||`${all.length} 示例`}</span><ChevronDown size={13}/></button>
            <button className={styles.layerSwitch} role="switch" aria-checked={enabled} aria-label={`显示${l.label}`} onClick={()=>{onToggle(l.id);if(!enabled&&!open)toggleExpanded(l.id);}}><span/></button>
          </div>
          {open&&<div id={`category-${l.id}`} className={styles.subtypes}>
            {/* 真实数据图层：整合进对应分类，复用现有开关交互 */}
            {realItems.map(item=>(
              <section key={item.key} className={styles.realGeoInline}>
                <label className={styles.realGeoItem}>
                  <input type="checkbox" checked={realGeo[item.key]} onChange={()=>onRealGeo(item.key)} aria-label={`显示${item.label}`}/>
                  <span>{item.label}<small>{item.hint}</small></span>
                </label>
                {item.key==='landcover'&&realGeo.landcover&&(
                  <div className={styles.landcoverLegend}>
                    <button className={landcoverClass===null?styles.legendActive:''} onClick={()=>onSelectLandcoverClass(null)}>全部类别</button>
                    {landcoverCodes.map(code=>{
                      const s=LANDCOVER_STYLE[code];
                      if(!s)return null;
                      return <button key={code} className={landcoverClass===code?styles.legendActive:''} onClick={()=>onSelectLandcoverClass(code)}><i style={{background:s.day}}/><span>{s.zh}</span></button>;
                    })}
                  </div>
                )}
                {item.key==='observations'&&realGeo.observations&&gbifStats&&(
                  <div className={styles.gbifLegend}>
                    <p>{gbifStats.total} 条记录 · {gbifStats.clusters} 个聚合点位{gbifStats.yearMin?` · ${gbifStats.yearMin}–${gbifStats.yearMax}`:''}</p>
                    <div className={styles.gbifGroups}>{GBIF_GROUPS.map(g=><span key={g.key}><i style={{background:g.day}}/>{g.zh}</span>)}</div>
                  </div>
                )}
              </section>
            ))}
            {SUBTYPES.filter(s=>s.layer===l.id&&all.some(o=>subtypeOf(o)===s.id)).map(sub=>{
              const objects=available.filter(o=>subtypeOf(o)===sub.id),total=all.filter(o=>subtypeOf(o)===sub.id).length;
              const active=enabled&&(state.subtypes?.includes(sub.id)??true);
              return <section key={sub.id}>
                <label className={styles.subtype}><input type="checkbox" checked={objects.length>0&&active} disabled={!objects.length} aria-label={`显示${sub.label}`} onChange={()=>onSubtype(sub.id)}/><span>{sub.label}</span><small>{objects.length?`${sub.form} · ${objects.length}`:`${total} DEMO`}</small></label>
                {!objects.length?<p className={styles.pending}>开启上方 DEMO 示例后查看</p>:active&&<div className={styles.objects}>{objects.map(o=><button key={o.id} aria-pressed={state.selectedObjectIds.includes(o.id)} onClick={()=>onObject(o.id)}><i aria-hidden="true"/><span>{o.title}</span>{o.isMock&&<small>DEMO</small>}<ArrowUpRight size={12}/></button>)}</div>}
              </section>;
            })}
            {pending.length>0&&<details className={styles.unavailable}><summary>尚无资料的子类 <span>{pending.length}</span></summary>{pending.map(sub=><p key={sub.id}><strong>{sub.label}</strong><span>{sub.note??'尚未编入资料'}</span></p>)}</details>}
          </div>}
        </section>;
      })}
      {/* 空间分析：轻量入口，当相关图层开启后可用 */}
      {(realGeo.observations||realGeo.roads)&&<section className={styles.analysisEntry} style={{'--category-color':'var(--accent)'} as React.CSSProperties}>
        <button className={styles.analyzeBtn} aria-pressed={realGeo.analysis} onClick={()=>{onRealGeo('analysis');onAnalyze();}}>
          <span>空间分析 · 邻近关系</span>
          <small>SPATIAL ANALYSIS · 观察记录 ↔ 道路距离</small>
        </button>
      </section>}
    </div>
    <footer><button onClick={onClear} disabled={!state.layers.length}>清除图层</button><small>研究对象 {visible.filter(o=>o.layer!=='proposal').length} 个 · 真实数据图层独立计数</small></footer>
  </aside>;
}
