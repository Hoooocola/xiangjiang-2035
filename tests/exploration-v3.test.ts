import {describe,it,expect} from 'vitest';
import {sampleCover,readingAt,COVER_CLASSES,EMPTY_EXPLORATION,DEMO_NODES,CULTURE_NODES,type CoverMeta} from '@/src/exploration/data';
import {project,unproject} from '@/src/experience/geo';
import {MAP_PLACES} from '@/src/places/registry';
import fs from 'node:fs';import crypto from 'node:crypto';
const meta=JSON.parse(fs.readFileSync('public/data/spatial/worldcover-2021-texture.json','utf8')) as CoverMeta;
const values=new Uint8Array(fs.readFileSync('public/data/spatial/worldcover-2021-core.bin'));
describe('georeferenced land cover',()=>{
 it('preserves every original pixel, source hash and actual categories without invented wetland classes',()=>{const original=JSON.parse(fs.readFileSync('public/data/spatial/worldcover-2021-core.json','utf8'));expect(Buffer.from(values).equals(Buffer.from(original.values))).toBe(true);expect(crypto.createHash('sha256').update(values).digest('hex')).toBe(meta.sha256);expect(COVER_CLASSES.map(c=>c.code)).toEqual(meta.classes);});
 it('reads north-up pixel centres and never clamps outside coverage into false values',()=>{const m={...meta,width:2,height:2,bounds:[112,28,114,30]};const v=new Uint8Array([10,80,50,40]);expect(sampleCover(m,v,[112.5,29.5])).toBe(10);expect(sampleCover(m,v,[113.5,29.5])).toBe(80);expect(sampleCover(m,v,[112.5,28.5])).toBe(50);expect(sampleCover(m,v,[113.5,28.5])).toBe(40);for(const c of [[114,29],[112.5,28],[111.9,29],[113,30.1]])expect(sampleCover(m,v,c as [number,number])).toBe(0);});
 it('keeps shader data and CPU readout on the same WGS84/local projection contract',()=>{for(let i=0;i<values.length;i+=13907){const col=i%meta.width,row=Math.floor(i/meta.width),[w,s,e,n]=meta.bounds;const c:[number,number]=[w+(col+.5)/meta.width*(e-w),n-(row+.5)/meta.height*(n-s)];const [x,z]=project(c);expect(unproject([x,z])[0]).toBeCloseTo(c[0],10);expect(readingAt(meta,values,x,z).code).toBe(values[i]);}});
 it('starts with no active data and retains explicit deterministic demo nodes apart from registered culture locations',()=>{expect(Object.values(EMPTY_EXPLORATION).every(v=>!v)).toBe(true);expect(DEMO_NODES.every(n=>n.name.includes('示意'))).toBe(true);for(const n of CULTURE_NODES)expect(MAP_PLACES.find(p=>p.id===n.id)?.coordinate).toEqual(n.coordinate);});
});
