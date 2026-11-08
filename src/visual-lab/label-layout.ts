export interface LabelRect{x:number;y:number;width:number;height:number}
export function placeLabel(sx:number,sy:number,offset:[number,number],width:number,height:number,blocked:LabelRect[],labelWidth=220):{x:number;y:number;path:string}|undefined{
 const overlap=(a:LabelRect,b:LabelRect)=>a.x<b.x+b.width+10&&a.x+a.width>b.x-10&&a.y<b.y+b.height+8&&a.y+a.height>b.y-8;
 const preferred=offset[0]<0?-1:1;
 for(const side of[preferred,-preferred])for(const dy of[offset[1],-offset[1],0,90,-90]){
  const x=Math.max(18,Math.min(width-labelWidth-18,sx+(side>0?40:-labelWidth-40))),y=Math.max(150,Math.min(height-130,sy+dy));
  const box={x,y,width:labelWidth,height:52};if(blocked.some(b=>overlap(box,b)))continue;
  const ex=Math.max(x,Math.min(x+labelWidth,sx)),ey=Math.max(y,Math.min(y+52,sy));
  if(Math.hypot(ex-sx,ey-sy)>230)continue;
  return{x,y,path:`M${sx.toFixed(2)} ${sy.toFixed(2)}L${ex.toFixed(2)} ${ey.toFixed(2)}`};
 }
}
