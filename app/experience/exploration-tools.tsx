'use client';
import {useEffect,useRef,useState,useCallback,type RefObject,type PointerEvent} from 'react';
import {X,Move,ArrowRight,ArrowLeft} from 'lucide-react';
import type {ExperienceEngine} from '@/src/experience/engine';
import {COVER_CLASSES,CULTURE_NODES,DEMO_NODES,type ExplorationState,type LensReading} from '@/src/exploration/data';
import type {LayerId} from '@/src/atlas/types';
import styles from './exploration.module.css';
export function ExplorationControls({layer,state,onChange}:{layer:LayerId;state:ExplorationState;onChange:(state:ExplorationState)=>void}){
 const toggle=(key:keyof ExplorationState,label:string,note:string)=><button className={styles.toggle} role="switch" aria-checked={!!state[key]} onClick={()=>onChange({...state,[key]:!state[key]})}><span>{label}<small>{note}</small></span><i/></button>;
 return <div className={styles.controls}>
 {layer==='geography'&&<>{toggle('shore','河流岸线','OSM · 真实河岸几何')}{toggle('roads','道路与桥梁','OSM · 路网细线与桥梁高程')}<p>地形高程沿用已有DEM；等高线 / 剖面 · 规划中</p></>}
 {layer==='ecology'&&<><h3>土地覆盖 <small>ESA WorldCover 2021 · 10m</small></h3><div className={styles.classes} aria-label="土地覆盖分类">{COVER_CLASSES.map(c=><button key={c.code} aria-pressed={state.cover===c.code} onClick={()=>onChange({...state,cover:state.cover===c.code?0:c.code})}>{c.label}</button>)}</div><button className={styles.lensButton} aria-pressed={state.lens} onClick={()=>onChange({...state,lens:!state.lens})}>{state.lens?'关闭精读':'局部精读'} <Move size={13}/></button><button onClick={()=>onChange({...state,cover:0,lens:false})}>关闭土地覆盖</button><p>范围扫描是类别编码，不代表单棵树、田垄方向或法定用地。此裁剪不含湿地植被类，不添加虚构类别。</p><details><summary>数据来源与边界</summary><p>ESA WorldCover 2021 v200 · EPSG:4326 · 10m原始像元。裁剪：112.90–113.02°E，28.10–28.27°N；范围外NoData。CC BY 4.0 / ESA WorldCover consortium。无年度变化推论。</p></details><p>历史水体时间序列、生物记录聚合 · 规划中</p></>}
 {layer==='culture'&&<>{toggle('culture','文化地点','现有注册地点 · 小型地理锚点')}{state.culture&&<ul>{CULTURE_NODES.map(p=><li key={p.id}>{p.name} · 地点索引</li>)}</ul>}<p>文化设施分类 · 规划中；地方故事使用既有资料入口。</p></>}
 {layer==='society'&&<>{toggle('services','公共服务节点','DEMO · 确定性示例，不是设施普查')}{toggle('walk','步行关系','DEMO · 近邻路段，不是计算等时圈')}<p>示意点及近邻路段用于提出研究问题，不证明实际可达性。人口分布 · 规划中</p></>}
 {layer==='economy'&&<>{toggle('commerce','商业服务节点','DEMO · 确定性示例，不是商业名录')}<p>产业边界、夜间灯光 · 规划中</p></>}
 {(layer==='society'||layer==='economy')&&<ul>{DEMO_NODES.filter(p=>layer==='society'?p.kind==='services':p.kind==='commerce').map(p=><li key={p.id}>{p.name} · DEMO</li>)}</ul>}
 </div>;
}
function moveLensFrame(frame:RefObject<HTMLDivElement|null>,centre:RefObject<{x:number;y:number;r:number}>,engine:RefObject<ExperienceEngine|null>,x:number,y:number){const r=Math.min(110,(innerWidth-36)/2);centre.current={x:Math.max(r+10,Math.min(innerWidth-r-10,x)),y:Math.max(150,Math.min(innerHeight-r-100,y)),r};frame.current?.style.setProperty('transform',`translate3d(${centre.current.x-r}px,${centre.current.y-r}px,0)`);frame.current?.style.setProperty('--lens-size',`${r*2}px`);engine.current?.lensMove(centre.current.x,centre.current.y,r);}
export function DataLens({engine,onClose}:{engine:RefObject<ExperienceEngine|null>;onClose:()=>void}){
 const frame=useRef<HTMLDivElement>(null),centre=useRef({x:0,y:0,r:110}),drag=useRef<{x:number;y:number;cx:number;cy:number}|null>(null);
 const [reading,setReading]=useState<LensReading>({coordinate:null,code:0,label:'数据准备中',status:'loading'});
 const move=useCallback((x:number,y:number)=>moveLensFrame(frame,centre,engine,x,y),[engine]);
 useEffect(()=>{move(innerWidth*.61,innerHeight*.48);const timer=setInterval(()=>{const c=centre.current;const value=engine.current?.lensRead(c.x,c.y);if(value)setReading(value);},120);const resize=()=>move(centre.current.x,centre.current.y);window.addEventListener('resize',resize);return()=>{clearInterval(timer);window.removeEventListener('resize',resize);};},[engine,move]);
 const down=(e:PointerEvent<HTMLElement|SVGCircleElement>)=>{e.preventDefault();e.stopPropagation();drag.current={x:e.clientX,y:e.clientY,cx:centre.current.x,cy:centre.current.y};e.currentTarget.setPointerCapture(e.pointerId);};
 const moving=(e:PointerEvent<HTMLElement|SVGCircleElement>)=>{if(!drag.current)return;e.stopPropagation();move(drag.current.cx+e.clientX-drag.current.x,drag.current.cy+e.clientY-drag.current.y);};
 return <div ref={frame} className={styles.lens} aria-label="土地覆盖数据透镜" data-lens data-lens-code={reading.code} data-lens-coordinate={JSON.stringify(reading.coordinate)}>
 <svg className={styles.rim} viewBox="0 0 220 220"><circle cx="110" cy="110" r="109"/><circle className={styles.hitRim} cx="110" cy="110" r="107" onPointerDown={down} onPointerMove={moving} onPointerUp={()=>{drag.current=null;}}/></svg>
 <button className={styles.handle} aria-label="拖动数据透镜" onPointerDown={down} onPointerMove={moving} onPointerUp={()=>{drag.current=null;}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();move(centre.current.x+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0),centre.current.y+(e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0));}}}><Move size={13}/>数据显影</button><button className={styles.closeLens} aria-label="关闭数据透镜" onClick={onClose}><X size={16}/></button>
 <div className={styles.reading}><small>ECOLOGY / LAND COVER · 非放大</small><strong>{reading.label}</strong><span>{reading.coordinate?`${reading.coordinate[1].toFixed(5)}°N · ${reading.coordinate[0].toFixed(5)}°E`:'地面不可见 / 数据未就绪'}</span><small>ESA WorldCover 2021 · 10m · 无面积推算</small></div></div>;
}
const ACTS=[['从城市地图到空间信息','沿真实岸线和路网认识城市，再选择土地覆盖类别。'],['发现空间要素之间的关系','拖动显影镜比较地表分类，逐项叠加文化与服务节点。'],['从数据叠加到设计研究','滨江公共与文化资源的空间分布，是否与周边居民的实际可达性相匹配？']];
export function ExplorationStory({act,onAct,onExit}:{act:number;onAct:(act:number)=>void;onExit:()=>void}){return <section className={styles.story} aria-label="三幕空间探索"><small>SPATIAL RESEARCH / 0{act+1} · 自定步速，建议每幕40–60秒</small><h2>{ACTS[act][0]}</h2><p>{ACTS[act][1]}</p>{act===2&&<><p>当前场地：东岸示意研究窗口 · 112.975°E / 28.191°N</p><p>研究假设，尚未得到证实 · 服务/商业与近邻步行关系为DEMO。</p></>}<nav><button onClick={()=>onAct(Math.max(0,act-1))} disabled={act===0}><ArrowLeft size={13}/>上一步</button><button onClick={()=>onAct(Math.min(2,act+1))} disabled={act===2}>下一步<ArrowRight size={13}/></button><button onClick={onExit}>退出 Demo / 自由探索</button></nav></section>;}
