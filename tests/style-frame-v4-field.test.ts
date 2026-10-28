import {describe,it,expect} from 'vitest';
import {inwardWeights} from '../src/experience/style-frame-v4/field';
describe('approved inward-only material boundary',()=>{
 it('never adds support and reaches full material only after the inward blend',()=>{
  const cols=30,rows=30,support=new Uint8Array(cols*rows);
  for(let r=2;r<28;r++)for(let c=2;c<28;c++)support[r*cols+c]=1;
  const weights=inwardWeights(support,cols,rows,.5,2);
  weights.forEach((w,i)=>{expect(w).toBeGreaterThanOrEqual(0);expect(w).toBeLessThanOrEqual(1);if(!support[i])expect(w).toBe(0);});
  const line=Array.from({length:7},(_,c)=>weights[15*cols+c]);
  expect(line).toEqual([...line].sort((a,b)=>a-b));
  expect(weights[15*cols+2]).toBeLessThan(.1);
  expect(weights[15*cols+5]).toBeLessThan(1);
  expect(weights[15*cols+6]).toBe(1);
 });
 it('preserves background holes rather than filling them with the surrounding subject',()=>{
  const cols=21,rows=21,support=new Uint8Array(cols*rows).fill(1);support[10*cols+10]=0;
  const weights=inwardWeights(support,cols,rows,.5,2);
  expect(weights[10*cols+10]).toBe(0);expect(weights[10*cols+11]).toBeLessThan(.1);expect(weights[10*cols+15]).toBe(1);
 });
});
