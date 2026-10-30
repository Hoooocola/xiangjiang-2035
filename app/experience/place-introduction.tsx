'use client';
import {ArrowUpRight,ChevronLeft,X} from 'lucide-react';
import type {Place} from '@/src/experience/config';
import styles from './editorial.module.css';
export function PlaceIntroduction({place,onClose,onResearch,onDetails}:{place:Place;onClose:()=>void;onResearch:()=>void;onDetails:()=>void}){
 return <section className={styles.introduction} aria-label={`${place.name}地点信息`} data-information-panel>
  <header><span>{place.en}</span><button onClick={onClose} aria-label="关闭地点并返回原视角"><X size={19}/></button></header>
  <p className={styles.kicker}>{place.category}</p><h2>{place.name}</h2>
  <p className={styles.lede}>{place.description.split(/(?<=[。！？])/)[0]}</p>
  <nav className={styles.actions} aria-label="地点阅读"><button onClick={onResearch}>查看研究资料 <ArrowUpRight size={15}/></button><button onClick={onDetails}>进入地点详情 <ArrowUpRight size={15}/></button></nav>
  <details className={styles.provenance}><summary>定位与来源说明</summary><p>{place.note}</p><p>{place.coordinate[1].toFixed(4)}° N · {place.coordinate[0].toFixed(4)}° E</p></details>
  <button className={styles.return} onClick={onClose}><ChevronLeft size={14}/>返回原视角</button>
 </section>;
}
