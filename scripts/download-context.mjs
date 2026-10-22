/** Public Overture PMTiles extraction; run with `node scripts/download-context.mjs buildings|base|transportation`. */
import {PMTiles} from 'pmtiles';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const theme=process.argv[2]??'buildings';
if(!['buildings','base','transportation'].includes(theme))throw new Error('Unknown theme');
const release='2026-09-23.1',url=`https://tiles.overturemaps.org/${release}/${theme}.pmtiles`;
const cache=process.argv[3]??`.cache/xiangjiang/${theme}`;fs.mkdirSync(cache,{recursive:true});
const exec=promisify(execFile),pending=new Map();
const source={getKey:()=>url,getBytes:async(offset,length)=>{
 const file=`${cache}/range-${offset}-${length}`;
 if(!fs.existsSync(file)||fs.statSync(file).size!==length){
  if(!pending.has(file))pending.set(file,exec('curl',['-sS','--fail','--retry','1','--connect-timeout','8','--max-time','45','--range',`${offset}-${offset+length-1}`,url,'-o',file]));
  try{await pending.get(file);}finally{pending.delete(file);}
 }
 const b=fs.readFileSync(file);if(b.length!==length)throw new Error('Incomplete byte range');return {data:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};
}};
const pm=new PMTiles(source),header=await pm.getHeader(),z=header.maxZoom;
const grid=JSON.parse(fs.readFileSync('public/data/terrain.json'));
const distance=(lon,lat)=>{const x=(lon-112.965)*1113.2*Math.cos(28.195*Math.PI/180),zz=-(lat-28.195)*1113.2,c=Math.max(0,Math.min(grid.width-1,Math.round((x-grid.x0)/grid.dx))),r=Math.max(0,Math.min(grid.height-1,Math.round((zz-grid.z0)/grid.dz)));return grid.riverDistance[r*grid.width+c]/10;};
const tx=lon=>Math.floor((lon+180)/360*2**z),ty=lat=>Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**z),tiles=[];
for(let x=tx(112.73);x<=tx(113.08);x++)for(let y=ty(28.49);y<=ty(27.92);y++){
 const lon=(x+.5)/2**z*360-180,lat=Math.atan(Math.sinh(Math.PI*(1-2*(y+.5)/2**z)))*180/Math.PI;if(distance(lon,lat)<70+(z<14?12:0))tiles.push([x,y]);
}
console.log(theme,tiles.length,'tiles');let index=0,done=0;const failed=[];
async function worker(){while(index<tiles.length){const [x,y]=tiles[index++],out=`${cache}/tile-${z}-${x}-${y}.json`;try{
 if(!fs.existsSync(out)){
  const tile=await pm.getZxy(z,x,y),features=[];
  if(tile){const vt=new VectorTile(new PbfReader(tile.data));for(const [name,layer] of Object.entries(vt.layers)){
   if(theme==='buildings'&&name!=='building'||theme==='transportation'&&name!=='segment'||theme==='base'&&!['land','land_cover','land_use'].includes(name))continue;
   for(let i=0;i<layer.length;i++){const f=layer.feature(i).toGeoJSON(x,y,z);f.properties._layer=name;features.push(f);}
  }}fs.writeFileSync(out,JSON.stringify(features));
 }
 done++;if(done%20===0)console.log(done,'/',tiles.length);
 }catch(e){failed.push([x,y]);console.error('Tile failed',x,y,e.message.slice(0,100));}}}
await Promise.all(Array.from({length:6},worker));
fs.writeFileSync(`${cache}/coverage.json`,JSON.stringify({z,tiles,failed,source:url,release}));
console.log('Complete',done,'failed',failed.length);if(failed.length)process.exitCode=1;
