import type {LayerId} from './types';
/** Category identity stays separate from selection and from research hierarchy. */
export const LAYER_VISUALS:Record<LayerId,{day:string;night:string;shape:'square'|'leaf'|'diamond'|'route'|'document'|'triangle'}>={
 geography:{day:'#236879',night:'#83c7d9',shape:'square'},
 ecology:{day:'#397241',night:'#a4dca0',shape:'leaf'},
 culture:{day:'#986020',night:'#efc47e',shape:'diamond'},
 society:{day:'#ac4f35',night:'#f5a58a',shape:'route'},
 economy:{day:'#7751a1',night:'#c4a5ef',shape:'document'},
 proposal:{day:'#187a75',night:'#6edfd0',shape:'triangle'},
};
