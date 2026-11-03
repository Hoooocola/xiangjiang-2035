import {expect,it} from 'vitest';
import {activeSceneDetail} from '@/app/experience/panel-selection';
const simultaneous={detailOpen:false,objectId:'pilot-shore-1',courseWorkId:'pinwall-66172',atlasPanel:null,drawer:null} as const;
it('replaces the course list with the newly selected shoreline detail',()=>{
 expect(activeSceneDetail(simultaneous)).toBe('object');
 expect(activeSceneDetail({...simultaneous,objectId:null})).toBe('course');
});
it('keeps library, place details and course details mutually exclusive',()=>{
 expect(activeSceneDetail({...simultaneous,detailOpen:true})).toBe('place');
 expect(activeSceneDetail({...simultaneous,atlasPanel:'library'})).toBeNull();
 expect(activeSceneDetail({...simultaneous,drawer:'about'})).toBeNull();
 expect(activeSceneDetail({...simultaneous,objectId:null,atlasPanel:'layers'})).toBeNull();
});
