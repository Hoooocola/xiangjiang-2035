'use client';
import {useRef,useState,type ChangeEvent} from 'react';
import {COLOR_FIELDS,colorDocument,defaultColorPair,normalizeHex,parseColorDocument,type ColorKey,type ColorPair} from '@/src/experience/style-frame-v4/colors';
import type {Theme,Variant} from '@/src/experience/style-frame-v4/profile';
import styles from './study.module.css';

type Props={colors:ColorPair;theme:Theme;variant:Variant;disabled:boolean;saveStatus:string;onChange:(colors:ColorPair)=>void;onTheme:(theme:Theme)=>void;onEdit:()=>void};
export default function ColorPanel({colors,theme,variant,disabled,saveStatus,onChange,onTheme,onEdit}:Props){
 const file=useRef<HTMLInputElement>(null);
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[message,setMessage]=useState('');
 const update=(key:ColorKey,value:string)=>{onChange({...colors,[theme]:{...colors[theme],[key]:value}});setMessage('');};
 const clearDraft=(key:string)=>setDrafts(prev=>{const next={...prev};delete next[key];return next;});
 const reset=()=>{onChange({...colors,[theme]:defaultColorPair()[theme]});setDrafts({});setMessage(`已恢复${theme==='day'?'日间':'夜间'}默认配色。`);};
 const download=()=>{
  const blob=new Blob([JSON.stringify(colorDocument(colors),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='湘江2035-V4-昼夜配色.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('已导出昼夜配色，可把文件发回来应用。');
 };
 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{
  const selected=e.target.files?.[0];e.target.value='';if(!selected)return;
  try{if(selected.size>100000)throw new Error('配色文件过大，请选择本页导出的 JSON。');const next=parseColorDocument(JSON.parse(await selected.text()));onChange(next);setDrafts({});setMessage('已导入昼夜配色。');onEdit();}catch(error){setMessage(error instanceof Error?error.message:'文件无法读取，请重新选择。');}
 };
 return <aside className={styles.colorPanel} aria-label="实时调色面板">
  <div className={styles.panelHeading}><div><p>LIVE PALETTE</p><h2>实时调色</h2></div><span>{theme==='day'?'日间':'夜间'}</span></div>
  <div className={styles.colorTabs} role="group" aria-label="编辑昼夜配色"><button disabled={disabled} aria-pressed={theme==='day'} onClick={()=>{onTheme('day');setDrafts({});}}>日间</button><button disabled={disabled} aria-pressed={theme==='night'} onClick={()=>{onTheme('night');setDrafts({});}}>夜间</button></div>
  <p className={styles.colorHelp}>选颜色或输入 HEX，即时查看真实光照效果。昼夜独立保存。</p>
  {variant==='current'&&<div className={styles.compareNotice}>正在查看原版对照。<button disabled={disabled} onClick={onEdit}>返回 V4 调色</button></div>}
  <fieldset className={styles.colorFields} disabled={disabled||variant!=='v4'}>
   {(['建筑','环境','背景与光照'] as const).map(group=><details key={group} open={group==='建筑'} className={styles.colorGroup}><summary>{group}<span>{COLOR_FIELDS.filter(f=>f.group===group).length} 项</span></summary><div>{COLOR_FIELDS.filter(f=>f.group===group).map(({key,label})=>{
    const id=`${theme}-${key}`,value=drafts[id]??colors[theme][key].toUpperCase(),invalid=normalizeHex(value)===null;
    return <div className={styles.colorRow} key={id}><label htmlFor={`hex-${id}`}>{label}</label><input type="color" aria-label={`${label}取色`} value={colors[theme][key]} onChange={e=>{clearDraft(id);update(key,e.target.value);}}/><input id={`hex-${id}`} aria-label={`${label} HEX`} aria-invalid={invalid} className={styles.hexInput} type="text" spellCheck={false} maxLength={7} value={value} onChange={e=>{const v=e.target.value;setDrafts(prev=>({...prev,[id]:v}));const hex=normalizeHex(v);if(hex)update(key,hex);}} onBlur={()=>{if(invalid)setMessage('请输入六位 HEX 色号，例如 #829696；未完成的输入已还原。');clearDraft(id);}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></div>;
   })}</div></details>)}
  </fieldset>
  <div className={styles.paletteActions}><button disabled={disabled||variant!=='v4'} onClick={reset}>恢复本模式默认</button><button disabled={disabled} onClick={download}>导出配色</button><button disabled={disabled} onClick={()=>file.current?.click()}>导入配色</button></div>
  <input ref={file} type="file" accept=".json,application/json" hidden aria-label="导入配色文件" onChange={upload}/>
  <p className={styles.saveStatus} role="status">{message||saveStatus}</p>
  <p className={styles.colorHelp}>保存于此浏览器。导出 JSON 可备份或发回给我；原图导出也会使用你的配色。</p>
 </aside>;
}
