import {describe,it,expect} from 'vitest';
import {BoxGeometry,Mesh,PerspectiveCamera,Vector3} from 'three';
import {MAP_OBJECTS,visibleObjects} from '../src/atlas/objects';
import {focusState,SUBTYPES} from '../src/atlas/information';
import {LAYERS,recordById} from '../src/atlas/catalog';
import {buildOverlays} from '../src/experience/overlays';
import {informationPoint,renderedTerrainHeight} from '../src/experience/information-surface';
import {project} from '../src/experience/geo';
import {projectAnchor} from '../src/spatial/projection';
import type {OverlayState} from '../src/atlas/types';
import {readFileSync} from 'node:fs';
const base:OverlayState={layers:LAYERS.map(l=>l.id),proposal:null,placeId:null,selectedObjectIds:[],subtypes:SUBTYPES.map(s=>s.id)};
describe('spatial information visibility and provenance',()=>{
 it('keeps demo opt-in, economy empty and research records reachable',()=>{
  expect(visibleObjects(base).every(o=>o.dataStatus==='public')).toBe(true);
  expect(visibleObjects({...base,showDemo:true}).some(o=>o.dataStatus==='demo')).toBe(true);
  expect(MAP_OBJECTS.filter(o=>o.layer==='economy')).toHaveLength(0);
  for(const id of ['research-2018','research-2024','field-template','demo-gap'])expect(recordById(id)).toBeDefined();
 });
 it('clears effective focus when its layer, subtype, scope or demo switch is off',()=>{
  const selected={...base,selectedObjectIds:['pilot-juzizhou-bridge']};
  expect(focusState(selected,MAP_OBJECTS).mode).toBe('object');
  for(const state of [{...selected,layers:[]},{...selected,subtypes:['shoreline']},{...selected,placeId:'ezhou'}])expect(focusState(state,MAP_OBJECTS).primaryId).toBeNull();
  expect(focusState({...base,selectedObjectIds:['demo-ecology-area']},MAP_OBJECTS).primaryId).toBeNull();
 });
 it('does not claim existing park polygons are wetland or full land-use data',()=>{
  expect(MAP_OBJECTS.some(o=>['wetland','landuse','corridor'].includes(o.subtype??''))).toBe(false);
  const park=MAP_OBJECTS.find(o=>o.id==='pilot-park-15867482')!;expect(park.subtype).toBe('cover');expect(park.precision).toContain('不是湿地');
 });
 it('preserves source shoreline segments and bridges instead of creating arbitrary boundaries',()=>{
  const source=JSON.parse(readFileSync('public/data/xiangjiang.geojson','utf8'));
  const water=source.features.find((f:{id:string})=>f.id==='relation/8727387');
  const segments: number[][][]=water.geometry.coordinates.flatMap((p:number[][][])=>p.flatMap(r=>r.slice(1).map((b,i)=>[r[i],b])));
  for(const object of MAP_OBJECTS.filter(o=>o.subtype==='shoreline'))for(const p of object.geometry.coordinates){
   expect(segments.some(([a,b])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy);return t>=-1e-6&&t<=1+1e-6&&Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<1e-8;})).toBe(true);
  }
  const bridge=MAP_OBJECTS.find(o=>o.id==='pilot-juzizhou-bridge')!;
  expect(bridge.sourceFeatureIds).toHaveLength(2);
  for(const id of bridge.sourceFeatureIds!)expect(source.features.find((f:{id:string})=>f.id===id)?.properties.name).toBe('橘子洲大桥');
 });
});
describe('information geometry and anchors',()=>{
 it('uses captured bridge geometry and exact bounds, without a bounding-box substitute',()=>{
  const bridge=MAP_OBJECTS.find(o=>o.id==='pilot-juzizhou-bridge')!,geometry=new BoxGeometry(8,.2,1);geometry.translate(1,4,2);
  const overlays=buildOverlays(()=>0,new Map([[bridge.sourceFeatureIds![0],[geometry]]]));
  const group=overlays.groups.get(bridge.id)!;
  expect(group.children.some(o=>o.type==='Box3Helper')).toBe(false);
  expect((group.children.find(o=>o instanceof Mesh) as Mesh).geometry).toBe(geometry);
  expect(overlays.anchors.get(bridge.id)!.y).toBeCloseTo(4.12);
  const empty=buildOverlays(()=>0);expect(empty.groups.get(bridge.id)!.children).toHaveLength(0);
 });
 it('binds shore lines to the base shoreline even when DEM height differs',()=>{
  const shore=MAP_OBJECTS.find(o=>o.subtype==='shoreline')!;const point=informationPoint(shore,shore.anchor,()=>100);
  expect(point.y).toBeCloseTo(.037);expect([point.x,point.z]).toEqual(project(shore.anchor));
 });
 it('interpolates the rendered relief triangles and shares stable CSS pixel projection',()=>{
  const grid={width:3,height:3,x0:0,z0:0,dx:1,dz:1,elevations:[],riverDistance:[],water:[]};
  const height=renderedTerrainHeight(grid,(x,z)=>x*z);
  expect(height(.5,.5)).toBeCloseTo(-.025);expect(height(1.5,1.5)).toBeCloseTo(1.975);
  const camera=new PerspectiveCamera(38,16/9,.1,1000),point=new Vector3(1,2,3),out=new Vector3();
  for(const x of [10,25,40]){camera.position.set(x,20,30);camera.lookAt(point);camera.updateMatrixWorld();projectAnchor(point,camera,1280,720,out);expect(out.x).toBeCloseTo(640);expect(out.y).toBeCloseTo(360);}
 });
});

