/** Local study field, 50 m samples; same inward blend construction as the approved diagram. */
export const STUDY_BOUNDS={x:-140,z:-120,w:265,h:240,step:.5};
export function inwardWeights(support:Uint8Array,cols:number,rows:number,step:number,blend=2){
 const distance=Float32Array.from(support,v=>v?1e6:0),diagonal=Math.SQRT2;
 for(let r=1;r<rows;r++)for(let c=1;c<cols-1;c++){const i=r*cols+c;distance[i]=Math.min(distance[i],distance[i-1]+1,distance[i-cols]+1,distance[i-cols-1]+diagonal,distance[i-cols+1]+diagonal);}
 for(let r=rows-2;r>=0;r--)for(let c=cols-2;c>0;c--){const i=r*cols+c;distance[i]=Math.min(distance[i],distance[i+1]+1,distance[i+cols]+1,distance[i+cols-1]+diagonal,distance[i+cols+1]+diagonal);}
 return Float32Array.from(distance,(v,i)=>{const t=Math.max(0,Math.min(1,(v-.5)*step/blend));return support[i]?t*t*(3-2*t):0;});
}
export function createStudyField(terrain:{importance:(x:number,z:number)=>number;forest:(x:number,z:number)=>number}){
 const b=STUDY_BOUNDS,cols=b.w/b.step,rows=b.h/b.step,support=new Uint8Array(cols*rows),forest=new Float32Array(cols*rows);
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*cols+c,x=b.x+(c+.5)*b.step,z=b.z+(r+.5)*b.step;support[i]=terrain.importance(x,z)>0?1:0;forest[i]=terrain.forest(x,z);}
 const weights=inwardWeights(support,cols,rows,b.step),pixels=new Float32Array(cols*rows*4);
 weights.forEach((v,i)=>pixels.set([v,forest[i],support[i],1],i*4));
 const sample=(x:number,z:number)=>{const c=Math.floor((x-b.x)/b.step),r=Math.floor((z-b.z)/b.step);return c<0||r<0||c>=cols||r>=rows?0:weights[r*cols+c];};
 // B stores a low-frequency proximity field, stamped from actual building centres below.
 const addBuilding=(x:number,z:number,height:number)=>{
  const radius=Math.min(1.1,.38+height*.18),c0=Math.floor((x-b.x)/b.step),r0=Math.floor((z-b.z)/b.step),n=Math.ceil(radius/b.step);
  if(c0< -n||r0< -n||c0>=cols+n||r0>=rows+n)return;
  for(let r=Math.max(0,r0-n);r<=Math.min(rows-1,r0+n);r++)for(let c=Math.max(0,c0-n);c<=Math.min(cols-1,c0+n);c++){
   const d=Math.hypot(b.x+(c+.5)*b.step-x,b.z+(r+.5)*b.step-z),v=Math.max(0,1-d/radius),i=(r*cols+c)*4+2;
   pixels[i]=Math.max(pixels[i],v*v*(3-2*v));
  }
 };
 for(let i=0;i<support.length;i++)pixels[i*4+2]=0;
 const setBlend=(meters:number)=>{const next=inwardWeights(support,cols,rows,b.step,meters/100);weights.set(next);weights.forEach((v,i)=>{pixels[i*4]=v;});};
 return {pixels,cols,rows,bounds:b,sample,addBuilding,setBlend};
}
