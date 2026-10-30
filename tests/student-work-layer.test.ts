import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {LayerPanel} from '@/app/experience/layer-panel';
import {showcaseStats} from '@/src/student-works/catalog';

it('exposes actual student proposals through the design layer with DEMO disabled',()=>{
 const noop=()=>{};
 const html=renderToStaticMarkup(createElement(LayerPanel,{
  scope:'all',onScope:noop,courseStats:showcaseStats(),onCourseOpen:noop,
  state:{placeId:null,layers:['proposal'],selectedObjectIds:[],proposal:null,showDemo:false},
  onToggle:noop,onObject:noop,onClose:noop,onSubtype:noop,onDemo:noop,onGuide:noop,onClear:noop,
 }));
 expect(html).toContain('24 作品');
 expect(html).toContain('学生课程设计方案');
 expect(html).toContain('浏览课程设计作品');
 expect(html).toContain('11');
 expect(html).toContain('显示设计方案');
 expect(html).toContain('aria-checked="true"');
 expect(html).toContain('非实施项目');
});
