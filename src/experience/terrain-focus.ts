import * as THREE from 'three';
import {project} from './geo';
import {ZHAOSHAN_REFERENCE} from '../places/zhaoshan';
/** A feathered relief patch with actual DEM isolines. Radius is visual, never a geographic boundary. */
export function createTerrainFocus(relief:(x:number,z:number)=>number){
 const root=new THREE.Group();root.name='zhaoshan-dem-visual-focus';root.visible=false;root.userData.geometryMeaning=ZHAOSHAN_REFERENCE.geometryMeaning;
 const [cx,cz]=project(ZHAOSHAN_REFERENCE.coordinate),radius=14,steps=64,positions:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let row=0;row<=steps;row++)for(let col=0;col<=steps;col++){const x=cx+(col/steps*2-1)*radius,z=cz+(row/steps*2-1)*radius,y=relief(x,z);positions.push(x,y+.009,z);const r=Math.hypot(x-cx,z-cz)/radius,alpha=(1-THREE.MathUtils.smoothstep(r,.55,1))*THREE.MathUtils.smoothstep(y,.08,.45);colors.push(1,1,1,alpha);}
 for(let row=0;row<steps;row++)for(let col=0;col<steps;col++){const a=row*(steps+1)+col,b=a+1,c=a+steps+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=new THREE.MeshBasicMaterial({color:'#b5cfbf',vertexColors:true,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});const surface=new THREE.Mesh(geometry,material);surface.renderOrder=3;root.add(surface);
 const lines:number[]=[],lineColors:number[]=[];
 for(const level of [.25,.5,.75,1,1.25])for(let i=0;i<indices.length;i+=3){const hits:THREE.Vector3[]=[];for(let j=0;j<3;j++){const a=indices[i+j]*3,b=indices[i+(j+1)%3]*3,ya=positions[a+1]-.009,yb=positions[b+1]-.009;if((ya<level)!==(yb<level)){const t=(level-ya)/(yb-ya);hits.push(new THREE.Vector3(THREE.MathUtils.lerp(positions[a],positions[b],t),level+.016,THREE.MathUtils.lerp(positions[a+2],positions[b+2],t)));}}if(hits.length===2&&hits.every(p=>Math.hypot(p.x-cx,p.z-cz)<radius*.92)){for(const p of hits){lines.push(...p.toArray());const fade=1-THREE.MathUtils.smoothstep(Math.hypot(p.x-cx,p.z-cz)/radius,.55,.95);lineColors.push(fade,fade,fade);}}}
 const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));lineGeometry.setAttribute('color',new THREE.Float32BufferAttribute(lineColors,3));const lineMaterial=new THREE.LineBasicMaterial({color:'#c9d9c0',vertexColors:true,transparent:true,opacity:.62,depthWrite:false});root.add(new THREE.LineSegments(lineGeometry,lineMaterial));
 const bounds=new THREE.Box3().setFromObject(surface);const points=[bounds.min,bounds.max];
 return {root,points,center:[cx,cz] as [number,number],setActive:(active:boolean)=>{root.visible=active;},theme:(night:number)=>{material.color.set('#557b64').lerp(new THREE.Color('#b5cfbf'),night);material.opacity=THREE.MathUtils.lerp(.25,.32,night);lineMaterial.color.set('#426755').lerp(new THREE.Color('#d2ddc5'),night);},dispose:()=>{geometry.dispose();material.dispose();lineGeometry.dispose();lineMaterial.dispose();}};
}
