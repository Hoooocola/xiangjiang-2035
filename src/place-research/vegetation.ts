import * as THREE from 'three';import{mergeGeometries}from'three/addons/utils/BufferGeometryUtils.js';
interface Builder{root:THREE.Group;mat:(day:string,night:string,roughness?:number)=>THREE.MeshStandardMaterial}
function crown(kind:number){
 const parts:THREE.BufferGeometry[]=[];const lobes=kind===0?3:kind===1?2:1;
 for(let j=0;j<lobes;j++){const g=new THREE.SphereGeometry(1,10,8),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.1*Math.sin(x*7+z*5+j)*Math.cos(y*5-j);p.setXYZ(i,x*n,y*(1+.06*Math.cos(z*8)),z*n)}g.scale(kind===0?.022:kind===1?.026:.018,kind===0?.032:kind===1?.020:.011,kind===0?.022:kind===1?.023:.018);g.translate(Math.cos(j*2.4)*.012,kind===2?.008:.07+j*.009,Math.sin(j*2.4)*.01);g.computeVertexNormals();parts.push(g)}
 const merged=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());return merged;
}
/** Mixed broadleaf canopy masses and low shrubs. Deterministic reconstruction,
 * not a species survey; three shared instance batches and one trunk batch. */
export function addVegetation(t:Builder,points:THREE.Vector3[],scale:number){
 const leaf=t.mat('#a1b08d','#587c6c'),bark=t.mat('#8c8170','#3f544d'),groups=[[],[],[]]as THREE.Vector3[][],dummy=new THREE.Object3D();
 points.forEach((p,i)=>groups[i%7===0?2:i%3===0?0:1].push(p));let trunks=0;
 for(let kind=0;kind<3;kind++){const ps=groups[kind],mesh=new THREE.InstancedMesh(crown(kind),leaf,ps.length);ps.forEach((p,i)=>{const s=(.68+(i*19%29)/40)*scale;dummy.position.copy(p);dummy.rotation.set(0,i*2.399,0);dummy.scale.set(s,s*(.85+i%3*.13),s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color().setHSL(.20+(i%5)*.015,.14+(i%3)*.025,.48+(i%7)*.025))});mesh.castShadow=kind!==2;mesh.receiveShadow=true;mesh.computeBoundingSphere();t.root.add(mesh);if(kind<2)trunks+=ps.length}
 const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0035,.007,.075,5),bark,trunks);let i=0;for(const ps of groups.slice(0,2))for(const p of ps){const s=(.7+(i*11%23)/35)*scale;dummy.position.copy(p).add(new THREE.Vector3(0,.036*s,0));dummy.scale.set(s,s,s);dummy.rotation.set(0,i*1.7,.06*Math.sin(i));dummy.updateMatrix();trunk.setMatrixAt(i++,dummy.matrix)}trunk.castShadow=true;trunk.computeBoundingSphere();t.root.add(trunk);
}
