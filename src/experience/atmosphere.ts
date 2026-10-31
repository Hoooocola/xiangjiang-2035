import * as THREE from 'three';
import {createCloudFields} from './atmosphere-clouds';
export type AtmospherePreference='auto'|'low'|'off';
export function atmosphereQuality(preference:AtmospherePreference,reducedMotion:boolean,compact:boolean,underPressure=false){return preference==='off'||reducedMotion?'off':preference==='low'||compact||underPressure?'low':'full';}

/** World-space motes and bounded mist fields. One particle batch, six/fewer mist draws; no ray marching. */
export function createAtmosphere(){
 const root=new THREE.Group();root.name='river-atmosphere';let mode:AtmospherePreference='auto',quality:'full'|'low'|'off'='full',time=0;
 const count=160,position:number[]=[],seed:number[]=[];let n=917;const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
 for(let i=0;i<count;i++){position.push((random()-.5)*160,2+random()*25,(random()-.5)*160);seed.push(random());}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seed,1));
 const uniforms={uTime:{value:0},uNight:{value:1},uPixel:{value:1}};
 const particlesMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
 vertexShader:`
 attribute float seed;uniform float uTime,uPixel;varying float vSeed,vBreath;
 void main(){
  vSeed=seed;vec3 p=position;float speed=.055+seed*.095;float angle=seed*31.4;
  p.x+=cos(angle)*uTime*speed+sin(uTime*(.14+seed*.1)+seed*30.)*.65;
  p.z+=sin(angle)*uTime*speed+cos(uTime*(.12+seed*.07)+seed*19.)*.55;
  p.x=mod(p.x+80.,160.)-80.;p.z=mod(p.z+80.,160.)-80.;
  p.y+=sin(uTime*(.2+seed*.12)+seed*41.)*.55;
  float life=fract(seed+uTime*(.003+seed*.003));
  vBreath=(.76+.24*sin(uTime*(.45+seed*.25)+seed*22.))*smoothstep(0.,.08,life)*(1.-smoothstep(.91,1.,life));
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  gl_PointSize=(2.5+seed*2.5)*clamp(72./max(1.,-mv.z),.55,1.55)*uPixel;
 }`,
 fragmentShader:`
 uniform float uNight;varying float vSeed,vBreath;
 void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
  float glow=pow(1.-r,2.1),core=pow(1.-r,7.);
  vec3 amber=mix(vec3(.89,.61,.27),vec3(1.,.88,.65),vSeed);
  vec3 color=mix(amber,vec3(1.,.95,.83),step(.94,vSeed));
  gl_FragColor=vec4(color*(.85+core*.4),glow*mix(.2,.88,uNight)*vBreath);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const particles=new THREE.Points(geometry,particlesMaterial);particles.frustumCulled=false;root.add(particles);
 const clouds=createCloudFields();root.add(clouds.root);
 return {root,setPreference:(value:AtmospherePreference)=>{mode=value;},get preference(){return mode;},get elapsed(){return time;},get fogStrength(){return quality==='off'?0:quality==='low'?.55:1;},
 stats:()=>({particles:quality==='off'?0:quality==='low'?48:count,mistLayers:quality==='off'?0:quality==='low'?3:6,atmosphere:quality}),
 update:(dt:number,night:number,distance:number,camera:THREE.Camera,lookAt:readonly number[],reduced:boolean,compact:boolean,pressure:boolean,pixel:number)=>{
  quality=atmosphereQuality(mode,reduced,compact,pressure);root.visible=quality!=='off';if(!root.visible)return;
  time+=Math.max(0,Math.min(dt,.1));uniforms.uTime.value=time;uniforms.uNight.value=night;uniforms.uPixel.value=pixel;geometry.setDrawRange(0,quality==='low'?48:count);
  // Quantized world neighbourhood stays fixed through small pans/zooms; depth and parallax remain real.
  particles.position.set(Math.round(lookAt[0]/64)*64,0,Math.round(lookAt[2]/64)*64);
  clouds.update(time,night,distance,camera,lookAt,quality);
 },dispose:()=>{geometry.dispose();particlesMaterial.dispose();clouds.dispose();}};
}
