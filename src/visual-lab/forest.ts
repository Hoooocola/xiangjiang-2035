import * as T from 'three';
import {branch,merge,lineObject,segments,seeded,LAB_COLORS} from './geometry';
import {ECO_ZONES,insideRing} from './data';
import {quarryHeight,slopeDegrees} from '../place-research/analysis';
import type {QuarryAsset} from '../place-research/types';
export interface Crown{x:number;z:number;radius:number}
/** A locally authored botanical study, not a species or vegetation survey.
 * Leaf instances share one curved shape. LOD removes evenly distributed leaf
 * samples, retaining every tree; technical mode uses branch/crown structure. */
export function createResearchForest(asset:QuarryAsset){
 const root=new T.Group(),woodParts:T.BufferGeometry[]=[],grassParts:T.BufferGeometry[]=[],skeleton:number[]=[],envelopes:number[]=[],crowns:Crown[]=[],random=seeded(4203),positions:T.Vector3[]=[],leaves:{matrix:T.Matrix4;color:T.Color}[][]=[];
 const shape=new T.Shape();shape.moveTo(0,-.6);shape.quadraticCurveTo(-.4,-.1,0,.6);shape.quadraticCurveTo(.42,.1,0,-.6);
 const leaf=new T.ShapeGeometry(shape,2);leaf.rotateX(-Math.PI/2);const lp=leaf.attributes.position;for(let i=0;i<lp.count;i++)lp.setY(i,.16*(1-Math.abs(lp.getZ(i)/.6)));leaf.computeVertexNormals();
 const heights=(x:number,z:number)=>quarryHeight(x,z,asset.outline)/100,dummy=new T.Object3D();
 for(let x=-390;x<-105;x+=15)for(let z=-365;z<-175;z+=16){
  const tx=x+(random()-.5)*13,tz=z+(random()-.5)*14;if(!insideRing(tx,tz,ECO_ZONES[0].ring)||slopeDegrees(tx,tz,asset.outline)>30||random()<.18)continue;
  const base=new T.Vector3(tx/100,heights(tx,tz),tz/100),height=.075+random()*.085,width=.035+random()*.035,angle=random()*Math.PI*2,top=base.clone().add(new T.Vector3(Math.cos(angle)*.008,height*.68,Math.sin(angle)*.008)),treeLeaves:{matrix:T.Matrix4;color:T.Color}[]=[];
  positions.push(base);crowns.push({x:tx,z:tz,radius:width*100});woodParts.push(branch(base,top,.0035,.0012));skeleton.push(...segments([base,top]));const tips:T.Vector3[]=[];
  for(let arm=0;arm<9;arm++){
   const a=angle+arm*2.399,anchor=base.clone().lerp(top,.3+arm*.065),tip=base.clone().add(new T.Vector3(Math.cos(a)*width*(.55+random()*.35),height*(.6+random()*.4),Math.sin(a)*width*(.55+random()*.35)));
   woodParts.push(branch(anchor,tip,.0016,.0004));skeleton.push(...segments([anchor,tip]));tips.push(tip);
   for(let twig=0;twig<3;twig++){
    const q=tip.clone().add(new T.Vector3((random()-.5)*width*.5,(random()-.2)*.025,(random()-.5)*width*.5));woodParts.push(branch(tip.clone().lerp(anchor,.2),q,.0006,.00015));skeleton.push(...segments([tip.clone().lerp(anchor,.2),q]));
    for(let i=0;i<65;i++){
     const r=Math.cbrt(random()),theta=random()*Math.PI*2,vertical=random()*2-1,horizontal=Math.sqrt(1-vertical*vertical),size=.004+random()*.003;
     dummy.position.set(q.x+Math.cos(theta)*horizontal*r*width*.5,q.y+vertical*r*height*.14,q.z+Math.sin(theta)*horizontal*r*width*.5);
     dummy.rotation.set((random()-.5)*1.8,random()*Math.PI*2,(random()-.5)*1.2);dummy.scale.set(size,size,size*.65);dummy.updateMatrix();
     treeLeaves.push({matrix:dummy.matrix.clone(),color:new T.Color().setHSL(.20+random()*.10,.28+random()*.25,.20+random()*.20)});
    }
   }
  }
  leaves.push(treeLeaves);
  // Crown sections are derived from branch reach, not per-leaf wireframes.
  const maxRadius=Math.max(...tips.map(p=>Math.hypot(p.x-base.x,p.z-base.z)));
  for(let level=0;level<4;level++){const pts:T.Vector3[]=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2,r=maxRadius*(.75+.15*Math.sin(a*3+positions.length)+.1*Math.cos(a*5-positions.length))*Math.sin((level+1)/5*Math.PI);pts.push(new T.Vector3(base.x+Math.cos(a)*r,base.y+height*(.48+level*.15)+.007*Math.sin(a*3),base.z+Math.sin(a)*r))}envelopes.push(...segments(pts))}
 }
 for(let i=0;i<540;i++){const x=-385+random()*280,z=-360+random()*185;if(!insideRing(x,z,ECO_ZONES[0].ring)||slopeDegrees(x,z,asset.outline)>35)continue;const y=heights(x,z);for(let j=0;j<5;j++){const a=random()*Math.PI*2,h=.006+random()*.009,w=.0007,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([x/100-w,y,z/100,x/100+w,y,z/100,x/100+Math.cos(a)*.003,y+h,z/100+Math.sin(a)*.003],3));g.computeVertexNormals();grassParts.push(g)}}
 const count=leaves.reduce((n,a)=>n+a.length,0),wood=new T.Mesh(merge(woodParts),new T.MeshStandardMaterial({color:'#5f5c43',roughness:1})),foliage=new T.InstancedMesh(leaf,new T.MeshStandardMaterial({side:T.DoubleSide,roughness:1}),count),grass=new T.Mesh(merge(grassParts),new T.MeshStandardMaterial({color:'#637747',side:T.DoubleSide,roughness:1}));
 let index=0;for(let i=0;i<1755;i++)for(const tree of leaves){if(!tree[i])continue;foliage.setMatrixAt(index,tree[i].matrix);foliage.setColorAt(index,tree[i].color);index++}
 foliage.computeBoundingSphere();wood.castShadow=foliage.castShadow=true;foliage.receiveShadow=grass.receiveShadow=true;root.add(wood,foliage,grass);
 const structure=lineObject(skeleton,LAB_COLORS.purple,.65),canopy=lineObject(envelopes,LAB_COLORS.cyan,.38);root.add(structure,canopy);structure.visible=canopy.visible=false;
 return{root,crowns,treeCount:positions.length,anchor:positions[Math.floor(positions.length*.55)]??new T.Vector3(-2.6,.7,-2.6),updateLod:(distance:number)=>{foliage.count=distance>6?Math.floor(count*.5):count},setTechnical:(active:boolean,partial=false)=>{structure.visible=canopy.visible=active;foliage.visible=wood.visible=grass.visible=!active||partial;const m=foliage.material as T.MeshStandardMaterial;m.transparent=partial;m.opacity=partial?.5:1}};
}
