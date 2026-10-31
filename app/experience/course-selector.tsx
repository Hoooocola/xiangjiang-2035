'use client';
import {useEffect, useId, useRef, useState, type KeyboardEvent} from 'react';
import {Check, ChevronDown} from 'lucide-react';
import type {Course} from '@/src/student-works/courses';
import styles from './student-work-showcase.module.css';

/** Keep focus on the combobox; options are announced via active-descendant. */
export function CourseSelector({course, options, onChange}: {course:Course; options:readonly Course[]; onChange:(id:string)=>void}) {
  const [open,setOpen]=useState(false),[active,setActive]=useState(0);
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const id=useId(),selected=Math.max(0,options.findIndex(item=>item.id===course.id));
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};
    document.addEventListener('pointerdown',outside);
    return()=>document.removeEventListener('pointerdown',outside);
  },[open]);
  const choose=(index:number)=>{onChange(options[index].id);setOpen(false);trigger.current?.focus({preventScroll:true});};
  const keyDown=(event:KeyboardEvent<HTMLButtonElement>)=>{
    if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(false);return;}
    if(event.key==='Tab'){setOpen(false);return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();setActive(open?(active+(event.key==='ArrowDown'?1:-1)+options.length)%options.length:selected);setOpen(true);
    }else if(open&&(event.key==='Home'||event.key==='End')){event.preventDefault();setActive(event.key==='Home'?0:options.length-1);
    }else if(open&&(event.key==='Enter'||event.key===' ')){event.preventDefault();choose(active);}
  };
  return <div ref={root} className={styles.courseTitleRow}>
    <h1><button ref={trigger} type="button" role="combobox" aria-label="选择课程" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-activedescendant={open?`${id}-${active}`:undefined} onKeyDown={keyDown} onClick={()=>{setActive(selected);setOpen(!open);}}>{course.title}<ChevronDown size={16}/></button></h1>
    {open&&<ul id={id} className={styles.courseOptions} role="listbox" aria-label="课程年份" onWheel={event=>event.stopPropagation()}>
      {options.map((item,index)=><li key={item.id} role="presentation"><button type="button" role="option" id={`${id}-${index}`} tabIndex={-1} aria-selected={item.id===course.id} data-active={index===active} onPointerMove={()=>setActive(index)} onClick={()=>choose(index)}><span>{item.title}</span><Check size={13} aria-hidden="true"/></button></li>)}
    </ul>}
  </div>;
}
