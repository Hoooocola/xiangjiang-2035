import * as THREE from 'three';
import { CameraRig, clonePose } from './camera';
import { CAMERA_PRESETS, OVERVIEW_POSE, PLACES, placePose, type CameraPose } from './config';
import { makeMaterials, THEMES } from './materials';
import { buildScene } from './scene';
import { project, type SceneData } from './geo';
export interface ExperienceCallbacks {
 progress:(n:number,label:string)=>void;
 ready:()=>void;
 motion:(moving:boolean)=>void;
 metrics:(metrics:{fps:number;calls:number;triangles:number;geometries:number;buildings:number;knownHeight:number;trees:number})=>void;
}
export interface ExperienceEngine {
 start:()=>void; tour:()=>void; stop:()=>void; reset:()=>void;
 overview:()=>void; focus:(id:string)=>void; back:()=>void;
 theme:(night:boolean)=>void; zoom:(f:number)=>void; orbit:(v:number)=>void; preset:(index:number)=>void;dispose:()=>void;
}
export async function createExperience(host:HTMLDivElement,markers:Map<string,HTMLButtonElement>,callbacks:ExperienceCallbacks,signal:AbortSignal):Promise<ExperienceEngine>{
 const cleanups:(()=>void)[]=[];const materials=makeMaterials();
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('当前浏览器未能创建 WebGL 2 场景，请开启硬件加速，或使用支持 WebGL 的 Chrome / Safari。');}
 let disposed=false,frame=0;let built:Awaited<ReturnType<typeof buildScene>>|undefined;
 const scene=new THREE.Scene();scene.background=new THREE.Color(THEMES.day.background);scene.fog=new THREE.Fog(THEMES.day.background,90,200);
 const camera=new THREE.PerspectiveCamera(38,1,0.3,4500);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','三维湘江地图。拖动平移，Shift 加拖动或右键旋转，滚轮缩放。键盘方向键转动，Home 返回。');canvas.style.cursor='grab';host.appendChild(canvas);
 const rig=new CameraRig(camera,canvas);
 const hemi=new THREE.HemisphereLight('#fff7e8','#9ca9ab',1.5);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff0d9',2.5);sun.position.set(-45,70,28);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:180});sun.shadow.bias=-0.0003;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
 const fill=new THREE.DirectionalLight('#c2dae1',0.5);fill.position.set(35,20,-40);scene.add(fill);
 const focusMaterial=new THREE.MeshBasicMaterial({color:'#d3af73',transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 const ring=new THREE.Mesh(new THREE.RingGeometry(0.5,0.54,64),focusMaterial);ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 let nightTarget=0,night=0,last=performance.now(),frames=0,frameTime=0,metricsTime=0,touring=false;
 let previous:CameraPose|undefined;
 const stop=()=>{touring=false;rig.cancel();callbacks.motion(false);};rig.onInteract=stop;
 const dispose=()=>{
  if(disposed)return;disposed=true;cancelAnimationFrame(frame);rig.dispose();cleanups.forEach(f=>f());
  const geometries=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();scene.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>mats.add(m));});
  geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());Object.values(materials).forEach(v=>{if(v instanceof THREE.Material)v.dispose();});sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
 };
 try{
  callbacks.progress(12,'读取湘江地理数据');
  const response=await fetch('/data/xiangjiang.geojson',{signal});if(!response.ok)throw new Error('地理数据加载失败，请重试。');const data:SceneData=await response.json();
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  callbacks.progress(35,'构建河岸、街区与洲岛');
  built=await buildScene(data,materials,n=>callbacks.progress(Math.round(n),'构建河岸、街区与洲岛'));
  scene.add(built.root);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  callbacks.progress(88,'准备光影与镜头');
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<700?52:38;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);cleanups.push(()=>observer.disconnect());resize();
  const media=matchMedia('(prefers-reduced-motion: reduce)');const motionChange=()=>{rig.reducedMotion=media.matches;};media.addEventListener('change',motionChange);cleanups.push(()=>media.removeEventListener('change',motionChange));
  const lost=(e:Event)=>{e.preventDefault();stop();callbacks.progress(-1,'图形上下文已中断，请刷新页面重新载入。');};canvas.addEventListener('webglcontextlost',lost);cleanups.push(()=>canvas.removeEventListener('webglcontextlost',lost));
  rig.update(performance.now(),0);
  renderer.compile(scene,camera);
  renderer.render(scene,camera);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const projectPoint=new THREE.Vector3();
  const compass=host.parentElement?.querySelector<HTMLElement>('[data-compass]');
  function render(now:number){
   if(disposed)return;frame=requestAnimationFrame(render);const elapsed=(now-last)/1000,dt=Math.min(elapsed,.05);last=now;
   if(document.hidden)return;
   rig.update(now,dt);if(compass)compass.style.transform=`rotate(${-rig.pose.azimuth*180/Math.PI}deg)`;materials.time.value=media.matches?0:now/1000;
   night=THREE.MathUtils.lerp(night,nightTarget,1-Math.exp(-dt*2.2));materials.updateTheme(night);
   (scene.background as THREE.Color).set(THEMES.day.background).lerp(new THREE.Color(THEMES.night.background),night);
   const fog=scene.fog as THREE.Fog;fog.color.copy(scene.background as THREE.Color);
   const d=rig.pose.distance;fog.near=d*0.82;fog.far=d*2.6;
   hemi.intensity=THREE.MathUtils.lerp(1.5,1.35,night);sun.intensity=THREE.MathUtils.lerp(2.5,1.8,night);sun.color.set(THEMES.day.sun).lerp(new THREE.Color(THEMES.night.sun),night);
   renderer.toneMappingExposure=THREE.MathUtils.lerp(1.03,1.05,night);
   if(built){built.detail.visible=d<220;const fade=THREE.MathUtils.smoothstep(d,250,350);materials.building.opacity=1-fade;materials.farBuilding.opacity=fade;built.city.visible=fade<1;built.overview.visible=fade>0;}
   sun.castShadow=d<240;
   const w=host.clientWidth,h=host.clientHeight;
   for(const place of PLACES){
    const el=markers.get(place.id);if(!el)continue;
    const [x,z]=project(place.coordinate);projectPoint.set(x,place.id==='yuelu'?3.7:.6,z).project(camera);
    const px=(projectPoint.x*.5+.5)*w,py=(-projectPoint.y*.5+.5)*h;
    const show=projectPoint.z<1&&projectPoint.z>-1&&px>35&&px<w-35&&py>100&&py<h-120&&(!place.overview||d>170)&&!(d>300&&['yuelu','city'].includes(place.id));
    el.dataset.edge=px>w-200?'right':'left';el.style.transform=`translate3d(${px}px,${py}px,0)`;el.style.visibility=show?'visible':'hidden';
   }
   ring.scale.setScalar(1+(media.matches?0:Math.sin(now*.0015)*.05));
   renderer.render(scene,camera);frames++;frameTime+=elapsed;metricsTime+=elapsed;
   if(metricsTime>1.5&&built){callbacks.metrics({fps:Math.round(frames/frameTime),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,...built.stats});frames=0;frameTime=0;metricsTime=0;}
  }
  frame=requestAnimationFrame(render);callbacks.progress(100,'准备就绪');callbacks.ready();
  const fly=(pose:CameraPose,duration=2600)=>{touring=false;callbacks.motion(true);rig.fly(pose,duration,()=>callbacks.motion(false));};
  const tour=()=>{
   if(media.matches){fly(CAMERA_PRESETS[0].pose,0);return;}
   touring=true;callbacks.motion(true);ring.visible=false;
   const sequence:CameraPose[]=[{target:[0,0,11],distance:66,azimuth:.40,polar:.83},{target:[1,0,-12],distance:73,azimuth:.29,polar:.76},CAMERA_PRESETS[0].pose];
   let i=0;const next=()=>{if(!touring)return;if(i===sequence.length){touring=false;callbacks.motion(false);return;}rig.fly(sequence[i++],i===3?3400:4200,next);};next();
  };
  return {start:tour,tour,stop,reset:()=>{previous=undefined;ring.visible=false;fly(CAMERA_PRESETS[0].pose);},overview:()=>{ring.visible=false;fly(OVERVIEW_POSE,3600);},focus:(id)=>{
   const p=PLACES.find(p=>p.id===id);if(!p)return;previous??=clonePose(rig.pose);const [x,z]=project(p.coordinate);ring.position.set(x,.1,z);ring.visible=true;fly(placePose(p));
  },back:()=>{ring.visible=false;fly(previous??CAMERA_PRESETS[0].pose);previous=undefined;},theme:(v)=>{nightTarget=v?1:0;},zoom:(f)=>{stop();rig.zoom(f);},orbit:(v)=>{stop();rig.orbit(v);},preset:(i)=>{ring.visible=false;fly(CAMERA_PRESETS[i].pose);},dispose};
 }catch(e){dispose();throw e;}
}
