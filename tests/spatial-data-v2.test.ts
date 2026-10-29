import {describe,it,expect} from 'vitest';
import {contains,cropRaster,distanceToLine,pointBuffer,validBounds} from '../src/spatial-data/geometry';
import {getLayer,loadLayer,objectDetails,studyArea} from '../src/spatial-data/service';
import {analyzeYanghu} from '../src/spatial-data/analysis';
import {SPATIAL_LAYERS,WORLDCOVER_LEGEND} from '../src/spatial-data/catalog';
import {GET} from '../app/api/spatial-data/route';
import type {Collection,Position,Raster} from '../src/spatial-data/types';
describe('spatial geometry contracts',()=>{
 const outer:Position[]=[[0,0],[4,0],[4,4],[0,4],[0,0]],hole:Position[]=[[1,1],[2,1],[2,2],[1,2],[1,1]];
 it('excludes polygon holes',()=>{expect(contains([.5,.5],[outer,hole])).toBe(true);expect(contains([1.5,1.5],[outer,hole])).toBe(false);});
 it('rejects NaN/reversed/non-WGS84 boxes',()=>{expect(validBounds([112,28,113,29])).toBe(true);for(const b of [[113,28,112,29],[NaN,28,113,29],[-181,0,1,2]])expect(validBounds(b)).toBe(false);});
 it('computes distance to segment interior and endpoints',()=>{expect(distanceToLine([0,0],[[-1,.001],[1,.001]])).toBeCloseTo(111.32);expect(distanceToLine([0,0],[[.001,0],[.002,0]])).toBeCloseTo(111.32);});
 it('creates closed metre buffers',()=>{const b=pointBuffer([112.94,28.13],100);expect(b.type).toBe('Polygon');if(b.type==='Polygon')expect(b.coordinates[0][0]).toEqual(b.coordinates[0].at(-1));expect(()=>pointBuffer([0,0],-1)).toThrow();});
 it('preserves native raster orientation and nodata',()=>{const r:Raster={width:2,height:2,bounds:[0,0,2,2],nodata:0,values:[10,0,30,80]};expect(cropRaster(r,[1,1,2,2])?.values).toEqual([0]);expect(cropRaster(r,[3,3,4,4])).toBeNull();});
});
describe('real snapshots and API boundary',()=>{
 it('keeps existing six-category enum without mutating map state',()=>{expect(SPATIAL_LAYERS.every(l=>['geography','ecology'].includes(l.category))).toBe(true);expect(WORLDCOVER_LEGEND.map(x=>x.value)).toEqual([10,20,30,40,50,60,70,80,90,95,100]);expect(()=>getLayer('../../.env')).toThrow();});
 it('retains unlocated monthly water records with no fabricated metrics',async()=>{const d=await loadLayer('ecology.water.2025-11');if(!d||!('records'in d))throw Error('Expected water');expect(d.records).toHaveLength(30);expect(d.records.every(r=>r.geometry===null&&r.positionStatus==='unverified')).toBe(true);expect(d.records.filter(r=>r.river==='湘江干流')).toHaveLength(8);});
 it('retains licensed, finite, uncertainty-qualified GBIF evidence',async()=>{const d=await loadLayer('ecology.gbif.snapshot') as Collection;expect(d.features).toHaveLength(100);for(const f of d.features){expect(Number(f.properties.coordinateUncertaintyInMeters)).toBeGreaterThan(0);expect(Number(f.properties.coordinateUncertaintyInMeters)).toBeLessThanOrEqual(1000);expect(String(f.properties.license)).toMatch(/\/by\/4.0|\/zero\/1.0/);expect(f.properties).not.toHaveProperty('recordedBy');}expect(await objectDetails('ecology.gbif.snapshot',d.features[0].id)).toEqual(d.features[0]);});
 it('reuses OSM study polygon, keeps raster values only on bbox request',async()=>{expect((await studyArea()).geometry.type).toBe('Polygon');expect(await loadLayer('ecology.worldcover.2021')).not.toHaveProperty('values',expect.anything());const d=await loadLayer('ecology.worldcover.2021',[112.93,28.12,112.931,28.121]) as Raster;expect(d.values.length).toBe(d.width*d.height);expect(d.values.every(v=>v===0||WORLDCOVER_LEGEND.some(x=>x.value===v))).toBe(true);});
 it('rejects unknown layers, actions and invalid area/buffer/bbox',async()=>{for(const q of ['action=layer&layerId=bad','action=region&bbox=0,0,10,10&layers=ecology.gbif.snapshot','action=no','action=analysis&studyAreaId=bad','action=analysis&bufferMeters=-1'])expect((await GET(new Request('http://localhost/api/spatial-data?'+q))).status).toBe(400);});
 it('produces reproducible overlap with explicit uncertainty and evidence',async()=>{const a=await analyzeYanghu(),b=await analyzeYanghu();expect(a.analysisId).toBe(b.analysisId);expect(a.metrics.insidePixelCount).toBe(55076);expect(Object.values(a.metrics.classPixelCounts as Record<string,number>).reduce((a,b)=>a+b,0)).toBe(a.metrics.insidePixelCount);expect(a.verificationStatus).toBe('requires-field-verification');expect(a.sourceReferences.length).toBe(4);expect(a.evidenceReferences.length).toBeGreaterThan(2);expect(a.metrics.observationProximity).toEqual(expect.arrayContaining([expect.objectContaining({withinBuffer:'uncertain'})]));},30000);
});
