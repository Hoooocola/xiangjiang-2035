import * as THREE from 'three';
import {ANNOTATIONS} from './data';
import {annotationStyles} from './styles';
import {highlightedRecordIds,visibleAnnotations} from './controller';
import type {ExplorerState,SpatialAnnotation} from './types';
import type {SiteModel} from './scene';

export function createAnnotations(model:SiteModel){
 const root=new THREE.Group(),groups=new Map<string,THREE.Group>();
 const pickables:THREE.Object3D[]=[];
 for(const a of ANNOTATIONS){
  const g=new THREE.Group();g.visible=false;g.userData.annotation=a.id;root.add(g);groups.set(a.id,g);
  const color=annotationStyles[a.layer].color;
  if(a.form==='point'){
   const geometry=a.layer==='findings'?new THREE.OctahedronGeometry(.43):a.layer==='proposal'?new THREE.CylinderGeometry(.45,.45,.3,6):new THREE.BoxGeometry(.55,.55,.55);
   const dot=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));dot.position.set(...a.anchor);g.add(dot);
   const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.72,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.set(a.anchor[0],a.anchor[1]-.2,a.anchor[2]);g.add(ring);
  } else if(a.form==='path'&&a.points){
   const curve=new THREE.CatmullRomCurve3(a.points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
   g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,60,.10,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7})));
  } else if(a.form==='area'&&a.points){
   const shape=new THREE.Shape(a.points.map(p=>new THREE.Vector2(p[0],-p[2])));
   const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometry.translate(0,a.points[0][1],0);
   const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide}));mesh.userData.fill=true;mesh.renderOrder=2;g.add(mesh);
   const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(a.points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity:.75}));line.renderOrder=3;g.add(line);
  } else if(a.form==='object'){
   for(const id of a.objectIds??[]){const object=model.objects.get(id);if(!object)continue;object.updateWorldMatrix(true,true);
    object.traverse(child=>{if(child instanceof THREE.Mesh){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry,35),new THREE.LineBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false}));edge.matrixAutoUpdate=false;edge.matrix.copy(child.matrixWorld);g.add(edge);const tint=new THREE.Mesh(child.geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));tint.matrixAutoUpdate=false;tint.matrix.copy(child.matrixWorld);tint.userData.fill=true;tint.renderOrder=4;g.add(tint);}});}
  }
  g.traverse(o=>{o.userData.annotation=a.id;if(o instanceof THREE.Mesh)pickables.push(o);});
 }
 let current:ExplorerState|undefined,hoverId:string|null=null;
 function paint(){if(!current)return;const shown=new Set(visibleAnnotations(current).map(a=>a.id)),highlight=new Set(highlightedRecordIds(current));
  for(const a of ANNOTATIONS){const g=groups.get(a.id)!;g.visible=shown.has(a.id)&&(a.layer!=='context'||highlight.has(a.recordId)||hoverId===a.recordId);
   const active=highlight.has(a.recordId)||hoverId===a.recordId;
   g.traverse(o=>{const mesh=o as THREE.Mesh;const m=mesh.material as THREE.MeshBasicMaterial|undefined;if(m){m.transparent=true;m.opacity=o.userData.fill?active?.28:.10:active?1:.62;}});
  }
  model.proposal.visible=visibleAnnotations(current).some(a=>a.futureOnly);
 }
 return {root,pickables,groups,update:(state:ExplorerState)=>{current=state;paint();},hover:(id:string|null)=>{hoverId=id;paint();}};
}
export function annotationForObject(object:THREE.Object3D,model:SiteModel,state:ExplorerState):SpatialAnnotation|undefined{
 const eligible=visibleAnnotations(state);
 for(let o:THREE.Object3D|null=object;o;o=o.parent){
  const annotated=eligible.find(a=>a.id===o!.userData.annotation);if(annotated)return annotated;
  const id=[...model.objects].find(([,value])=>value===o)?.[0];
  if(id)return eligible.find(a=>a.layer!=='context'&&a.objectIds?.includes(id))??ANNOTATIONS.find(a=>a.layer==='context'&&a.objectIds?.includes(id));
 }
}
