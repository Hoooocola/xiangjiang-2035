import * as THREE from 'three';
type Quality='full'|'low'|'off';
const fragment=`
 varying vec2 vUv;varying vec3 vWorld;varying float vDepth;
 uniform float uTime,uNight,uDistance,uDetail,uSeed,uTier;uniform vec2 uFocus;
 uniform vec3 uDay,uDark;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
 void main(){
  vec2 q=(vUv-.5)*2.;float shape=1.-dot(q,q);if(shape<=0.)discard;
  vec2 wind=vec2(uTime*.007,-uTime*.004);
  vec2 p=vUv*vec2(4.2,3.1)+vec2(uSeed*23.,uSeed*11.)+wind;
  float field=noise(p)*.72+noise(p*2.13-wind*.6)*.28;
  if(uDetail>.5)field=field*.9+noise(p*4.17+wind*.25)*.1;
  float cloud=smoothstep(.28,.69,field)*pow(shape,1.5);
  float tier=uTier<.5?1.-smoothstep(110.,260.,uDistance):uTier<1.5?smoothstep(80.,180.,uDistance)*(1.-smoothstep(440.,760.,uDistance)):smoothstep(350.,650.,uDistance);
  float nearFade=smoothstep(uDistance*.35+4.,uDistance*.8+12.,vDepth);
  float heightFade=smoothstep(.6,5.,vWorld.y)*(1.-smoothstep(80.,140.,vWorld.y));
  float focusClear=mix(.15,1.,smoothstep(uDistance*.13,uDistance*.65,length(vWorld.xz-uFocus)));
  float alpha=cloud*tier*nearFade*heightFade*focusClear*mix(.22,.52,uNight);
  if(alpha<.001)discard;
  gl_FragColor=vec4(mix(uDay,uDark,uNight),alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
const vertex='varying vec2 vUv;varying vec3 vWorld;varying float vDepth;void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vec4 view=viewMatrix*world;vDepth=-view.z;gl_Position=projectionMatrix*view;}';
const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};

/** Six bounded, irregular cloud banks in three world-depth bands; no texture downloads. */
export function createCloudFields(){
 const root=new THREE.Group();root.name='world-cloud-banks';
 const plane=new THREE.PlaneGeometry(1,1);
 const shared={uTime:{value:0},uNight:{value:1},uDistance:{value:58},uDetail:{value:1},uFocus:{value:new THREE.Vector2()},uDay:{value:new THREE.Color('#d9e2e2')},uDark:{value:new THREE.Color('#36545a')}};
 const fields=Array.from({length:6},(_,i)=>{
  const tier=Math.floor(i/2),tile=[64,160,384][tier];
  const material=new THREE.ShaderMaterial({uniforms:{...shared,uSeed:{value:.23+i*.137},uTier:{value:tier}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(plane,material);mesh.frustumCulled=false;root.add(mesh);
  return {mesh,tier,tile,cellX:NaN,cellZ:NaN};
 });
 return {root,update:(time:number,night:number,distance:number,camera:THREE.Camera,focus:readonly number[],quality:Quality)=>{
  shared.uTime.value=time;shared.uNight.value=night;shared.uDistance.value=distance;shared.uDetail.value=quality==='full'?1:0;shared.uFocus.value.set(focus[0],focus[2]);
  fields.forEach((f,i)=>{
   f.mesh.visible=quality==='full'||(quality==='low'&&i%2===0);
   const side=i%2===0?-1:1,cx=Math.floor(focus[0]/f.tile)+side,cz=Math.floor(focus[2]/f.tile)+(i%2===0?-1:1);
   if(cx!==f.cellX||cz!==f.cellZ){f.cellX=cx;f.cellZ=cz;const seed=hash(cx,cz),tile=f.tile;
    f.mesh.position.set((cx+.25+seed*.5)*tile,8+seed*12+f.tier*8,(cz+.2+hash(cz,cx)*.6)*tile);
    f.mesh.scale.set(tile*(1.2+seed*.6),tile*(.32+seed*.15),1);
   }
   f.mesh.quaternion.copy(camera.quaternion);
  });
 },dispose:()=>{plane.dispose();fields.forEach(f=>f.mesh.material.dispose());}};
}
