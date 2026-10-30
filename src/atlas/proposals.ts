import {RECORDS} from './catalog';
import type {AtlasRecord} from './types';
import {PLACES} from '../experience/config';
/** Existing Proposal records only: StudentWork never becomes a Proposal implicitly. */
export const DESIGN_PROPOSALS=RECORDS.filter(r=>r.kind==='Proposal');
export function proposalPlaceIds(record:AtlasRecord){return [...new Set(record.placeIds??[record.placeId])].filter(id=>PLACES.some(p=>p.id===id));}
