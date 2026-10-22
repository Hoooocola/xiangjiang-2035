import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { project, polygons, inRing, type SceneData, type Coordinate } from './geo';
import {terrainSampler,type TerrainGrid} from './terrain';
import type { Materials } from './materials';

function shapeFrom(rings:Coordinate[][]) {
 const shape=new THREE.Shape();
 rings.forEach((r,i)=>{const path=i===0?shape:new THREE.Path();r.forEach((coord,j)=>{const [x,z]=project(coord);if(j===0)path.moveTo(x,-z);else path.lineTo(x,-z);});path.closePath();if(i>0)shape.holes.push(path);});return shape;
}
function flat(rings:Coordinate[][],y:number){const g=new THREE.ShapeGeometry(shapeFrom(rings));g.rotateX(-Math.PI/2);g.translate(0,y,0);return g;}
function ribbon(points:[number,number][],width:number,height:(x:number,z:number)=>number) {
 const pos:number[]=[];
 for(let i=1;i<points.length;i++){
  const [ax,az]=points[i-1],[bx,bz]=points[i],d=Math.hypot(bx-ax,bz-az);if(d<.0001)continue;
  const dx=-(bz-az)/d*width/2,dz=(bx-ax)/d*width/2,steps=Math.ceil(d);
  for(let j=0;j<steps;j++){
   const a=[THREE.MathUtils.lerp(ax,bx,j/steps),THREE.MathUtils.lerp(az,bz,j/steps)];
   const b=[THREE.MathUtils.lerp(ax,bx,(j+1)/steps),THREE.MathUtils.lerp(az,bz,(j+1)/steps)];
   const ay=height(a[0],a[1]),by=height(b[0],b[1]);
   pos.push(a[0]+dx,ay,a[1]+dz,b[0]+dx,by,b[1]+dz,a[0]-dx,ay,a[1]-dz,b[0]+dx,by,b[1]+dz,b[0]-dx,by,b[1]-dz,a[0]-dx,ay,a[1]-dz);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}
function combine(gs:THREE.BufferGeometry[],material:THREE.Material,root:THREE.Object3D,shadow=false){
 if(!gs.length)return;const g=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());if(!g)return;
 const mesh=new THREE.Mesh(g,material);mesh.castShadow=shadow;mesh.receiveShadow=true;g.computeBoundingSphere();root.add(mesh);return mesh;
}
export interface ContextData {buildings:number[][];counts:{knownHeight:number}}
/** All city chunks retain their real footprint and height at every camera distance. */
export async function buildScene(data:SceneData,grid:TerrainGrid,contextData:ContextData,materials:Materials,onProgress:(value:number)=>void){
 const root=new THREE.Group(),city=new THREE.Group(),detail=new THREE.Group();root.add(city,detail);
 const terrain=terrainSampler(grid),height=terrain.height;
 const groundGeo=new THREE.PlaneGeometry(6000,6000);groundGeo.rotateX(-Math.PI/2);groundGeo.translate(0,-.08,0);groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(groundGeo.attributes.position.count*3).fill(1),3));
 const ground=new THREE.Mesh(groundGeo,materials.ground);ground.receiveShadow=true;root.add(ground);
 const cols=Math.floor((grid.width-1)/2),rows=Math.floor((grid.height-1)/2);
 const relief=new THREE.PlaneGeometry(grid.dx*(grid.width-1),grid.dz*(grid.height-1),cols,rows);relief.rotateX(-Math.PI/2);relief.translate(grid.x0+grid.dx*(grid.width-1)/2,0,grid.z0+grid.dz*(grid.height-1)/2);
 const rp=relief.attributes.position;for(let i=0;i<rp.count;i++)rp.setY(i,height(rp.getX(i),rp.getZ(i))-.025);relief.computeVertexNormals();
 const groundColors=new Float32Array(rp.count*3),groundTint=new THREE.Color(),forestCore=new THREE.Color('#a1b095'),forestContext=new THREE.Color('#e2e6dc'),white=new THREE.Color('white');
 for(let i=0;i<rp.count;i++){
  const x=rp.getX(i),z=rp.getZ(i),weight=terrain.forest(x,z);
  groundTint.copy(forestContext).lerp(forestCore,terrain.importance(x,z)).lerp(white,1-weight);
  groundColors.set([groundTint.r,groundTint.g,groundTint.b],i*3);
 }
 relief.setAttribute('color',new THREE.BufferAttribute(groundColors,3));
 const mountain=new THREE.Mesh(relief,materials.ground);mountain.receiveShadow=true;root.add(mountain);
 const waterGs:THREE.BufferGeometry[]=[],shoreGs:THREE.BufferGeometry[]=[],parks:THREE.BufferGeometry[][]=[[],[]],roads:THREE.BufferGeometry[][]=[[],[]],bridgeGs:THREE.BufferGeometry[]=[];
 const chunks=new Map<string,THREE.BufferGeometry[]>(),treePositions:[number,number,number,number][]=[];
 const selection=new THREE.Group();selection.visible=false;root.add(selection);
 const waterRings:[number,number][][][]=data.features.filter(f=>f.properties.water==='river'||f.properties.waterway==='riverbank').flatMap(f=>polygons(f).map(r=>r.map(r=>r.map(project))));
 const onWater=(x:number,z:number)=>waterRings.some(r=>inRing(x,z,r[0])&&!r.slice(1).some(h=>inRing(x,z,h)));
 const treeCells=new Set<string>(),bridgePiers:[number,number,number][]=[];
 function plant(rings:Coordinate[][],island=false){
  const projected=rings.map(r=>r.map(project)),pts=projected[0],xs=pts.map(v=>v[0]),zs=pts.map(v=>v[1]);
  const minx=Math.min(...xs),maxx=Math.max(...xs),minz=Math.min(...zs),maxz=Math.max(...zs);
  const focus=terrain.importance((minx+maxx)/2,(minz+maxz)/2),step=island?.32:focus>.2?.65:1.8;
  // A geographic sampling grid within source vegetation polygons, including holes.
  for(let x=Math.floor(minx/step)*step;x<=maxx;x+=step)for(let z=Math.floor(minz/step)*step;z<=maxz;z+=step){
   if(x<grid.x0||x>grid.x0+grid.dx*(grid.width-1)||z<grid.z0||z>grid.z0+grid.dz*(grid.height-1))continue;
   const tx=x+Math.sin(x*51+z*17)*step*.3,tz=z+Math.cos(z*31+x*13)*step*.3;
   if(!inRing(tx,tz,pts)||projected.slice(1).some(r=>inRing(tx,tz,r))||onWater(tx,tz))continue;
   const key=`${Math.round(tx*3)},${Math.round(tz*3)}`;if(treeCells.has(key))continue;treeCells.add(key);
   treePositions.push([tx,height(tx,tz)+.035,tz,terrain.importance(tx,tz)]);
  }
 }
 let count=0,heightKnown=0;
 for(let fi=0;fi<data.features.length;fi++){
  const f=data.features[fi],p=f.properties;
  if(fi%600===0){onProgress(35+fi/data.features.length*48);await new Promise<void>(r=>setTimeout(r,0));}
  if(p.water==='river'||p.waterway==='riverbank'){
   for(const rings of polygons(f)){
    waterGs.push(flat(rings,.015));
    for(let ri=0;ri<rings.length;ri++){
     shoreGs.push(ribbon(rings[ri].map(project),.065,()=>.035));
     if(ri>0){parks[0].push(flat([rings[ri]],.028));plant([rings[ri]],true);}
    }
   }continue;
  }
  if(p.place==='island'&&p.name?.includes('橘子洲')){
   for(const rings of polygons(f)){
    const g=flat(rings,.065);selection.add(new THREE.Mesh(g,materials.selection));
    selection.add(new THREE.Mesh(ribbon(rings[0].map(project),.10,()=>.075),materials.selectionEdge));
   }
  }
  if(p.building||p['building:part']){
   for(const rings of polygons(f)){
    const pts=rings[0].map(project),cx=pts.reduce((s,v)=>s+v[0],0)/pts.length,cz=pts.reduce((s,v)=>s+v[1],0)/pts.length;
    if(onWater(cx,cz))continue;
    const actual=Number.parseFloat(p.height)||Number.parseFloat(p['building:levels'])*3.2;
    const estimate=p.building==='apartments'?27:p.building==='commercial'?24:p.building==='industrial'?8:12;
    const h=Math.max(.03,Math.min(6,(actual||estimate)/100)),base=height(cx,cz)+.012;
    const minimum=Math.max(0,Number.parseFloat(p.min_height)||0)/100;
    const g=new THREE.ExtrudeGeometry(shapeFrom(rings),{depth:Math.max(.03,h-minimum),bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,base+minimum,0);
    const vertices=g.attributes.position.count,colors=new Float32Array(vertices*3).fill(1),importance=new Float32Array(vertices).fill(terrain.importance(cx,cz));
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setAttribute('importance',new THREE.BufferAttribute(importance,1));
    const key=`${Math.floor(cx/30)},${Math.floor(cz/30)}`;if(!chunks.has(key))chunks.set(key,[]);chunks.get(key)!.push(g);count++;if(actual)heightKnown++;
   }
  }else if(p.highway&&f.geometry.type==='LineString'){
   const pts=f.geometry.coordinates.map(project);if(pts.length<2)continue;
   const mid=pts[Math.floor(pts.length/2)],context=terrain.importance(...mid)<.2?1:0;
   const foot=['footway','path','cycleway'].includes(p.highway),width=foot?.025:/motorway|trunk|primary/.test(p.highway)?.18:/secondary|tertiary/.test(p.highway)?.11:.055;
   if(p.bridge&&p.bridge!=='no'){
    const y=Math.max(.25,height(...pts[0]),height(...pts[pts.length-1]))+.06;bridgeGs.push(ribbon(pts,width,()=>y));
    for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=.5;t<length;t+=1){const x=THREE.MathUtils.lerp(a[0],b[0],t/length),z=THREE.MathUtils.lerp(a[1],b[1],t/length);if(onWater(x,z))bridgePiers.push([x,z,y]);}}

   }else roads[context].push(ribbon(pts,width,(x,z)=>height(x,z)+.035));
  }else if(p.leisure==='park'||p.natural==='wood'||p.landuse==='forest'){
   for(const rings of polygons(f)){
    const center=project(rings[0][0]),context=terrain.importance(...center)<.2?1:0;
    const base=flat(rings,0),pg=new TessellateModifier(1.8,5).modify(base);base.dispose();
    const a=pg.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,height(a.getX(i),a.getZ(i))+.025);pg.computeVertexNormals();parks[context].push(pg);plant(rings);
   }
  }
 }
 combine(waterGs,materials.water,root);combine(shoreGs,materials.shore,root);
 for(let i=0;i<2;i++){combine(parks[i].map(g=>{if(!g.index)return g;const unindexed=g.toNonIndexed();g.dispose();return unindexed;}),i?materials.contextPark:materials.park,city);combine(roads[i],i?materials.contextRoad:materials.road,city);}
 combine(bridgeGs,materials.road,root,true);
 for(const gs of chunks.values())combine(gs,materials.building,city,true);
 const supports=new THREE.InstancedMesh(new THREE.BoxGeometry(.055,1,.07),materials.shore,bridgePiers.length),supportTransform=new THREE.Object3D();
 bridgePiers.forEach(([x,z,h],i)=>{supportTransform.position.set(x,h/2,z);supportTransform.scale.set(1,h,1);supportTransform.updateMatrix();supports.setMatrixAt(i,supportTransform.matrix);});supports.castShadow=true;supports.receiveShadow=true;supports.computeBoundingSphere();root.add(supports);
 const contextChunks=new Map<string,number[][]>();
 for(const item of contextData.buildings){
  const [x,z]=item;if(terrain.distance(x,z)<3&&onWater(x,z))continue;
  const key=`${Math.floor(x/40)},${Math.floor(z/40)}`;if(!contextChunks.has(key))contextChunks.set(key,[]);contextChunks.get(key)!.push(item);
 }
 const boxGeometry=new THREE.BoxGeometry(1,1,1),contextTransform=new THREE.Object3D();let contextCount=0;
 for(const items of contextChunks.values()){
  const mesh=new THREE.InstancedMesh(boxGeometry,materials.contextBuilding,items.length);
  items.forEach(([x,z,width,depth,angle,meters],i)=>{
   const h=Math.max(.03,Math.min(6,meters/100));contextTransform.position.set(x,height(x,z)+h/2+.01,z);contextTransform.scale.set(Math.max(.02,width),h,Math.max(.02,depth));contextTransform.rotation.set(0,-angle,0);contextTransform.updateMatrix();mesh.setMatrixAt(i,contextTransform.matrix);
  });mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();city.add(mesh);contextCount+=items.length;
 }
 // Additional trees follow the downloaded forest mask over the entire reach.
 for(let x=grid.x0;x<grid.x0+grid.dx*(grid.width-1);x+=1.05)for(let z=grid.z0;z<grid.z0+grid.dz*(grid.height-1);z+=1.15){
  const tx=x+Math.sin(x*11+z*17)*.35,tz=z+Math.cos(x*13-z*23)*.35;
  if(terrain.forest(tx,tz)<.7||terrain.distance(tx,tz)>75||terrain.distance(tx,tz)<2.5&&onWater(tx,tz))continue;
  treePositions.push([tx,height(tx,tz)+.025,tz,terrain.importance(tx,tz)]);
 }
 const treeChunks=new Map<string,typeof treePositions>();
 for(const p of treePositions){const key=`${Math.floor(p[0]/40)},${Math.floor(p[2]/40)}`;if(!treeChunks.has(key))treeChunks.set(key,[]);treeChunks.get(key)!.push(p);}
 const treeGeo=new THREE.IcosahedronGeometry(1,0),transform=new THREE.Object3D();
 const treeCore=new THREE.Color('#778d69'),treeContext=new THREE.Color('#d0d8cb'),treeColor=new THREE.Color();
 for(const positions of treeChunks.values()){
  const trees=new THREE.InstancedMesh(treeGeo,materials.tree,positions.length);
  positions.forEach(([x,y,z,importance],i)=>{const h=.08+(Math.sin(x*31+z*19)*.5+.5)*.07;transform.position.set(x,y+h*.6,z);transform.scale.set(h*.7,h,h*.7);transform.rotation.y=i;transform.updateMatrix();trees.setMatrixAt(i,transform.matrix);treeColor.copy(treeContext).lerp(treeCore,importance);trees.setColorAt(i,treeColor);});
  trees.castShadow=true;trees.receiveShadow=true;trees.computeBoundingSphere();detail.add(trees);
 }

 return {root,city,detail,terrain,select:(id?:string)=>{selection.visible=id==='juzizhou';},stats:{buildings:count+contextCount,knownHeight:heightKnown+contextData.counts.knownHeight,trees:treePositions.length}};
}
