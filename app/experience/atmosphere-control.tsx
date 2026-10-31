'use client';
import {useEffect,useRef,useState} from 'react';
import {Sparkles} from 'lucide-react';
import type {AtmospherePreference} from '@/src/experience/atmosphere';
import styles from './atmosphere-control.module.css';

export function AtmosphereControl({value,onChange,disabled}:{value:AtmospherePreference;onChange:(value:AtmospherePreference)=>void;disabled:boolean}){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};},[open]);
 return <div ref={root} className={styles.control}><button ref={trigger} aria-label="场景氛围设置" aria-expanded={open} aria-controls="atmosphere-options" disabled={disabled} onClick={()=>setOpen(!open)}><Sparkles size={17}/><span>氛围</span></button>{open&&<section id="atmosphere-options" className={styles.options} aria-label="场景氛围"><small>微光与河雾</small><div role="group" aria-label="氛围质量">{([['auto','标准'],['low','轻量'],['off','关闭']] as const).map(([mode,label])=><button key={mode} aria-pressed={value===mode} onClick={()=>onChange(mode)}><i/>{label}</button>)}</div></section>}</div>;
}
