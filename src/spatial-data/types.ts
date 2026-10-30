import type {LayerId} from '../atlas/types';
export type Position=[number,number];
export type Bounds=[number,number,number,number];
export type Geometry={type:'Point';coordinates:Position}|{type:'LineString';coordinates:Position[]}|{type:'Polygon';coordinates:Position[][]};
export interface Feature {type:'Feature';id:string;geometry:Geometry;properties:Record<string,unknown>}
export interface Collection {type:'FeatureCollection';features:Feature[]}
export interface SourceMetadata {sourceId:string;sourceName:string;sourceUrl:string;license:string;attribution:string;observedAt:string|null;period:{start:string;end:string}|null;publishedAt:string|null;retrievedAt:string;spatialResolution:string;coordinateReferenceSystem:string;geometryAccuracy:string;processingMethod:string;dataStatus:'public'}
export interface Raster {width:number;height:number;bounds:Bounds;nodata:number;values:number[]}
export interface SpatialLayer {layerId:string;category:LayerId;name:string;geometryType:'Point'|'LineString'|'Polygon'|'raster'|'nonspatial';source:SourceMetadata;years:number[];legend:{value:number|string;label:string;color?:string}[];visibility:'controlled-by-existing-overlay';loadStatus:'available'|'unverified';bounds:Bounds|null;dataUrl:string;quality:string[];queryMethod:'bbox'|'records'}
export interface AnalysisResult {analysisId:string;studyAreaId:string;inputLayerIds:string[];sourceReferences:SourceMetadata[];analysisMethod:string;parameters:Record<string,unknown>;spatialObservation:string[];candidateResearchQuestion:string;limitations:string[];evidenceReferences:string[];verificationStatus:'requires-field-verification';metrics:Record<string,unknown>}
