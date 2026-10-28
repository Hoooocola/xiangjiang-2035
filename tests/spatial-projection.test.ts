import {describe,expect,it} from 'vitest';
import {PerspectiveCamera,Vector3,Mesh,OctahedronGeometry} from 'three';
import {projectAnchor} from '../src/spatial/projection';
import {geographicAnchor,objectAnchorHeight,ANCHOR_HEIGHT_METERS} from '../src/experience/anchors';
import {ORIGIN,METERS_PER_UNIT} from '../src/experience/geo';
import {buildOverlays} from '../src/experience/overlays';
import {MAP_OBJECTS} from '../src/atlas/objects';
import {Line2} from 'three/addons/lines/Line2.js';

describe('scene anchors and CSS-pixel projection',()=>{
 it('uses the current aspect and viewport after resize without applying drawing-buffer DPR',()=>{
  const camera=new PerspectiveCamera(38,16/9,.1,4500),target=new Vector3(2,0,-1),out=new Vector3();
  camera.position.set(40,60,80);camera.lookAt(target);camera.updateMatrixWorld();
  for(const [w,h] of [[1280,720],[1600,900],[900,1000]]){
   camera.aspect=w/h;camera.updateProjectionMatrix();
   projectAnchor(target,camera,w,h,out);
   expect(out.x).toBeCloseTo(w/2,8);expect(out.y).toBeCloseTo(h/2,8);
   const world=new Vector3(10,3,4),before=world.clone();
   projectAnchor(world,camera,w,h,out);
   const unprojected=new Vector3(out.x/w*2-1,1-out.y/h*2,out.z).unproject(camera);
   expect(unprojected.distanceTo(world)).toBeLessThan(1e-8);
   expect(world).toEqual(before);
  }
 });
 it('does not project a collapsed viewport as a visible marker',()=>{
  const out=projectAnchor(new Vector3(),new PerspectiveCamera(),0,720,new Vector3());
  expect(out.z).toBe(Infinity);expect(Number.isFinite(out.x)).toBe(false);
 });
 it('converts terrain-relative metres once and leaves place anchors on the surface',()=>{
  const out=new Vector3();
  geographicAnchor(ORIGIN,()=>2,ANCHOR_HEIGHT_METERS.place,out);expect(out.toArray()).toEqual([0,2,-0]);
  geographicAnchor(ORIGIN,()=>2,50,out);expect(out.y).toBe(2+50/METERS_PER_UNIT);
 });
 it('binds every global point label to the actual 3D pin centre',()=>{
  const height=(x:number,z:number)=>.1*x+.05*z;
  const overlays=buildOverlays(height);overlays.root.updateMatrixWorld(true);
  for(const object of MAP_OBJECTS.filter(o=>o.geometry.type==='Point')){
   const group=overlays.root.getObjectByName(object.id)!;
   const tip=group.children.find(o=>o instanceof Mesh&&o.geometry instanceof OctahedronGeometry)!;
   const label=geographicAnchor(object.anchor,height,objectAnchorHeight('Point'),new Vector3());
   expect(label.distanceTo(tip.getWorldPosition(new Vector3()))).toBeLessThan(1e-10);
  }
  overlays.root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
 });
 it('drapes polygon interiors and outlines at one clearance without flattening the terrain',()=>{
  const height=(x:number,z:number)=>.02*x+.01*z+Math.sin(x*.3)*.1;
  const overlays=buildOverlays(height);
  for(const object of MAP_OBJECTS.filter(o=>o.geometry.type==='Polygon'&&!o.surface)){
   const group=overlays.root.getObjectByName(object.id)!;
   const fill=group.children.find(o=>o.userData.overlayFill) as Mesh;
   const a=fill.geometry.attributes.position;
   expect(a.count).toBeGreaterThan(object.geometry.coordinates.length);
   for(let i=0;i<a.count;i++)expect(a.getY(i)-height(a.getX(i),a.getZ(i))).toBeCloseTo(ANCHOR_HEIGHT_METERS.area/METERS_PER_UNIT,4);
   const line=group.children.find(o=>o instanceof Line2) as Line2;
   const edges=line.geometry.attributes.instanceStart;
   for(let i=0;i<edges.count;i++)expect(edges.getY(i)-height(edges.getX(i),edges.getZ(i))).toBeCloseTo(ANCHOR_HEIGHT_METERS.area/METERS_PER_UNIT,4);
  }
  overlays.root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
 });
 it('changes semantic highlight and theme without moving the geographic line',()=>{
  const overlays=buildOverlays(()=>0),route=MAP_OBJECTS.find(o=>o.geometry.type==='LineString'&&o.dataStatus==='public')!;
  const group=overlays.root.getObjectByName(route.id)!,line=group.children.find(o=>o instanceof Line2) as Line2;
  const positions=Array.from(line.geometry.attributes.instanceStart.array);
  const state={layers:[route.layer],selectedObjectIds:[],placeId:null,proposal:null};
  overlays.update(state);expect(group.visible).toBe(true);
  const normalWidth=line.material.linewidth;
  overlays.hover(route.id);expect(line.material.linewidth).toBeGreaterThan(normalWidth);
  overlays.hover(null);expect(line.material.linewidth).toBe(normalWidth);
  overlays.update({...state,selectedObjectIds:[route.id]});
  const nightColor=line.material.color.clone();overlays.theme(0);
  expect(line.material.color.equals(nightColor)).toBe(false);
  expect(Array.from(line.geometry.attributes.instanceStart.array)).toEqual(positions);
  overlays.update({...state,layers:[]});expect(group.visible).toBe(false);
  overlays.root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
 });
});
