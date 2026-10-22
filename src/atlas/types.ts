import type {Coordinate} from '../experience/geo';
export type LayerId='geography'|'ecology'|'culture'|'society'|'research'|'proposal';
export type RecordKind='ResearchProject'|'ResearchSession'|'FieldRecord'|'ResearchGap'|'Insight'|'Issue'|'Conflict'|'DesignOpportunity'|'Proposal';
export type ProposalType='Product Design'|'Service Design'|'Product-Service System'|'Spatial Installation'|'Information / Interaction Design';
export interface AtlasRecord {
 id:string;kind:RecordKind;placeId:string;title:string;year:number;author:string;course?:string;themes:string[];summary:string;body:string[];
 dataStatus:'public'|'demo';state:string;sourceIds:string[];evidenceIds:string[];relatedIds:string[];objectIds:string[];
 gapType?:'Knowledge Gap'|'Spatial Gap';proposalType?:ProposalType;legacyId?:string;
}
export interface MapObject {id:string;title:string;placeId:string;layer:LayerId;recordId?:string;sourceIds:string[];dataStatus:'public'|'demo';geometry:{type:'Point'|'LineString'|'Polygon';coordinates:Coordinate[]};anchor:Coordinate;precision:string;scenario:'both'|'2035';}
export interface Scenario {id:'today'|'2035';title:string;description:string;proposalIds:string[];status:'current'|'concept'}
export interface OverlayState {layers:LayerId[];scenario:Scenario['id'];selectedObjectIds:string[];placeId:string|null;proposalVisible:boolean}
