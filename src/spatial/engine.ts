import * as THREE from 'three';
import {CameraRig} from '../experience/camera';
import {SITE,SITE_HOME,SITE_LIMITS,STORY,ANNOTATIONS} from './data';
import {initialState,highlightedRecordIds,visibleAnnotations} from './controller';
import {loadSiteModel,disposeTree} from './scene';
import {createAnnotations,annotationForObject} from './annotations';
import type {ExplorerState} from './types';
import {projectAnchor} from './projection';
export interface SiteEngine {apply:(state:ExplorerState)=>void;reset:()=>void;orbit:(n:number)=>void;zoom:(n:number)=>void;stop:()=>void;dispose:()=>void}
interface Callbacks {select:(id:string)=>void;interact:()=>void;ready:()=>void;motion:(v:boolean)=>void;error:(message:string)=>void;metrics:(m:{fps:number;calls:number;geometries:number})=>void}
export async function createSiteEngine(host:HTMLDivElement,markers:Map<string,HTMLButtonElement>,callbacks:Callbacks,signal:AbortSignal):Promise<SiteEngine>{
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','三维研究现场，拖动旋转，Shift 拖动平移，滚轮缩放，方向键旋转，Home 重置');canvas.style.touchAction='none';host.appendChild(canvas);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#102c33');scene.fog=new THREE.Fog('#102c33',160,260);
 const camera=new THREE.PerspectiveCamera(40,1,.1,500);
 const rig=new CameraRig(camera,canvas,{initial:SITE_HOME,limits:SITE_LIMITS,leftOrbit:true,boundTarget:t=>{t[0]=THREE.MathUtils.clamp(t[0],-30,34);t[2]=THREE.MathUtils.clamp(t[2],-40,40);}});
 scene.add(new THREE.HemisphereLight('#e9f1ee','#2c4f4d',2));
 const sun=new THREE.DirectionalLight('#ffe0ad',3.5);sun.position.set(-28,65,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:160});sun.shadow.normalBias=.04;scene.add(sun);
 const fill=new THREE.DirectionalLight('#83b9d1',1.4);fill.position.set(40,30,-25);scene.add(fill);
 let disposed=false,frame=0,state=initialState,last=performance.now(),metricTime=0,frames=0,hoverId:string|null=null;
 let model:Awaited<ReturnType<typeof loadSiteModel>>|undefined,annotations:ReturnType<typeof createAnnotations>|undefined;
 const cleanups:(()=>void)[]=[];
 const dispose=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);rig.dispose();cleanups.forEach(f=>f());model?.dispose();if(annotations)disposeTree(annotations.root);sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};
 try{
  model=await loadSiteModel(SITE.asset,signal);if(signal.aborted)throw new DOMException('Aborted','AbortError');scene.add(model.root);annotations=createAnnotations(model);scene.add(annotations.root);
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<700?51:40;camera.updateProjectionMatrix();};
  const ro=new ResizeObserver(resize);ro.observe(host);cleanups.push(()=>ro.disconnect());resize();
  const on=(name:string,fn:EventListener)=>{canvas.addEventListener(name,fn);cleanups.push(()=>canvas.removeEventListener(name,fn));};
  const stop=()=>{rig.cancel();callbacks.motion(false);};rig.onInteract=()=>{stop();callbacks.interact();};
  on('webglcontextlost',((e:Event)=>{e.preventDefault();stop();callbacks.error('图形上下文已中断，请重新载入研究现场。');}) as EventListener);
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down:[number,number]|null=null;
  const pick=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);
   const meshes:THREE.Object3D[]=[...model!.occluders];for(const obj of model!.objects.values())if(obj.parent?.visible!==false)meshes.push(obj);
   const shown=new Set(visibleAnnotations(state).map(a=>a.id));meshes.push(...annotations!.pickables.filter(o=>shown.has(o.userData.annotation)));
   const hits=raycaster.intersectObjects(meshes,true).filter(h=>{for(let p:THREE.Object3D|null=h.object;p;p=p.parent)if(!p.visible)return false;return true;});
   return hits.length?annotationForObject(hits[0].object,model!,state):undefined;
  };
  on('pointerdown',((e:PointerEvent)=>{down=[e.clientX,e.clientY];}) as EventListener);
  on('pointerup',((e:PointerEvent)=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5&&e.button===0){const a=pick(e);if(a)callbacks.select(a.recordId);}down=null;}) as EventListener);
  on('pointermove',((e:PointerEvent)=>{if(e.buttons)return;const a=pick(e);hoverId=a?.recordId??null;annotations!.hover(hoverId);canvas.style.cursor=a?'pointer':'grab';}) as EventListener);
  on('pointerleave',(()=>{hoverId=null;annotations!.hover(null);}) as EventListener);
  const point=new THREE.Vector3(),origin=new THREE.Vector3(),direction=new THREE.Vector3();
  function updateLabels(){
   const w=host.clientWidth,h=host.clientHeight,highlight=new Set(highlightedRecordIds(state));
   const candidates=visibleAnnotations(state).filter(a=>a.layer!=='context'||highlight.has(a.recordId));
   const priority=(id:string)=>(id===state.selectedId?10:0)+(highlight.has(id)?1:0);candidates.sort((a,b)=>priority(b.recordId)-priority(a.recordId));
   const occupied:{x:number;y:number;label:boolean;labelLeft:number}[]=[];const shown=new Set<string>(),labeledRecords=new Set<string>();
   for(const a of candidates){const el=markers.get(a.id);if(!el)continue;
    origin.set(...a.anchor);projectAnchor(origin,camera,w,h,point);const x=point.x,y=point.y;
    let show=point.z>-1&&point.z<1&&x>24&&x<w-24&&y>110&&y<h-(w<700?105:130);
    const panel=host.parentElement?.querySelector<HTMLElement>('[data-site-panel]');if(panel){const rect=panel.getBoundingClientRect(),hr=host.getBoundingClientRect();if(x>rect.left-hr.left-15&&x<rect.right-hr.left+15&&y>rect.top-hr.top-15&&y<rect.bottom-hr.top+15)show=false;}
    if(show){direction.copy(origin).sub(camera.position);const distance=direction.length();raycaster.set(camera.position,direction.normalize());raycaster.far=Math.max(.1,distance-.55);const blocked=raycaster.intersectObjects(model!.occluders,false).length>0;raycaster.far=Infinity;show=!blocked;}
    const nearby=occupied.some(p=>Math.abs(p.x-x)<30&&Math.abs(p.y-y)<28||(p.label&&x>p.labelLeft-8&&x<p.labelLeft+188&&Math.abs(p.y-y)<35));if(nearby)show=false;
    if(show){const label=!labeledRecords.has(a.recordId)&&(highlight.has(a.recordId)||hoverId===a.recordId)&&rig.pose.distance<105&&!occupied.some(p=>p.label&&Math.abs(p.x-x)<185&&Math.abs(p.y-y)<62);if(label)labeledRecords.add(a.recordId);el.dataset.label=String(label);const panelLeft=panel?panel.getBoundingClientRect().left-host.getBoundingClientRect().left:w;el.dataset.edge=x+220>panelLeft?'right':'left';el.style.transform=`translate3d(${x}px,${y}px,0)`;el.style.visibility='visible';occupied.push({x,y,label,labelLeft:el.dataset.edge==='right'?x-220:x+39});shown.add(a.id);}
   }
   for(const [id,el] of markers)if(!shown.has(id))el.style.visibility='hidden';
  }
  function render(now:number){if(disposed)return;frame=requestAnimationFrame(render);const elapsed=(now-last)/1000;last=now;if(document.hidden)return;rig.update(now,Math.min(elapsed,.05));updateLabels();renderer.render(scene,camera);frames++;metricTime+=elapsed;if(metricTime>2){callbacks.metrics({fps:Math.round(frames/metricTime),calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries});frames=0;metricTime=0;}}
  rig.update(performance.now(),0);renderer.render(scene,camera);frame=requestAnimationFrame(render);callbacks.ready();
  const fly=(pose:typeof SITE_HOME)=>{callbacks.motion(true);rig.fly(pose,1700,()=>callbacks.motion(false));};
  return {apply:next=>{
   const focus=next.focusRevision!==state.focusRevision;
   if((next.paused&&!state.paused)||(state.mode==='guided'&&next.mode==='free'))stop();state=next;annotations!.update(state);
   if(focus){if(state.mode==='guided'&&!state.paused)fly(STORY.steps[state.step].camera);else if(state.selectedId){const a=ANNOTATIONS.find(a=>a.recordId===state.selectedId);if(a)fly({target:[a.anchor[0]+3,2,a.anchor[2]],distance:43,azimuth:rig.pose.azimuth,polar:.87});}else fly(SITE_HOME);}
  },reset:()=>{stop();callbacks.interact();fly(SITE_HOME);},orbit:n=>{stop();callbacks.interact();rig.orbit(n);},zoom:n=>{stop();callbacks.interact();rig.zoom(n);},stop,dispose};
 }catch(error){dispose();throw error;}
}
