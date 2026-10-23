// Offline, reproducible source matching. Never geocode from PDF pixel positions.
import fs from 'node:fs';
import osmtogeojson from 'osmtogeojson';
const seeds=JSON.parse(fs.readFileSync('src/places/site-seeds.json','utf8'));
const elements=new Map();
for(const file of fs.readdirSync('data/osm').filter(f=>f.endsWith('.json'))){const d=JSON.parse(fs.readFileSync(`data/osm/${file}`,'utf8'));for(const e of d.elements??[])elements.set(`${e.type}/${e.id}`,e);}
const converted=osmtogeojson({elements:[...elements.values()]},{flatProperties:true}).features;
const scene=JSON.parse(fs.readFileSync('public/data/xiangjiang.geojson','utf8')).features;
const byId=new Map([...converted,...scene].map(f=>[f.id,f]));
const pdf='docs/references/xiangjiang-site-classification.pdf';
const flatten=c=>typeof c[0]==='number'?[c]:c.flatMap(flatten);
const center=g=>{const p=flatten(g.coordinates);return [0,1].map(i=>+(p.reduce((s,p)=>s+p[i],0)/p.length).toFixed(7));};
const pointFallback={'铜官窑':[112.811,28.434],'昭山风景区':[112.939,27.963],'鹅洲':[112.9481,28.0099]};
const existingId={'铜官窑':'tongguan','昭山风景区':'zhaoshan','鹅洲':'ezhou','岳麓山':'yuelu','橘子洲':'juzizhou'};
const sites=seeds.map(seed=>{
 const names=[seed.name,...seed.aliases];
 let candidates=[...byId.values()].filter(f=>names.includes(f.properties?.name)&&!f.properties?.railway&&!f.properties?.public_transport&&!f.properties?.highway);
 candidates.sort((a,b)=>Number(b.geometry.type.includes('Polygon'))-Number(a.geometry.type.includes('Polygon')));
 const f=Object.hasOwn(seed,'preferredOsmId')?(seed.preferredOsmId?byId.get(seed.preferredOsmId):undefined):candidates[0];
 const polygon=f?.geometry.type.includes('Polygon');
 return {id:seed.id,name:seed.name,category:seed.category,approximateLocation:f?center(f.geometry):pointFallback[seed.name]??null,geometry:polygon?f.geometry:null,spatialExtentStatus:polygon?'open-gis':f?'point-only':pointFallback[seed.name]?'approximate':'unverified',importance:seed.category==='ecology'||seed.category==='island'?1:.85,source:[pdf,...(f?[`OpenStreetMap ${f.id} · repository data/osm`]:pointFallback[seed.name]?['existing project PLACES approximate location']:[])],verified:!!f,displayPriority:seed.category==='ecology'?90:seed.category==='island'?85:65,notes:(seed.notes??'')+(f?' 已匹配开放地图对象，不代表测绘或研究范围认证。':pointFallback[seed.name]?' 使用既有近似地点，边界待核验。':' 尚无可靠坐标；不生成亮区或定位标记。')};
});
const focus=[];
for(const s of sites){
 let geometry=s.geometry,verified=!!geometry,source=geometry?s.source[1]:'',width=s.category==='ecology'?1700:s.category==='island'?650:750;
 if(!geometry&&pointFallback[s.name]){
  // A manually declared visual context envelope, NOT an inferred survey boundary.
  const [x,y]=s.approximateLocation;const offsets=s.name==='铜官窑'?[[-.008,-.008],[.006,-.009],[.015,-.003],[.019,.009],[.007,.017],[-.007,.012]]:s.name==='昭山风景区'?[[-.009,-.012],[.012,-.009],[.022,.002],[.014,.015],[-.002,.018],[-.012,.006]]:[[-.006,-.015],[.004,-.013],[.008,.002],[.002,.015],[-.007,.011],[-.009,-.002]];
  const ring=offsets.map(([dx,dy])=>[+(x+dx).toFixed(7),+(y+dy).toFixed(7)]);ring.push(ring[0]);geometry={type:'Polygon',coordinates:[ring]};source='Approximate · existing project point + manually declared visual context; not a site boundary';width=s.name==='鹅洲'?750:1800;
 }
 if(geometry)focus.push({id:`focus-${s.id}`,name:s.name,siteId:s.id,siteCategory:s.category,geometry,importance:s.importance,extentSource:source,verified,displayPriority:s.displayPriority,transitionWidth:width,visualIntensity:s.category==='ecology'?.82:s.category==='island'?.88:.92,optionalRelatedPlaces:existingId[s.name]?[existingId[s.name]]:[]});
}
fs.writeFileSync('src/places/xiangjiang-sites.json',JSON.stringify(sites,null,2)+'\n');
fs.writeFileSync('src/experience/aoi/focus-areas.json',JSON.stringify(focus)+'\n');
console.log({sites:sites.length,openGis:sites.filter(s=>s.geometry).length,points:sites.filter(s=>s.spatialExtentStatus==='point-only').length,unverified:sites.filter(s=>!s.approximateLocation).length,focusAreas:focus.length});
