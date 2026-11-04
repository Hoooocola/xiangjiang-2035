'use client';
import {useLayoutEffect,useRef,type ReactNode} from 'react';
import glass from './liquid-glass.module.css';
/** Layout is measured only on selection/resize, never in the Three.js render loop. */
export function GlassNavigation({active,className,children}:{active:string|null;className:string;children:ReactNode}){
 const nav=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{
  const el=nav.current;if(!el)return;
  const measure=()=>{const button=Array.from(el.querySelectorAll<HTMLElement>('[data-nav]')).find(b=>b.dataset.nav===active);el.style.setProperty('--selection-opacity',button?'1':'0');if(button){el.style.setProperty('--selection-x',`${button.offsetLeft}px`);el.style.setProperty('--selection-width',`${button.offsetWidth}px`);}};
  measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();
 },[active]);
 return <nav ref={nav} className={`${className} ${glass.navigation}`} aria-label="知识地图工具" data-glass="group"><span className={glass.indicator} aria-hidden="true"/>{children}</nav>;
}
