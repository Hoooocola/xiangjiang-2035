import {buildOverlays} from './overlays';
import {MAP_OBJECTS,visibleObjects} from '../atlas/objects';
import type {OverlayState} from '../atlas/types';
import * as THREE from 'three';
import { CameraRig, clonePose } from './camera';
import { CAMERA_PRESETS, OVERVIEW_POSE, PLACES, placePose, type CameraPose } from './config';
import { makeMaterials } from './materials';
import {createEnvironment} from './lighting';
import { buildScene,type ContextData } from './scene';
import { project, type SceneData } from './geo';
import type {TerrainGrid} from './terrain';
import {miniPoint,miniViewport,riverMiniPaths} from './minimap';
export interface ExperienceCallbacks {
 progress:(n:number,label:string)=>void;
 ready:()=>void;
 minimap:(paths:string[])=>void;
 motion:(moving:boolean)=>void;
 metrics:(metrics:{fps:number;calls:number;triangles:number;geometries:number;buildings:number;knownHeight:number;trees:number})=>void;
}
export interface ExperienceEngine {
 start:()=>void; tour:()=>void; stop:()=>void; reset:()=>void;
 setOverlays:(state:OverlayState)=>void; navigate:(x:number,z:number)=>void; overview:()=>void; focus:(id:string)=>void; back:()=>void;
 theme:(night:boolean)=>void; zoom:(f:number)=>void; orbit:(v:number)=>void; preset:(index:number)=>void;dispose:()=>void;
}
export async function createExperience(host:HTMLDivElement,markers:Map<string,HTMLButtonElement>,callbacks:ExperienceCallbacks,signal:AbortSignal):Promise<ExperienceEngine>{
 const cleanups:(()=>void)[]=[];const materials=makeMaterials();
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('当前浏览器未能创建 WebGL 2 场景，请开启硬件加速，或使用支持 WebGL 的 Chrome / Safari。');}
 let disposed=false,frame=0;let built:Awaited<ReturnType<typeof buildScene>>|undefined;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(38,1,0.3,4500);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','三维湘江地图。拖动平移，Shift 加拖动或右键旋转，滚轮缩放。键盘方向键转动，Home 返回。');canvas.style.cursor='grab';host.appendChild(canvas);
 const rig=new CameraRig(camera,canvas);
 const sceneEnvironment=createEnvironment(scene,renderer),{sun}=sceneEnvironment;
 const focusMaterial=new THREE.MeshBasicMaterial({color:'#9276bd',transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 const ring=new THREE.Mesh(new THREE.RingGeometry(0.5,0.54,64),focusMaterial);ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 let nightTarget=1,night=1,last=performance.now(),frames=0,frameTime=0,metricsTime=0;
 let previous:CameraPose|undefined,selectedId:string|undefined;
 const select=(id?:string)=>{selectedId=id;built?.select(id);const place=PLACES.find(p=>p.id===id);const [x,z]=place?project(place.coordinate):[0,0];materials.focusRegion.value.set(x,z,id==='juzizhou'?5:16,id==='juzizhou'?24:16);};
 const stop=()=>{rig.cancel();callbacks.motion(false);};rig.onInteract=stop;
 const dispose=()=>{
  if(disposed)return;disposed=true;cancelAnimationFrame(frame);rig.dispose();cleanups.forEach(f=>f());
  const geometries=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();scene.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>mats.add(m));});
  geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());Object.values(materials).forEach(v=>{if(v instanceof THREE.Material)v.dispose();});sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
 };
 try{
  callbacks.progress(12,'读取湘江地理数据');
  const [response,terrainResponse,contextResponse,environmentResponse]=await Promise.all([fetch('/data/xiangjiang.geojson',{signal}),fetch('/data/terrain.json',{signal}),fetch('/data/context.json',{signal}),fetch('/data/environment.json',{signal})]);if(!response.ok||!terrainResponse.ok||!contextResponse.ok||!environmentResponse.ok)throw new Error('地理数据加载失败，请重试。');const data:SceneData=await response.json();const grid:TerrainGrid=await terrainResponse.json();const context:ContextData=await contextResponse.json();const environment:SceneData&{forest:number[]}=await environmentResponse.json();data.features.push(...environment.features);grid.forest=environment.forest;
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  callbacks.minimap(riverMiniPaths(data));
  callbacks.progress(35,'构建河岸、街区与洲岛');
  built=await buildScene(data,grid,context,materials,n=>callbacks.progress(Math.round(n),'构建河岸、街区与洲岛'));
  scene.add(built.root);
  const overlays=buildOverlays(built.terrain.height);scene.add(overlays.root);
  let overlayState:OverlayState={layers:[],scenario:"today",selectedObjectIds:[],placeId:null,proposalVisible:true};
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  callbacks.progress(88,'准备光影与镜头');
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<700?52:38;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);cleanups.push(()=>observer.disconnect());resize();
  const media=matchMedia('(prefers-reduced-motion: reduce)');const motionChange=()=>{rig.reducedMotion=media.matches;};media.addEventListener('change',motionChange);cleanups.push(()=>media.removeEventListener('change',motionChange));
  const lost=(e:Event)=>{e.preventDefault();stop();callbacks.progress(-1,'图形上下文已中断，请刷新页面重新载入。');};canvas.addEventListener('webglcontextlost',lost);cleanups.push(()=>canvas.removeEventListener('webglcontextlost',lost));
  rig.update(performance.now(),0);
  materials.updateTheme(1);sceneEnvironment.update(1,rig.pose.distance);
  renderer.compile(scene,camera);
  renderer.render(scene,camera);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const projectPoint=new THREE.Vector3(),shadowTarget=new THREE.Vector3(Infinity,0,Infinity);
  const miniView=host.parentElement?.querySelector<SVGPathElement>('[data-minimap-view]');
  const miniCenter=host.parentElement?.querySelector<SVGCircleElement>('[data-minimap-center]');
  let mapTime=0;
  const compass=host.parentElement?.querySelector<HTMLElement>('[data-compass]');
  function render(now:number){
   if(disposed)return;frame=requestAnimationFrame(render);const elapsed=(now-last)/1000,dt=Math.min(elapsed,.05);last=now;
   if(document.hidden)return;
   rig.update(now,dt);if(compass)compass.style.transform=`rotate(${-rig.pose.azimuth*180/Math.PI}deg)`;materials.time.value=media.matches?0:now/1000;
   night=THREE.MathUtils.lerp(night,nightTarget,1-Math.exp(-dt*2.2));materials.updateTheme(night);materials.focusActive.value=THREE.MathUtils.lerp(materials.focusActive.value,selectedId?1:0,1-Math.exp(-dt*3));
   const d=rig.pose.distance;sceneEnvironment.update(night,d);
   const near=Math.max(.3,d*.01);if(Math.abs(camera.near-near)>.05){camera.near=near;camera.updateProjectionMatrix();}
   sun.castShadow=d<240;
   if(sun.castShadow&&Math.hypot(rig.pose.target[0]-shadowTarget.x,rig.pose.target[2]-shadowTarget.z)>8){
    shadowTarget.set(rig.pose.target[0],0,rig.pose.target[2]);sun.target.position.copy(shadowTarget);sun.position.copy(shadowTarget).add(new THREE.Vector3(-45,70,28));renderer.shadowMap.needsUpdate=true;
   }
   const w=host.clientWidth,h=host.clientHeight;
   mapTime+=dt;
   if(mapTime>.08){
    mapTime=0;const vertices=miniViewport(rig.pose.target,d,rig.pose.azimuth,rig.pose.polar,camera.fov,camera.aspect);
    miniView?.setAttribute('d',vertices.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')+'Z');
    const [mx,my]=miniPoint(rig.pose.target[0],rig.pose.target[2]);miniCenter?.setAttribute('cx',String(mx));miniCenter?.setAttribute('cy',String(my));
   }
   for(const place of PLACES){
    const el=markers.get(place.id);if(!el)continue;
    const [x,z]=project(place.coordinate);projectPoint.set(x,(built?.terrain.height(x,z)??0)+.6,z).project(camera);
    const px=(projectPoint.x*.5+.5)*w,py=(-projectPoint.y*.5+.5)*h;
    const show=projectPoint.z<1&&projectPoint.z>-1&&px>35&&px<w-35&&py>100&&py<h-120&&(!place.overview||d>170||selectedId===place.id)&&!(d>300&&['yuelu','city'].includes(place.id));
    el.dataset.edge=px>w-200?'right':'left';el.style.transform=`translate3d(${px}px,${py}px,0)`;el.style.visibility=show?'visible':'hidden';
   }
   const visibleIds=new Set(visibleObjects(overlayState).map(o=>o.id));
   for(const o of MAP_OBJECTS){const el=markers.get('object:'+o.id);if(!el)continue;const [x,z]=project(o.anchor);projectPoint.set(x,(built?.terrain.height(x,z)??0)+1,z).project(camera);const px=(projectPoint.x*.5+.5)*w,py=(-projectPoint.y*.5+.5)*h;
    const show=visibleIds.has(o.id)&&projectPoint.z<1&&projectPoint.z>-1&&px>24&&px<w-24&&py>110&&py<h-130&&(d<230||overlayState.selectedObjectIds.includes(o.id));
    el.style.transform=`translate3d(${px}px,${py}px,0)`;el.style.visibility=show?'visible':'hidden';el.dataset.edge=px>w-220?'right':'left';
   }
   ring.scale.setScalar(1+(media.matches?0:Math.sin(now*.0015)*.05));
   renderer.render(scene,camera);frames++;frameTime+=elapsed;metricsTime+=elapsed;
   if(metricsTime>1.5&&built){callbacks.metrics({fps:Math.round(frames/frameTime),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,...built.stats});frames=0;frameTime=0;metricsTime=0;}
  }
  frame=requestAnimationFrame(render);callbacks.progress(100,'准备就绪');callbacks.ready();
  const fly=(pose:CameraPose,duration=2600)=>{callbacks.motion(true);rig.fly(pose,duration,()=>callbacks.motion(false));};
  const tour=()=>{
   previous=undefined;ring.visible=false;select();
   if(media.matches){fly(CAMERA_PRESETS[0].pose,0);return;}
   callbacks.motion(true);ring.visible=false;select();
   const sequence:CameraPose[]=[{target:[0,0,11],distance:66,azimuth:.40,polar:.83},{target:[1,0,-12],distance:73,azimuth:.29,polar:.76},CAMERA_PRESETS[0].pose];
   rig.cruise(sequence,11800,()=>{callbacks.motion(false);});
  };
  return {setOverlays:(state)=>{overlayState=state;overlays.update(state);},start:tour,tour,stop,navigate:(x,z)=>{previous=undefined;ring.visible=false;select();fly({target:[x,0,z],distance:Math.min(100,Math.max(55,rig.pose.distance)),azimuth:rig.pose.azimuth,polar:.88});},reset:()=>{previous=undefined;ring.visible=false;select();fly(CAMERA_PRESETS[0].pose);},overview:()=>{previous=undefined;ring.visible=false;select();fly(OVERVIEW_POSE,3600);},focus:(id)=>{
   const p=PLACES.find(p=>p.id===id);if(!p)return;previous??=clonePose(rig.pose);const [x,z]=project(p.coordinate);ring.position.set(x,(built?.terrain.height(x,z)??0)+.08,z);select(id);ring.visible=false;fly(placePose(p));
  },back:()=>{ring.visible=false;select();fly(previous??CAMERA_PRESETS[0].pose);previous=undefined;},theme:(v)=>{nightTarget=v?1:0;},zoom:(f)=>{stop();rig.zoom(f);},orbit:(v)=>{stop();rig.orbit(v);},preset:(i)=>{previous=undefined;ring.visible=false;select();fly(CAMERA_PRESETS[i].pose);},dispose};
 }catch(e){dispose();throw e;}
}
