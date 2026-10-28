import {describe,it,expect} from 'vitest';
import {colorDocument,defaultColorPair,normalizeHex,parseColorDocument} from '../src/experience/style-frame-v4/colors';

describe('V4 portable color palette',()=>{
 it('round-trips independent day and night edits without mutating defaults',()=>{
  const pair=defaultColorPair();pair.day.wall='#112233';pair.night.water='#abcdef';
  const parsed=parseColorDocument(JSON.parse(JSON.stringify(colorDocument(pair))));
  expect(parsed.day.wall).toBe('#112233');expect(parsed.night.water).toBe('#ABCDEF');
  expect(parsed.night.wall).toBe(defaultColorPair().night.wall.toUpperCase());
  expect(defaultColorPair().day.wall).not.toBe('#112233');
 });
 it('normalizes complete hex input and rejects incomplete or executable values',()=>{
  expect(normalizeHex(' aabbcc ')).toBe('#AABBCC');
  for(const v of ['#fff','red','url(x)','#12345g',''])expect(normalizeHex(v)).toBeNull();
 });
 it('rejects malformed imports atomically',()=>{
  const good=colorDocument(defaultColorPair());
  expect(()=>parseColorDocument({...good,version:2})).toThrow();
  expect(()=>parseColorDocument({...good,colors:{day:good.colors.day}})).toThrow();
  expect(()=>parseColorDocument({...good,colors:{...good.colors,night:{...good.colors.night,ground:'invalid'}}})).toThrow('地面');
  expect(parseColorDocument(good).night.ground).toBe('#8E8C80');
 });
});
