import type {Coordinate,Feature} from '../experience/geo';
export type ResearchSiteId='ezhou'|'quarry';
export type ResearchPhase='context'|'resources'|'evidence'|'findings'|'proposal';
export type DataState='REAL'|'RECONSTRUCTED'|'DEMO'|'DEMO ANALYSIS';
export interface ResearchNode{id:string;name:string;coordinate:Coordinate;kind:'home'|'service'|'visitor'|'ecology';state:DataState;serviceUnits?:number;spatialType?:string;roadReference?:string;plannedServiceId?:string;followUp?:string[]}
export interface NetworkEdge{id:string;from:string;to:string;coordinates:Coordinate[];state:'DEMO'}
export interface IslandAsset{id:'ezhou';boundary:Coordinate[];features:Feature[];contextBuildings:number[][];source:string;accuracy:string}
export interface IslandStudy{nodes:ResearchNode[];edges:NetworkEdge[];serviceIds:string[];source:string}
export type LocalPoint=[number,number];
export interface AccessGraph{state:'DEMO';entryId:string;source:string;nodes:{id:string;name:string;point:LocalPoint}[];edges:{id:string;from:string;to:string;kind:'road'|'connector'|'walk';points:LocalPoint[]}[]}
export interface QuarryAsset{id:'quarry';coordinate:null;state:'RECONSTRUCTED';outline:LocalPoint[];paths:{id:string;name:string;points:LocalPoint[]}[];restoration:{id:string;center:LocalPoint;radius:number}[];nodes:{id:string;name:string;point:LocalPoint}[];source:string;note:string;access?:AccessGraph}
export interface ResearchState{site:ResearchSiteId;step:number;guided:boolean;networks:boolean;activities:boolean;ecology:boolean;analysis:boolean;section:boolean;threshold:number;axis:'east-west'|'north-south';access?:boolean;blockedAccess?:string}
export const INITIAL_RESEARCH:Omit<ResearchState,'site'>={step:0,guided:false,networks:false,activities:false,ecology:false,analysis:false,section:false,threshold:35,axis:'east-west'};
