import type {Coordinate,Feature} from '../experience/geo';
export type ResearchSiteId='ezhou'|'quarry';
export type ResearchPhase='context'|'resources'|'evidence'|'findings'|'proposal';
export type DataState='REAL'|'RECONSTRUCTED'|'DEMO'|'DEMO ANALYSIS';
export interface ResearchNode{id:string;name:string;coordinate:Coordinate;kind:'home'|'service'|'visitor'|'ecology';state:DataState}
export interface NetworkEdge{id:string;from:string;to:string;coordinates:Coordinate[];state:'DEMO'}
export interface IslandAsset{id:'ezhou';boundary:Coordinate[];features:Feature[];contextBuildings:number[][];source:string;accuracy:string}
export interface IslandStudy{nodes:ResearchNode[];edges:NetworkEdge[];serviceIds:string[];source:string}
export type LocalPoint=[number,number];
export interface QuarryAsset{id:'quarry';coordinate:null;state:'RECONSTRUCTED';outline:LocalPoint[];paths:{id:string;name:string;points:LocalPoint[]}[];restoration:{id:string;center:LocalPoint;radius:number}[];nodes:{id:string;name:string;point:LocalPoint}[];source:string;note:string}
export interface ResearchState{site:ResearchSiteId;step:number;guided:boolean;networks:boolean;activities:boolean;ecology:boolean;analysis:boolean;section:boolean;threshold:number;axis:'east-west'|'north-south'}
export const INITIAL_RESEARCH:Omit<ResearchState,'site'>={step:0,guided:false,networks:false,activities:false,ecology:false,analysis:false,section:false,threshold:35,axis:'east-west'};