import {buildScene} from '../src/experience/scene';
import {makeMaterials} from '../src/experience/materials';
import {unproject,type SceneData} from '../src/experience/geo';
import {validateInformationFeature,recordsForFeature} from '../src/atlas/registry';
import type {MapObject} from '../src/atlas/types';

describe('source model binding and reusable spatial contracts',()=>{
 it('retains the exact generated bridge deck for information focus',async()=>{
  const grid={width:3,height:3,x0:-2,z0:-2,dx:2,dz:2,elevations:Array(9).fill(420),riverDistance:Array(9).fill(0),water:Array(9).fill(1)};
  const feature={type:'Feature' as const,id:'bridge-source',properties:{highway:'primary',bridge:'yes'},geometry:{type:'LineString' as const,coordinates:[unproject([-1,0]),unproject([1,0])]}};
  const data:SceneData={type:'FeatureCollection',features:[feature]};
  const materials=makeMaterials(),scene=await buildScene(data,grid,{buildings:[],counts:{knownHeight:0}},materials,()=>{},false,new Set(['bridge-source']));
  const captured=scene.sourceGeometry.get('bridge-source')![0];const positions=Array.from(captured.attributes.position.array);
  const mesh=scene.root.children.find(o=>o instanceof Mesh&&o.material===materials.bridge) as Mesh;
  expect(Array.from(mesh.geometry.attributes.position.array)).toEqual(positions);
  expect(scene.sourceGeometry.size).toBe(1);
  expect(mesh.geometry).not.toBe(captured);
 });
 it('triangulates separate polygons and holes without filling their gap',()=>{
  const ring=(x:number,z:number,w:number)=>[[x,z],[x+w,z],[x+w,z+w],[x,z+w],[x,z]].map(([x,z])=>unproject([x,z]));
  const f:MapObject={id:'multi',title:'Multi',placeId:'juzizhou',layer:'geography',dataStatus:'public',sourceIds:['osm'],precision:'fixture',surface:'terrain',geometry:{type:'Polygon',coordinates:ring(0,0,4),polygons:[[ring(0,0,4),ring(1,1,1)],[ring(6,0,2)]]},anchor:unproject([0,0])};
  expect(validateInformationFeature(f)).toEqual([]);
  const overlays=buildOverlays(()=>0,new Map(),()=>0,[f]);
  const fills=overlays.groups.get('multi')!.children.filter(o=>o.userData.overlayFill) as Mesh[];
  expect(fills).toHaveLength(2);
  for(const fill of fills){const geometry=fill.geometry.index?fill.geometry.toNonIndexed():fill.geometry;const p=geometry.attributes.position;for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;expect(x>1+1e-6&&x<2-1e-6&&z>1+1e-6&&z<2-1e-6).toBe(false);expect(x>4+1e-6&&x<6-1e-6).toBe(false);}}
 });
 it('keeps record-to-feature relations many-to-one and validates sourced pilot records',()=>{
  expect(recordsForFeature('research-index').map(r=>r.id)).toEqual(expect.arrayContaining(['research-2018','document-2018']));
  for(const o of MAP_OBJECTS.filter(o=>o.id.startsWith('pilot-')))expect(validateInformationFeature(o),o.id).toEqual([]);
 });
});
