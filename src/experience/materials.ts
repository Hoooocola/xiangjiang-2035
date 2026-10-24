import * as THREE from 'three';

export const THEMES = {
 day:{background:'#f1f4f6',ground:'#f5f7f8',building:'#647780',context:'#f3f6f7',road:'#717c7e',contextRoad:'#e4e9eb',park:'#637f59',contextPark:'#edf1ee',water:'#568a91',shore:'#becbc9',sun:'#ffffff',tree:'#ffffff',bridge:'#b5c0c1'},
 night:{background:'#07191e',ground:'#ffffff',building:'#a0afb5',context:'#294550',road:'#3d5961',contextRoad:'#1d363f',park:'#627c70',contextPark:'#263e40',water:'#315b6b',shore:'#31545b',sun:'#cbdde9',tree:'#b9cfc5',bridge:'#778e92'},
};
export function makeMaterials() {
 const time={value:0},night={value:0},focusActive={value:0},focusRegion={value:new THREE.Vector4(0,0,12,12)};
 const coreColor={value:new THREE.Color(THEMES.day.building)},contextColor={value:new THREE.Color(THEMES.day.context)};
 const building=new THREE.MeshStandardMaterial({color:'white',roughness:.72,metalness:.08});
 building.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uNight:night,uCoreColor:coreColor,uContextColor:contextColor,uFocusActive:focusActive,uFocusRegion:focusRegion});
  s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
   #ifdef USE_INSTANCING
    attribute float instanceImportance;
   #else
    attribute float importance;
   #endif
   varying vec3 vWorld; varying vec3 vFace; varying float vImportance;`)
   .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 buildingWorld=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
     buildingWorld=instanceMatrix*buildingWorld; vImportance=instanceImportance;
    #else
     vImportance=importance;
    #endif
    vWorld=(modelMatrix*buildingWorld).xyz; vFace=normal;
   `);
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vWorld; varying vec3 vFace; varying float vImportance;
   uniform float uNight; uniform float uFocusActive; uniform vec4 uFocusRegion;
   uniform vec3 uCoreColor; uniform vec3 uContextColor;`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float side=1.0-smoothstep(.25,.75,abs(vFace.y));
   float focus=1.0-smoothstep(.75,1.25,length((vWorld.xz-uFocusRegion.xy)/uFocusRegion.zw));
   float detail=clamp(vImportance,0.0,1.0);
   float block=fract(sin(dot(floor(vWorld.xz*.45),vec2(12.98,78.23)))*43758.54);
   vec3 base=mix(uContextColor,uCoreColor,detail);
   base*=1.0-detail*block*.13;
   vec3 roof=mix(vec3(.62,.67,.69),vec3(.36,.43,.46),uNight);
   diffuseColor.rgb=mix(base,mix(base,roof,detail*.7),1.0-side);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.50,.34,.72),focus*uFocusActive*.12);
   float axis=abs(vFace.x)>abs(vFace.z)?vWorld.z:vWorld.x;
   vec2 cell=vec2(axis*25.0,vWorld.y*30.0);
   vec2 aa=max(fwidth(cell),vec2(.001)); vec2 f=fract(cell);
   vec2 pane=smoothstep(vec2(.18)-aa,vec2(.18)+aa,f)*(1.0-smoothstep(vec2(.78)-aa,vec2(.78)+aa,f));
   float resolution=1.0-smoothstep(.5,1.6,max(aa.x,aa.y));
   float windows=pane.x*pane.y*side*detail*resolution;
   float lit=step(.34,fract(sin(dot(floor(cell),vec2(12.98,78.23)))*43758.54));
   float floors=1.0-smoothstep(.045,.09,abs(fract(vWorld.y*30.0)-.04));
   diffuseColor.rgb*=1.0-windows*.45;
   diffuseColor.rgb+=vec3(.09)*floors*side*detail*resolution*(1.0-uNight);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   outgoingLight=mix(mix(vec3(.76,.80,.83),vec3(.012,.025,.032),uNight),outgoingLight,smoothstep(0.0,.24,vGroundImportance));
   #include <opaque_fragment>
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float distantGlow=side*detail*(1.0-resolution)*(.11+block*.08);
   totalEmissiveRadiance+=mix(vec3(1.0,.78,.46),vec3(.78,.88,1.0),step(.72,block))*(windows*lit*2.6+distantGlow)*uNight;
   totalEmissiveRadiance+=vec3(.55,.28,.85)*focus*uFocusActive*detail*.12;
  `);
 };
 // Use one material implementation for both original footprints and new instances.
 const contextBuilding=building;
 const ground=new THREE.MeshStandardMaterial({color:THEMES.day.ground,roughness:1,vertexColors:true,transparent:true});
 ground.onBeforeCompile=s=>{
  s.uniforms.uNight=night;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float importance; attribute float assetEdgeOpacity; varying float vAssetEdgeOpacity; varying float vGroundImportance; varying vec3 vGroundPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGroundImportance=importance; vAssetEdgeOpacity=assetEdgeOpacity; vGroundPosition=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight; varying float vAssetEdgeOpacity; varying float vGroundImportance; varying vec3 vGroundPosition;').replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.a*=vAssetEdgeOpacity;
   float district=clamp(vGroundImportance,0.0,1.0);
   vec3 dayGround=mix(vec3(1.0),vec3(.40,.46,.47),district);
   vec3 litGround=mix(vec3(.022,.042,.052),vec3(.12,.18,.19),district);
   diffuseColor.rgb*=mix(dayGround,litGround,uNight);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   outgoingLight=mix(mix(vec3(.76,.80,.83),vec3(.012,.025,.032),uNight),outgoingLight,smoothstep(0.0,.24,vGroundImportance));
   #include <opaque_fragment>
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance+=vec3(.022,.038,.042)*district*uNight;
  `);
 };
 const park=new THREE.MeshStandardMaterial({color:THEMES.day.park,roughness:1});
 const contextPark=new THREE.MeshStandardMaterial({color:THEMES.day.contextPark,roughness:1});
 const road=new THREE.MeshStandardMaterial({color:THEMES.day.road,roughness:1});
 const contextRoad=new THREE.MeshStandardMaterial({color:THEMES.day.contextRoad,roughness:1});

 // A single material per surface, with the same geographic weights in both themes.
 function spatialSurface(material:THREE.MeshStandardMaterial,kind:'road'|'park'){
  const context=kind==='road'?'contextRoad':'contextPark';
  material.onBeforeCompile=s=>{
   Object.assign(s.uniforms,{uNight:night,uSurfaceDay:{value:new THREE.Color(THEMES.day[kind])},uSurfaceDayContext:{value:new THREE.Color(THEMES.day[context])},uSurfaceNight:{value:new THREE.Color(THEMES.night[kind])},uSurfaceNightContext:{value:new THREE.Color(THEMES.night[context])}});
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float importance; varying float vSurfaceImportance;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfaceImportance=importance;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight; uniform vec3 uSurfaceDay; uniform vec3 uSurfaceDayContext; uniform vec3 uSurfaceNight; uniform vec3 uSurfaceNightContext; varying float vSurfaceImportance;').replace('#include <color_fragment>',`#include <color_fragment>
    float weight=clamp(vSurfaceImportance,0.0,1.0);
    diffuseColor.rgb=mix(mix(uSurfaceDayContext,uSurfaceDay,weight),mix(uSurfaceNightContext,uSurfaceNight,weight),uNight);`);
  };
 }
 spatialSurface(road,'road');spatialSurface(park,'park');
 const tree=new THREE.MeshStandardMaterial({color:THEMES.day.tree,roughness:1});
 tree.onBeforeCompile=s=>{
  s.uniforms.uNight=night;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float instanceImportance; varying float vTreeImportance;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTreeImportance=instanceImportance;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight; varying float vTreeImportance;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(1.0,.18+.82*clamp(vTreeImportance,0.0,1.0),uNight);');
 };
 const shore=new THREE.MeshStandardMaterial({color:THEMES.day.shore,roughness:.9});
 const bridge=new THREE.MeshStandardMaterial({color:THEMES.day.bridge,roughness:.65});
 const bridgeLight=new THREE.MeshStandardMaterial({color:'#d9e2e2',emissive:'#ffdba1',emissiveIntensity:0,roughness:.6});
 const water=new THREE.MeshStandardMaterial({color:THEMES.day.water,roughness:.28,metalness:.24,emissive:'#173e4a',emissiveIntensity:0});
 water.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uTime:time,uNight:night});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWater;')
   .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWater=(modelMatrix*vec4(transformed,1.0)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWater; uniform float uTime; uniform float uNight;');
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float stream=sin(vWater.x*.16+sin(vWater.z*.11)*1.5)*.035+sin(vWater.z*.08)*.025;
   diffuseColor.rgb*=1.0+stream;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float ripple=sin(vWater.z*18.0+vWater.x*3.0-uTime*.45)*sin(vWater.x*15.0+uTime*.25);
   normal=normalize(normal+vec3(ripple*.018,0.0,cos(vWater.z*9.0+uTime*.25)*.013));
  `);
 };
 const selection=new THREE.MeshBasicMaterial({color:'#a48cd2',transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide});
 const selectionEdge=new THREE.MeshBasicMaterial({color:'#9977cc',transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide});
 const entries={ground,road,contextRoad,park,contextPark,water,shore,tree,bridge};
 const dayColors=Object.fromEntries(Object.keys(entries).map(k=>[k,new THREE.Color(THEMES.day[k as keyof typeof entries])])) as Record<keyof typeof entries,THREE.Color>;
 const nightColors=Object.fromEntries(Object.keys(entries).map(k=>[k,new THREE.Color(THEMES.night[k as keyof typeof entries])])) as Record<keyof typeof entries,THREE.Color>;
 const coreDay=new THREE.Color(THEMES.day.building),coreNight=new THREE.Color(THEMES.night.building);
 const contextDay=new THREE.Color(THEMES.day.context),contextNight=new THREE.Color(THEMES.night.context);
 function updateTheme(t:number){
  night.value=t;coreColor.value.copy(coreDay).lerp(coreNight,t);contextColor.value.copy(contextDay).lerp(contextNight,t);
  for(const key of Object.keys(entries) as (keyof typeof entries)[])entries[key].color.copy(dayColors[key]).lerp(nightColors[key],t);
  bridgeLight.emissiveIntensity=t*.65;water.emissiveIntensity=t*.28;
 }
 return {ground,focusRegion,focusActive,contextBuilding,tree,building,road,contextRoad,park,contextPark,water,shore,bridge,bridgeLight,selection,selectionEdge,time,updateTheme};
}
export type Materials=ReturnType<typeof makeMaterials>;
