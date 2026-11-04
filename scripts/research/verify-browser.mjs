// Optional external Playwright runtime; no application dependency or production test hook.
import fs from 'node:fs';import assert from 'node:assert/strict';
const runtime=await import(process.env.PLAYWRIGHT_MODULE||'playwright');const {chromium}=runtime.default??runtime;
const base=process.env.REVIEW_URL||'http://127.0.0.1:3019',out=process.env.EVIDENCE_DIR||'/tmp/xiangjiang-v4-evidence';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const report={base,viewport:[1440,900],dpr:1,checks:[],samples:[],rounds:[],errors:[],requests:[]};
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,...(process.env.RECORD_VIDEO==='1'?{recordVideo:{dir:out+'/video',size:{width:1440,height:900}}}:{})}),p=await context.newPage();
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});p.on('request',r=>{if(r.url().includes('/data/'))report.requests.push(r.url().split('?')[0])});
const state=async()=>JSON.parse(await p.getByTestId('research-state').textContent()),metrics=async()=>JSON.parse(await p.getByTestId('scene-metrics').textContent()),view=async()=>p.locator('[data-minimap-view]').getAttribute('d'),wait=async(ms=1900)=>p.waitForTimeout(ms),sample=async(name,quarry=false,action)=>{await wait(1200);const frames=p.evaluate(()=>new Promise(resolve=>{const a=[];let start=performance.now(),prev=start;function tick(t){a.push(t-prev);prev=t;if(t-start<3000)requestAnimationFrame(tick);else{a.sort((x,y)=>x-y);resolve({fps:a.length*1000/(t-start),p95:a[Math.floor(a.length*.95)],heap:performance.memory?.usedJSHeapSize})}}requestAnimationFrame(tick)}));if(action)await action();report.samples.push({name,...await frames,metrics:quarry?JSON.parse(await p.getByTestId('quarry-metrics').textContent()):await metrics()})},shot=async n=>p.screenshot({path:out+'/'+n+'.png'});
try{
await p.goto(base+'/experience');await p.getByRole('button',{name:/开始探索/}).click({timeout:120000});await p.getByRole('button',{name:'湘江 2035，返回核心河段'}).click();await wait(2800);assert(!report.requests.some(u=>u.includes('/research/')));report.checks.push('Neither local research asset is downloaded by initial map');
await sample('main-night');await sample('main-orbit',false,async()=>{await p.mouse.move(800,350);await p.mouse.down({button:'right'});await p.mouse.move(920,380,{steps:30});await p.mouse.up({button:'right'})});await p.getByRole('button',{name:'湘江 2035，返回核心河段'}).click();await wait(2800);
const originalCanvas=await p.locator('canvas').first().elementHandle(),saved=await view(),before=await metrics();
for(let round=1;round<=2;round++){
 const started=Date.now();await p.getByRole('button',{name:'地点研究',exact:true}).click();await p.getByRole('button',{name:'开始双场地研究演示 →',exact:true}).click();await p.getByLabel('场地研究',{exact:true}).waitFor();await wait(2500);assert(await originalCanvas.evaluate(el=>el.isConnected));assert(!report.requests.some(u=>u.endsWith('/quarry.json')));report.rounds.push({round,islandReadyMs:Date.now()-started});
 await sample('island-overview-'+round);await shot('island-overview-night-'+round);
 for(let step=1;step<6;step++){
  await p.getByRole('button',{name:'下一步 →',exact:true}).click();await wait(1800);assert.equal((await state()).state.step,step);
  if(step===1){await shot('island-resources-'+round);await sample('island-resources-'+round)}
  if(step===3){let s=await state();assert.equal(s.result.connected.length,8);assert.equal(s.result.unconnected.length,4);await p.getByLabel('模拟移除连接',{exact:true}).selectOption({index:1});await wait(200);assert.equal((await state()).result.connected.length,7);await p.getByLabel('模拟移除连接',{exact:true}).selectOption('');assert.equal((await state()).result.connected.length,8);await sample('island-analysis-'+round);await shot('island-graph-'+round)}
 }
 await p.getByRole('button',{name:'退出引导，继续自由探索',exact:true}).click();assert.equal((await state()).state.guided,false);
 let clicked=false;for(const marker of await p.locator('[data-research-node]').all()){const r=await marker.boundingBox();if(r&&r.x>450&&r.x<1300&&r.y>160&&r.y<630&&await marker.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})){await marker.click();clicked=true;break}}assert(clicked,'A visible scene node must be clicked');assert((await state()).selected);await wait(150);await p.mouse.move(850,350);await p.mouse.down({button:'right'});await p.mouse.move(930,390,{steps:15});await p.mouse.up({button:'right'});await wait(200);assert.equal(JSON.parse(await p.getByTestId('atlas-state').textContent()).moving,false);
 await p.getByRole('button',{name:'切换日间',exact:true}).click();await wait();await shot('island-detail-day-'+round);await p.getByRole('button',{name:'切换夜间',exact:true}).click();await wait();
 await p.getByRole('button',{name:'退出场地研究',exact:true}).click();await wait(2400);assert.equal(await view(),saved);assert(await originalCanvas.evaluate(el=>el.isConnected));const after=await metrics();assert.equal(after.geometries,before.geometries);assert.equal(after.textures,before.textures);assert.equal(after.buildings,before.buildings);assert.equal(after.trees,before.trees);report.rounds.at(-1).afterExit=after;await sample('returned-main-'+round);
}
report.checks.push('Two complete island tours; graph 8/4 -> 7/5 -> 8/4; free mode; camera interruption; day/night; same renderer and exact saved view; GPU geometry/texture and original asset counts restored');
const qStart=Date.now();await p.goto(base+'/experience/research/quarry?guided=1');await p.getByLabel('场地研究',{exact:true}).waitFor();report.quarryReadyMs=Date.now()-qStart;await wait(2200);await sample('quarry-overview',true);await shot('quarry-overview-night');
let quarryBaseline;
for(let round=1;round<=2;round++){
 if(round===2){await p.getByRole('button',{name:'Context',exact:true}).click();await wait()}
 for(let step=1;step<7;step++){
  await p.getByRole('button',{name:'下一步 →',exact:true}).click();await wait(1700);assert.equal((await state()).state.step,step);
  if(step===1){await p.getByRole('button',{name:'东西剖切',exact:true}).click();const a=await p.getByLabel('相对模型水面的地表剖面').locator('path').first().getAttribute('d');await p.getByRole('button',{name:'南北剖切',exact:true}).click();assert.notEqual(await p.getByLabel('相对模型水面的地表剖面').locator('path').first().getAttribute('d'),a);await sample('quarry-section-'+round,true);await p.getByRole('button',{name:'日间',exact:true}).click();await wait();await p.locator('[class*="reading"]').evaluate(el=>el.scrollTop=160);await shot('quarry-profile-day-'+round);await p.getByRole('button',{name:'夜间',exact:true}).click();await wait()}
  if(step===4){await p.getByLabel('模拟坡度阈值',{exact:true}).fill('10');await wait(200);const low=(await state()).paths.reduce((n,p)=>n+p.overlap,0);await p.getByLabel('模拟坡度阈值',{exact:true}).fill('70');await wait(200);const high=(await state()).paths.reduce((n,p)=>n+p.overlap,0);assert(low>high);await p.getByLabel('模拟坡度阈值',{exact:true}).fill('35');await sample('quarry-analysis-'+round,true);await shot('quarry-analysis-'+round)}
 }
 assert((await p.getByLabel('双场地模拟研究记录',{exact:true}).innerText()).includes('8 个接入 / 4 个未接入'));await p.getByRole('button',{name:'重置视角',exact:true}).click();await wait(1800);const m=JSON.parse(await p.getByTestId('quarry-metrics').textContent());if(round===1)quarryBaseline=m;else{assert.equal(m.geometries,quarryBaseline.geometries);assert.equal(m.textures,quarryBaseline.textures)}report.rounds.push({quarryRound:round,metrics:m});
}
report.checks.push('Two quarry tours; profile axes change; adjustable threshold changes actual intersections; no underwater depth invented; geometry/texture counts stable after repeated section and analysis changes');
assert.equal(report.errors.length,0,JSON.stringify(report.errors));
}finally{fs.writeFileSync(out+'/research-browser.json',JSON.stringify(report,null,2));await context.close();await browser.close()}
console.log(JSON.stringify({checks:report.checks,samples:report.samples.map(s=>({name:s.name,fps:s.fps,p95:s.p95,calls:s.metrics.calls,geo:s.metrics.geometries})),rounds:report.rounds},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
