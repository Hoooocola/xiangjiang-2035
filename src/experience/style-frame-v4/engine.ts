import * as THREE from 'three';
import {loadExperienceAssets} from '../assets';
import {buildScene} from '../scene';
import {makeMaterials} from '../materials';
import {createEnvironment} from '../lighting';
import {createPostprocessing} from '../postprocessing';
import {terrainSampler} from '../terrain';
import {polygons,project} from '../geo';
import {createStudyField} from './field';
import {makeV4Materials} from './materials';
import {defaultColorPair,type ColorPair} from './colors';
import {createRoadFlows} from './flows';
import {FRAME,SHOTS,LOOK,GROUND_PALETTES,DEFAULT_BLEND_METERS,type Variant,type Theme,type Shot,type GroundPalette} from './profile';

export async function createV4Study(host:HTMLDivElement,signal:AbortSignal,progress:(text:string)=>void){
 const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(FRAME.pixelRatio);renderer.setSize(FRAME.width,FRAME.height);
 renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';renderer.domElement.setAttribute('aria-label','V4 局部材质验证，固定机位昼夜对照');host.appendChild(renderer.domElement);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFShadowMap;
 const camera=new THREE.PerspectiveCamera(FRAME.fov,FRAME.width/FRAME.height,.2,4500),environment=createEnvironment(scene,renderer);
 const composer=createPostprocessing(renderer,scene,camera),current=makeMaterials(),resources=new Set<THREE.Material>();
 let disposed=false,frame=0,playing=false,variant:Variant='v4',theme:Theme='night',shot:Shot='river',bodyOnly=false,time=12,shadowKey='',frameTimes:number[]=[];
 let colors=defaultColorPair();
 let fieldTexture:THREE.Texture|undefined;const shaderErrors:string[]=[];
 renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{shaderErrors.push([gl.getProgramInfoLog(program),gl.getShaderInfoLog(vertex),gl.getShaderInfoLog(fragment)].filter(Boolean).join('\n'));};
 const dispose=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);const geometries=new Set<THREE.BufferGeometry>();scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>resources.add(m));}});geometries.forEach(g=>g.dispose());resources.forEach(m=>m.dispose());fieldTexture?.dispose();environment.sun.shadow.dispose();composer.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 try{
  progress('读取同一份 GIS 数据');const {data,grid,context}=await loadExperienceAssets(signal);if(signal.aborted)throw new DOMException('Aborted','AbortError');
  progress(`构建 ${DEFAULT_BLEND_METERS} 米柔和外缘过渡`);const terrain=terrainSampler(grid),field=createStudyField(terrain);
  for(const [x,z,,,,h] of context.buildings)field.addBuilding(x,z,h/100);
  for(const f of data.features)if(f.properties.building||f.properties['building:part'])for(const rings of polygons(f)){
   const points=rings[0].map(project),x=points.reduce((sum,p)=>sum+p[0],0)/points.length,z=points.reduce((sum,p)=>sum+p[1],0)/points.length;
   const h=(Number.parseFloat(f.properties.height)||Number.parseFloat(f.properties['building:levels'])*3.2||12)/100;field.addBuilding(x,z,h);
  }
  field.setBlend(DEFAULT_BLEND_METERS);let blendMeters=DEFAULT_BLEND_METERS;const v4=makeV4Materials(field);fieldTexture=v4.fieldTexture;
  const map=new Map<THREE.Material,THREE.Material>();
  for(const key of Object.keys(current) as (keyof typeof current)[]){const a=current[key],b=v4[key];if(a instanceof THREE.Material&&b instanceof THREE.Material){map.set(a,b);resources.add(a);resources.add(b);}}
  const built=await buildScene(data,grid,context,current,n=>progress(`构建局部对照 ${Math.round(n)}%`),true);scene.add(built.root);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const swaps:{mesh:THREE.Mesh;current:THREE.Material;v4:THREE.Material}[]=[];
  built.root.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;const a=o.material;let b=map.get(a);
   if(!b&&a.onBeforeCompile===current.ground.onBeforeCompile){b=v4.ground.clone();b.transparent=false;b.onBeforeCompile=v4.ground.onBeforeCompile;b.customProgramCacheKey=v4.ground.customProgramCacheKey;resources.add(b);}
   if(b){swaps.push({mesh:o,current:a,v4:b});resources.add(a);}
  });
  const flows=createRoadFlows(data,terrain,field.sample);scene.add(flows.mesh);
  const signature={...built.stats,meshes:swaps.length,flowRoadFeatures:flows.roads,fieldResolutionMeters:50};
  function render(){
   if(disposed)return;const n=theme==='night'?1:0,pose=SHOTS[shot],[x,y,z]=pose.target,d=pose.distance;
   camera.position.set(x+d*Math.sin(pose.polar)*Math.sin(pose.azimuth),y+d*Math.cos(pose.polar),z+d*Math.sin(pose.polar)*Math.cos(pose.azimuth));camera.lookAt(x,y,z);camera.updateMatrixWorld();
   environment.sun.target.position.set(x,0,z);environment.sun.position.set(x-45,70,z+28);
   const extent=shot==='close'?25:70;Object.assign(environment.sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});environment.sun.shadow.camera.updateProjectionMatrix();
   current.updateTheme(n);current.time.value=time;current.viewDistance.value=d;v4.updateTheme(n);v4.setColors(colors[theme]);v4.time.value=time;v4.details.value=bodyOnly?0:1;
   swaps.forEach(entry=>{entry.mesh.material=entry[variant];});
   environment.update(n,d);environment.fill.color.set('#bfd7e4');
   if(variant==='v4'){
    const look={...LOOK[theme],...colors[theme]};environment.hemi.color.set(look.sky);environment.hemi.groundColor.set(look.bounce);environment.hemi.intensity=look.hemi;
    environment.sun.color.set(look.key);environment.sun.intensity=look.sun;environment.fill.color.set(look.fill);environment.fill.intensity=look.fillIntensity;
    renderer.toneMappingExposure=look.exposure;(scene.background as THREE.Color).set(look.background);
    const fog=scene.fog as THREE.Fog;fog.color.set(look.background);fog.near=d*1.1+20;fog.far=d*3+95;
   }
   flows.mesh.visible=variant==='v4'&&n===1&&!bodyOnly;flows.active.value=n;flows.time.value=time;
   const nextShadowKey=`${shot}-${variant}-${theme}`;renderer.shadowMap.needsUpdate=shadowKey!==nextShadowKey;shadowKey=nextShadowKey;
   composer.render(bodyOnly?0:n);
   if(shaderErrors.length)throw new Error(`V4 Shader 编译失败：${shaderErrors[0]}`);
  }
  function animate(last:number){frame=requestAnimationFrame(now=>{if(!playing||disposed)return;const elapsed=now-last;time+=Math.min(elapsed/1000,.1);frameTimes.push(elapsed);if(frameTimes.length>60)frameTimes.shift();if(frameTimes.length>=30)host.dataset.previewFrameMs=(frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length).toFixed(1);render();animate(now);});}
  const play=(value:boolean)=>{playing=value;cancelAnimationFrame(frame);if(value){frameTimes=[];animate(performance.now());}};
  render();
  return {signature,dispose,play,
   setColors:(next:ColorPair)=>{colors={day:{...next.day},night:{...next.night}};render();},
   set:(v:Variant,t:Theme,s:Shot,diagnostic=false,palette:GroundPalette='mineral',blend=DEFAULT_BLEND_METERS)=>{variant=v;theme=t;shot=s;bodyOnly=diagnostic&&v==='v4';v4.setGroundPalette(palette);if(blend!==blendMeters){field.setBlend(blend);v4.fieldTexture.needsUpdate=true;blendMeters=blend;}if(!playing)time=12;render();},
   exportPalettes:async()=>{
    play(false);const saved={variant,theme,shot,bodyOnly},result:{name:string;url:string}[]=[];variant='v4';shot='river';bodyOnly=false;time=12;
    for(const t of ['day','night'] as const)for(const p of ['mineral','sage','slate','sand'] as const){theme=t;const oldGround=colors[t].ground;colors[t].ground=GROUND_PALETTES[p][t];render();result.push({name:`palette-${p}-${t}.png`,url:renderer.domElement.toDataURL('image/png')});colors[t].ground=oldGround;await new Promise<void>(r=>setTimeout(r,0));}
    ({variant,theme,shot,bodyOnly}=saved);v4.setGroundPalette('mineral');render();return result;
   },
   diagnostics:()=>({shaderErrors:[...shaderErrors],programs:renderer.info.programs?.length,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries}),
   exportAll:async()=>{
    play(false);const saved={variant,theme,shot,bodyOnly},result:{name:string;url:string}[]=[];bodyOnly=false;time=12;
    for(const s of ['river','close'] as const)for(const t of ['day','night'] as const)for(const v of ['current','v4'] as const){
     shot=s;theme=t;variant=v;render();result.push({name:`${s}-${v}-${t}.png`,url:renderer.domElement.toDataURL('image/png')});await new Promise<void>(r=>setTimeout(r,0));
    }
    ({variant,theme,shot,bodyOnly}=saved);render();return result;
   },
  };
 }catch(error){dispose();throw error;}
}
