'use client';
import {useState} from 'react';
import {ArrowUp,ArrowDown,ArrowLeft,ArrowRight,Compass,RotateCcw,RotateCw,Plus,Minus,X} from 'lucide-react';
import type {ExperienceEngine} from '@/src/experience/engine';
import styles from './experience.module.css';

type CameraActions=Pick<ExperienceEngine,'pan'|'orbit'|'zoom'|'dragMode'>;
export function CameraControls({actions,onReset}:{actions:CameraActions;onReset:()=>void}){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<'pan'|'orbit'>('pan');
 return <div className={styles.cameraControls} aria-label="镜头控制">
  <button className={styles.compassButton} onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="camera-tools" aria-label="展开镜头控制"><span>N</span><Compass size={30} strokeWidth={1} data-compass/></button>
  <button onClick={onReset} aria-label="重置镜头"><RotateCcw size={17}/></button>
  {open&&<section id="camera-tools" className={styles.cameraTools} aria-label="镜头操作面板">
   <div className={styles.cameraHeading}><span>观察视角</span><button onClick={()=>setOpen(false)} aria-label="收起镜头控制"><X size={16}/></button></div>
   <div className={styles.dragModes} role="group" aria-label="拖动方式">{(['pan','orbit'] as const).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);actions.dragMode(m);}}>{m==='pan'?'拖动平移':'拖动旋转'}</button>)}</div>
   <div className={styles.cameraDirections} role="group" aria-label="平移地图">
    <button onClick={()=>actions.pan(0,1)} aria-label="向前平移"><ArrowUp size={18}/></button>
    <button onClick={()=>actions.pan(-1,0)} aria-label="向左平移"><ArrowLeft size={18}/></button>
    <span>平移</span><button onClick={()=>actions.pan(1,0)} aria-label="向右平移"><ArrowRight size={18}/></button>
    <button onClick={()=>actions.pan(0,-1)} aria-label="向后平移"><ArrowDown size={18}/></button>
   </div>
   <div className={styles.cameraRow}><button onClick={()=>actions.orbit(-.22)} aria-label="向左旋转"><RotateCcw size={17}/></button><span>旋转</span><button onClick={()=>actions.orbit(.22)} aria-label="向右旋转"><RotateCw size={17}/></button></div>
   <div className={styles.cameraRow}><button onClick={()=>actions.zoom(1.25)} aria-label="缩小"><Minus size={18}/></button><span>缩放</span><button onClick={()=>actions.zoom(.8)} aria-label="放大"><Plus size={18}/></button></div>
   <p>Shift 拖动切换操作 · 滚轮缩放<br/>方向键旋转 · Shift + 方向键平移</p>
  </section>}
 </div>;
}
