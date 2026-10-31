import * as THREE from 'three';
export type AtmospherePreference='auto'|'low'|'off';
export function atmosphereQuality(preference:AtmospherePreference,reducedMotion:boolean,compact:boolean,underPressure=false){return preference==='off'||reducedMotion?'off':preference==='low'||compact||underPressure?'low':'full';}
/** One Points draw plus at most five depth-tested world-space mist billboards. No textures or DOM particles. */
export function createAtmosphere(){
 const root=new THREE.Group();root.name='river-atmosphere';let mode:AtmospherePreference='auto',quality:'full'|'low'|'off'='full',time=0;
 const count=96,position:number[]=[],seed:number[]=[];let n=917;const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
 for(let i=0;i<count;i++){position.push((random()-.5)*2,random()*.24+.015,(random()-.5)*2);seed.push(random());}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seed,1));
 const uniforms={uTime:{value:0},uRange:{value:58},uNight:{value:1},uPixel:{value:1}};
 const particlesMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,vertexShader:`attribute float seed;uniform float uTime,uRange,uPixel;varying float vSeed;void main(){vSeed=seed;vec3 p=position;p.x+=sin(uTime*.035+seed*30.)*.04;p.z+=cos(uTime*.027+seed*19.)*.035;p.y+=sin(uTime*.047+seed*41.)*.018;vec4 mv=modelViewMatrix*vec4(p*uRange,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(2.2+seed*1.7)*uPixel;}`,fragmentShader:`uniform float uNight;varying float vSeed;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=pow(1.-r,1.6)*mix(.22,.72,uNight);vec3 c=mix(vec3(.59,.81,.79),vec3(.91,.82,.62),step(.88,vSeed));gl_FragColor=vec4(c,a);}`});
 const particles=new THREE.Points(geometry,particlesMaterial);particles.frustumCulled=false;root.add(particles);
 const cloudUniforms={uTime:{value:0},uNight:{value:1},uNear:{value:80},uRange:{value:58}};
 const cloudMaterial=new THREE.ShaderMaterial({uniforms:cloudUniforms,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,vertexShader:`varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float uTime,uNight,uNear,uRange;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}void main(){vec2 uv=(vUv-.5)*2.;float mask=pow(max(0.,1.-dot(uv,uv)),1.7);float n=noise(vWorld.xz*.025+vec2(uTime*.008,uTime*.003));float depth=smoothstep(uNear,uNear+uRange*.7,length(cameraPosition-vWorld));float a=mask*depth*(.045+.11*n);vec3 c=mix(vec3(.79,.85,.84),vec3(.075,.18,.20),uNight);gl_FragColor=vec4(c,a);}`});
 const clouds=new THREE.Group();root.add(clouds);const plane=new THREE.PlaneGeometry(1,1);for(let i=0;i<5;i++){const mesh=new THREE.Mesh(plane,cloudMaterial);mesh.frustumCulled=false;clouds.add(mesh);}
 const target=new THREE.Vector3();
 return {root,setPreference:(value:AtmospherePreference)=>{mode=value;},get preference(){return mode;},get fogStrength(){return quality==='off'?0:quality==='low'?.55:1;},stats:()=>({particles:quality==='off'?0:quality==='low'?32:count,mistLayers:quality==='off'?0:quality==='low'?2:5,atmosphere:quality}),update:(dt:number,night:number,distance:number,camera:THREE.Camera,lookAt:readonly number[],reduced:boolean,compact:boolean,pressure:boolean,pixel:number)=>{
  quality=atmosphereQuality(mode,reduced,compact,pressure);root.visible=quality!=='off';if(!root.visible)return;time+=dt;uniforms.uTime.value=time;uniforms.uNight.value=night;uniforms.uRange.value=Math.max(25,Math.min(600,distance*.8));uniforms.uPixel.value=pixel;geometry.setDrawRange(0,quality==='low'?32:count);
  particles.position.set(lookAt[0],lookAt[1]+.3,lookAt[2]);
  cloudUniforms.uTime.value=time;cloudUniforms.uNight.value=night;cloudUniforms.uNear.value=distance*.95+25;cloudUniforms.uRange.value=distance;
  target.set(Math.round(lookAt[0]/40)*40,0,Math.round(lookAt[2]/40)*40);clouds.position.lerp(target,1-Math.exp(-dt*.25));
  clouds.children.forEach((o,i)=>{o.visible=quality==='full'||i<2;o.quaternion.copy(camera.quaternion);o.position.set((i%3-1)*distance*.85,2.5+i*.9,((i*7)%5-2)*distance*.65);o.scale.set(distance*(1.2+i*.12),distance*.22,1);});
 },dispose:()=>{geometry.dispose();particlesMaterial.dispose();plane.dispose();cloudMaterial.dispose();}};
}
