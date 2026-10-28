'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {STYLE_FRAME,type FrameTheme,type FrameVariant} from '@/src/experience/style-frame/profile';
import type {createStyleFrame} from '@/src/experience/style-frame/engine';
import styles from './style-frame.module.css';
const FRAMES=[{variant:'current',theme:'day',label:'01 当前 · 日间'},{variant:'v3',theme:'day',label:'02 V3 · 日间'},{variant:'current',theme:'night',label:'03 当前 · 夜间'},{variant:'v3',theme:'night',label:'04 V3 · 夜间'}] as const;
export default function StyleFrame(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Awaited<ReturnType<typeof createStyleFrame>>|null>(null);
 const [ready,setReady]=useState(false),[status,setStatus]=useState('准备局部对照'),[error,setError]=useState('');
 const [variant,setVariant]=useState<FrameVariant>('current'),[theme,setTheme]=useState<FrameTheme>('day'),[bodyOnly,setBodyOnly]=useState(false);
 const [signature,setSignature]=useState('');
 const [exported,setExported]=useState<{name:string;url:string}|null>(null);
 useEffect(()=>{const el=host.current;if(!el)return;let disposed=false,instance:Awaited<ReturnType<typeof createStyleFrame>>|null=null;const controller=new AbortController();
  import('@/src/experience/style-frame/engine').then(({createStyleFrame})=>createStyleFrame(el,controller.signal,t=>{if(!disposed)setStatus(t);})).then(e=>{instance=e;if(disposed)e.dispose();else{engine.current=e;setSignature(JSON.stringify(e.signature));setReady(true);setStatus('场景就绪');}}).catch(e=>{if(!disposed&&e.name!=='AbortError')setError(e.message);});
  return()=>{disposed=true;controller.abort();instance?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>{if(ready)engine.current?.set(variant,theme,bodyOnly);},[variant,theme,bodyOnly,ready]);
 return <main className={styles.page}>
  <header className={styles.header}><div><p>湘江 2035 / MATERIAL STUDY 01</p><h1>橘子洲及邻近两岸 · 昼夜材质对照</h1></div><Link href="/experience">返回地图 ↗</Link></header>
  <nav className={styles.controls} aria-label="四张固定镜头对照">{FRAMES.map(frame=><button key={frame.label} disabled={!ready} aria-pressed={variant===frame.variant&&theme===frame.theme} onClick={()=>{setVariant(frame.variant);setTheme(frame.theme);setBodyOnly(false);setExported(null);}}>{frame.label}</button>)}<button className={styles.download} disabled={!ready} onClick={()=>{const frame=engine.current?.exportFrame();if(frame)setExported(frame);}}>生成当前画面 ↓</button></nav>
  <div className={styles.viewport} ref={host} data-testid="style-frame-canvas" data-variant={variant} data-theme={theme} data-ready={ready} data-signature={signature} style={{aspectRatio:`${STYLE_FRAME.width} / ${STYLE_FRAME.height}`}}>{!ready&&<p role={error?'alert':'status'}>{error||status}</p>}</div>
  <footer className={styles.footer}><div><strong>{bodyOnly?'V3 体量检查':FRAMES.find(f=>f.variant===variant&&f.theme===theme)?.label}</strong><p>同一数据、建筑、AOI 与固定镜头；水面时间冻结。纯场景对照，不叠加地图标签或界面渐变。</p><p>本页为局部实验，尚未应用到全段地图。</p></div><label><input type="checkbox" checked={bodyOnly} disabled={!ready||variant!=='v3'} onChange={e=>{setBodyOnly(e.target.checked);setExported(null);}}/> V3 体量检查：关闭窗灯、桥灯与 Bloom</label></footer>
  {exported&&<section className={styles.exported} aria-label="原始画面导出"><p>已生成原始画面 · {exported.name} <a href={exported.url} download={exported.name}>保存 PNG ↓</a> <button onClick={()=>setExported(null)}>关闭预览</button></p>{/* Native image displays the exact local canvas export without optimization. */}
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={exported.url} alt={`原始画面 ${exported.name}`} data-testid="exported-frame" width={2160} height={1350}/></section>}
 </main>;
}
