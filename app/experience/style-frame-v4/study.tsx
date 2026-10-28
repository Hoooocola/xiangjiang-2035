'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {createV4Study} from '@/src/experience/style-frame-v4/engine';
import {FRAME,SHOTS,DEFAULT_BLEND_METERS,type Variant,type Theme,type Shot} from '@/src/experience/style-frame-v4/profile';
import styles from './study.module.css';
import ColorPanel from './color-panel';
import {COLOR_STORAGE_KEY,colorDocument,defaultColorPair,parseColorDocument,type ColorPair} from '@/src/experience/style-frame-v4/colors';
export default function Study(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Awaited<ReturnType<typeof createV4Study>>|null>(null);
 const [colors,setColors]=useState<ColorPair>(defaultColorPair),[colorsLoaded,setColorsLoaded]=useState(false),[saveStatus,setSaveStatus]=useState('正在读取配色…');
 const [ready,setReady]=useState(false),[status,setStatus]=useState('准备场景'),[error,setError]=useState('');
 const [variant,setVariant]=useState<Variant>('v4'),[theme,setTheme]=useState<Theme>('night'),[shot,setShot]=useState<Shot>('river');
 const [bodyOnly,setBodyOnly]=useState(false),[playing,setPlaying]=useState(false),[exporting,setExporting]=useState(false),[frames,setFrames]=useState<{name:string;url:string}[]>([]),[signature,setSignature]=useState('');
 useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(!active)return;try{const saved=localStorage.getItem(COLOR_STORAGE_KEY);if(saved)setColors(parseColorDocument(JSON.parse(saved)));setSaveStatus(saved?'已恢复此浏览器保存的配色':'当前为默认配色');}catch{setSaveStatus('未能读取已存配色，已使用默认。你仍可导出文件备份。');}setColorsLoaded(true);});return()=>{active=false;};},[]);
 useEffect(()=>{if(!colorsLoaded)return;let active=true;try{localStorage.setItem(COLOR_STORAGE_KEY,JSON.stringify(colorDocument(colors)));Promise.resolve().then(()=>{if(active)setSaveStatus('昼夜配色已自动保存');});}catch{Promise.resolve().then(()=>{if(active)setSaveStatus('浏览器无法保存，请用「导出配色」备份。');});}return()=>{active=false;};},[colors,colorsLoaded]);
 useEffect(()=>{if(ready&&colorsLoaded)engine.current?.setColors(colors);},[colors,colorsLoaded,ready]);
 useEffect(()=>{const el=host.current;if(!el)return;let disposed=false,instance:Awaited<ReturnType<typeof createV4Study>>|null=null;const controller=new AbortController();
  import('@/src/experience/style-frame-v4/engine').then(({createV4Study})=>createV4Study(el,controller.signal,t=>{if(!disposed)setStatus(t);})).then(e=>{instance=e;if(disposed)e.dispose();else{engine.current=e;setSignature(JSON.stringify(e.signature));setReady(true);}}).catch(e=>{if(!disposed&&e.name!=='AbortError')setError(e.message);});
  return()=>{disposed=true;controller.abort();instance?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>{let active=true;if(ready)Promise.resolve().then(()=>{if(active)engine.current?.set(variant,theme,shot,bodyOnly);}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[ready,variant,theme,shot,bodyOnly]);
 useEffect(()=>{if(ready)engine.current?.play(playing);},[playing,ready]);
 const exportAll=async()=>{setExporting(true);setPlaying(false);try{const images=await engine.current?.exportAll();if(images)setFrames(images);}catch(e){setError(String(e));}finally{setExporting(false);}};
 return <main className={styles.page}>
  <header className={styles.header}><div><p>湘江 2035 / MATERIAL STUDY V4</p><h1>主体与背景 · 两个机位，八张对照</h1></div><div><Link href="/experience/style-frame">V3 存档</Link><Link href="/experience">返回地图 ↗</Link></div></header>
  <nav className={styles.controls} aria-label="机位">{(['river','close'] as const).map(s=><button key={s} disabled={!ready||exporting} aria-pressed={shot===s} onClick={()=>setShot(s)}>{SHOTS[s].label}机位</button>)}<span>每组锁定同一镜头与几何</span></nav>
  <nav className={styles.controls} aria-label="材质对照">{(['day','night'] as const).flatMap(t=>(['current','v4'] as const).map(v=><button key={v+t} disabled={!ready||exporting} aria-pressed={theme===t&&variant===v} onClick={()=>{setVariant(v);setTheme(t);setBodyOnly(false);}}>{v==='v4'?'V4':'当前'} · {t==='day'?'日间':'夜间'}</button>))}<button className={styles.download} disabled={!ready||exporting} onClick={exportAll}>{exporting?'正在生成八张…':'生成八张原图 ↓'}</button></nav>
  <div className={styles.workbench}><div className={styles.sceneColumn}><div ref={host} className={styles.viewport} style={{aspectRatio:`${FRAME.width}/${FRAME.height}`}} data-testid="v4-canvas" data-ready={ready} data-shot={shot} data-variant={variant} data-theme={theme} data-signature={signature}>{!ready&&<p role="status">{error||status}</p>}</div>
  {error&&<p role="alert" className={styles.error}>{error}</p>}</div><ColorPanel colors={colors} theme={theme} variant={variant} disabled={!ready||!colorsLoaded||exporting} saveStatus={saveStatus} onChange={setColors} onTheme={t=>{setTheme(t);setVariant('v4');}} onEdit={()=>setVariant('v4')}/></div>
  <footer className={styles.footer}><div><strong>{SHOTS[shot].label} / {variant==='v4'?'V4 材质分层':'当前材质'} / {theme==='night'?'夜间':'日间'}</strong><p>使用右侧面板测试配色。外缘向内约 {DEFAULT_BLEND_METERS} m 柔和过渡。水体、植被与硬质地面分别表达。</p><p>仅此局部验证页生效，尚未推广全段。道路动效为艺术化交通示意；截图固定在同一时间。</p></div><div className={styles.toggles}><label><input type="checkbox" disabled={!ready||exporting} checked={playing} onChange={e=>setPlaying(e.target.checked)}/>播放水面与道路动效</label><label><input type="checkbox" disabled={!ready||variant!=='v4'||exporting} checked={bodyOnly} onChange={e=>setBodyOnly(e.target.checked)}/>检查体量：关闭窗灯、光流与 Bloom</label></div></footer>
  {frames.length>0&&<section className={styles.gallery} aria-label="八张固定镜头原图"><h2>固定时间 · 原始渲染</h2><p>点击保存 2160 × 1350 PNG。相邻两张使用同一机位、同一昼夜状态。</p><div className={styles.grid}>{frames.map(f=><figure key={f.name}><figcaption><a href={f.url} download={f.name}>{f.name} ↓</a></figcaption>
   {/* Native image preserves the original canvas bytes without image optimization. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={f.url} width={2160} height={1350} alt={f.name} data-testid={f.name}/></figure>)}</div></section>}
 </main>;
}
