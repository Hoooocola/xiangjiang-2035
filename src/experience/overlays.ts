import * as THREE from 'three';
import {isVisible} from '../atlas/information';
import {MAP_OBJECTS} from '../atlas/objects';
import type {MapObject,OverlayState} from '../atlas/types';
import {METERS_PER_UNIT,project,type Coordinate} from './geo';
import {ANCHOR_HEIGHT_METERS as HEIGHT,geographicAnchor} from './anchors';
import {informationPoint} from './information-surface';
import {LAYER_VISUALS} from '../atlas/visuals';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

/** A disposable information tree; captured model geometry is the exact base-scene geometry. */
export function buildOverlays(height:(x:number,z:number)=>number,sourceGeometry=new Map<string,THREE.BufferGeometry[]>(),relief=height,objects:MapObject[]=MAP_OBJECTS){
 const root=new THREE.Group();root.name='knowledge-layers';
 const groups=new Map<string,THREE.Group>(),anchors=new Map<string,THREE.Vector3>();
 let current:OverlayState={layers:[],proposal:null,selectedObjectIds:[],placeId:null},hovered:string|null=null,night=1;
 const dayColors=new Map(objects.map(o=>[o.id,new THREE.Color(LAYER_VISUALS[o.layer].day)]));
 const nightColors=new Map(objects.map(o=>[o.id,new THREE.Color(LAYER_VISUALS[o.layer].night)]));
 const point=(o:MapObject,c:Coordinate)=>informationPoint(o,c,height,relief);
 const makeLine=(o:MapObject,g:THREE.Group,coords:Coordinate[],segments?:number[])=>{
  if(coords.length<2)return;
  const vertices:THREE.Vector3[]=[];
  for(let i=1;i<coords.length;i++){
   const [ax,az]=project(coords[i-1]),[bx,bz]=project(coords[i]);
   const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.25));
   for(let t=0;t<steps;t++){const k=t/steps;vertices.push(point(o,[THREE.MathUtils.lerp(coords[i-1][0],coords[i][0],k),THREE.MathUtils.lerp(coords[i-1][1],coords[i][1],k)]));}
  }
  vertices.push(point(o,coords.at(-1)!));
  if(segments){for(let i=1;i<vertices.length;i++)segments.push(...vertices[i-1].toArray(),...vertices[i].toArray());return;}
  const line=new Line2(new LineGeometry().setPositions(vertices.flatMap(v=>v.toArray())),new LineMaterial({color:dayColors.get(o.id),linewidth:2,worldUnits:false,dashed:o.dataStatus==='demo',dashSize:.28,gapSize:.16,transparent:true,opacity:.9,depthWrite:false}));
  line.computeLineDistances();line.renderOrder=5;g.add(line);
 };
 for(const o of objects){
  const g=new THREE.Group();g.name=o.id;g.visible=false;root.add(g);groups.set(o.id,g);
  const color=dayColors.get(o.id)!;
  anchors.set(o.id,point(o,o.anchor));
  if(o.form==='object'){
   for(const id of o.sourceFeatureIds??[])for(const geometry of sourceGeometry.get(id)??[]){
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    mesh.userData.modelFill=true;mesh.renderOrder=4;g.add(mesh);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial({color,transparent:true,opacity:1,depthWrite:false}));edges.renderOrder=5;g.add(edges);
   }
   if(g.children.length){g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);anchors.set(o.id,b.getCenter(new THREE.Vector3()).setY(b.max.y+.02));}
   // Missing model binding stays absent; a centreline is not a substitute for structure.
  }else if(o.geometry.type==='Point'){
   const p=geographicAnchor(o.anchor,height,HEIGHT.pointBase,new THREE.Vector3());
   const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false});
   const ring=new THREE.Mesh(new THREE.RingGeometry(.09,.13,24),material);ring.rotation.x=-Math.PI/2;ring.position.copy(p);g.add(ring);
   const pin=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,HEIGHT.pointStemHeight/METERS_PER_UNIT,8),material);pin.position.copy(p).add(new THREE.Vector3(0,HEIGHT.pointStemCenter/METERS_PER_UNIT,0));g.add(pin);
   const top=new THREE.Mesh(new THREE.OctahedronGeometry(.06),material);top.position.copy(p).add(new THREE.Vector3(0,HEIGHT.pointTip/METERS_PER_UNIT,0));g.add(top);
  }else{
   if(o.geometry.type!=='Polygon'&&o.geometry.paths){const segments:number[]=[];for(const coords of o.geometry.paths)makeLine(o,g,coords,segments);const line=new LineSegments2(new LineSegmentsGeometry().setPositions(segments),new LineMaterial({color,linewidth:1.6,worldUnits:false,transparent:true,depthWrite:false,opacity:.72}));line.computeLineDistances();line.renderOrder=5;g.add(line);}else if(o.geometry.type!=='Polygon')makeLine(o,g,o.geometry.coordinates);
   if(o.geometry.type==='Polygon')for(const rings of o.geometry.polygons??[[o.geometry.coordinates,...(o.geometry.holes??[])]]){
    makeLine(o,g,rings[0]);
    const shape=new THREE.Shape();
    for(const [i,coords] of rings.entries()){
     const path=i?new THREE.Path():shape;coords.forEach((c,j)=>{const [x,z]=project(c);if(j)path.lineTo(x,-z);else path.moveTo(x,-z);});path.closePath();if(i){shape.holes.push(path);makeLine(o,g,coords);}
    }
    const flat=new THREE.ShapeGeometry(shape);flat.rotateX(-Math.PI/2);const geometry=new TessellateModifier(.5,8).modify(flat);flat.dispose();
    const a=geometry.attributes.position;for(let i=0;i<a.count;i++){
     const x=a.getX(i),z=a.getZ(i);
     a.setY(i,o.surface==='park'?height(x,z)+.027:o.surface==='terrain'?relief(x,z)+.002:height(x,z)+HEIGHT.area/METERS_PER_UNIT);
    }geometry.computeVertexNormals();
    const fill=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));fill.userData.overlayFill=true;fill.renderOrder=3;g.add(fill);
   }
  }
  g.traverse(obj=>{obj.userData.informationId=o.id;});
 }
 function paint(){const visible=new Set(objects.filter(o=>isVisible(o,current)).map(o=>o.id));for(const [id,g] of groups){g.visible=visible.has(id);const selected=current.selectedObjectIds.includes(id),active=selected||hovered===id,muted=current.selectedObjectIds.some(id=>visible.has(id))&&!active;
  g.traverse(obj=>{const m=(obj as THREE.Mesh).material as THREE.MeshBasicMaterial|undefined;if(!m)return;
   m.color.copy(dayColors.get(id)!).lerp(nightColors.get(id)!,night);
   m.opacity=(obj.userData.modelFill?active?.9:.28:obj.userData.overlayFill?active?.19:.06:active?1:.72)*(muted?.4:1);
   if(obj instanceof LineSegments2)obj.material.linewidth=active?2.8:1.6;
  });
 }}
 return {root,groups,anchors,update:(state:OverlayState)=>{current=state;paint();},hover:(id:string|null)=>{hovered=id;paint();},theme:(value:number)=>{if(Math.abs(value-night)<.002)return;night=value;paint();}};
}
