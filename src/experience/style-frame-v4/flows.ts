import * as THREE from 'three';
import {project,type SceneData} from '../geo';
/** Arc-length flow follows actual source roads. Decorative traffic, never live traffic data. */
export function createRoadFlows(data:SceneData,terrain:{height:(x:number,z:number)=>number},weight:(x:number,z:number)=>number){
 const positions:number[]=[],uvs:number[]=[],weights:number[]=[];let roads=0;
 for(const f of data.features){const p=f.properties;
  if(f.geometry.type!=='LineString'||! /^(primary|trunk|secondary)$/.test(p.highway??'')||p.bridge&&p.bridge!=='no'||p.tunnel&&p.tunnel!=='no')continue;
  const points=f.geometry.coordinates.map(project);let arc=0,used=false;
  for(let i=1;i<points.length;i++){
   const [ax,az]=points[i-1],[bx,bz]=points[i],len=Math.hypot(bx-ax,bz-az);if(len<.001)continue;
   const width=p.highway==='secondary'?.011:.016,dx=-(bz-az)/len*width/2,dz=(bx-ax)/len*width/2,steps=Math.max(1,Math.ceil(len/.5));
   for(let j=0;j<steps;j++){
    const t=j/steps,u=(j+1)/steps,x=ax+(bx-ax)*t,z=az+(bz-az)*t,xx=ax+(bx-ax)*u,zz=az+(bz-az)*u;
    const wa=weight(x,z),wb=weight(xx,zz);if(wa<.7&&wb<.7)continue;
    // Only the approved local study window carries moving lines.
    if(x< -80||x>65||z< -60||z>60)continue;
    const y=terrain.height(x,z)+.042,yy=terrain.height(xx,zz)+.042;
    positions.push(x+dx,y,z+dz,xx+dx,yy,zz+dz,x-dx,y,z-dz,xx+dx,yy,zz+dz,xx-dx,yy,zz-dz,x-dx,y,z-dz);
    const a=arc+len*t,b=arc+len*u;uvs.push(a,0,b,0,a,1,b,0,b,1,a,1);weights.push(wa,wb,wa,wb,wb,wa);used=true;
   }arc+=len;
  }if(used)roads++;
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('importance',new THREE.Float32BufferAttribute(weights,1));geometry.computeVertexNormals();
 const time={value:0},active={value:0},material=new THREE.MeshStandardMaterial({color:'#8e7754',roughness:1,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 material.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uFlowTime:time,uFlowActive:active});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float importance;varying vec3 vFlow;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFlow=vec3(uv,importance);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFlow;uniform float uFlowTime,uFlowActive;')
   .replace('#include <color_fragment>',`#include <color_fragment>
    float phase=fract(vFlow.x*.32-uFlowTime*.055);float pulse=smoothstep(.05,.20,phase)*(1.-smoothstep(.30,.53,phase));
    float edge=smoothstep(0.,.25,vFlow.y)*(1.-smoothstep(.75,1.,vFlow.y));
    diffuseColor.a=uFlowActive*vFlow.z*edge*(.08+.65*pulse);`)
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.95,.69,.37)*.8;');
 };material.customProgramCacheKey=()=> 'v4-arc-length-road-flow';
 const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=2;
 return {mesh,time,active,roads,dispose:()=>{geometry.dispose();material.dispose();}};
}
