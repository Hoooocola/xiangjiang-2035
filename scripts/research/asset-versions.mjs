import fs from 'node:fs';import {createHash} from 'node:crypto';
const files=['xiangjiang.geojson','environment.json','context.json','terrain.json','inland-water.geojson'];
fs.writeFileSync('src/experience/asset-versions.json',JSON.stringify(Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync('public/data/'+f)).digest('hex').slice(0,12)])),null,2));
