/** Fixed-camera colour-study SVGs. Visible masks are vectorised from a CPU depth pass;
 * no screenshot/image is embedded and the interactive map is never changed. */
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import {buildScene} from '../src/experience/scene';
import {makeMaterials} from '../src/experience/materials';
import {terrainSampler} from '../src/experience/terrain';
import {createStudyField} from '../src/experience/style-frame-v4/field';
import {FRAME,SHOTS,DEFAULT_BLEND_METERS,GROUND_PALETTES,LOOK} from '../src/experience/style-frame-v4/profile';

const OUT=path.resolve('exports/river-color-study');
const W=2160,H=1350,N=W*H;
const read=async(name:string)=>JSON.parse(await fs.readFile(`public/data/${name}`,'utf8'));
const [source,grid,context,environment]=await Promise.all(['xiangjiang.geojson','terrain.json','context.json','environment.json'].map(read));
grid.forest=environment.forest;
const data={...source,features:[...source.features,...environment.features]};
const terrain=terrainSampler(grid),field=createStudyField(terrain);field.setBlend(DEFAULT_BLEND_METERS);
const materials=makeMaterials();
console.log('Building the actual scene geometry…');
const built=await buildScene(data,grid,context,materials,()=>{},true);
built.root.updateMatrixWorld(true);
const camera=new THREE.PerspectiveCamera(FRAME.fov,W/H,.2,4500),p=SHOTS.river,[x,y,z]=p.target,d=p.distance;
camera.position.set(x+d*Math.sin(p.polar)*Math.sin(p.azimuth),y+d*Math.cos(p.polar),z+d*Math.sin(p.polar)*Math.cos(p.azimuth));
camera.lookAt(x,y,z);camera.updateMatrixWorld();
const vp=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
const depth=new Float32Array(N).fill(Infinity),roles=new Uint8Array(N),zones=new Uint8Array(N),shades=new Uint8Array(N);
const winU=new Float32Array(N),winV=new Float32Array(N),winSeed=new Float32Array(N),winTall=new Float32Array(N),winAA=new Float32Array(N);
// Stable IDs used in both files. Real geographic objects determine every visible silhouette.
const names=['背景','地面','水体','绿地','道路','建筑_屋顶','建筑_暖色立面','建筑_冷色立面','树木','岸线与桥墩','桥梁','桥梁灯带','窗格_暖色','窗格_冷色'];
const matRole=new Map<THREE.Material,number>([[materials.ground,1],[materials.water,2],[materials.park,3],[materials.contextPark,3],[materials.road,4],[materials.contextRoad,4],[materials.building,6],[materials.tree,8],[materials.shore,9],[materials.bridge,10],[materials.bridgeLight,11]]);
const fract=(n:number)=>n-Math.floor(n);
const hash=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const sun=new THREE.Vector3(-.45,.7,.28).normalize();
type V={x:number;y:number;z:number;w:number;wx:number;wy:number;wz:number};
function clipNear(input:V[]){
 const out:V[]=[];for(let i=0;i<input.length;i++){
  const a=input[i],b=input[(i+1)%input.length],da=a.z+a.w,db=b.z+b.w;
  if(da>=0)out.push(a);
  if((da>=0)!==(db>=0)){const t=da/(da-db),v={} as V;for(const k of Object.keys(a) as (keyof V)[])v[k]=a[k]+(b[k]-a[k])*t;out.push(v);}
 }return out;
}
let triangles=0,visibleTriangles=0;
const point=new THREE.Vector3(),clip=new THREE.Vector4(),normal=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();
const matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
function raster(a:V,b:V,c:V,role:number,seed:number,tall:number,cx:number,cz:number,base:number,normalX:number,normalY:number,normalZ:number){
 const ax=(a.x/a.w*.5+.5)*W,ay=(.5-a.y/a.w*.5)*H,bx=(b.x/b.w*.5+.5)*W,by=(.5-b.y/b.w*.5)*H,cxS=(c.x/c.w*.5+.5)*W,cy=(.5-c.y/c.w*.5)*H;
 const area=(bx-ax)*(cy-ay)-(by-ay)*(cxS-ax);if(area>=-1e-8)return;
 const minX=Math.max(0,Math.floor(Math.min(ax,bx,cxS))),maxX=Math.min(W-1,Math.ceil(Math.max(ax,bx,cxS))),minY=Math.max(0,Math.floor(Math.min(ay,by,cy))),maxY=Math.min(H-1,Math.ceil(Math.max(ay,by,cy)));
 if(minX>maxX||minY>maxY)return;visibleTriangles++;
 const za=a.z/a.w,zb=b.z/b.w,zc=c.z/c.w;
 const shade=Math.max(0,Math.min(3,Math.round((1-Math.max(0,normalX*sun.x+normalY*sun.y+normalZ*sun.z))*3)));
 const facade=role===6||role===7;
 const u=(v:V)=>(Math.abs(normalX)>Math.abs(normalZ)?v.wz-cz:v.wx-cx)/THREE.MathUtils.lerp(.045,.032,tall);
 const va=(a.wy-base)/.033,vb=(b.wy-base)/.033,vc=(c.wy-base)/.033,ua=u(a),ub=u(b),uc=u(c);
 // Same screen-space resolution limit as the facade study, approximated per face.
 const duX=((ub-ua)*(cy-ay)-(uc-ua)*(by-ay))/area,duY=((bx-ax)*(uc-ua)-(cxS-ax)*(ub-ua))/area;
 const dvX=((vb-va)*(cy-ay)-(vc-va)*(by-ay))/area,dvY=((bx-ax)*(vc-va)-(cxS-ax)*(vb-va))/area;
 const aa=Math.max(Math.abs(duX)+Math.abs(duY),Math.abs(dvX)+Math.abs(dvY));
 for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++){
  const sx=px+.5,sy=py+.5;
  const l1=((bx-sx)*(cy-sy)-(by-sy)*(cxS-sx))/area,l2=((cxS-sx)*(ay-sy)-(cy-sy)*(ax-sx))/area,l3=1-l1-l2;
  if(l1<0||l2<0||l3<0)continue;
  const q=l1*za+l2*zb+l3*zc,i=py*W+px;if(q>=depth[i])continue;
  const div=l1/a.w+l2/b.w+l3/c.w,t1=l1/a.w/div,t2=l2/b.w/div,t3=l3/c.w/div;
  const wx=t1*a.wx+t2*b.wx+t3*c.wx,wz=t1*a.wz+t2*b.wz+t3*c.wz;
  const weight=field.sample(facade||role===5?cx:wx,facade||role===5?cz:wz);
  let r=role;
  if(r===1){const col=Math.floor((wx-field.bounds.x)/field.bounds.step),row=Math.floor((wz-field.bounds.z)/field.bounds.step);if(col>=0&&row>=0&&col<field.cols&&row<field.rows&&field.pixels[(row*field.cols+col)*4+1]>.45)r=3;}
  depth[i]=q;roles[i]=r;zones[i]=role===2?4:Math.round(weight*4);shades[i]=shade;
  if(facade){winU[i]=t1*ua+t2*ub+t3*uc;winV[i]=t1*va+t2*vb+t3*vc;winSeed[i]=seed;winTall[i]=tall;winAA[i]=aa;}
 }
}
built.root.traverseVisible(o=>{
 if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;
 let role=matRole.get(o.material);if(role===undefined&&o.material.onBeforeCompile===materials.ground.onBeforeCompile)role=1;
 if(role===undefined||o.renderOrder===-2)return;
 const g=o.geometry,pos=g.getAttribute('position'),idx=g.index,info=g.getAttribute('studyBuilding');
 for(let inst=0;inst<(o instanceof THREE.InstancedMesh?o.count:1);inst++){
  if(o instanceof THREE.InstancedMesh){o.getMatrixAt(inst,instance);matrix.multiplyMatrices(o.matrixWorld,instance);}else matrix.copy(o.matrixWorld);
  for(let t=0;t<(idx?idx.count:pos.count);t+=3){
   triangles++;const verts:V[]=[];let cx=0,cz=0,height=0,base=0;
   for(let j=0;j<3;j++){
    const k=idx?idx.getX(t+j):t+j;point.fromBufferAttribute(pos,k).applyMatrix4(matrix);clip.set(point.x,point.y,point.z,1).applyMatrix4(vp);
    verts.push({x:clip.x,y:clip.y,z:clip.z,w:clip.w,wx:point.x,wy:point.y,wz:point.z});
    if(info&&j===0){const v=o instanceof THREE.InstancedMesh?inst:k;cx=info.getX(v);cz=info.getY(v);height=info.getZ(v);base=info.getW(v);}
   }
   // Whole-triangle homogeneous frustum reject, preserving crossing triangles.
   if(verts.every(v=>v.x< -v.w)||verts.every(v=>v.x>v.w)||verts.every(v=>v.y< -v.w)||verts.every(v=>v.y>v.w)||verts.every(v=>v.z< -v.w)||verts.every(v=>v.z>v.w))continue;
   const [a,b,c]=verts;ab.set(b.wx-a.wx,b.wy-a.wy,b.wz-a.wz);ac.set(c.wx-a.wx,c.wy-a.wy,c.wz-a.wz);normal.crossVectors(ab,ac).normalize();
   const seed=hash(cx,cz),tall=THREE.MathUtils.smoothstep(height,.16,.42);
   const r=role===6?(Math.abs(normal.y)>.75?5:seed>.72&&tall>.5?7:6):role;
   const polygon=clipNear(verts);for(let j=1;j<polygon.length-1;j++)raster(polygon[0],polygon[j],polygon[j+1],r,seed,tall,cx,cz,base,normal.x,normal.y,normal.z);
  }
 }
});
console.log({triangles,visibleTriangles,scene:built.stats});
// Every visible pixel belongs to one material; depth has already removed hidden faces.
// Trace boundary edges into compound paths, then simplify within 0.6 export pixels.
function simplifyRing(points:number[],stride:number){
 if(points.length<8)return points;
 const start=points[0];let split=1,max=0;
 for(let i=1;i<points.length;i++){const dx=points[i]%stride-start%stride,dy=Math.floor(points[i]/stride)-Math.floor(start/stride),d=dx*dx+dy*dy;if(d>max){max=d;split=i;}}
 const reduce=(p:number[])=>{const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const stack=[[0,p.length-1]];
  while(stack.length){const [a,b]=stack.pop()!,ax=p[a]%stride,ay=Math.floor(p[a]/stride),bx=p[b]%stride,by=Math.floor(p[b]/stride),dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;let far=.36,idx=-1;
   for(let i=a+1;i<b;i++){const x=p[i]%stride,y=Math.floor(p[i]/stride),t=den?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)):0,d=(x-ax-t*dx)**2+(y-ay-t*dy)**2;if(d>far){far=d;idx=i;}}
   if(idx>=0){keep[idx]=1;stack.push([a,idx],[idx,b]);}
  }return p.filter((_,i)=>keep[i]);};
 return [...reduce(points.slice(0,split+1)).slice(0,-1),...reduce([...points.slice(split),points[0]]).slice(0,-1)];
}
function contours(labels:Uint16Array){
 const edges=new Map<number,Map<number,number[]>>();
 const add=(id:number,a:number,b:number)=>{let m=edges.get(id);if(!m){m=new Map();edges.set(id,m);}const v=m.get(a);if(v)v.push(b);else m.set(a,[b]);};
 const stride=W+1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,id=labels[i];if(!id)continue;const a=y*stride+x;
  if(y===0||labels[i-W]!==id)add(id,a,a+1);
  if(x===W-1||labels[i+1]!==id)add(id,a+1,a+stride+1);
  if(y===H-1||labels[i+W]!==id)add(id,a+stride+1,a+stride);
  if(x===0||labels[i-1]!==id)add(id,a+stride,a);
 }
 const paths=new Map<number,string>();
 for(const [id,m] of edges){const parts:string[]=[];
  while(m.size){const start=m.keys().next().value as number;let v=start;const points:number[]=[];
   do{points.push(v);const ns=m.get(v);if(!ns)throw new Error('Unclosed vector contour');const n=ns.pop()!;if(!ns.length)m.delete(v);v=n;}while(v!==start);
   const clean=points.filter((v,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return !((a%stride===v%stride&&v%stride===b%stride)||(Math.floor(a/stride)===Math.floor(v/stride)&&Math.floor(v/stride)===Math.floor(b/stride)));});
   if(clean.length<3)continue;
   parts.push(simplifyRing(clean,stride).map((v,i)=>`${i?'L':'M'}${v%stride} ${Math.floor(v/stride)}`).join('')+'Z');
  }paths.set(id,parts.join(''));
 }return paths;
}
const labels=Uint16Array.from(roles,(r,i)=>r?r*5+zones[i]:0);
const basePaths=contours(labels);
const shadeLabels=Uint16Array.from(roles,(r,i)=>r&&shades[i]&&r!==2&&r!==11?r*4+shades[i]:0);
const shadePaths=contours(shadeLabels);
const windowLabels=new Uint16Array(N);
for(let i=0;i<N;i++){
 if((roles[i]!==6&&roles[i]!==7)||zones[i]<2||winAA[i]>.65||winV[i]<1)continue;
 const u=winU[i],v=winV[i],seed=winSeed[i],family=Math.floor(seed*3),fu=fract(u),fv=fract(v);
 const pane=family===1&&winTall[i]>.5?fu>.21&&fu<.76:family===2&&winTall[i]>.5?fv>.18&&fv<.78:fu>.21&&fu<.76&&fv>.18&&fv<.78;
 if(!pane)continue;
 // Use a deterministic occupancy seed; vectors are a study, not baked shader output.
 const lit=hash(Math.floor(u)+seed*41,Math.floor(v/(family===1?5:1))+seed*13)>THREE.MathUtils.lerp(.8,.58,winTall[i]);
 windowLabels[i]=(seed>.7?13:12)*2+(lit?1:0);
}
const windowPaths=contours(windowLabels);
const zoneNames=['背景区','过渡_25','过渡_50','过渡_75','主体区'];
const sourceColors={
 day:['#e9e7df',GROUND_PALETTES.mineral.day,LOOK.day.water,LOOK.day.park,LOOK.day.road,LOOK.day.roof,LOOK.day.wall,'#829696','#5f7950','#b8b6a2','#b7b3a7','#b5b3a5','#617473','#5f777c'],
 night:['#071e1d',GROUND_PALETTES.mineral.night,LOOK.night.water,LOOK.night.park,LOOK.night.road,LOOK.night.roof,LOOK.night.wall,'#829696','#456047','#567067','#7c8275','#ffe1af','#ffe5bc','#d9e7e8'],
};
const xml=(s:string)=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
let pathSerial=0;
const element=(name:string,fill:string,d:string,opacity?:number)=>`<path id="${xml(name)}_${++pathSerial}" fill="${fill}"${opacity===undefined?'':` opacity="${opacity}"`} fill-rule="evenodd" d="${d}"/>`;
await fs.mkdir(OUT,{recursive:true});
for(const theme of ['day','night'] as const){
 const colors=sourceColors[theme],context=LOOK[theme].context;
 const groups=[`<g id="00_背景"><rect width="${W}" height="${H}" fill="${colors[0]}"/></g>`];
 for(let r=1;r<=11;r++){
  const children:string[]=[];
  for(let zone=0;zone<5;zone++){const d=basePaths.get(r*5+zone);if(!d)continue;
   // Two editable fills + opacity preserve the transition when the main colour changes.
   const paths=zone===4?element('主体色',colors[r],d):element('背景色',context,d)+(zone?element('主体混合色',colors[r],d,zone/4):'');
   children.push(`<g id="${String(r).padStart(2,'0')}_${zoneNames[zone]}">${paths}</g>`);
  }
  const shadeParts=[];for(let s=1;s<=3;s++){const d=shadePaths.get(r*4+s);if(d)shadeParts.push(element(`明暗_${s}`,'#000000',d,s*(theme==='day'?.085:.065)));}
  if(shadeParts.length)children.push(`<g id="${r}_可隐藏_体块明暗">${shadeParts.join('')}</g>`);
  groups.push(`<g id="${String(r).padStart(2,'0')}_${names[r]}">${children.join('')}</g>`);
 }
 const windows=[];for(const [id,d] of windowPaths){const r=Math.floor(id/2),lit=id%2===1;const fill=theme==='night'?(lit?colors[r]:'#3c4948'):colors[r];windows.push(element(`${names[r]}_${lit?'点亮':'未点亮'}`,fill,d,theme==='night'&&lit?.9:.4));}
 groups.push(`<g id="12_可隐藏_窗格与窗灯">${windows.join('')}</g>`);
 const svg=`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>湘江2035 河段机位 ${theme==='day'?'日间':'夜间'} 可编辑配色研究</title><desc>Actual scene camera and geometry; visible surface masks vectorised at 2160x1350. Flat material colours with optional face shading. No embedded images, real-time shadows, bloom or reflection. Open paths are never used.</desc>${groups.join('\n')}</svg>`;
 await fs.writeFile(path.join(OUT,`xiangjiang-river-${theme}-layers.svg`),svg);
}
await fs.writeFile(path.join(OUT,'palette.json'),JSON.stringify({width:W,height:H,camera:{...p,fov:FRAME.fov},blendMeters:DEFAULT_BLEND_METERS,layers:names,colors:sourceColors,context:{day:LOOK.day.context,night:LOOK.night.context},method:'CPU depth visibility pass, closed vector boundary paths, 2160x1350 sampling; not editable 3D or shader-exact rendering'},null,2));
console.log('Exported layered SVG files to',OUT);
