'use client';
import {SpaceMarker} from './shared/space-marker';
import {SidePanelShell} from './shared/side-panel';
import {X,ArrowUpRight,ArrowLeft} from 'lucide-react';
import {RESOURCE_NODES,ANALYSIS_RADII,activeNodes,focusedNode,stateAnalysis,type NodeKind} from '@/src/exploration/relations';
import type {ExplorationState} from '@/src/exploration/data';
import styles from './exploration.module.css';

export function ResourceList({kind,onLocate,onAll,selected}:{kind:NodeKind;onLocate:(ids:string[])=>void;onAll:(kind:NodeKind)=>void;selected?:string|null}){
 const nodes=RESOURCE_NODES.filter(n=>n.kind===kind);
 return <div className={styles.resourceList}>
  <button className={styles.allNodes} onClick={()=>onAll(kind)}>查看全部地点 <ArrowUpRight size={12}/></button>
  <ul>{nodes.map(n=><li key={n.id}><button aria-pressed={selected===n.id} onClick={()=>onLocate([n.id])}><span>{n.name}<small>{n.demo?'DEMO · 示意坐标':n.precision}</small></span><ArrowUpRight size={12}/></button></li>)}</ul>
 </div>;
}
export function ResourceMarkers({state,register,onLocate}:{state:ExplorationState;register:(id:string,element:HTMLButtonElement|null)=>void;onLocate:(ids:string[])=>void}){
 return <div className={styles.resourceMarkers} aria-label="图层地点标记">{activeNodes(state).map(n=><SpaceMarker key={n.id} ref={el=>register(n.id,el)} className={styles.resourceMarker} data-resource-id={n.id} data-kind={n.kind} data-selected={state.focusId===n.id} data-members={n.id} style={{visibility:'hidden'}} aria-label={`定位${n.name}`} aria-pressed={state.focusId===n.id} onClick={e=>onLocate((e.currentTarget.dataset.members??n.id).split(','))}><i aria-hidden="true"><b>{n.kind==='culture'?'C':n.kind==='services'?'S':'E'}</b><em data-resource-count/></i><span>{n.name}<small>{n.demo?'DEMO / 示意节点':'文化地点 / 注册坐标'}</small></span></SpaceMarker>)}</div>;
}
export function ResourceReading({state,moving,onRadius,onClearAnalysis,onClose,onReturn,onPlace}:{state:ExplorationState;moving:boolean;onRadius:(radius:number)=>void;onClearAnalysis:()=>void;onClose:()=>void;onReturn:()=>void;onPlace:(id:string)=>void}){
 const node=focusedNode(state),analysis=stateAnalysis(state);if(!node)return null;
 return <SidePanelShell side="right" className={styles.resourceReading} aria-label="图层地点精读" data-information-panel data-resource-selected={node.id} data-resource-moving={moving}>
  <header><small>{analysis?'CROSS-LAYER STUDY':'SPATIAL RESOURCE'} / {node.demo?'DEMO':'PLACE INDEX'}</small><button aria-label="关闭地点精读" onClick={onClose}><X size={18}/></button></header>
  <div className={styles.resourceReadingBody} data-panel-body>
   <p className={styles.resourceCategory}>{node.category}</p><h2>{node.name}</h2>
   {!analysis&&<p>{node.description}</p>}<p className={styles.resourceCoordinate}>{node.coordinate[1].toFixed(5)}°N · {node.coordinate[0].toFixed(5)}°E</p>
   {node.demo&&<strong className={styles.demoNotice}>DEMO / 示意节点，不是真实设施调查</strong>}
   <details><summary>{analysis?'地点信息与来源':'来源与定位精度'}</summary>{analysis&&<p>{node.description}</p>}<p>{node.precision}</p>{node.source.map((s,i)=><p key={i}>{s}</p>)}{analysis&&node.placeId&&<button className={styles.resourceLink} onClick={()=>onPlace(node.placeId!)}>查看地点资料 <ArrowUpRight size={12}/></button>}</details>
   {!analysis&&node.placeId&&<button className={styles.resourceLink} onClick={()=>onPlace(node.placeId!)}>查看地点资料 <ArrowUpRight size={12}/></button>}
   {node.kind==='culture'&&<div className={styles.analysisTools}>
    {!analysis&&<button className={styles.resourceLink} onClick={()=>onRadius(2000)}>分析周边资源 <ArrowUpRight size={12}/></button>}
    {analysis&&<><div className={styles.radiusOptions} role="group" aria-label="直线分析半径">{ANALYSIS_RADII.map(radius=><button key={radius} aria-pressed={radius===analysis.radius} onClick={()=>onRadius(radius)}>{radius<1000?`${radius}m`:`${radius/1000}km`}</button>)}</div>
     <div className={styles.analysisResult} data-testid="resource-analysis" data-analysis-radius={analysis.radius} data-analysis-services={analysis.services} data-analysis-commerce={analysis.commerce} data-analysis-matches={analysis.matches.map(n=>n.id).join(',')}>
      <strong>演示数据 / 非真实研究结论</strong><p>以{node.name}为中心 · 直线半径{analysis.radius}m</p>
      <dl><div><dt>公共服务样本</dt><dd>{analysis.services}</dd></div><div><dt>商业服务样本</dt><dd>{analysis.commerce}</dd></div></dl>
      {analysis.matches.length?<ul>{analysis.matches.map(n=><li key={n.id}>{n.name}<span>{Math.round(n.distanceMeters)}m</span></li>)}</ul>:<p>未命中当前6个DEMO样本；不代表真实设施不存在。</p>}
      <p className={styles.researchQuestion}>{analysis.question}</p><details><summary>分析方法与来源</summary><p>{analysis.method}；道路是已有OSM几何的近邻参照，不是步行网络计算。</p><p>来源：3个固定公共服务示意点 + 3个固定商业示意点。未移动坐标、未随机补点、未外推真实设施总量。</p><p>{analysis.limitation}</p></details>
     </div><button className={styles.resourceLink} onClick={onClearAnalysis}>清除分析，保留地点</button></>}
   </div>}
  </div>
  <footer><button onClick={onReturn}><ArrowLeft size={12}/>返回原视角</button><span>{moving?'镜头移动中 · 拖动地图可中断':'可继续自由操作地图'}</span></footer>
 </SidePanelShell>;
}
