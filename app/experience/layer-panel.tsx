'use client';
import {SidePanelShell} from './shared/side-panel';
import {useState,type ReactNode} from 'react';
import {X,ChevronDown} from 'lucide-react';
import {LAYERS} from '@/src/atlas/catalog';
import type {LayerId} from '@/src/atlas/types';
import styles from './information.module.css';
const english:Record<LayerId,string>={geography:'GEOGRAPHY',ecology:'ECOLOGY',culture:'CULTURE',society:'SOCIETY',economy:'ECONOMY',proposal:'PROPOSAL'};
export function LayerPanel({active,content,onToggle,onClear,onClose,onExploreDemo}:{active:LayerId[];content:Partial<Record<LayerId,ReactNode>>;onToggle:(id:LayerId)=>void;onClear:()=>void;onClose:()=>void;onExploreDemo:()=>void}){
 const [expanded,setExpanded]=useState<LayerId[]>(active);
 const toggle=(id:LayerId)=>setExpanded(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
 return <SidePanelShell className={styles.directory} aria-label="数据图层" data-information-panel data-information-directory>
  <header><div><small>SPATIAL INFORMATION</small><h2>空间信息</h2><p className={styles.directorySubhead}>选择图层，查看湘江沿岸的地理、生态与社会信息。</p></div><button onClick={onClose} aria-label="关闭数据图层"><X size={18}/></button></header>
  <button className={styles.startExploration} onClick={onExploreDemo}>开始三幕空间探索 ↗</button>
  <div className={styles.directoryBody} data-panel-body>
   {LAYERS.filter(l=>l.id!=='proposal').map((layer,index)=>{const enabled=active.includes(layer.id),open=expanded.includes(layer.id);return <section key={layer.id} className={styles.category} style={{'--category-color':`var(--layer-${layer.id})`} as React.CSSProperties}>
    <div className={styles.categoryHeading}>
     <button className={styles.expandCategory} aria-expanded={open} aria-controls={`category-${layer.id}`} onClick={()=>toggle(layer.id)}><span className={styles.ordinal}>{String(index+1).padStart(2,'0')}</span><span><strong>{layer.label}</strong><small>{english[layer.id]}</small></span><span className={styles.count}>{enabled?'已启用':'可选'}</span><ChevronDown size={13}/></button>
     <button className={styles.layerSwitch} role="switch" aria-checked={enabled} aria-label={`显示${layer.label}`} onClick={()=>{onToggle(layer.id);if(!enabled&&!open)toggle(layer.id);}}><span/></button>
    </div>
    {open&&<div id={`category-${layer.id}`} className={styles.subtypes}>{content[layer.id]}</div>}
   </section>;})}
  </div>
  <footer><button onClick={onClear} disabled={!active.length}>清除图层</button><small>{active.length} 个数据主题已启用 · 研究资料与课程成果在顶部独立入口保留</small></footer>
 </SidePanelShell>;
}
