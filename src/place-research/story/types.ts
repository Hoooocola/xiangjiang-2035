import type {CameraPose} from '../../experience/config';
import type {LabMode} from '../../visual-lab/data';
import type {LocalPoint,ResearchPhase} from '../types';
export type Site='ezhou'|'quarry';
export type Zone='flooded'|'caution'|'stable'|'outside';
export type Governance='A'|'B'|'C'|'D';
export interface Grid{version:string;state:string;source:string;sourceSha256:string;method:string;cell:number;width:number;depth:number;minX:number;minZ:number;modelZeroMeters:number;centreProjectMeters:LocalPoint;heights:(number|null)[];ring:LocalPoint[];filledCells:number}
export interface StoryInput{site:Site;step:number;water:number;margin:number;scenario:Governance;route:'A'|'B';slopeMin:number;slopeMax:number;section:number;array:boolean;blocked:boolean;filter:Zone|null}
export const initialInput=(site:Site):StoryInput=>({site,step:0,water:10.5,margin:1.2,scenario:'D',route:'A',slopeMin:20,slopeMax:35,section:4,array:false,blocked:false,filter:null});
export interface StoryConfig{version:string;water:{presets:number[];default:number;warningMargin:number;units:string};candidates:{id:string;nodeId:string;name:string;kind:string}[];governance:{id:Governance;name:string;candidateIds:string[];facilityRoles?:Record<string,{name:string;kind:string}>;dependencies:string[]}[];quarryRoutes:{id:'A'|'B';name:string;paths:{id:string;from:string;to:string;points:LocalPoint[]}[]}[]}
export interface StoryShot{shotId:string;phase:ResearchPhase;title:string;researchQuestion:string;cameraPosition:CameraPose;cameraTarget:CameraPose['target'];subjectObjects:string[];dimmedObjects:string[];visibleDataLayers:string[];analysisMode:LabMode;primaryMetrics:string[];annotations:string[];interactionActions:string[];transitionSettings:{duration:number;hold?:boolean};evidence:string}
export interface StorySnapshot{input:StoryInput;shot:StoryShot;mode:LabMode;revision:number;calculations:number;animating:boolean;selected:string;detail:string;dataStates:string[];results:Record<string,unknown>;tables:{title:string;headers:string[];rows:string[][]}[];met:string[];unmet:string[];unknown:string[]}
