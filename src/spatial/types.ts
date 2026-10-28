import type {CameraPose} from '../experience/config';
export type Vec3=[number,number,number];
export type SemanticLayer='context'|'resources'|'evidence'|'findings'|'proposal';
export type Theme='ecology'|'culture'|'society'|'field';
export type SpatialForm='point'|'path'|'area'|'object';
export interface ScanAsset {
 id:string;siteId:string;assetType:'procedural'|'glb';source:string;isMock:boolean;url?:string;
 originalCRS:string|null;coordinateSystem:'local-y-up-metres';
 modelTransform:{position:Vec3;rotation:Vec3;scale:Vec3};captureDate?:string;accuracy?:string;
}
export interface Site {id:string;placeId:string;name:string;englishName:string;description:string;asset:ScanAsset;georeferencing:{status:'unregistered';gisAnchor:null;note:string}}
interface BaseRecord {id:string;siteId:string;layer:SemanticLayer;title:string;summary:string;body:string[];theme:Theme;sourceType:'mock';source:string;timeLabel:string;status:string;annotationIds:string[];relatedIds:string[];evidenceIds:string[];researchId:string}
export interface ContextRecord extends BaseRecord {kind:'Context'}
export interface Resource extends BaseRecord {kind:'Resource';resourceType:'Ecology'|'Culture'|'Society'}
export interface Evidence extends BaseRecord {kind:'Evidence';evidenceType:'Field Observation'|'Interview'|'Photograph'|'Measurement'|'Existing Research';findingIds:string[];media?:{url:string;alt:string}}
export interface Finding extends BaseRecord {kind:'Issue'|'Insight'|'ResearchGap'|'Conflict';interpretation:string;gapType?:'Knowledge Gap'|'Spatial Gap'}
export type Insight=Finding&{kind:'Insight'};
export type Issue=Finding&{kind:'Issue'};
export type ResearchGap=Finding&{kind:'ResearchGap'};
export type Conflict=Finding&{kind:'Conflict'};
export interface DesignOpportunity extends BaseRecord {kind:'DesignOpportunity';findingIds:string[];directions:string[]}
export interface Proposal extends BaseRecord {kind:'Proposal';opportunityIds:string[];proposalType:'Product Design'|'Service Design'|'Product-Service System'|'Spatial Installation'|'Information / Interaction Design'|'Future Scenario'}
export type ResearchRecord=ContextRecord|Resource|Evidence|Finding|DesignOpportunity|Proposal;
/** anchor and points are resolved scene-world Y-up metres, not raw scan-local
 * coordinates. A future scan import must apply its registered model transform
 * before providing these positions. HTML glyph centres share the same anchor.
 */
export interface SpatialAnnotation {id:string;recordId:string;layer:SemanticLayer;form:SpatialForm;anchor:Vec3;points?:Vec3[];objectIds?:string[];futureOnly?:boolean}
export interface GuidedStep {id:string;title:string;verb:string;description:string;camera:CameraPose;layers:SemanticLayer[];selectedId:string|null;highlightIds:string[];proposalVisible:boolean}
export interface GuidedStory {id:string;siteId:string;title:string;steps:GuidedStep[]}
export interface ExplorerState {layers:SemanticLayer[];themes:Theme[];selectedId:string|null;compareIds:string[];mode:'free'|'guided';step:number;paused:boolean;proposalVisible:boolean;focusRevision:number}
