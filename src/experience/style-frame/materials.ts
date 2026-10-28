import * as THREE from 'three';
import {makeMaterials,type Materials} from '../materials';
import {V3_LOOK} from './profile';

/** Independent role materials for the locked local experiment. No textures or new passes. */
export function makeStyleMaterials():Materials & {detailLights:{value:number}} {
 const m=makeMaterials(),night={value:1},detailLights={value:1};
 const colour=(hex:string)=>({value:new THREE.Color(hex)});
 const common={uV3Night:night,uV3DetailLights:detailLights};
 const bgDay=colour(V3_LOOK.day.context),bgNight=colour(V3_LOOK.night.context);
 type Shader=Parameters<THREE.Material['onBeforeCompile']>[0];
 function install(material:THREE.MeshStandardMaterial,role:string,vertex:string,fragment:string,body:string,emission=''){
  material.color.set('white');material.metalness=0;material.emissive.set('black');material.emissiveIntensity=1;
  material.onBeforeCompile=(s:Shader)=>{
   Object.assign(s.uniforms,common,{uV3ContextDay:bgDay,uV3ContextNight:bgNight});
   s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>\n${vertex}`);
   s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>\nuniform float uV3Night; uniform float uV3DetailLights; uniform vec3 uV3ContextDay; uniform vec3 uV3ContextNight;\n${fragment}`)
    .replace('#include <color_fragment>',`#include <color_fragment>\n${body}`)
    .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\n${emission}`);
  };
  material.customProgramCacheKey=()=>`xiangjiang-style-frame-v3-${role}`;
 }
 const wallDay=colour(V3_LOOK.day.wall),wallNight=colour(V3_LOOK.night.wall),roofDay=colour(V3_LOOK.day.roof),roofNight=colour(V3_LOOK.night.roof);
 const bodyColour=colour(V3_LOOK.emission.body),windowColour=colour(V3_LOOK.emission.windows);
 install(m.building,'building',`
  #ifdef USE_INSTANCING
  attribute float instanceImportance;
  #else
  attribute float importance;
  #endif
  varying vec3 vV3World; varying vec3 vV3Face; varying float vV3Weight;`,
  `varying vec3 vV3World; varying vec3 vV3Face; varying float vV3Weight;
   uniform vec3 uWallDay; uniform vec3 uWallNight; uniform vec3 uRoofDay; uniform vec3 uRoofNight; uniform vec3 uBodyColour; uniform vec3 uWindowColour;`,
  `float weight=clamp(vV3Weight,0.0,1.0);
   vec3 face=normalize(vV3Face);
   float side=1.0-smoothstep(.25,.75,abs(face.y));
   vec3 wall=mix(uWallDay,uWallNight,uV3Night),roof=mix(uRoofDay,uRoofNight,uV3Night);
   diffuseColor.rgb=mix(mix(uV3ContextDay,uV3ContextNight,uV3Night),mix(roof,wall,side),weight);
   float axis=abs(face.x)>abs(face.z)?vV3World.z:vV3World.x;
   vec2 cell=vec2(axis*25.0,vV3World.y*30.0),aa=max(fwidth(cell),vec2(.001)),f=fract(cell);
   vec2 pane=smoothstep(vec2(.22)-aa,vec2(.22)+aa,f)*(1.0-smoothstep(vec2(.72)-aa,vec2(.72)+aa,f));
   float resolved=1.0-smoothstep(.25,.8,max(aa.x,aa.y));
   float windows=pane.x*pane.y*side*weight*resolved;
   float occupied=step(${1-V3_LOOK.emission.windowOccupancy},fract(sin(dot(floor(cell),vec2(12.98,78.23)))*43758.54));
   diffuseColor.rgb*=1.0-windows*.12;`,
  `float facing=.28+.72*max(0.0,dot(face,normalize(vec3(-.45,.7,.28))));
   totalEmissiveRadiance+=uBodyColour*${V3_LOOK.emission.bodyStrength}*weight*uV3Night*facing*mix(.35,1.0,side);
   totalEmissiveRadiance+=uWindowColour*windows*occupied*${V3_LOOK.emission.windowStrength}*uV3Night*uV3DetailLights;`);
 const buildingCompile=m.building.onBeforeCompile;
 m.building.onBeforeCompile=(s,r)=>{
  buildingCompile(s,r);Object.assign(s.uniforms,{uWallDay:wallDay,uWallNight:wallNight,uRoofDay:roofDay,uRoofNight:roofNight,uBodyColour:bodyColour,uWindowColour:windowColour});
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 wp=vec4(transformed,1.0);vec3 fn=normal;
   #ifdef USE_INSTANCING
   wp=instanceMatrix*wp;vV3Weight=instanceImportance;
   mat3 v3InstanceNormal=mat3(instanceMatrix);fn/=vec3(dot(v3InstanceNormal[0],v3InstanceNormal[0]),dot(v3InstanceNormal[1],v3InstanceNormal[1]),dot(v3InstanceNormal[2],v3InstanceNormal[2]));fn=v3InstanceNormal*fn;
   #else
   vV3Weight=importance;
   #endif
   vV3World=(modelMatrix*wp).xyz;vV3Face=normalize(mat3(modelMatrix)*fn);`);
 };
 m.building.roughness=V3_LOOK.surface.wallRoughness;
 function surface(material:THREE.MeshStandardMaterial,kind:'ground'|'road'|'park'){
  const d=colour(V3_LOOK.day[kind]),n=colour(V3_LOOK.night[kind]),glow=colour(V3_LOOK.emission.ground);
  const edge=kind==='ground';
  install(material,kind,`attribute float importance;varying float vV3Weight;${edge?'attribute float assetEdgeOpacity;varying float vV3Edge;':''}`,
   `varying float vV3Weight;uniform vec3 uSurfaceDay;uniform vec3 uSurfaceNight;uniform vec3 uGroundGlow;${edge?'varying float vV3Edge;':''}`,
   `float weight=clamp(vV3Weight,0.0,1.0);
    ${edge?'diffuseColor.a*=vV3Edge;':''}
    diffuseColor.rgb*=mix(mix(uV3ContextDay,uV3ContextNight,uV3Night),mix(uSurfaceDay,uSurfaceNight,uV3Night),weight);`,
   `totalEmissiveRadiance+=uGroundGlow*${kind==='ground'?V3_LOOK.emission.groundStrength:kind==='park'?.025:.018}*clamp(vV3Weight,0.0,1.0)*uV3Night;`);
  const compile=material.onBeforeCompile;
  material.onBeforeCompile=(s,r)=>{compile(s,r);Object.assign(s.uniforms,{uSurfaceDay:d,uSurfaceNight:n,uGroundGlow:glow});
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvV3Weight=importance;${edge?'vV3Edge=assetEdgeOpacity;':''}`);
   // Retain part of the real shaded surface, including terrain, in the white-model context.
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
    vec3 contextFloor=mix(uV3ContextDay,uV3ContextNight,uV3Night)*mix(.72,.20,uV3Night);
    outgoingLight=mix(outgoingLight,contextFloor,(1.0-clamp(vV3Weight,0.0,1.0))*.55);
    #include <opaque_fragment>`);
  };
  material.roughness=kind==='road'?V3_LOOK.surface.roadRoughness:V3_LOOK.surface.groundRoughness;
 }
 surface(m.ground,'ground');surface(m.road,'road');surface(m.park,'park');
 install(m.tree,'tree','attribute float instanceImportance;varying float vV3Weight;','varying float vV3Weight;',
  'diffuseColor.rgb*=mix(vec3(1.0),vec3(.55,.66,.58),uV3Night)*mix(mix(.85,.16,uV3Night),1.0,clamp(vV3Weight,0.0,1.0));',
  'totalEmissiveRadiance+=vec3(.009,.016,.010)*vV3Weight*uV3Night;');
 const treeCompile=m.tree.onBeforeCompile;m.tree.onBeforeCompile=(s,r)=>{treeCompile(s,r);s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvV3Weight=instanceImportance;');};
 // Water has its own colour and roughness; it does not inherit the land's warm body light.
 install(m.water,'water','varying vec3 vV3Water;','varying vec3 vV3Water;',
  `float stream=sin(vV3Water.x*.16+sin(vV3Water.z*.11)*1.5)*.035+sin(vV3Water.z*.08)*.025;
   diffuseColor.rgb*=1.0+stream;`);
 const waterCompile=m.water.onBeforeCompile;m.water.onBeforeCompile=(s,r)=>{waterCompile(s,r);s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvV3Water=(modelMatrix*vec4(transformed,1.0)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float ripple=sin(vV3Water.z*18.0+vV3Water.x*3.0)*sin(vV3Water.x*15.0);
   normal=normalize(normal+vec3(ripple*.018,0.0,cos(vV3Water.z*9.0)*.013));`);
 };
 m.water.roughness=V3_LOOK.surface.waterRoughness;
 for(const [role,material] of [['shore',m.shore],['bridge',m.bridge],['bridgeLight',m.bridgeLight]] as const)install(material,role,'','','');
 const colours={water:m.water,shore:m.shore,bridge:m.bridge};
 const day=Object.fromEntries(Object.keys(colours).map(k=>[k,new THREE.Color(V3_LOOK.day[k as keyof typeof colours])]));
 const dark=Object.fromEntries(Object.keys(colours).map(k=>[k,new THREE.Color(V3_LOOK.night[k as keyof typeof colours])]));
 const waterGlow=new THREE.Color(V3_LOOK.emission.water);
 m.updateTheme=(t:number)=>{
  night.value=t;m.time.value=0;
  for(const key of Object.keys(colours) as (keyof typeof colours)[])colours[key].color.copy(day[key]).lerp(dark[key],t);
  m.water.emissive.copy(waterGlow);m.water.emissiveIntensity=t*V3_LOOK.emission.waterStrength;
  m.bridgeLight.color.set('#d9e2e2');m.bridgeLight.emissive.set('#ffdba1');m.bridgeLight.emissiveIntensity=t*V3_LOOK.emission.bridgeStrength*detailLights.value;
 };
 return {...m,detailLights};
}
