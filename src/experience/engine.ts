import {readNightPreference} from './theme-state';
import {attachInspection} from '../spatial/inspection';
import type {IslandStudy,ResearchState} from '../place-research/types';
import type {ResearchModel} from '../place-research/model';
import {createIsland,projectResearchLabels} from '../place-research/runtime';
import {createExploration} from '@/src/exploration/render';
import {createResourceMarkers} from '@/src/exploration/markers';
import {RESOURCE_NODES,activeNodes,usableCoordinate,analysisBoundary,ANALYSIS_RADII} from '@/src/exploration/relations';
import {EMPTY_EXPLORATION} from '@/src/exploration/data';
import type {ExplorationState,LensReading} from '@/src/exploration/data';
import {createAtmosphere,type AtmospherePreference} from './atmosphere';
import {createTerrainFocus} from './terrain-focus';
import {informationPose,informationDuration,informationInsets} from './information-framing';
import {INTRO_SEQUENCE} from './camera-sequence';
import {renderedTerrainHeight} from './information-surface';
import {buildOverlays} from './overlays';
import {MAP_OBJECTS,visibleObjects} from '../atlas/objects';
import type {OverlayState} from '../atlas/types';
import * as THREE from 'three';
import { CameraRig, clonePose } from './camera';
import { CAMERA_PRESETS, OVERVIEW_POSE, PLACES, CAMERA_LIMITS, placePose, type CameraPose, type Place } from './config';
import { makeMaterials } from './materials';
import {createEnvironment} from './lighting';
import { buildScene } from './scene';
import {loadExperienceAssets} from './assets';
import { project,inRing } from './geo';
import {ANCHOR_HEIGHT_METERS,geographicAnchor} from './anchors';
import {projectAnchor} from '../spatial/projection';
import {createPostprocessing} from './postprocessing';
import {researchPose} from './framing';
import {miniPoint,miniViewport,riverMiniPaths} from './minimap';
export interface ExperienceCallbacks {
 progress:(n:number,label:string)=>void;
 ready:()=>void;
 informationReady?:(ready:boolean)=>void;
 object?:(id:string)=>void;
 interact?:()=>void;
 minimap:(paths:string[])=>void;
 motion:(moving:boolean)=>void;
 metrics:(metrics:{fps:number;calls:number;triangles:number;geometries:number;textures?:number;buildings:number;knownHeight:number;trees:number;particles?:number;mistLayers?:number;atmosphere?:string})=>void;
}
export interface ExperienceEngine {
 researchReset:()=>void;researchHighlight:(ids:string[])=>void;researchGraph:(study:IslandStudy)=>void;researchEnter:()=>Promise<void>;researchExit:()=>void;researchState:(state:ResearchState,move?:boolean)=>void;researchNode:(id:string)=>void;
 locateResources:(ids:string[],options?:{directoryOpen?:boolean;radius?:number})=>{ok:boolean;message?:string};
 explore:(state:ExplorationState)=>Promise<void>;lensMove:(x:number,y:number,r:number)=>void;lensRead:(x:number,y:number)=>LensReading;
 atmosphere:(value:AtmospherePreference)=>void;
 rememberView:()=>()=>void;
 clearPlaceSelection:()=>void;
 start:()=>void; tour:()=>void; stop:()=>void; skip:()=>void; reset:()=>void;
 clearInformationFocus:()=>void;focusSpatialInformation:(id:string,options?:{directoryOpen?:boolean})=>void;returnFromFocus:()=>void;setOverlays:(state:OverlayState)=>void;focusObjects:(ids:string[])=>void;hoverObject:(id:string|null)=>void; navigate:(x:number,z:number)=>void; overview:()=>void; focus:(id:string)=>void; back:()=>void;
 pan:(x:number,y:number)=>void;dragMode:(mode:'pan'|'orbit')=>void;
 theme:(night:boolean)=>void; zoom:(f:number)=>void; orbit:(v:number)=>void; preset:(index:number)=>void;dispose:()=>void;
}
export async function createExperience(host:HTMLDivElement,markers:Map<string,HTMLButtonElement>,callbacks:ExperienceCallbacks,signal:AbortSignal,navigationPlaces:readonly Place[]=PLACES):Promise<ExperienceEngine>{
 const cleanups:(()=>void)[]=[];const materials=makeMaterials();
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('当前浏览器未能创建 WebGL 2 场景，请开启硬件加速，或使用支持 WebGL 的 Chrome / Safari。');}
 let disposed=false,frame=0;let built:Awaited<ReturnType<typeof buildScene>>|undefined,post:ReturnType<typeof createPostprocessing>|undefined;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(38,1,0.3,4500);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight);
 renderer.info.autoReset=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','三维湘江地图。拖动平移，Shift 加拖动或右键旋转，滚轮缩放。键盘方向键转动，Home 返回。');canvas.style.cursor='grab';host.appendChild(canvas);
 let localResearch:ResearchModel|undefined,researchView:CameraPose|undefined,researchToken=0,researchState:ResearchState|undefined;
 const limits={...CAMERA_LIMITS};
 const replacedInstances:{mesh:THREE.InstancedMesh;index:number;matrix:THREE.Matrix4}[]=[];
 const restoreDetail=()=>{for(const entry of replacedInstances){entry.mesh.setMatrixAt(entry.index,entry.matrix);entry.mesh.instanceMatrix.needsUpdate=true;}replacedInstances.length=0;};
 const rig=new CameraRig(camera,canvas,{limits,initial:OVERVIEW_POSE,minimumCameraY:(x,z,d)=>(built?.terrain.height(x,z)??0)+(localResearch?.12:Math.max(.18,Math.min(6.6,d*.035)))});
 const sceneEnvironment=createEnvironment(scene,renderer),{sun}=sceneEnvironment;
 const atmosphere=createAtmosphere();scene.add(atmosphere.root);let pressure=false,slowSamples=0;
 const focusMaterial=new THREE.MeshBasicMaterial({color:'#9276bd',transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 const ring=new THREE.Mesh(new THREE.RingGeometry(0.5,0.54,64),focusMaterial);ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 let night=readNightPreference()?1:0,nightTarget=night,last=performance.now(),frames=0,frameTime=0,metricsTime=0;
 let previous:CameraPose|undefined,selectedId:string|undefined;
 let researchSelected=false,researchWeight=0;let objectPrevious:CameraPose|undefined;let informationPending=false;
 let updatePlaceFocus:(id?:string)=>void=()=>{};
 const select=(id?:string)=>{selectedId=id;updatePlaceFocus(id);built?.select(researchSelected?undefined:id);const place=navigationPlaces.find(p=>p.id===id);const [x,z]=place?project(place.coordinate):[0,0];materials.focusRegion.value.set(x,z,id==='juzizhou'?5:16,id==='juzizhou'?24:16);};
 const stop=()=>{if(rig.route||rig.transition)rig.cancel();informationPending=false;callbacks.informationReady?.(true);callbacks.motion(false);};rig.onInteract=()=>{stop();callbacks.interact?.();};
 const dispose=()=>{
  if(disposed)return;disposed=true;researchToken++;localResearch?.dispose();cancelAnimationFrame(frame);rig.dispose();cleanups.forEach(f=>f());
  const geometries=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();scene.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>mats.add(m));});
  geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());Object.values(materials).forEach(v=>{if(v instanceof THREE.Material)v.dispose();});sun.shadow.dispose();post?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
 };
 try{
  callbacks.progress(12,'读取湘江地理数据');
  const {data,grid,context}=await loadExperienceAssets(signal);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  callbacks.minimap(riverMiniPaths(data));
  callbacks.progress(35,'构建河岸、街区与洲岛');
  built=await buildScene(data,grid,context,materials,n=>callbacks.progress(Math.round(n),'构建河岸、街区与洲岛'),false,new Set(MAP_OBJECTS.filter(o=>o.form==='object').flatMap(o=>o.sourceFeatureIds??[])));
  scene.add(built.root);
  const relief=built.root.children.find(o=>o instanceof THREE.Mesh&&o.renderOrder===-1) as THREE.Mesh;
  const exploration=createExploration(data,relief.geometry,built.terrain.height);scene.add(exploration.root);cleanups.push(()=>exploration.dispose());
  let explorationState:ExplorationState={...EMPTY_EXPLORATION},resourcePlaceIds=new Set<string>();
  const updateResourceMarkers=createResourceMarkers(markers,built.terrain.height);
  const overlays=buildOverlays(built.terrain.height,built.sourceGeometry,renderedTerrainHeight(grid,built.terrain.height));scene.add(overlays.root);
  const terrainFocus=createTerrainFocus(renderedTerrainHeight(grid,built.terrain.height));scene.add(terrainFocus.root);
  const informationOccluders=[...built.city.children,...built.root.children.filter(o=>o instanceof THREE.Mesh&&!(o instanceof THREE.InstancedMesh))];
  let overlayState:OverlayState={layers:[],proposal:null,selectedObjectIds:[],placeId:null};
  updatePlaceFocus=id=>{overlays.focus(id==='yanghu'?'pilot-park-15867482':null);terrainFocus.setActive(id==='zhaoshan');};
  const picker=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown:[number,number]|null=null;
  const down=(e:PointerEvent)=>{pointerDown=e.button===0?[e.clientX,e.clientY]:null;};
  const up=(e:PointerEvent)=>{if(!pointerDown||e.button!==0||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>4){pointerDown=null;return;}pointerDown=null;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);picker.setFromCamera(pointer,camera);const groups=[...overlays.groups.values()].filter(g=>g.visible);const hit=picker.intersectObjects(groups,true)[0];if(hit){const obstruction=picker.intersectObjects(informationOccluders,false)[0];if(!obstruction||obstruction.distance>=hit.distance-.04)callbacks.object?.(hit.object.userData.informationId);}};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);cleanups.push(()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);});
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  callbacks.progress(88,'准备光影与镜头');
  post=createPostprocessing(renderer,scene,camera);
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);post?.resize(w,h);camera.aspect=w/h;camera.fov=w<700?52:38;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);cleanups.push(()=>observer.disconnect());resize();
  const media=matchMedia('(prefers-reduced-motion: reduce)');const motionChange=()=>{rig.reducedMotion=media.matches;};media.addEventListener('change',motionChange);cleanups.push(()=>media.removeEventListener('change',motionChange));
  const lost=(e:Event)=>{e.preventDefault();stop();callbacks.progress(-1,'图形上下文已中断，请刷新页面重新载入。');};canvas.addEventListener('webglcontextlost',lost);cleanups.push(()=>canvas.removeEventListener('webglcontextlost',lost));
  rig.update(performance.now(),0);
  materials.updateTheme(night);sceneEnvironment.update(night,rig.pose.distance);
  renderer.compile(scene,camera);
  renderer.render(scene,camera);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const projectPoint=new THREE.Vector3(),anchorPoint=new THREE.Vector3(),shadowTarget=new THREE.Vector3(Infinity,0,Infinity);
  const miniView=host.parentElement?.querySelector<SVGPathElement>('[data-minimap-view]');
  const miniCenter=host.parentElement?.querySelector<SVGCircleElement>('[data-minimap-center]');
  let mapTime=0;const labelRay=new THREE.Raycaster(),occlusion=new Map<string,boolean>();let occlusionAt=0;const occlusionCamera=new THREE.Matrix4();
  let compass=host.parentElement?.querySelector<HTMLElement>('[data-compass]');
  function render(now:number){
   if(disposed)return;frame=requestAnimationFrame(render);const elapsed=(now-last)/1000,dt=Math.min(elapsed,.05);last=now;
   if(document.hidden)return;
   rig.update(now,dt);if(informationPending&&(!rig.transition||rig.transition.duration===0||(now-rig.transition.start)/rig.transition.duration>=.72)){informationPending=false;callbacks.informationReady?.(true);}compass??=host.parentElement?.querySelector<HTMLElement>('[data-compass]');if(compass)compass.style.transform=`rotate(${-rig.pose.azimuth*180/Math.PI}deg)`;materials.time.value=media.matches?0:now/1000;
   night=THREE.MathUtils.lerp(night,nightTarget,1-Math.exp(-dt*2.2));materials.updateTheme(night);materials.focusActive.value=THREE.MathUtils.lerp(materials.focusActive.value,selectedId&&!overlayState.selectedObjectIds.length?1:0,1-Math.exp(-dt*3));
   materials.researchFocus.value=THREE.MathUtils.lerp(materials.researchFocus.value,researchWeight,1-Math.exp(-dt*3));
   const d=rig.pose.distance;materials.viewDistance.value=d;atmosphere.update(dt,night,d,camera,rig.pose.target,media.matches,host.clientWidth<760,pressure,renderer.getPixelRatio());sceneEnvironment.update(night,d,atmosphere.fogStrength,media.matches?0:now/1000);overlays.theme(night);terrainFocus.theme(night);
   const near=localResearch?Math.max(.008,d*.003):Math.max(.04,d*.005);if(Math.abs(camera.near-near)>.05){camera.near=near;camera.updateProjectionMatrix();}
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
   const occupied:[number,number][]=[];
   for(const place of [...navigationPlaces].sort((a,b)=>Number(b.id===selectedId)-Number(a.id===selectedId))){
    const el=markers.get(place.id);if(!el||el.hidden)continue;
    geographicAnchor(place.coordinate,built!.terrain.height,ANCHOR_HEIGHT_METERS.place,anchorPoint);
    projectAnchor(anchorPoint,camera,w,h,projectPoint);
    const px=projectPoint.x,py=projectPoint.y;
    const resourceVisible=resourcePlaceIds.has(place.id)&&!!markers.get('resource:'+place.id);
    const show=!resourceVisible&&!researchSelected&&projectPoint.z<1&&projectPoint.z>-1&&px>35&&px<w-35&&py>100&&py<h-120&&(!occupied.some(([x,y])=>Math.hypot(px-x,py-y)<(d>300?38:30))||selectedId===place.id);
    if(show)occupied.push([px,py]);
    el.dataset.edge=px>w-200?'right':'left';el.style.transform=`translate3d(${px}px,${py}px,0)`;el.style.visibility=show?'visible':'hidden';
   }
   const visibleIds=new Set(visibleObjects(overlayState).map(o=>o.id));
   const hr=host.getBoundingClientRect();const panels=Array.from(host.parentElement?.querySelectorAll<HTMLElement>('[data-information-panel]')??[]).map(el=>el.getBoundingClientRect());
   const refreshOcclusion=now-occlusionAt>100&&!occlusionCamera.equals(camera.matrixWorldInverse);if(refreshOcclusion){occlusionAt=now;occlusionCamera.copy(camera.matrixWorldInverse);occlusion.clear();}
   const infoOccupied:[number,number][]=[];

   for(const o of [...MAP_OBJECTS].sort((a,b)=>Number(overlayState.selectedObjectIds.includes(b.id))-Number(overlayState.selectedObjectIds.includes(a.id)))){const el=markers.get('object:'+o.id);if(!el)continue;anchorPoint.copy(overlays.anchors.get(o.id)!);projectAnchor(anchorPoint,camera,w,h,projectPoint);const px=projectPoint.x,py=projectPoint.y;
    let show=visibleIds.has(o.id)&&projectPoint.z<1&&projectPoint.z>-1&&px>24&&px<w-24&&py>110&&py<h-130&&(d<230||overlayState.selectedObjectIds.includes(o.id));
    if(show&&panels.some(r=>px+hr.left>r.left-20&&px+hr.left<r.right+20&&py+hr.top>r.top-20&&py+hr.top<r.bottom+20))show=false;
    if(show&&infoOccupied.some(([x,y])=>Math.hypot(px-x,py-y)<40))show=false;
    if(show){if(refreshOcclusion||!occlusion.has(o.id)){const dir=anchorPoint.clone().sub(camera.position),distance=dir.length();labelRay.set(camera.position,dir.normalize());labelRay.far=Math.max(.001,distance-.008);occlusion.set(o.id,labelRay.intersectObjects(informationOccluders,false).length>0);}show=!occlusion.get(o.id);}
    if(show)infoOccupied.push([px,py]);
    el.style.transform=`translate3d(${px}px,${py}px,0)`;el.style.visibility=show?'visible':'hidden';el.dataset.edge=px>w-220?'right':'left';
   }
   ring.scale.setScalar(1+(media.matches?0:Math.sin(now*.0015)*.05));
   exploration.update(dt,night,renderer.getPixelRatio(),h,media.matches);
   updateResourceMarkers(explorationState,camera,w,h,host);
   if(localResearch&&researchState){localResearch.theme(night);projectResearchLabels(localResearch,camera,host);}
   renderer.info.reset();post!.render(night);frames++;frameTime+=elapsed;metricsTime+=elapsed;
   if(metricsTime>1.5&&built){callbacks.metrics({fps:Math.round(frames/frameTime),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,...built.stats,...atmosphere.stats()});if(frames/frameTime<30)slowSamples++;else slowSamples=0;if(slowSamples>=3)pressure=true;frames=0;frameTime=0;metricsTime=0;}
  }
  frame=requestAnimationFrame(render);callbacks.progress(100,'准备就绪');callbacks.ready();
  const fly=(pose:CameraPose,duration=2600)=>{informationPending=false;callbacks.informationReady?.(true);callbacks.motion(true);rig.fly(pose,duration,()=>{informationPending=false;callbacks.informationReady?.(true);callbacks.motion(false);});};
  const locateResources=(ids:string[],options:{directoryOpen?:boolean;radius?:number}={})=>{
   const unique=[...new Set(ids)],nodes=RESOURCE_NODES.filter(n=>unique.includes(n.id));
   if(!nodes.length||nodes.length!==unique.length||nodes.some(n=>!usableCoordinate(n.coordinate)))return {ok:false,message:'地点坐标缺失或超出可用地图范围，未移动镜头。'};
   if(options.radius!==undefined&&!ANALYSIS_RADII.some(r=>r===options.radius))return {ok:false,message:'不支持的分析范围，未移动镜头。'};
   const coordinates=options.radius&&nodes.length===1?analysisBoundary(nodes[0].coordinate,options.radius):nodes.map(n=>n.coordinate);
   const points=coordinates.map(c=>{const[x,z]=project(c);return new THREE.Vector3(x,built!.terrain.height(x,z),z);});
   const w=host.clientWidth,h=host.clientHeight,reading=nodes.length===1,insets=w<760?{left:24,right:24,top:145,bottom:reading?Math.min(h*.4+140,h-220):150}:{left:options.directoryOpen?380:40,right:options.directoryOpen||!reading?40:380,top:140,bottom:160};
   const pose=informationPose(points,options.radius?'area':nodes.length===1?'point':'area',rig.pose,w,h,camera.fov,insets);
   if(!pose)return {ok:false,message:'当前窗口不足以显示地点，请扩大窗口后重试。'};
   if(nodes.length===1&&!options.radius)pose.distance=Math.max(pose.distance,30);
   ring.visible=false;select();fly(pose,informationDuration(rig.pose,pose));return {ok:true};
  };
  const frameResearch=(ids=overlayState.selectedObjectIds)=>{const points:THREE.Vector3[]=[];for(const id of ids){const g=overlays.groups.get(id);if(!g?.children.length)continue;g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);points.push(b.min,b.max);}return researchPose(points,host.clientWidth,host.clientHeight,camera.fov);};
  const framePlace=(place:Place)=>{const fallback=placePose(place);if(place.id==='zhaoshan')return informationPose(terrainFocus.points,'area',fallback,host.clientWidth,host.clientHeight,camera.fov)??fallback;if(place.id!=='yanghu')return fallback;const group=overlays.groups.get('pilot-park-15867482');if(!group?.children.length)return fallback;group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);return informationPose([bounds.min,bounds.max],'area',fallback,host.clientWidth,host.clientHeight,camera.fov)??fallback;};
  const focusInformation=(ids:string[],directoryOpen=false)=>{
   const objects=MAP_OBJECTS.filter(o=>ids.includes(o.id));const points:THREE.Vector3[]=[];
   for(const o of objects){const g=overlays.groups.get(o.id);if(!g?.children.length)continue;g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z));}
   if(!objects.length)return;
   const object=objects[0],form=object.form??(object.geometry.type==='Point'?'point':object.geometry.type==='Polygon'?'area':'line');
   const pose=informationPose(points,form,rig.pose,host.clientWidth,host.clientHeight,camera.fov,informationInsets(host.clientWidth,host.clientHeight,directoryOpen));
   if(pose){objectPrevious??=clonePose(rig.pose);fly(pose,informationDuration(rig.pose,pose));informationPending=!media.matches;callbacks.informationReady?.(media.matches);}
  };
  const tour=()=>{
   previous=undefined;ring.visible=false;select();
   if(media.matches){fly(CAMERA_PRESETS[0].pose,0);return;}
   callbacks.motion(true);ring.visible=false;select();
   const play=()=>rig.sequence(INTRO_SEQUENCE,()=>callbacks.motion(false));
   if(Math.abs(rig.pose.distance-OVERVIEW_POSE.distance)<.1)play();
   else rig.fly(OVERVIEW_POSE,2600,play);

  };
  const researchExit=()=>{if(!localResearch&&!researchView&&!researchState)return;stop();researchToken++;restoreDetail();localResearch?.dispose();localResearch=undefined;researchState=undefined;Object.assign(limits,CAMERA_LIMITS);researchView=undefined;renderer.shadowMap.needsUpdate=true;};
  const researchEnter=async()=>{const token=++researchToken;researchView??=clonePose(rig.pose);stop();const model=await createIsland(built!.terrain.height);if(token!==researchToken||disposed){model.dispose();return;}localResearch?.dispose();localResearch=model;restoreDetail();
   // Replace duplicate coarse instances only inside this verified local footprint.
   // Matrices are restored exactly on exit; source assets and global model budgets stay intact.
   if(model.footprint){const footprint=model.footprint,xs=footprint.map(p=>p[0]),zs=footprint.map(p=>p[1]),minx=Math.min(...xs),maxx=Math.max(...xs),minz=Math.min(...zs),maxz=Math.max(...zs),matrix=new THREE.Matrix4(),zero=new THREE.Matrix4().makeScale(0,0,0);built!.root.traverse(o=>{if(!(o instanceof THREE.InstancedMesh))return;const sphere=o.boundingSphere;if(sphere&&(sphere.center.x+sphere.radius<minx||sphere.center.x-sphere.radius>maxx||sphere.center.z+sphere.radius<minz||sphere.center.z-sphere.radius>maxz))return;let changed=false;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const x=matrix.elements[12],z=matrix.elements[14];if(x<minx||x>maxx||z<minz||z>maxz||!inRing(x,z,footprint))continue;replacedInstances.push({mesh:o,index:i,matrix:matrix.clone()});o.setMatrixAt(i,zero);changed=true;}if(changed)o.instanceMatrix.needsUpdate=true;});}
   scene.add(model.root);if(researchState)model.update(researchState,night);limits.minDistance=.65;limits.maxPolar=1.42;fly(model.pose(0),2200);renderer.shadowMap.needsUpdate=true;};
  cleanups.push(attachInspection(host,camera,()=>clonePose(rig.pose),()=>{
 const anchors=[...navigationPlaces.map(p=>{const [x,z]=project(p.coordinate);return {id:p.id,world:[x,built!.terrain.height(x,z),z],selector:`[data-place="${p.id}"]`}}),...activeNodes(explorationState).map(n=>{const[x,z]=project(n.coordinate);return {id:n.id,world:[x,built!.terrain.height(x,z)+.18,z],selector:`[data-resource-id="${n.id}"]`}})];if(localResearch){localResearch.root.updateWorldMatrix(true,false);for(const[id,p]of localResearch.anchors)anchors.push({id,world:p.clone().applyMatrix4(localResearch.root.matrixWorld).toArray(),selector:`[data-research-node="${id}"]`})}return anchors;
 },p=>{stop();rig.fly(p,0)},()=>localResearch?.root));
  return {researchReset:()=>{if(localResearch)fly(localResearch.pose(0),1400)},researchHighlight:ids=>localResearch?.highlight?.(ids),researchGraph:s=>{localResearch?.setStudy?.(s);if(researchState)localResearch?.update(researchState,night);},researchEnter,researchExit,researchState:(s,move=true)=>{researchState=s;localResearch?.update(s,night);if(localResearch&&move)fly(localResearch.pose(s.step),1600);},researchNode:id=>{const p=localResearch?.anchors.get(id);localResearch?.highlight?.([id]);if(p){const d=Math.max(.65,rig.pose.distance*.95),a=rig.pose.azimuth;fly({target:[p.x-Math.cos(a)*d*.14,p.y,p.z+Math.sin(a)*d*.14],distance:d,azimuth:a,polar:rig.pose.polar},850);}},locateResources,explore:state=>{explorationState={...state};resourcePlaceIds=new Set(activeNodes(state).flatMap(n=>n.placeId?[n.placeId]:[]));return exploration.set(state);},lensMove:(x,y,r)=>exploration.moveLens(x,y,r),lensRead:(x,y)=>exploration.read(x,y,host.clientWidth,host.clientHeight,camera),atmosphere:value=>atmosphere.setPreference(value),rememberView:()=>{const saved=clonePose(rig.pose),id=selectedId;return ()=>{objectPrevious=undefined;previous=undefined;select(id);fly(saved,1000);};},clearPlaceSelection:()=>{stop();ring.visible=false;select();},clearInformationFocus:()=>{stop();objectPrevious=undefined;overlays.focus(null);terrainFocus.setActive(false);},focusSpatialInformation:(id,options)=>focusInformation([id],options?.directoryOpen),returnFromFocus:()=>{if(objectPrevious){fly(objectPrevious,1000);objectPrevious=undefined;}},focusObjects:ids=>focusInformation(ids),hoverObject:id=>overlays.hover(id),setOverlays:(state)=>{overlayState=state;if(state.selectedObjectIds.length){overlays.focus(null);terrainFocus.setActive(false);}overlays.update(state);const selected=visibleObjects(state).find(o=>state.selectedObjectIds.includes(o.id));researchSelected=!!selected;researchWeight=selected?.form==='object'?.75:selected?.geometry.type==='Polygon'?.35:selected?.geometry.type==='LineString'?.18:0;built?.select(researchSelected?undefined:selectedId);},start:tour,tour,stop,skip:()=>{stop();fly(CAMERA_PRESETS[0].pose,600);},navigate:(x,z)=>{objectPrevious=undefined;previous=undefined;ring.visible=false;select();fly({target:[x,0,z],distance:Math.min(100,Math.max(55,rig.pose.distance)),azimuth:rig.pose.azimuth,polar:.88});},reset:()=>{if(localResearch){fly(localResearch.pose(0),1400);return;}objectPrevious=undefined;previous=undefined;ring.visible=false;select();fly(CAMERA_PRESETS[0].pose);},overview:()=>{objectPrevious=undefined;previous=undefined;ring.visible=false;select();fly(OVERVIEW_POSE,3600);},focus:(id)=>{objectPrevious=undefined;
   const p=navigationPlaces.find(p=>p.id===id);if(!p)return;previous??=clonePose(rig.pose);const [x,z]=project(p.coordinate);ring.position.set(x,(built?.terrain.height(x,z)??0)+.08,z);select(id);ring.visible=false;fly(framePlace(p));
  },back:()=>{ring.visible=false;select();fly(previous??CAMERA_PRESETS[0].pose);previous=undefined;},pan:(x,y)=>{stop();rig.pan(x*rig.pose.distance*.08,y*rig.pose.distance*.08);},dragMode:(mode)=>{stop();rig.dragMode=mode;},theme:(v)=>{nightTarget=v?1:0;},zoom:(f)=>{stop();rig.zoom(f);},orbit:(v)=>{stop();rig.orbit(v);},preset:(i)=>{const preset=CAMERA_PRESETS[i];if(!preset)return;const place=navigationPlaces.find(p=>p.id===selectedId);const pose=preset.mode==='research'?frameResearch()??preset.pose:preset.mode==='place'&&place?framePlace(place):preset.pose;previous=undefined;ring.visible=false;if(preset.mode==='macro')select();fly(pose);},dispose};
 }catch(e){dispose();throw e;}
}
