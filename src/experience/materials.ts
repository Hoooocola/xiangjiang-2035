import * as THREE from 'three';

export const THEMES = {
 day:{background:'#e7e5dc',ground:'#d6d7cb',building:'#8f9b98',road:'#efeee7',park:'#819778',water:'#4f827c',shore:'#c7d0bc',sun:'#fff0d9'},
 night:{background:'#101f29',ground:'#293e46',building:'#728d92',road:'#637e85',park:'#36574d',water:'#37616b',shore:'#6d8075',sun:'#b6cfdf'},
};
export function makeMaterials() {
 const time={value:0}, night={value:0};
 const ground=new THREE.MeshStandardMaterial({color:THEMES.day.ground,roughness:0.98});
 const park=new THREE.MeshStandardMaterial({color:THEMES.day.park,roughness:1});
 const road=new THREE.MeshStandardMaterial({color:THEMES.day.road,roughness:0.95});
 const shore=new THREE.MeshStandardMaterial({color:THEMES.day.shore,roughness:0.9});
 const building=new THREE.MeshStandardMaterial({transparent:true,color:THEMES.day.building,vertexColors:true,roughness:0.72,metalness:0.06});
 const farBuilding=new THREE.MeshStandardMaterial({color:THEMES.day.building,roughness:1,transparent:true,opacity:0});
 // World-space facade detail: geometry stays honest, window pattern is illustrative.
 building.onBeforeCompile=(s)=>{
   s.uniforms.uNight=night;
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWorld; varying vec3 vFace;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWorld=(modelMatrix*vec4(transformed,1.0)).xyz; vFace=normal;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWorld; varying vec3 vFace; uniform float uNight;');
   s.fragmentShader=s.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
     float boundary=max(abs((vWorld.x-2.0)/39.0),abs((vWorld.z+12.0)/96.0));
     gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,smoothstep(0.64,1.08,boundary)*0.95);
   `);
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     float side=1.0-smoothstep(0.25,0.75,abs(vFace.y));
     float axis=abs(vFace.x)>abs(vFace.z)?vWorld.z:vWorld.x;
     vec2 cell=vec2(axis*22.0,vWorld.y*26.0);
     vec2 f=fract(cell);
     float windowMask=step(0.23,f.x)*step(f.x,0.74)*step(0.24,f.y)*step(f.y,0.72)*side;
     float lit=step(0.34,fract(sin(dot(floor(cell),vec2(12.98,78.23)))*43758.54));
     float detail=1.0-smoothstep(100.0,185.0,length(vViewPosition));
     diffuseColor.rgb*=1.0-windowMask*0.42*detail;
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.8,1.31,0.69),windowMask*lit*uNight*detail*0.85);
   `);
 };
 const water=new THREE.MeshStandardMaterial({color:THEMES.day.water,roughness:0.36,metalness:0.25});
 water.onBeforeCompile=(s)=>{
   s.uniforms.uTime=time;s.uniforms.uNight=night;
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWater;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWater=(modelMatrix*vec4(transformed,1.0)).xyz;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWater; uniform float uTime; uniform float uNight;');
   s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
     float ripple=sin(vWater.z*22.0+vWater.x*3.0-uTime*0.55)*sin(vWater.x*18.0+uTime*0.32);
     normal=normalize(normal+vec3(ripple*0.009,0.0,cos(vWater.z*11.0+uTime*0.3)*0.007));
   `);
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     float current=sin(vWater.x*3.4+sin(vWater.z*0.5-uTime*0.03))*0.018;
     float glint=pow(max(0.0,sin(vWater.z*22.0+vWater.x*2.0-uTime*0.38)),32.0);
     diffuseColor.rgb+=glint*0.009;
   `);
 };
 function updateTheme(t:number) {
   night.value=t;
   farBuilding.color.set(THEMES.day.building).lerp(new THREE.Color(THEMES.night.building),t);
   const entries={ground,building,road,park,water,shore};
   for(const [k,m] of Object.entries(entries)) {
     const key=k as keyof typeof THEMES.day;
     m.color.set(THEMES.day[key]).lerp(new THREE.Color(THEMES.night[key]),t);
   }
 }
 return {ground,building,farBuilding,road,park,water,shore,time,night,updateTheme};
}
export type Materials = ReturnType<typeof makeMaterials>;
