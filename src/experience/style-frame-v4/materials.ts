import * as THREE from 'three';
import {makeMaterials} from '../materials';
import {LOOK,GROUND_PALETTES,type GroundPalette} from './profile';
import type {createStudyField} from './field';
import {COLOR_FIELDS,defaultColorPair,type ColorKey,type StudyColors} from './colors';

/** A local, reversible material study. No point lights, reflection targets or extra post passes. */
export function makeV4Materials(field:ReturnType<typeof createStudyField>){
 const m=makeMaterials(),night={value:0},details={value:1};
 const texture=new THREE.DataTexture(field.pixels,field.cols,field.rows,THREE.RGBAFormat,THREE.FloatType);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 const bounds={value:new THREE.Vector4(field.bounds.x,field.bounds.z,field.bounds.w,field.bounds.h)};
 const groundDay={value:new THREE.Color(GROUND_PALETTES.mineral.day)},groundNight={value:new THREE.Color(GROUND_PALETTES.mineral.night)};
 const defaults=defaultColorPair(),edit=Object.fromEntries(COLOR_FIELDS.map(({key})=>[`uEdit_${key}`,{value:new THREE.Color(defaults.day[key])}])) as Record<string,{value:THREE.Color}>;
 const common={...edit,uGroundDay:groundDay,uGroundNight:groundNight,uStudyField:{value:texture},uStudyBounds:bounds,uStudyNight:night,uStudyTime:m.time,uStudyDetails:details,
  uContextDay:{value:new THREE.Color(LOOK.day.context)},uContextNight:{value:new THREE.Color(LOOK.night.context)}};
 const declarations=`uniform sampler2D uStudyField;uniform vec4 uStudyBounds;uniform float uStudyNight,uStudyTime,uStudyDetails;uniform vec3 uContextDay,uContextNight,uGroundDay,uGroundNight;
 ${COLOR_FIELDS.map(({key})=>`uniform vec3 uEdit_${key};`).join('')}
 varying vec3 vStudyWorld;
 vec3 studyField(vec2 p){vec2 uv=(p-uStudyBounds.xy)/uStudyBounds.zw;vec2 mask=step(vec2(0.),uv)*step(uv,vec2(1.));return texture2D(uStudyField,uv).rgb*mask.x*mask.y;}
 float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float studyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
 float softPane(float x,float aa,float a,float b){return smoothstep(a-aa,a+aa,x)*(1.-smoothstep(b-aa,b+aa,x));}`;
 type Shader=Parameters<THREE.Material['onBeforeCompile']>[0];
 function install(mat:THREE.MeshStandardMaterial,role:string,vertex:string,fragment:string,body:string,emission:string){
  mat.color.set('white');mat.emissive.set('black');mat.emissiveIntensity=1;mat.metalness=0;
  mat.onBeforeCompile=(s:Shader)=>{
   Object.assign(s.uniforms,common);
   s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>\nvarying vec3 vStudyWorld;${vertex}`)
    .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
     vec4 studyPosition=vec4(transformed,1.);
     #ifdef USE_INSTANCING
     studyPosition=instanceMatrix*studyPosition;
     #endif
     vStudyWorld=(modelMatrix*studyPosition).xyz;`);
   s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>\n${declarations}\n${fragment}`)
    .replace('#include <color_fragment>',`#include <color_fragment>\n${body}`)
    .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\n${emission}`);
  };mat.customProgramCacheKey=()=>`xiangjiang-v4-${role}`;
 }
 const c=(hex:string)=>`vec3(${new THREE.Color(hex).toArray().map(v=>v.toFixed(5)).join(',')})`;
 const palette=(key:ColorKey)=>`uEdit_${key}`;
 const context='mix(uContextDay,uContextNight,uStudyNight)';
 install(m.building,'facade','attribute vec4 studyBuilding;varying vec4 vBuilding;varying vec3 vStudyFace;',
  'varying vec4 vBuilding;varying vec3 vStudyFace;',`
  float weight=studyField(vBuilding.xy).x;
  float seed=hash21(vBuilding.xy),family=floor(seed*3.);
  vec3 face=normalize(vStudyFace);float side=1.-smoothstep(.3,.75,abs(face.y));
  float tall=smoothstep(.16,.42,vBuilding.z);
  vec3 wall=${palette('wall')};
  wall=mix(wall,${palette('coolWall')},step(.72,seed)*.6*tall);
  wall*=mix(.78,1.10,hash21(vBuilding.yx+17.));
  vec3 roof=${palette('roof')}*mix(.8,1.1,seed);
  float axis=abs(face.x)>abs(face.z)?vStudyWorld.z-vBuilding.y:vStudyWorld.x-vBuilding.x;
  vec2 cell=vec2(axis/mix(.045,.032,tall),(vStudyWorld.y-vBuilding.w)/.033);
  vec2 aa=max(fwidth(cell),vec2(.001)),f=fract(cell);
  float resolved=1.-smoothstep(.28,1.0,max(aa.x,aa.y));
  float bay=softPane(f.x,aa.x,.21,.76),floorPane=softPane(f.y,aa.y,.18,.78);
  float grid=bay*floorPane;
  float pattern=family<1.?grid:family<2.?mix(grid,bay*.86,tall):mix(grid,floorPane*.84,tall);
  float lower=1.-smoothstep(.008,.035,vStudyWorld.y-vBuilding.w);
  float pane=pattern*side*resolved*weight*(1.-lower);
  // Broad pilasters retain facade rhythm when individual windows become sub-pixel.
  float broad=softPane(fract(axis/.24),max(fwidth(axis/.24),.001),.12,.24)*tall*side*weight;
  vec3 body=mix(roof,wall,side)*(1.-broad*.16);
  diffuseColor.rgb=mix(${context},body,weight);
  diffuseColor.rgb*=1.-pane*mix(.46,.26,uStudyNight);
  vec2 occupancyCell=family<1.?floor(cell):family<2.?vec2(floor(cell.x),floor(cell.y/5.)):vec2(floor(cell.x/5.),floor(cell.y));
  float occupied=step(mix(.80,.58,tall),hash21(occupancyCell+vBuilding.xy*7.));
  vec3 windowTint=mix(${palette('windowWarm')},${palette('windowCool')},step(.7,seed));
  float orientation=.42+.58*max(0.,dot(face,normalize(vec3(-.45,.7,.28))));`,
  `totalEmissiveRadiance+=uContextNight*(1.-weight)*uStudyNight*.18;
   totalEmissiveRadiance+=body*weight*uStudyNight*(.25+.22*orientation);
   totalEmissiveRadiance+=${c('#e5c79c')}*lower*side*weight*uStudyNight*.18;
   totalEmissiveRadiance+=windowTint*pane*occupied*uStudyNight*uStudyDetails*1.45;
   totalEmissiveRadiance+=windowTint*(1.-resolved)*side*weight*uStudyNight*.018*tall;`);
 const buildingCompile=m.building.onBeforeCompile;
 m.building.onBeforeCompile=(s,r)=>{buildingCompile(s,r);s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vBuilding=studyBuilding;vec3 studyNormal=normal;
  #ifdef USE_INSTANCING
  mat3 studyMatrix=mat3(instanceMatrix);
  studyNormal/=vec3(dot(studyMatrix[0],studyMatrix[0]),dot(studyMatrix[1],studyMatrix[1]),dot(studyMatrix[2],studyMatrix[2]));studyNormal=studyMatrix*studyNormal;
  #endif
  vStudyFace=normalize(mat3(modelMatrix)*studyNormal);`);};
 m.building.roughness=.78;
 for(const kind of ['ground','road','park'] as const){
  const mat=m[kind],isGround=kind==='ground';
  install(mat,kind,isGround?'attribute float assetEdgeOpacity;varying float vStudyEdge;':'',isGround?'varying float vStudyEdge;':'',`
   vec3 field=studyField(vStudyWorld.xz);float weight=field.x;
   vec3 surface=${isGround?'mix(uGroundDay,uGroundNight,uStudyNight)':palette(kind)};
   ${isGround?`surface*=.82+.18*field.z;
   surface=mix(surface,${palette('park')},smoothstep(.20,.75,field.y));diffuseColor.a*=vStudyEdge;`:''}
   float grain=sin(vStudyWorld.x*.65+sin(vStudyWorld.z*.44))*sin(vStudyWorld.z*.51)*.035;
   surface*=1.+grain;
   diffuseColor.rgb=mix(${context}${kind==='road'?'*.75':''},surface,weight);`,
   `totalEmissiveRadiance+=uContextNight*(1.-weight)*uStudyNight*.18;
    totalEmissiveRadiance+=surface*weight*uStudyNight*${kind==='ground'?'(.20+.10*field.z)':kind==='park'?'.19':'.12'};`);
  if(isGround){const compile=mat.onBeforeCompile;mat.onBeforeCompile=(s,r)=>{compile(s,r);s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStudyEdge=assetEdgeOpacity;');};}
  mat.roughness=.94;
 }
 install(m.tree,'tree','','',`
  float weight=studyField(vStudyWorld.xz).x;
  vec3 leaves=${palette('tree')};
  leaves*=.85+.15*sin(vStudyWorld.y*11.);
  diffuseColor.rgb=mix(${context},leaves,weight);`,
  `totalEmissiveRadiance+=leaves*weight*uStudyNight*.14;`);
 install(m.water,'water','','',`
  float weight=studyField(vStudyWorld.xz).x;
  float wave=sin(vStudyWorld.z*.8+vStudyWorld.x*.12-uStudyTime*.12)*.5+.5;
  diffuseColor.rgb=${palette('water')}*(.93+.07*wave);`,
  `vec3 viewDirection=normalize(cameraPosition-vStudyWorld);
   float grazing=pow(1.-clamp(viewDirection.y,0.,1.),3.);
   vec2 wavePosition=vec2(vStudyWorld.x*.75,vStudyWorld.z*.29-uStudyTime*.025);
   float sheen=smoothstep(.50,.85,studyNoise(wavePosition))*studyNoise(wavePosition*2.3+13.);
   float direction=pow(max(0.,dot(normalize(viewDirection.xz),normalize(vec2(.45,.9)))),4.);
   totalEmissiveRadiance+=${c('#31595b')}*uStudyNight*.25;
   totalEmissiveRadiance+=${c('#d8b77b')}*uStudyNight*weight*grazing*sheen*(.018+.045*direction)*uStudyDetails;`);
 m.water.roughness=.45;
 // Conservative bridge emission shares the road palette without a floodlit ribbon.
 install(m.bridgeLight,'bridgeLight','','',`diffuseColor.rgb=${c('#b5b3a5')};`,
  `totalEmissiveRadiance+=${palette('bridgeLight')}*uStudyNight*uStudyDetails*1.05;`);
 install(m.shore,'shore','','',`diffuseColor.rgb=mix(${context},${palette('shore')},studyField(vStudyWorld.xz).x);`,'');
 install(m.bridge,'bridge','','',`diffuseColor.rgb=${palette('bridge')};`,`totalEmissiveRadiance+=${c('#b9ae94')}*uStudyNight*.10;`);
 m.updateTheme=(n:number)=>{night.value=n;};
 return {...m,details,fieldTexture:texture,setColors:(colors:StudyColors)=>{
  for(const {key} of COLOR_FIELDS)edit[`uEdit_${key}`].value.set(colors[key]);
  // Both endpoints use the active palette; no shader recompilation or geometry rebuild.
  groundDay.value.set(colors.ground);groundNight.value.set(colors.ground);
  common.uContextDay.value.set(colors.context);common.uContextNight.value.set(colors.context);
 },setGroundPalette:(key:GroundPalette)=>{groundDay.value.set(GROUND_PALETTES[key].day);groundNight.value.set(GROUND_PALETTES[key].night);}};
}
