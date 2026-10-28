import * as THREE from 'three';
import {loadExperienceAssets} from '../assets';
import {buildScene} from '../scene';
import {makeMaterials} from '../materials';
import {createEnvironment} from '../lighting';
import {createPostprocessing} from '../postprocessing';
import {makeStyleMaterials} from './materials';
import {STYLE_FRAME,V3_LOOK,type FrameTheme,type FrameVariant} from './profile';

export async function createStyleFrame(host:HTMLDivElement,signal:AbortSignal,progress:(text:string)=>void){
 const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 const {width,height,pixelRatio,fov,pose}=STYLE_FRAME;
 renderer.setPixelRatio(pixelRatio);renderer.setSize(width,height);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.domElement.setAttribute('aria-label','橘子洲及邻近两岸固定镜头；四个状态复用同一几何。');host.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(fov,width/height,Math.max(.3,pose.distance*.01),4500);
 const [x,y,z]=pose.target,d=pose.distance;
 camera.position.set(x+d*Math.sin(pose.polar)*Math.sin(pose.azimuth),y+d*Math.cos(pose.polar),z+d*Math.sin(pose.polar)*Math.cos(pose.azimuth));camera.lookAt(x,y,z);camera.updateMatrixWorld();
 const current=makeMaterials(),v3=makeStyleMaterials(),environment=createEnvironment(scene,renderer);
 environment.sun.target.position.set(x,0,z);environment.sun.position.set(x-45,70,z+28);
 const composer=createPostprocessing(renderer,scene,camera);
 const swaps:{mesh:THREE.Mesh;current:THREE.Material;v3:THREE.Material}[]=[];
 const materialMap=new Map<THREE.Material,THREE.Material>();
 for(const key of Object.keys(current) as (keyof typeof current)[]){const a=current[key],b=v3[key];if(a instanceof THREE.Material&&b instanceof THREE.Material)materialMap.set(a,b);}
 let disposed=false,variant:FrameVariant='current',theme:FrameTheme='day',diagnostic=false;
 const resources=new Set<THREE.Material>([...materialMap.keys(),...materialMap.values()]);
 const dispose=()=>{if(disposed)return;disposed=true;const geometry=new Set<THREE.BufferGeometry>();scene.traverse(o=>{if(o instanceof THREE.Mesh){geometry.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>resources.add(m));}});geometry.forEach(g=>g.dispose());resources.forEach(m=>m.dispose());environment.sun.shadow.dispose();composer.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 try{
  progress('读取同一份 GIS 数据');const {data,grid,context}=await loadExperienceAssets(signal);if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const built=await buildScene(data,grid,context,current,n=>progress(`构建固定场景 ${Math.round(n)}%`));scene.add(built.root);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  built.root.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;const a=o.material;let b=materialMap.get(a);
   if(!b&&a.onBeforeCompile===current.ground.onBeforeCompile){const clone=v3.ground.clone();clone.transparent=false;clone.onBeforeCompile=v3.ground.onBeforeCompile;clone.customProgramCacheKey=v3.ground.customProgramCacheKey;b=clone;resources.add(clone);}
   if(b){swaps.push({mesh:o,current:a,v3:b});resources.add(a);}
  });
  const signature={buildings:built.stats.buildings,knownHeight:built.stats.knownHeight,trees:built.stats.trees,meshes:swaps.length};
  function render(){
   if(disposed)return;const n=theme==='night'?1:0;
   current.updateTheme(n);current.time.value=STYLE_FRAME.time;v3.detailLights.value=diagnostic?0:1;v3.updateTheme(n);
   for(const entry of swaps)entry.mesh.material=entry[variant];
   environment.update(n,pose.distance);environment.fill.color.set('#bfd7e4');
   if(variant==='v3'){
    const look=V3_LOOK[theme];environment.hemi.color.set(look.sky);environment.hemi.groundColor.set(look.bounce);environment.hemi.intensity=look.hemi;
    environment.sun.color.set(look.key);environment.sun.intensity=look.sun;environment.fill.color.set(look.fill);environment.fill.intensity=look.fillIntensity;
    renderer.toneMappingExposure=look.exposure;(scene.background as THREE.Color).set(look.background);(scene.fog as THREE.Fog).color.set(look.background);
   }
   renderer.shadowMap.needsUpdate=true;composer.render(variant==='v3'&&diagnostic?0:n);
  }
  render();
  return {set:(next:FrameVariant,nextTheme:FrameTheme,bodyOnly=false)=>{variant=next;theme=nextTheme;diagnostic=next==='v3'&&bodyOnly;render();},
   exportFrame:()=>{render();return {name:`xiangjiang-v3-${variant}-${theme}${diagnostic?'-body-only':''}.png`,url:renderer.domElement.toDataURL('image/png')};},
   signature,dispose};
 }catch(error){dispose();throw error;}
}
