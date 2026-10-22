import * as THREE from 'three';

export const THEMES = {
 day:{background:'#f0f0ed',ground:'#e5e6e2',building:'#838a8d',context:'#f2f2ef',road:'#d4d6d4',contextRoad:'#d9dcda',park:'#7f9472',contextPark:'#d5ddd0',water:'#779c98',shore:'#e2e5dc',sun:'#fffaf0',tree:'#ffffff'},
 night:{background:'#101f26',ground:'#23333a',building:'#65757c',context:'#31444b',road:'#778387',contextRoad:'#354951',park:'#364e43',contextPark:'#2b403b',water:'#3a6269',shore:'#53686b',sun:'#dce8ef',tree:'#5c7771'},
};
export function makeMaterials() {
 const time={value:0},night={value:0};
 const coreColor={value:new THREE.Color(THEMES.day.building)},contextColor={value:new THREE.Color(THEMES.day.context)};
 const contextBuilding=new THREE.MeshStandardMaterial({color:'white',roughness:.92});
 const contextFocus={value:new THREE.Vector3(0,0,0)};
 contextBuilding.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uContextFocus:contextFocus,uCoreColor:coreColor,uContextColor:contextColor});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vContextPoint;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 contextWorld=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    contextWorld=instanceMatrix*contextWorld;
   #endif
   vContextPoint=(modelMatrix*contextWorld).xz;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vContextPoint; uniform vec3 uContextFocus; uniform vec3 uCoreColor; uniform vec3 uContextColor;').replace('#include <color_fragment>',`#include <color_fragment>
   float focus=(1.0-smoothstep(8.0,22.0,distance(vContextPoint,uContextFocus.xy)))*uContextFocus.z;
   diffuseColor.rgb=mix(uContextColor,uCoreColor,focus*0.65);
  `);
 };
 const ground=new THREE.MeshStandardMaterial({color:THEMES.day.ground,roughness:1,vertexColors:true});
 const park=new THREE.MeshStandardMaterial({color:THEMES.day.park,roughness:1});
 const contextPark=new THREE.MeshStandardMaterial({color:THEMES.day.contextPark,roughness:1});
 const road=new THREE.MeshStandardMaterial({color:THEMES.day.road,roughness:1});
 const contextRoad=new THREE.MeshStandardMaterial({color:THEMES.day.contextRoad,roughness:1});
 const tree=new THREE.MeshStandardMaterial({color:THEMES.day.tree,roughness:1});
 const shore=new THREE.MeshStandardMaterial({color:THEMES.day.shore,roughness:1});
 const building=new THREE.MeshStandardMaterial({color:'white',vertexColors:true,roughness:.84,metalness:.02});
 building.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uNight:night,uCoreColor:coreColor,uContextColor:contextColor});
  s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
    attribute float importance;
    varying vec3 vWorld; varying vec3 vFace; varying float vImportance;`)
   .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vWorld=(modelMatrix*vec4(transformed,1.0)).xyz; vFace=normal; vImportance=importance;`);
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
    varying vec3 vWorld; varying vec3 vFace; varying float vImportance;
    uniform float uNight; uniform vec3 uCoreColor; uniform vec3 uContextColor;`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float side=1.0-smoothstep(0.25,0.75,abs(vFace.y));
    vec3 base=mix(uContextColor,uCoreColor,vImportance);
    vec3 roof=mix(vec3(0.86),vec3(0.17,0.22,0.25),uNight);
    diffuseColor.rgb*=mix(base,mix(base,roof,0.60),1.0-side);
    float axis=abs(vFace.x)>abs(vFace.z)?vWorld.z:vWorld.x;
    vec2 cell=vec2(axis*24.0,vWorld.y*29.0);
    vec2 aa=max(fwidth(cell),vec2(0.001)); vec2 f=fract(cell);
    vec2 pane=smoothstep(vec2(0.22)-aa,vec2(0.22)+aa,f)*(1.0-smoothstep(vec2(0.75)-aa,vec2(0.75)+aa,f));
    float resolution=1.0-smoothstep(0.45,1.5,max(aa.x,aa.y));
    float windows=pane.x*pane.y*side*vImportance*resolution;
    float lit=step(0.57,fract(sin(dot(floor(cell),vec2(12.98,78.23)))*43758.54));
    diffuseColor.rgb*=1.0-windows*0.44;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    totalEmissiveRadiance+=vec3(0.92,0.66,0.34)*(windows*lit*0.90+side*vImportance*(1.0-resolution)*0.025)*uNight;
  `);
 };
 const water=new THREE.MeshStandardMaterial({color:THEMES.day.water,roughness:.31,metalness:.16});
 water.onBeforeCompile=s=>{
  s.uniforms.uTime=time;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWater;')
   .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWater=(modelMatrix*vec4(transformed,1.0)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWater; uniform float uTime;');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float ripple=sin(vWater.z*18.0+vWater.x*3.0-uTime*0.45)*sin(vWater.x*15.0+uTime*0.25);
    normal=normalize(normal+vec3(ripple*0.012,0.0,cos(vWater.z*9.0+uTime*0.25)*0.008));
  `);
 };
 const selection=new THREE.MeshBasicMaterial({color:'#c1b3e1',transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});
 const selectionEdge=new THREE.MeshBasicMaterial({color:'#9276bd',transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 const entries={ground,road,contextRoad,park,contextPark,water,shore,tree};
 const dayColors=Object.fromEntries(Object.keys(entries).map(k=>[k,new THREE.Color(THEMES.day[k as keyof typeof entries])])) as Record<keyof typeof entries,THREE.Color>;
 const nightColors=Object.fromEntries(Object.keys(entries).map(k=>[k,new THREE.Color(THEMES.night[k as keyof typeof entries])])) as Record<keyof typeof entries,THREE.Color>;
 const coreDay=new THREE.Color(THEMES.day.building),coreNight=new THREE.Color(THEMES.night.building);
 const contextDay=new THREE.Color(THEMES.day.context),contextNight=new THREE.Color(THEMES.night.context);
 function updateTheme(t:number){
  night.value=t;coreColor.value.copy(coreDay).lerp(coreNight,t);contextColor.value.copy(contextDay).lerp(contextNight,t);
  for(const key of Object.keys(entries) as (keyof typeof entries)[])entries[key].color.copy(dayColors[key]).lerp(nightColors[key],t);
 }
 return {ground,contextFocus,contextBuilding,tree,building,road,contextRoad,park,contextPark,water,shore,selection,selectionEdge,time,updateTheme};
}
export type Materials=ReturnType<typeof makeMaterials>;
