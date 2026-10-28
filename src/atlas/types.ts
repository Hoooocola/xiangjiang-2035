import type {Coordinate} from '../experience/geo';
export type LayerId='geography'|'ecology'|'culture'|'society'|'economy'|'proposal';
export type RecordKind='ResearchProject'|'ResearchSession'|'FieldRecord'|'ResearchGap'|'Insight'|'Issue'|'Conflict'|'DesignOpportunity'|'Proposal';
export type ProposalType='Product Design'|'Service Design'|'Product-Service System'|'Spatial Installation'|'Information / Interaction Design';
export interface AtlasRecord {
 id:string;kind:RecordKind;placeId:string;placeIds?:string[];title:string;year:number;author:string;course?:string;themes:string[];summary:string;body:string[];
 dataStatus:'public'|'demo';state:string;sourceIds:string[];evidenceIds:string[];relatedIds:string[];objectIds:string[];
 gapType?:'Knowledge Gap'|'Spatial Gap';proposalType?:ProposalType;legacyId?:string;
}
export interface MapObject {id:string;title:string;placeId:string;placeIds?:string[];layer:LayerId;subtype?:string;recordId?:string;sourceIds:string[];dataStatus:'public'|'demo';geometry:{type:'Point'|'LineString'|'Polygon';coordinates:Coordinate[];paths?:Coordinate[][];holes?:Coordinate[][];polygons?:Coordinate[][][]};anchor:Coordinate;precision:string;proposalId?:string;summary?:string;shortDescription?:string;time?:string;researchStatus?:string;sourceFeatureIds?:string[];surface?:'terrain'|'shore'|'park'|'road'|'model';form?:'point'|'line'|'area'|'object';year?:number;metric?:{label:string;value:number;unit:string;scope:string};}
export interface ProposalScenario {proposalId:string;view:'baseline'|'intervention'}
export interface OverlayState {layers:LayerId[];proposal:ProposalScenario|null;selectedObjectIds:string[];placeId:string|null;showDemo?:boolean;subtypes?:string[]}

export interface InformationFeature extends MapObject {category:LayerId;shortDescription:string;geometryType:MapObject['geometry']['type'];relatedPlaceIds:string[];sourceStatus:'public'|'mock';isMock:boolean;relatedEvidenceIds:string[];relatedProposalIds:string[]}
