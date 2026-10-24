import * as THREE from 'three';
import {MAP_OBJECTS,visibleObjects} from '../atlas/objects';
import {LAYERS} from '../atlas/catalog';
import type {OverlayState} from '../atlas/types';
import {project,type Coordinate} from './geo';

/** A small, disposable layer tree. All positions use the same WGS84 projection as the base scene. */
export function buildOverlays(height:(x:number,z:number)=>number){
 const root=new THREE.Group();root.name='knowledge-layers';
 const groups=new Map<string,THREE.Group>();
 const point=(c:Coordinate,offset=.22)=>{const [x,z]=project(c);return new THREE.Vector3(x,height(x,z)+offset,z);};
 for(const o of MAP_OBJECTS){
  const g=new THREE.Group();g.name=o.id;g.visible=false;root.add(g);groups.set(o.id,g);
  const color=LAYERS.find(l=>l.id===o.layer)!.color;
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false});
  if(o.geometry.type==='Point'){
   const p=point(o.anchor),ring=new THREE.Mesh(new THREE.RingGeometry(.24,.32,32),material);ring.rotation.x=-Math.PI/2;ring.position.copy(p);g.add(ring);
   const pin=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.65,8),material);pin.position.copy(p).add(new THREE.Vector3(0,.32,0));g.add(pin);
   const top=new THREE.Mesh(new THREE.OctahedronGeometry(.16),material);top.position.copy(p).add(new THREE.Vector3(0,.7,0));g.add(top);
  }else{
   const coords=o.geometry.coordinates;
   const vertices:THREE.Vector3[]=[];
   for(let i=1;i<coords.length;i++){const a=point(coords[i-1]),b=point(coords[i]);const steps=Math.max(1,Math.ceil(a.distanceTo(b)));for(let t=0;t<steps;t++){const v=a.clone().lerp(b,t/steps);v.y=height(v.x,v.z)+.19;vertices.push(v);}}vertices.push(point(coords.at(-1)!,.19));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices),(o.layer==='society'?new THREE.LineDashedMaterial({color,dashSize:.28,gapSize:.16,transparent:true,opacity:.9,depthWrite:false}):new THREE.LineBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false})));line.computeLineDistances();line.renderOrder=5;g.add(line);
   if(o.geometry.type==='Polygon'){
    const shape=new THREE.Shape();coords.forEach((c,i)=>{const [x,z]=project(c);if(i)shape.lineTo(x,-z);else shape.moveTo(x,-z);});shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);const a=geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,height(a.getX(i),a.getZ(i))+.14);geometry.computeVertexNormals();
    const fill=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide}));fill.renderOrder=3;g.add(fill);
   }
   material.dispose();
  }
 }
 function update(state:OverlayState){const visible=new Set(visibleObjects(state).map(o=>o.id));for(const [id,g] of groups){g.visible=visible.has(id);const selected=state.selectedObjectIds.includes(id);g.traverse(obj=>{const m=(obj as THREE.Mesh).material as THREE.MeshBasicMaterial|undefined;if(m){m.opacity=obj instanceof THREE.Line?selected?1:.75:obj instanceof THREE.Mesh&&obj.geometry.type==='ShapeGeometry'?selected?.25:.10:selected?1:.75;}});}}
 return {root,update};
}
