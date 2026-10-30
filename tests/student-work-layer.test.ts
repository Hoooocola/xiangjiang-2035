import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {LayerPanel} from '@/app/experience/layer-panel';
import {ProposalExplorer} from '@/app/experience/proposal-explorer';
import {DESIGN_PROPOSALS,proposalPlaceIds} from '@/src/atlas/proposals';
import {STUDENT_WORKS} from '@/src/student-works/catalog';
it('offers five reality themes while retaining proposals in their own explorer',()=>{
 const noop=()=>{};const html=renderToStaticMarkup(createElement(LayerPanel,{scope:'all',onScope:noop,state:{placeId:null,layers:['ecology','proposal'],selectedObjectIds:[],proposal:null,showDemo:false},onToggle:noop,onObject:noop,onClose:noop,onSubtype:noop,onDemo:noop,onGuide:noop,onClear:noop}));
 expect(html).not.toContain('显示设计方案');expect(html).not.toContain('学生课程设计方案');expect((html.match(/role="switch"/g)||[]).length).toBe(5);expect(html).toContain('显示生态');
 const explorer=renderToStaticMarkup(createElement(ProposalExplorer,{selectedId:null,placeId:null,onSelect:noop,onPlace:noop,onClose:noop,onDetails:noop,onCourse:noop}));expect(explorer).toContain('设计方案目录');expect(explorer).toContain('浏览课程成果');expect(DESIGN_PROPOSALS.length).toBeGreaterThan(0);expect(DESIGN_PROPOSALS.every(p=>p.kind==='Proposal')).toBe(true);expect(STUDENT_WORKS).toHaveLength(24);
});
it('resolves multi-place proposals through existing place identities without creating markers',()=>{for(const p of DESIGN_PROPOSALS){expect(new Set(proposalPlaceIds(p)).size).toBe(proposalPlaceIds(p).length);}const p=DESIGN_PROPOSALS[0];expect(proposalPlaceIds({...p,placeId:'unknown',placeIds:['unknown']})).toEqual([]);expect(proposalPlaceIds({...p,placeIds:['ezhou','juzizhou','ezhou']})).toEqual(['ezhou','juzizhou']);});
