import * as THREE from 'three';
import {createCloudFields} from './atmosphere-clouds';
export type AtmospherePreference='auto'|'low'|'off';
export function atmosphereQuality(preference:AtmospherePreference,reducedMotion:boolean,compact:boolean,underPressure=false){return preference==='off'||reducedMotion?'off':preference==='low'||compact||underPressure?'low':'full';}

/** World-space motes and bounded mist fields. One particle batch, six/fewer mist draws; no ray marching. */
export function createAtmosphere(){
 const root=new THREE.Group();root.name='river-atmosphere';let mode:AtmospherePreference='auto',quality:'full'|'low'|'off'='full',time=0;
 const count=160,position:number[]=[],seed:number[]=[],tiers:number[]=[];let n=917;const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
 for(let i=0;i<count;i++){position.push((random()-.5)*160,2+random()*25,(random()-.5)*160);seed.push(random());tiers.push(i%3);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seed,1));geometry.setAttribute('tier',new THREE.Float32BufferAttribute(tiers,1));
 const uniforms={uTime:{value:0},uNight:{value:1},uPixel:{value:1},uDistance:{value:58}};
 const particlesMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
 vertexShader:`
 attribute float seed,tier;uniform float uTime,uPixel,uDistance;varying float vSeed,vBreath;
 void main(){
  vSeed=seed;vec3 p=position;float speed=.035+seed*.055;float angle=seed*31.4;float age=mod(uTime+seed*180.,180.);
  p.x+=cos(angle)*age*speed+sin(uTime*(.14+seed*.1)+seed*30.)*.65;
  p.z+=sin(angle)*age*speed+cos(uTime*(.12+seed*.07)+seed*19.)*.55;

  p.y+=sin(uTime*(.2+seed*.12)+seed*41.)*.55;
  float life=age/180.;float scaleWeight=tier<.5?1.-smoothstep(100.,240.,uDistance):tier<1.5?smoothstep(70.,180.,uDistance)*(1.-smoothstep(420.,700.,uDistance)):smoothstep(300.,600.,uDistance);
  vBreath=scaleWeight*(.76+.24*sin(uTime*(.45+seed*.25)+seed*22.))*smoothstep(0.,.08,life)*(1.-smoothstep(.91,1.,life));
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  gl_PointSize=(1.7+seed*1.5)*clamp((tier<.5?65.:tier<1.5?220.:850.)/max(1.,-mv.z),.65,1.3)*uPixel;
 }`,
 fragmentShader:`
 uniform float uNight;varying float vSeed,vBreath;
 void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
  float glow=pow(1.-r,2.1),core=pow(1.-r,7.);
  vec3 amber=mix(vec3(.57,.43,.25),vec3(.83,.74,.56),vSeed);
  vec3 color=mix(amber,vec3(.62,.78,.78),step(.95,vSeed));
  gl_FragColor=vec4(color*(.85+core*.4),glow*mix(.13,.68,uNight)*vBreath);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const particles=new THREE.Points(geometry,particlesMaterial);particles.frustumCulled=false;root.add(particles);
 const clouds=createCloudFields();root.add(clouds.root);
 const cells=Array.from({length:3},()=>({x:NaN,z:NaN}));
 const hash=(x:number,z:number)=>{const h=Math.sin(x*127.1+z*311.7)*43758.5453;return h-Math.floor(h);};
 return {root,setPreference:(value:AtmospherePreference)=>{mode=value;},get preference(){return mode;},get elapsed(){return time;},get fogStrength(){return quality==='off'?0:quality==='low'?.55:1;},
 stats:()=>({particles:quality==='off'?0:quality==='low'?48:count,mistLayers:quality==='off'?0:quality==='low'?3:6,atmosphere:quality}),
 update:(dt:number,night:number,distance:number,camera:THREE.Camera,lookAt:readonly number[],reduced:boolean,compact:boolean,pressure:boolean,pixel:number)=>{
  quality=atmosphereQuality(mode,reduced,compact,pressure);root.visible=quality!=='off';if(!root.visible)return;
  time+=Math.max(0,Math.min(dt,.1));uniforms.uTime.value=time;uniforms.uNight.value=night;uniforms.uPixel.value=pixel;uniforms.uDistance.value=distance;geometry.setDrawRange(0,quality==='low'?48:count);
  // Quantized world neighbourhood stays fixed through small pans/zooms; depth and parallax remain real.
  const positions=geometry.getAttribute('position') as THREE.BufferAttribute;
  cells.forEach((cell,tier)=>{const tile=[16,64,256][tier],ox=Math.floor(lookAt[0]/tile),oz=Math.floor(lookAt[2]/tile);
   if(cell.x===ox&&cell.z===oz)return;cell.x=ox;cell.z=oz;
   for(let i=tier;i<count;i+=3){const local=Math.floor(i/3),slot=(local*17)%48;
    const cx=ox+((slot%8-ox)%8+8)%8-3,cz=oz+((Math.floor(slot/8)-oz)%6+6)%6-2;
    positions.setXYZ(i,(cx+.12+hash(cx+i,cz)*.76)*tile,2+hash(cz,i)*[20,38,65][tier],(cz+.12+hash(cz+i,cx)*.76)*tile);
   }positions.needsUpdate=true;
  });
  clouds.update(time,night,distance,camera,lookAt,quality);
 },dispose:()=>{geometry.dispose();particlesMaterial.dispose();clouds.dispose();}};
}
