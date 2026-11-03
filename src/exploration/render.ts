import * as T from 'three';
import {project,type SceneData} from '@/src/experience/geo';
import {CULTURE_NODES,DEMO_NODES,DEMO_FOCUS,EMPTY_EXPLORATION,readingAt,type ExplorationState,type CoverMeta,type LensReading} from './data';
let rasterPromise:Promise<{meta:CoverMeta;values:Uint8Array}>|undefined;
export function loadCover(){return rasterPromise??=Promise.all([fetch('/data/spatial/worldcover-2021-texture.json').then(r=>{if(!r.ok)throw Error('分类元数据不可用');return r.json() as Promise<CoverMeta>;}),fetch('/data/spatial/worldcover-2021-core.bin').then(r=>{if(!r.ok)throw Error('分类数据不可用');return r.arrayBuffer();})]).then(([meta,bytes])=>{if(bytes.byteLength!==meta.width*meta.height)throw Error('分类尺寸不符');return {meta,values:new Uint8Array(bytes)};}).catch(e=>{rasterPromise=undefined;throw e;});}
export function createExploration(source:SceneData,relief:T.BufferGeometry,height:(x:number,z:number)=>number){
 const root=new T.Group();root.name='spatial-exploration-v3';let state={...EMPTY_EXPLORATION},coverMesh:T.Mesh<T.BufferGeometry,T.ShaderMaterial>|undefined,data:Awaited<ReturnType<typeof loadCover>>|undefined,generation=0,lastClass=0;
 const lens=new T.Vector3(650,400,110),ray=new T.Raycaster(),pointer=new T.Vector2();
 const groups=new Map<string,T.Group>();
 const disposeGroup=(g:T.Object3D)=>{g.traverse(o=>{const m=o as T.Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x.dispose());});root.remove(g);};
 const clearCover=()=>{if(coverMesh){coverMesh.material.uniforms.uCover.value.dispose();disposeGroup(coverMesh);coverMesh=undefined;}};
 function lines(kind:'shore'|'roads'|'walk'){
  const g=new T.Group(),pos:number[]=[],minor:number[]=[],bridges:number[]=[];let segments=0;
  const add=(coords:number[][],bridge=false,major=true)=>{for(let i=1;i<coords.length;i++){const a=coords[i-1],b=coords[i];if(Math.abs(a[0]-112.96)>.09||Math.abs(a[1]-28.19)>.10)continue;const [x,z]=project(a as [number,number]),[xx,zz]=project(b as [number,number]);if(kind==='walk'&&Math.hypot((x+xx)/2-DEMO_FOCUS[0],(z+zz)/2-DEMO_FOCUS[1])>6)continue;if(++segments>14000)return;const y=bridge?Math.max(.25,height(x,z),height(xx,zz))+.075:Math.max(.027,height(x,z)+.045);(kind==='roads'?(bridge?bridges:major?pos:minor):pos).push(x,y,z,xx,bridge?y:Math.max(.027,height(xx,zz)+.045),zz);}};
  for(const f of source.features){if(kind==='shore'){if(f.properties.water==='river'||f.properties.waterway==='riverbank'){if(f.geometry.type==='Polygon')f.geometry.coordinates.forEach(r=>add(r));else if(f.geometry.type==='MultiPolygon')f.geometry.coordinates.forEach(poly=>poly.forEach(r=>add(r)));}}else if(f.geometry.type==='LineString'&&f.properties.highway)add(f.geometry.coordinates,!!f.properties.bridge&&f.properties.bridge!=='no',/motorway|trunk|primary|secondary|tertiary/.test(f.properties.highway));}
  [pos,minor,bridges].forEach((vertices,tier)=>{if(!vertices.length)return;const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const material=new T.LineBasicMaterial({color:kind==='walk'?'#c5aadf':kind==='shore'?'#9fced2':tier===2?'#d3c9aa':tier===1?'#829fa5':'#c2b99b',transparent:true,opacity:.75,depthWrite:false});material.userData.day=new T.Color(kind==='walk'?'#80629c':tier===1?'#758b90':'#4c7178');material.userData.night=material.color.clone();material.userData.weight=tier===1?.5:1;g.add(new T.LineSegments(geometry,material));});return g;
 }
 function nodes(kind:string){const g=new T.Group(),rows=kind==='culture'?CULTURE_NODES:DEMO_NODES.filter(p=>p.kind===kind);const pos=rows.flatMap(p=>{const[x,z]=project(p.coordinate);return [x,height(x,z)+.3,z];});const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));const material=new T.PointsMaterial({color:kind==='culture'?'#cab2de':kind==='services'?'#a7c7d3':'#d7bd87',size:5,sizeAttenuation:false,depthWrite:false});material.userData.day=new T.Color(kind==='culture'?'#765d92':kind==='services'?'#426e82':'#936f40');material.userData.night=material.color.clone();g.add(new T.Points(geometry,material));return g;}
 async function cover(){const token=++generation;if(coverMesh)return;
  const result=await loadCover();if(token!==generation||(!state.cover&&!state.lens))return;data=result;
  const tex=new T.DataTexture(data.values,data.meta.width,data.meta.height,T.RedFormat,T.UnsignedByteType);tex.minFilter=tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;tex.unpackAlignment=1;tex.needsUpdate=true;
  const[west,south,east,north]=data.meta.bounds,[x0,z0]=project([west,north]),[x1,z1]=project([east,south]);
  const geometry=relief.clone(),p=geometry.getAttribute('position');for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+.057);geometry.computeBoundingSphere();
  const material=new T.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,uniforms:{uCover:{value:tex},uBounds:{value:new T.Vector4(x0,z0,x1-x0,z1-z0)},uLens:{value:lens},uLensOn:{value:0},uClass:{value:state.cover},uOld:{value:0},uFade:{value:0},uNight:{value:1},uPixel:{value:1},uHeight:{value:900}},
  vertexShader:'varying vec3 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
  fragmentShader:`varying vec3 vWorld;uniform sampler2D uCover;uniform vec4 uBounds;uniform vec3 uLens;uniform float uLensOn,uClass,uOld,uFade,uNight,uPixel,uHeight;
  vec3 tint(float c){if(c<15.)return vec3(.20,.39,.25);if(c<25.)return vec3(.48,.36,.14);if(c<35.)return vec3(.47,.59,.29);if(c<45.)return vec3(.55,.44,.27);if(c<55.)return vec3(.48,.29,.28);if(c<70.)return vec3(.58,.51,.43);return vec3(.12,.42,.53);}
  void main(){vec2 uv=(vWorld.xz-uBounds.xy)/uBounds.zw;if(any(lessThan(uv,vec2(0.)))||any(greaterThanEqual(uv,vec2(1.))))discard;float code=floor(texture2D(uCover,uv).r*255.+.5);if(code<1.)discard;
  vec2 pixel=gl_FragCoord.xy/uPixel;float inside=(1.-smoothstep(uLens.z-1.,uLens.z+1.,length(pixel-vec2(uLens.x,uHeight-uLens.y))))*uLensOn;
  float oldHit=1.-step(.5,abs(code-uOld)),hit=1.-step(.5,abs(code-uClass));float reveal=mix(oldHit,hit,uFade);
  float grain=step(.76,fract(sin(dot(floor(vWorld.xz*6.),vec2(12.9898,78.233)))*43758.5453));float stripe=step(.8,fract((vWorld.x+vWorld.z)*5.));float pattern=code<15.?grain:code<35.?grain*.65:code<45.?stripe:code<55.?stripe*.45:grain*.6;
  float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));float alpha=mix(reveal*(.045+pattern*.18)*smoothstep(0.,.012,edge),.83,inside);if(alpha<.002)discard;
  vec3 color=mix(tint(code),tint(code)*1.15+vec3(.04),uNight);gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  coverMesh=new T.Mesh(geometry,material);coverMesh.name='georeferenced-landcover';coverMesh.renderOrder=3;root.add(coverMesh);lastClass=state.cover;
 }
 return {root,
 set:async(next:ExplorationState)=>{state={...next};for(const key of ['shore','roads','culture','services','commerce','walk']as const){if(state[key]&&!groups.has(key)){const g=['shore','roads','walk'].includes(key)?lines(key as 'shore'|'roads'|'walk'):nodes(key);groups.set(key,g);root.add(g);}else if(!state[key]&&groups.has(key)){disposeGroup(groups.get(key)!);groups.delete(key);}}
 if(state.cover||state.lens)await cover();else{generation++;if(coverMesh){lastClass=state.cover;coverMesh.material.uniforms.uOld.value=coverMesh.material.uniforms.uClass.value;coverMesh.material.uniforms.uClass.value=0;coverMesh.material.uniforms.uFade.value=0;}}},
 moveLens:(x:number,y:number,r:number)=>lens.set(x,y,r),
 read:(x:number,y:number,w:number,h:number,camera:T.Camera):LensReading=>{if(!data||!coverMesh)return {coordinate:null,code:0,label:'数据准备中',status:'loading'};pointer.set(x/w*2-1,1-y/h*2);ray.setFromCamera(pointer,camera);coverMesh.updateMatrixWorld();const hit=ray.intersectObject(coverMesh,false)[0];return hit?readingAt(data.meta,data.values,hit.point.x,hit.point.z):{coordinate:null,code:0,label:'NoData / 地面不可见',status:'nodata'};},
 update:(dt:number,night:number,pixel:number,h:number,reduced:boolean)=>{groups.forEach((g,key)=>g.children.forEach(o=>{const m=(o as T.Points).material as T.PointsMaterial;if(m?.color&&m.userData.day){m.color.copy(m.userData.day).lerp(m.userData.night,night);m.opacity=key==='walk'?.85:key==='culture'?.8:key==='services'?.6:key==='commerce'?.48:state.walk?.3:.68;m.opacity*=m.userData.weight??1;}}));if(!coverMesh)return;const u=coverMesh.material.uniforms;if(lastClass!==state.cover){u.uOld.value=u.uClass.value;u.uClass.value=state.cover;u.uFade.value=0;lastClass=state.cover;}u.uFade.value=Math.min(1,u.uFade.value+(reduced?1:dt/0.8));u.uNight.value=night;u.uPixel.value=pixel;u.uHeight.value=h;u.uLensOn.value=state.lens?1:0;if(!state.cover&&!state.lens&&u.uFade.value>=1)clearCover();},
 dispose:()=>{generation++;clearCover();groups.forEach(disposeGroup);groups.clear();},
 stats:()=>({cover:!!coverMesh,groups:groups.size,pixels:data?.values.length??0})};
}
