import * as THREE from 'three';

// Lighting and atmosphere never sample AOI or decide which geometry is loaded.
export const SCENE_LIGHTING = {
 day: { sky:'#ffffff', bounce:'#a7b6bf', key:'#ffffff', hemi:.95, sun:2.25, fill:.4, exposure:1 },
 night: { sky:'#c4dbe5', bounce:'#486772', key:'#d2e4ed', hemi:1.05, sun:1.15, fill:.55, exposure:1.13 },
};
export const ATMOSPHERE = {
 day: { background:'#f1f4f6', nearScale:.9, farScale:3, nearOffset:80, farOffset:220 },
 night: { background:'#0c232b', nearScale:1.1, farScale:3.8, nearOffset:90, farOffset:260 },
};
export function createEnvironment(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
 const hemi=new THREE.HemisphereLight();
 const sun=new THREE.DirectionalLight();
 sun.position.set(-45,70,28);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:180});
 sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;
 const fill=new THREE.DirectionalLight('#bfd7e4');fill.position.set(35,20,-40);
 scene.add(hemi,sun,sun.target,fill);
 const background=new THREE.Color();scene.background=background;
 const fog=new THREE.Fog(ATMOSPHERE.night.background);scene.fog=fog;
 const colors=(key:'sky'|'bounce'|'key')=>[new THREE.Color(SCENE_LIGHTING.day[key]),new THREE.Color(SCENE_LIGHTING.night[key])];
 const sky=colors('sky'),bounce=colors('bounce'),key=colors('key');
 const bg=[new THREE.Color(ATMOSPHERE.day.background),new THREE.Color(ATMOSPHERE.night.background)];
 function update(night:number,distance:number){
  const mix=THREE.MathUtils.lerp,day=SCENE_LIGHTING.day,dark=SCENE_LIGHTING.night;
  hemi.color.copy(sky[0]).lerp(sky[1],night);hemi.groundColor.copy(bounce[0]).lerp(bounce[1],night);
  sun.color.copy(key[0]).lerp(key[1],night);
  hemi.intensity=mix(day.hemi,dark.hemi,night);sun.intensity=mix(day.sun,dark.sun,night);fill.intensity=mix(day.fill,dark.fill,night);
  renderer.toneMappingExposure=mix(day.exposure,dark.exposure,night);
  background.copy(bg[0]).lerp(bg[1],night);fog.color.copy(background);
  const a=ATMOSPHERE.day,b=ATMOSPHERE.night;
  fog.near=distance*mix(a.nearScale,b.nearScale,night)+mix(a.nearOffset,b.nearOffset,night);
  fog.far=distance*mix(a.farScale,b.farScale,night)+mix(a.farOffset,b.farOffset,night);
 }
 return {sun,update};
}
