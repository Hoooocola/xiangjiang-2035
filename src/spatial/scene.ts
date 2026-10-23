import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {ScanAsset,Vec3} from './types';

export interface SiteModel {root:THREE.Group;objects:Map<string,THREE.Object3D>;occluders:THREE.Mesh[];proposal:THREE.Group;dispose:()=>void}
export function disposeTree(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>{materials.add(mat);Object.values(mat).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);});});});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
/** Asset boundary. Future scans must register stable object IDs and a verified transform. */
export async function loadSiteModel(asset:ScanAsset,signal:AbortSignal):Promise<SiteModel>{
 if(asset.assetType==='glb'){
  if(!asset.url)throw new Error('模型资源未配置');
  const response=await fetch(asset.url,{signal});if(!response.ok)throw new Error('三维模型加载失败');
  const model=await new GLTFLoader().parseAsync(await response.arrayBuffer(),asset.url.slice(0,asset.url.lastIndexOf('/')+1));
  if(signal.aborted){disposeTree(model.scene);throw new DOMException('Aborted','AbortError');}
  const objects=new Map<string,THREE.Object3D>(),occluders:THREE.Mesh[]=[];model.scene.traverse(o=>{if(o.name)objects.set(o.name,o);if(o instanceof THREE.Mesh)occluders.push(o);});
  const root=model.scene,proposal=new THREE.Group();root.add(proposal);applyTransform(root,asset);
  return {root,objects,occluders,proposal,dispose:()=>disposeTree(root)};
 }
 const root=new THREE.Group(),objects=new Map<string,THREE.Object3D>(),occluders:THREE.Mesh[]=[];
 const proposal=new THREE.Group();proposal.name='design-intervention';proposal.visible=false;root.add(proposal);
 const mat=(color:string,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
 const stone=mat('#a6ac9e'),edge=mat('#647775'),sand=mat('#929b86'),path=mat('#c2bcaa'),timber=mat('#8f7d65'),roof=mat('#4c6565'),wall=mat('#bdc3af'),metal=mat('#426569');
 function box(parent:THREE.Object3D,size:Vec3,pos:Vec3,material:THREE.Material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const outline=[[-12,-36],[34,-36],[34,36],[-12,36],[-12,4],[-6,4],[-6,-4],[-12,-4]];
 const bankShape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(x,-z)));
 const bankGeometry=new THREE.ExtrudeGeometry(bankShape,{depth:3.3,bevelEnabled:false});bankGeometry.rotateX(-Math.PI/2);bankGeometry.translate(0,-1,0);
 const ground=new THREE.Mesh(bankGeometry,[stone,sand]);ground.receiveShadow=true;root.add(ground);occluders.push(ground);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(48,82),new THREE.MeshStandardMaterial({color:'#184b59',roughness:.3,metalness:.4}));water.rotation.x=-Math.PI/2;water.position.set(-36,-1.1,0);water.receiveShadow=true;root.add(water);
 // Terraced shore, with a visibly distinct public connection at z=0.
 for(let i=0;i<4;i++)for(const z of [-20,20])box(root,[1.4,.65,32],[-12-i*1.1,1.45-i*.64,z],i%2?edge:stone);
 const road=box(root,[6,.1,72],[14,2.35,0],mat('#485b5e'));
 for(let z=-33;z<34;z+=5)box(root,[.13,.03,2],[14,2.42,z],path);
 box(root,[1.8,.12,72],[9.7,2.38,0],path);
 const plaza=new THREE.Group();objects.set('plaza',plaza);root.add(plaza);
 box(plaza,[15,.22,17],[.5,2.38,16],path);
 for(let z=9;z<=23;z+=2)box(plaza,[14,.02,.04],[.5,2.51,z],edge);
 const landing=new THREE.Group();objects.set('landing',landing);root.add(landing);
 for(let i=0;i<9;i++)box(landing,[1,.36,5],[-7.5-i*.85,2.1-i*.35,0],path);
 box(landing,[4,.35,8],[-16,-.82,0],timber);
 for(const z of [-2.7,2.7]){for(let i=0;i<9;i++)box(landing,[.08,1,.08],[-7.5-i*.85,2.8-i*.35,z],metal);const rail=box(landing,[8.8,.08,.08],[-10.9,2.4,z],metal);rail.rotation.z=.39;}
 box(root,[7,.15,3],[-3.6,2.35,0],path);
 const house=new THREE.Group();objects.set('house',house);root.add(house);
 const building=box(house,[10,6.5,13],[23,5.5,18],wall);occluders.push(building);
 box(house,[11,.55,14],[23,8.95,18],roof);
 for(const z of [14,18,22]){box(house,[.08,1.5,1.7],[17.94,6,z],metal);box(house,[.25,.12,1.9],[17.8,5.2,z],path);}
 box(house,[.12,2.6,1.8],[17.9,3.8,11.7],timber);
 const shelter=new THREE.Group();root.add(shelter);
 for(const x of [1,6])for(const z of [-21,-15])box(shelter,[.25,3.6,.25],[x,4.2,z],timber);
 for(let z=-22;z<-14;z+=.8)box(shelter,[7,.22,.3],[3.5,6.1,z],timber);
 for(const z of [12,21]){box(plaza,[4,.18,1.1],[3,3.05,z],timber);for(const x of [1.5,4.5])box(plaza,[.25,.5,1],[x,2.7,z],metal);}
 // Planted beds and deterministic trees, no claim of surveyed vegetation.
 const leafMaterial=mat('#536f59');
 for(const pos of [[-4,-20],[-6,-29],[24,-23],[27,-8],[29,31]] as [number,number][]){box(root,[7,.35,9],[pos[0],2.4,pos[1]],mat('#647760'));}
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.2,2.2,6),timber,64);
 const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.35,1),leafMaterial,64),dummy=new THREE.Object3D();
 let treeCount=0;
 for(let i=0;i<64;i++){const z=-33+(i%16)*4.3,x=i<32?(-7+(i%2)*5):(22+(i%3)*4);const scale=.75+((i*17)%11)/20;if((Math.abs(z)<8&&x<0)||(z>8&&z<24&&x<8))continue;
  dummy.position.set(x,3.6,z);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(treeCount,dummy.matrix);
  dummy.position.y=5.5;dummy.scale.set(scale,1.3*scale,scale);dummy.rotation.y=i;dummy.updateMatrix();crowns.setMatrixAt(treeCount,dummy.matrix);crowns.setColorAt(treeCount,new THREE.Color(['#536f59','#718871','#8c9b77'][i%3]));treeCount++;}
 trunks.count=treeCount;crowns.count=treeCount;trunks.castShadow=true;crowns.castShadow=true;root.add(trunks,crowns);
 const glow=new THREE.MeshBasicMaterial({color:'#f4dbad'});
 for(const z of [-27,-8,8,28]){box(root,[.12,4,.12],[8,4.3,z],metal);box(root,[.65,.15,.65],[8,6.35,z],glow);}
 const designMat=new THREE.MeshStandardMaterial({color:'#b69cdb',emissive:'#795891',emissiveIntensity:.25,roughness:.6});
 const link=new THREE.Group();objects.set('proposal-link',link);proposal.add(link);
 const deck=box(link,[10,.25,2.4],[-12,.85,7],designMat);deck.rotation.z=.29;
 for(const z of [5.8,8.2]){const r=box(link,[10,.08,.08],[-12,1.85,z],designMat);r.rotation.z=.29;}
 const node=new THREE.Group();objects.set('proposal-node',node);proposal.add(node);
 box(node,[.15,2.3,.15],[6,3.6,20],metal);box(node,[1.5,1.2,.16],[6,4.4,20],designMat);
 const baseOcclusion=[ground,road,building];occluders.push(...baseOcclusion.filter(x=>!occluders.includes(x)));
 landing.traverse(o=>{if(o instanceof THREE.Mesh)occluders.push(o);});
 applyTransform(root,asset);
 return {root,objects,occluders,proposal,dispose:()=>disposeTree(root)};
}
function applyTransform(root:THREE.Object3D,asset:ScanAsset){root.position.set(...asset.modelTransform.position);root.rotation.set(...asset.modelTransform.rotation);root.scale.set(...asset.modelTransform.scale);root.updateMatrixWorld(true);}
