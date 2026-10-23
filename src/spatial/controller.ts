import {ANNOTATIONS,RECORDS,STORY,recordById} from './data';
import type {ExplorerState,SemanticLayer,Theme} from './types';
export const initialState:ExplorerState={layers:['context'],themes:['ecology','culture','society','field'],selectedId:null,compareIds:[],mode:'free',step:0,paused:false,proposalVisible:false,focusRevision:0};
export type Action={type:'layer';layer:SemanticLayer}|{type:'theme';theme:Theme}|{type:'topic';theme:Theme}|{type:'select';id:string|null}|{type:'compare';id:string}|{type:'proposal';visible:boolean}|{type:'start'|'next'|'previous'|'skip'|'pause'|'resume'|'exit'|'reset'|'focus'};
function stepState(state:ExplorerState,index:number):ExplorerState {
 const step=Math.max(0,Math.min(STORY.steps.length-1,index)),s=STORY.steps[step];
 return {...state,mode:'guided',paused:false,step,layers:[...s.layers],themes:[...initialState.themes],selectedId:s.selectedId,compareIds:[],proposalVisible:s.proposalVisible,focusRevision:state.focusRevision+1};
}
export function linkedRecordIds(id:string|null):string[]{const r=recordById(id);return r?[r.id,...r.evidenceIds]:[];}
export function highlightedRecordIds(state:ExplorerState):string[]{return Array.from(new Set([...linkedRecordIds(state.selectedId),...state.compareIds,...(state.mode==='guided'&&!state.paused?STORY.steps[state.step].highlightIds:[])]));}
export function visibleAnnotations(state:ExplorerState){return ANNOTATIONS.filter(a=>state.layers.includes(a.layer)&&state.themes.includes(recordById(a.recordId)!.theme)&&(!a.futureOnly||state.proposalVisible));}
export function relatedFindings(ids:string[]){return RECORDS.filter(r=>['Issue','Insight','ResearchGap','Conflict'].includes(r.kind)&&ids.some(id=>r.evidenceIds.includes(id)||recordById(id)?.relatedIds.includes(r.id)));}
export function explorerReducer(state:ExplorerState,action:Action):ExplorerState {
 switch(action.type){
  case 'start':return stepState(state,0);
  case 'next':return stepState(state,state.step+1);
  case 'previous':return stepState(state,state.step-1);
  case 'skip':return stepState(state,STORY.steps.length-1);
  case 'reset':return state.mode==='guided'?stepState(state,0):{...initialState,focusRevision:state.focusRevision+1};
  case 'exit':return {...initialState,focusRevision:state.focusRevision}; // camera stays where the user was observing
  case 'pause':return {...state,paused:state.mode==='guided'};
  case 'resume':return stepState(state,state.step);
  case 'focus':return {...state,focusRevision:state.focusRevision+1};
  case 'proposal':return {...state,proposalVisible:action.visible,layers:action.visible?Array.from(new Set([...state.layers,'proposal'])):state.layers};
  case 'layer':{
   if(action.layer==='context')return {...state,layers:['context'],selectedId:null,compareIds:[],proposalVisible:false,paused:state.mode==='guided'};
   const layers=state.layers.includes(action.layer)?state.layers.filter(l=>l!==action.layer):[...state.layers,action.layer];
   const current=recordById(state.selectedId);
   return {...state,layers,selectedId:current&&!layers.includes(current.layer)?null:state.selectedId,compareIds:state.compareIds.filter(id=>layers.includes(recordById(id)!.layer)),proposalVisible:layers.includes('proposal')&&state.proposalVisible,paused:state.mode==='guided'};
  }
  case 'topic':return {...state,layers:['context',action.theme==='field'?'evidence':'resources'],themes:[action.theme],selectedId:null,compareIds:[],proposalVisible:false,paused:state.mode==='guided'};
  case 'theme':{
   const themes=state.themes.includes(action.theme)?state.themes.filter(t=>t!==action.theme):[...state.themes,action.theme];
   const current=recordById(state.selectedId);
   return {...state,themes,selectedId:current&&!themes.includes(current.theme)?null:state.selectedId,compareIds:state.compareIds.filter(id=>themes.includes(recordById(id)!.theme)),paused:state.mode==='guided'};
  }
  case 'compare':{
   const r=recordById(action.id);if(!r)return state;
   return {...state,compareIds:state.compareIds.includes(r.id)?state.compareIds.filter(id=>id!==r.id):[...state.compareIds,r.id],layers:Array.from(new Set([...state.layers,r.layer])),themes:Array.from(new Set([...state.themes,r.theme])),paused:state.mode==='guided'};
  }
  case 'select':{
   const r=recordById(action.id);if(!r)return {...state,selectedId:null};
   const linked=linkedRecordIds(r.id).map(recordById).filter(r=>!!r);
   return {...state,selectedId:r.id,layers:Array.from(new Set([...state.layers,...linked.map(r=>r.layer)])),themes:Array.from(new Set([...state.themes,...linked.map(r=>r.theme)])),paused:state.mode==='guided',focusRevision:state.focusRevision+1};
  }
 }
}
