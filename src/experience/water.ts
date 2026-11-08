import * as THREE from 'three';
import clipping from 'polygon-clipping';
import {polygons,project,inRing,type SceneData,type Coordinate} from './geo';
import {isSurfaceWater,isRiverWater} from './water-tags.mjs';

type Point=[number,number];
export interface WaterSurface {id:string;rings:Coordinate[][];projected:Point[][];river:boolean;level:number;bounds:[number,number,number,number]}
/** Static spatial index, built once. Water never depends on AOI or UI filters. */
export function waterSurfaces(data:SceneData,height:(x:number,z:number)=>number){
 const surfaces:WaterSurface[]=[],buckets=new Map<string,WaterSurface[]>(),size=30;
 for(const f of data.features){if(!isSurfaceWater(f.properties))continue;
  for(const rings of polygons(f)){
   const projected=rings.map(r=>r.map(project)),outer=projected[0];if(!outer?.length)continue;
   const xs=outer.map(p=>p[0]),zs=outer.map(p=>p[1]),river=isRiverWater(f.properties);
   // Render datum, not a measured lake elevation. Median shore avoids an isolated DEM spike.
   const shore=outer.map(([x,z])=>height(x,z)).sort((a,b)=>a-b);
   const s:WaterSurface={id:f.id,rings,projected,river,level:river?.015:shore[Math.floor(shore.length/2)]+.015,bounds:[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)]};
   surfaces.push(s);const [a,b,c,d]=s.bounds;
   for(let x=Math.floor(a/size);x<=Math.floor(c/size);x++)for(let z=Math.floor(b/size);z<=Math.floor(d/size);z++){const key=`${x},${z}`;const list=buckets.get(key)??[];list.push(s);buckets.set(key,list);}
  }
 }
 const intersects=(bounds:WaterSurface['bounds'])=>{
  const [a,b,c,d]=bounds,result=new Set<WaterSurface>();for(let x=Math.floor(a/size);x<=Math.floor(c/size);x++)for(let z=Math.floor(b/size);z<=Math.floor(d/size);z++)for(const s of buckets.get(`${x},${z}`)??[])if(s.bounds[0]<=c&&s.bounds[2]>=a&&s.bounds[1]<=d&&s.bounds[3]>=b)result.add(s);return [...result];
 };
 const at=(x:number,z:number)=>(buckets.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)??[]).find(s=>inRing(x,z,s.projected[0])&&!s.projected.slice(1).some(r=>inRing(x,z,r)));
 return {surfaces,at,intersects};
}
/** Cut only inland-water footprints from the visible DEM. Inner-ring islands survive.
 * River and source DEM remain byte-for-byte unchanged; no global flattening or depth-test bypass.
 * New vertices interpolate the original triangle, so adjacent land retains its shape. */
export function cutInlandWater(relief:THREE.BufferGeometry,index:ReturnType<typeof waterSurfaces>){
 const pos=relief.attributes.position,indices=relief.index;if(!indices)throw new Error('Indexed terrain expected');
 const output:number[]=[],normals:number[]=[],uvs:number[]=[],normal=relief.attributes.normal,uv=relief.attributes.uv;
 const push=(ids:number[])=>{for(const i of ids){output.push(pos.getX(i),pos.getY(i),pos.getZ(i));normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));if(uv)uvs.push(uv.getX(i),uv.getY(i));}};
 for(let i=0;i<indices.count;i+=3){
  const ids=[indices.getX(i),indices.getX(i+1),indices.getX(i+2)];
  const triangle=ids.map(id=>[pos.getX(id),pos.getZ(id)] as Point);
  const xs=triangle.map(p=>p[0]),zs=triangle.map(p=>p[1]);
  const lakes=index.intersects([Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)]).filter(s=>!s.river);
  if(!lakes.length){push(ids);continue;}
  const remaining=clipping.difference([[...triangle,triangle[0]]],...lakes.map(s=>s.projected));
  const [a,b,c]=triangle,ay=pos.getY(ids[0]),by=pos.getY(ids[1]),cy=pos.getY(ids[2]);
  const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  const y=(x:number,z:number)=>{const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(z-c[1]))/det,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(z-c[1]))/det;return ay*u+by*v+cy*(1-u-v);};
  for(const poly of remaining){
   const rings=poly.map(r=>r.slice(0,-1).map(([x,z])=>new THREE.Vector2(x,z)));
   const vertices=rings.flat(),faces=THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1));
   for(const face of faces){const points=face.map(j=>vertices[j]);
    // Shape triangulation runs in XZ; ensure the land normals remain upward.
    const [p,q,r]=points;if((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x)>0)points.reverse();
    for(const p of points){output.push(p.x,y(p.x,p.y),p.y);const u=((b[1]-c[1])*(p.x-c[0])+(c[0]-b[0])*(p.y-c[1]))/det,v=((c[1]-a[1])*(p.x-c[0])+(a[0]-c[0])*(p.y-c[1]))/det;const n=new THREE.Vector3().fromBufferAttribute(normal,ids[0]).multiplyScalar(u).addScaledVector(new THREE.Vector3().fromBufferAttribute(normal,ids[1]),v).addScaledVector(new THREE.Vector3().fromBufferAttribute(normal,ids[2]),1-u-v).normalize();normals.push(n.x,n.y,n.z);if(uv)uvs.push(uv.getX(ids[0])*u+uv.getX(ids[1])*v+uv.getX(ids[2])*(1-u-v),uv.getY(ids[0])*u+uv.getY(ids[1])*v+uv.getY(ids[2])*(1-u-v));}
   }
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(output,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));if(uv)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));return geometry;
}
