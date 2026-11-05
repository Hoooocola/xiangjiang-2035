'use client';
import {ArrowUpRight,ChevronLeft,X}from'lucide-react';import type{Place}from'@/src/experience/config';
import{SidePanelShell}from'./shared/side-panel';import styles from'./editorial.module.css';
export function PlaceIntroduction({place,onClose,onReturn,onResearch,onDetails,onStudy}:{place:Place;onClose:()=>void;onReturn?:()=>void;onResearch:()=>void;onDetails:()=>void;onStudy?:()=>void}){
 return <SidePanelShell side="right" className={styles.introduction} aria-label={`${place.name}地点信息`}>
 <header><div><small>{place.en}</small><h2>{place.name}</h2></div><button onClick={onClose} aria-label="关闭地点信息"><X size={19}/></button></header>
 <div data-panel-body><p className={styles.kicker}>{place.category}</p><p className={styles.lede}>{place.description.split(/(?<=[。！？])/)[0]}</p>{place.id==='zhaoshan'&&<p className={styles.kicker}>公开近似定位 · DEM视觉焦点，非山体边界</p>}
 <nav className={styles.actions} aria-label="地点阅读">{onStudy&&<button onClick={onStudy}>进入场地研究 <ArrowUpRight size={15}/></button>}<button onClick={onResearch}>查看研究资料 <ArrowUpRight size={15}/></button><button onClick={onDetails}>进入地点详情 <ArrowUpRight size={15}/></button></nav>
 <details className={styles.provenance}><summary>定位与来源说明</summary><p>{place.note}</p><p>{place.coordinate[1].toFixed(4)}° N · {place.coordinate[0].toFixed(4)}° E</p></details></div>
 <footer><button onClick={onReturn??onClose}><ChevronLeft size={14}/>返回原视角</button></footer></SidePanelShell>;
}
