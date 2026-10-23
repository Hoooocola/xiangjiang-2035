import type {Coordinate,Feature} from '../experience/geo';
/** Site taxonomy is independent of the five research content layers. */
export type SiteCategory='island'|'waterfront'|'ecology'|'heritage'|'community'|'infrastructure';
export const SITE_CATEGORIES:Record<SiteCategory,string>={island:'01 洲岛',waterfront:'02 滨水 / 码头 / 港口',ecology:'03 生态自然',heritage:'04 历史文化 / 景观',community:'05 社区 / 街区',infrastructure:'06 产业 / 公共设施 / 创新节点'};
export interface XiangjiangSite {id:string;name:string;category:SiteCategory;approximateLocation:Coordinate|null;geometry:Feature['geometry']|null;spatialExtentStatus:'open-gis'|'point-only'|'approximate'|'unverified';importance:number;source:string[];verified:boolean;displayPriority:number;notes:string;}
export interface FocusArea {id:string;name:string;siteId:string;siteCategory:SiteCategory;geometry:Extract<Feature['geometry'],{type:'Polygon'|'MultiPolygon'}>;importance:number;extentSource:string;verified:boolean;displayPriority:number;transitionWidth:number;visualIntensity:number;optionalRelatedPlaces:string[];}
