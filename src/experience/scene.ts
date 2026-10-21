import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { project, polygons, inRing, type SceneData, type Coordinate } from './geo';
import type { Materials } from './materials';

function shapeFrom(rings:Coordinate[][]) {
 const shape=new THREE.Shape();
 rings.forEach((r,i)=>{const path=i===0?shape:new THREE.Path();r.forEach((coord,j)=>{const [x,z]=project(coord);if(j===0)path.moveTo(x,-z);else path.lineTo(x,-z);});path.closePath();if(i>0)shape.holes.push(path);});
 return shape;
}
function flat(rings:Coordinate[][],y:number){const g=new THREE.ShapeGeometry(shapeFrom(rings));g.rotateX(-Math.PI/2);g.translate(0,y,0);return g;}
function ribbon(points:[number,number][],width:number,y:number) {
 const pos:number[]=[];
 for(let i=1;i<points.length;i++){
  const [ax,az]=points[i-1],[bx,bz]=points[i];const d=Math.hypot(bx-ax,bz-az);if(d<0.0001)continue;
  const dx=-(bz-az)/d*width/2,dz=(bx-ax)/d*width/2;
  pos.push(ax+dx,y,az+dz,bx+dx,y,bz+dz,ax-dx,y,az-dz,bx+dx,y,bz+dz,bx-dx,y,bz-dz,ax-dx,y,az-dz);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}
function combine(gs:THREE.BufferGeometry[],material:THREE.Material,root:THREE.Object3D,shadow=false){
 if(!gs.length)return;
 const g=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());if(!g)return;
 const mesh=new THREE.Mesh(g,material);mesh.castShadow=shadow;mesh.receiveShadow=true;root.add(mesh);return mesh;
}
// Artistic relief only: no DEM claim. Peaks located west of the real river.
export function terrainHeight(x:number,z:number){
 const hill=(cx:number,cz:number,sx:number,sz:number,h:number)=>h*Math.exp(-(((x-cx)/sx)**2)-((z-cz)/sz)**2);
 return hill(-36,3,12,16,3.1)+hill(-46,20,17,25,2.2)+hill(-63,-23,16,22,1.3);
}
export async function buildScene(data:SceneData,materials:Materials,onProgress:(value:number)=>void){
 const root=new THREE.Group(), city=new THREE.Group(), detail=new THREE.Group(), overview=new THREE.Group();root.add(city,detail,overview);
 const groundGeo=new THREE.PlaneGeometry(6000,6000);groundGeo.rotateX(-Math.PI/2);groundGeo.translate(0,-0.08,0);
 const ground=new THREE.Mesh(groundGeo,materials.ground);ground.receiveShadow=true;root.add(ground);
 const terrain=new THREE.PlaneGeometry(135,175,150,170);terrain.rotateX(-Math.PI/2);terrain.translate(-61,0,4);
 const tp=terrain.attributes.position;for(let i=0;i<tp.count;i++)tp.setY(i,terrainHeight(tp.getX(i),tp.getZ(i))-.08);terrain.computeVertexNormals();
 const mountain=new THREE.Mesh(terrain,materials.ground);mountain.receiveShadow=true;root.add(mountain);
 const waterGs:THREE.BufferGeometry[]=[],landGs:THREE.BufferGeometry[]=[],shoreGs:THREE.BufferGeometry[]=[],parkGs:THREE.BufferGeometry[]=[],roads:THREE.BufferGeometry[]=[],bridgeGs:THREE.BufferGeometry[]=[],buildings:THREE.BufferGeometry[]=[],farBuildings:THREE.BufferGeometry[]=[];
 const treePositions:[number,number,number][]=[];const bridgePiers:[number,number][]=[];
 const waterRings:[number,number][][][]=[];
 for(const f of data.features){if(f.properties.water==='river'||f.properties.waterway==='riverbank')for(const rings of polygons(f))waterRings.push(rings.map(r=>r.map(project)));}
 const onWater=(x:number,z:number)=>waterRings.some(rings=>inRing(x,z,rings[0])&&!rings.slice(1).some(r=>inRing(x,z,r)));
 // The artistic mountain skirt must never intersect the surveyed water polygon.
 for(let i=0;i<tp.count;i++)if(onWater(tp.getX(i),tp.getZ(i)))tp.setY(i,-0.08);
 terrain.computeVertexNormals();
 let count=0, heightKnown=0;
 for(let fi=0;fi<data.features.length;fi++){
  const f=data.features[fi],p=f.properties;
  if(fi%450===0){onProgress(35+fi/data.features.length*50);await new Promise<void>(r=>setTimeout(r,0));}
  if(p.water==='river'||p.waterway==='riverbank'){
   for(const rings of polygons(f)){
    waterGs.push(flat(rings,0.015));
    for(let ri=0;ri<rings.length;ri++){
     const r=rings[ri];shoreGs.push(ribbon(r.map(project),0.09,0.03));
     if(ri>0){landGs.push(flat([r],0.045));
      const pts=r.map(project),xs=pts.map(v=>v[0]),zs=pts.map(v=>v[1]);
      const minx=Math.min(...xs),maxx=Math.max(...xs),minz=Math.min(...zs),maxz=Math.max(...zs);
      if(minz<45&&maxz>-65) for(let x=minx;x<maxx;x+=0.31)for(let z=minz;z<maxz;z+=0.37){if(treePositions.length>14000)break;const jitter=Math.sin(x*19+z*37)*0.14,jz=Math.cos(x*37-z*13)*0.17;if(Math.sin(x*31+z*17)>.1&&inRing(x+jitter,z+jz,pts))treePositions.push([x+jitter,0.09,z+jz]);}
     }
    }
   }
   continue;
  }
  if(p.building||p['building:part']){
   for(const rings of polygons(f)){
    const pts=rings[0].map(project);const cx=pts.reduce((s,v)=>s+v[0],0)/pts.length,cz=pts.reduce((s,v)=>s+v[1],0)/pts.length;
    if(onWater(cx,cz)||Math.abs(cx)>75||cz>78||cz<-104)continue;
    const actual=Number.parseFloat(p.height)||Number.parseFloat(p['building:levels'])*3.2;
    // Missing building height is a deterministic estimate based on footprint area and use.
    let area=0;for(let i=1;i<pts.length;i++)area+=pts[i-1][0]*pts[i][1]-pts[i][0]*pts[i-1][1];area=Math.abs(area)/2;
    const seed=Number(f.id.split('/')[1])%11;
    const estimated=p.building==='apartments'?36+seed*3:p.building==='commercial'?38+seed*5:12+seed*2.1;
    const height=Math.min(4.8,Math.max(0.045,(actual||estimated)/100*1.65));
    const g=new THREE.ExtrudeGeometry(shapeFrom(rings),{depth:height,bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,0.005,0);
    const colors=new Float32Array(g.attributes.position.count*3);
    const edge=1-THREE.MathUtils.smoothstep(Math.max(Math.abs(cx)/42,Math.abs(cz+5)/55),0.5,1.0);
    const shade=THREE.MathUtils.lerp(1.10,0.72+seed*0.026,edge);const c=new THREE.Color().setRGB(shade,shade,shade*0.98);
    for(let i=0;i<g.attributes.position.count;i++){colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));
    buildings.push(g);count++;if(actual)heightKnown++;
    // Overview silhouette uses a lower polygon count but the same footprints/positions.
    if(area>0.035){const fg=new THREE.ExtrudeGeometry(shapeFrom(rings),{depth:height*0.65,bevelEnabled:false,curveSegments:1});fg.rotateX(-Math.PI/2);farBuildings.push(fg);}
   }
  }else if(p.highway&&f.geometry.type==='LineString'){
    const pts=f.geometry.coordinates.map(project);if(!pts.some(([x,z])=>Math.abs(x)<90&&Math.abs(z)<90))continue;
    const isBridge=p.bridge&&p.bridge!=='no';
    const isFootway=['footway','path','cycleway'].includes(p.highway);
    const width= isFootway?0.025:/motorway|trunk|primary/.test(p.highway)?0.22:/secondary|tertiary/.test(p.highway)?0.14:0.065;
    if(isBridge){bridgeGs.push(ribbon(pts,width,0.35));for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let k=0;k<d;k+=0.8)bridgePiers.push([a[0]+(b[0]-a[0])*k/d,a[1]+(b[1]-a[1])*k/d]);}}
    else roads.push(ribbon(pts,width,isFootway?0.09:0.006));
  }else if(p.leisure==='park'||p.natural==='wood'||p.landuse==='forest'){
   for(const rings of polygons(f)){
    const pts=rings[0].map(project);if(!pts.some(([x,z])=>Math.abs(x)<65&&Math.abs(z)<70))continue;
    const pg=flat(rings,0.008);const a=pg.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,Math.max(0.008,terrainHeight(a.getX(i),a.getZ(i))));pg.computeVertexNormals();parkGs.push(pg);
    const xs=pts.map(v=>v[0]),zs=pts.map(v=>v[1]);
    for(let x=Math.min(...xs);x<Math.max(...xs);x+=0.65)for(let z=Math.min(...zs);z<Math.max(...zs);z+=0.7){if(treePositions.length>16000)break;const tx=x+Math.sin(x*51+z*17)*.28,tz=z+Math.cos(z*31+x*13)*.3;if(inRing(tx,tz,pts)&&!onWater(tx,tz)&&Math.sin(tx*19+tz*37)>-.2)treePositions.push([tx,Math.max(.08,terrainHeight(tx,tz)),tz]);}
   }
  }
 }
 combine(waterGs,materials.water,root);combine(landGs,materials.park,root);combine(shoreGs,materials.shore,root);
 combine(parkGs,materials.park,city);combine(roads,materials.road,city);combine(bridgeGs,materials.road,root,true);
 combine(buildings,materials.building,city,true);combine(farBuildings,materials.farBuilding,overview);
 const treeGeo=new THREE.IcosahedronGeometry(1,0);
 const trees=new THREE.InstancedMesh(treeGeo,materials.park,treePositions.length);const transform=new THREE.Object3D();
 treePositions.forEach(([x,y,z],i)=>{const h=0.10+(Math.sin(i*31)*0.5+0.5)*0.12;transform.position.set(x,y+h*0.6,z);transform.scale.set(h*.65,h,h*.65);transform.rotation.y=i;transform.updateMatrix();trees.setMatrixAt(i,transform.matrix);});
 trees.castShadow=true;trees.receiveShadow=true;trees.computeBoundingSphere();detail.add(trees);
 const piers=new THREE.InstancedMesh(new THREE.BoxGeometry(0.06,0.35,0.09),materials.shore,bridgePiers.length);
 bridgePiers.forEach(([x,z],i)=>{transform.position.set(x,0.15,z);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();piers.setMatrixAt(i,transform.matrix);});piers.castShadow=true;piers.computeBoundingSphere();root.add(piers);
 overview.visible=false;
 return {root,city,detail,overview,stats:{buildings:count,knownHeight:heightKnown,trees:treePositions.length}};
}
