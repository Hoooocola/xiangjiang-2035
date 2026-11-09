/** Reproducible read-only comparison by Pinwall project ID, never by title similarity. */
import {writeFileSync} from 'node:fs';
import reference from '../src/student-works/workbook-reference.json';
import base from '../src/student-works/source.json';
import archive from '../src/student-works/archive-works.json';
import reviews from '../src/student-works/location-review.json';
import bindings from '../src/student-works/spatial-bindings.json';
import {SHOWCASE_PLACES, STUDENT_WORKS, statsForWorks} from '../src/student-works/catalog';
import {workPlaceIds,isPendingWork} from '../src/student-works/relationships';
const names=new Map(SHOWCASE_PLACES.map(p=>[p.id,p.name]));
const source=[...base,...archive];
const report=reference.rows.map(row=>{
 const id='pinwall-'+row.url.split('/').pop(), matches=STUDENT_WORKS.filter(w=>w.id===id),work=matches[0], old=source.find(w=>w.id===id);
 const review=(reviews as Record<string,{placeIds:string[]}>)[id];
 const before=old?[...new Set([...(old.placeId?[old.placeId]:[]),...(review?.placeIds??('placeIds' in old?old.placeIds as string[]:[]))])]:[];
 const after=work?workPlaceIds(work):[], missingPlaces=after.filter(id=>!names.has(id));
 const evidence=(bindings as Record<string,{evidence:string}>)[id]?.evidence??'';
 const action=row.seq===10?'原选址为空，保留待核查，不补坐标':row.seq===42?'旧表端点截断；保留先前修订依据的双地点并披露版本差异，不推断完整走廊几何':row.seq===48?'保留已核实鹅洲岛关联；全域及其他具体地点需新的来源核实后再添加':row.site==='湘江整体'?'归入湘江整体，无点位，不计入未绑定':!after.length?'原名称保留，缺有效地点 ID/核实坐标，待补来源':row.site!==work?.originalSite?'保留原表与已确认修订名称，不覆写既有记录':'保留已核实 ID 关联';
 return{sequence:row.seq,excelRow:row.row,year:Number(row.year),title:row.title,pinwallId:id,sourceSite:row.site,currentTitle:work?.title??null,beforePlaceIds:before,beforePlaceNames:before.map(id=>names.get(id)??id),placeId:work?.placeId??null,placeIds:after,placeNames:after.map(id=>names.get(id)??id),scope:work?.spatialScope??null,matched:!!work&&!missingPlaces.length&&!isPendingWork(work),duplicate:matches.length>1,missingWork:!work,missingPlace:!!work&&isPendingWork(work),invalidPlaceIds:missingPlaces,titleDiffers:!!work&&work.title!==row.title,yearMatches:work?.year===Number(row.year),action,evidence};
});
const summary={source:{file:reference.file,sha256:reference.sha256,sheet:reference.sheet},rows:report.length,years:Object.fromEntries([2024,2025,2026].map(y=>[y,report.filter(r=>r.year===y).length])),uniqueIds:new Set(report.map(r=>r.pinwallId)).size,missingWorks:report.filter(r=>r.missingWork).length,duplicates:report.filter(r=>r.duplicate).length,invalidPlaceIds:report.flatMap(r=>r.invalidPlaceIds),unlocatedWorks:report.filter(r=>r.missingPlace).length,stats:statsForWorks(STUDENT_WORKS),rowsAudit:report};
if(summary.rows!==51||summary.uniqueIds!==51||summary.missingWorks||summary.duplicates||summary.invalidPlaceIds.length||report.some(r=>!r.yearMatches))throw Error('Workbook/catalog integrity mismatch');
writeFileSync('docs/course-bindings/audit-51.json',JSON.stringify(summary,null,2)+'\n');
const esc=(s:unknown)=>String(s??'—').replaceAll('|','／').replaceAll('\n',' ');
writeFileSync('docs/course-bindings/AUDIT_51.md',`# 课程作品 51 件核对\n\n来源：${reference.file} / ${reference.sheet}，SHA256：${reference.sha256}。按 Pinwall ID 匹配，不依赖中文名称。工作簿只读，未上传原工作簿。\n\n2024：10；2025：2；2026：39。唯一项目 51，缺作品 0，重复 0，无效地点 ID 0。${summary.unlocatedWorks} 件仍缺有效地点关联，明确保留待核查。5 件原选址“湘江整体”属于全域类别，无经纬度、无点位。\n\n“当前绑定”是修复前网站绑定，“交付绑定”是独立分支的规范化结果。第 42 条沿用仓库已有的用户修订依据，旧表并不能单独证明完整端点。第 48 条没有凭标题擅自增加具体地点。作品名称和原选址的旧表／网站差异保存在 JSON 中；没有用旧表覆盖已确认修订。\n\n|序号／单元格|年份|项目名称|Pinwall ID|表格原选址|当前绑定 ID／名称|交付绑定／分类|成功匹配地点或全域|重复|缺作品|缺地点|建议动作|\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`+report.map(r=>[`${r.sequence} / ${r.excelRow}`,r.year,r.title,`[${r.pinwallId.replace('pinwall-','')}](${reference.rows.find(x=>x.seq===r.sequence)!.url})`,r.sourceSite||'空',r.beforePlaceIds.map((id,i)=>id+' / '+r.beforePlaceNames[i]).join('；')||'无',r.scope==='corridor'?'湘江整体（无点位）':r.placeIds.map((id,i)=>id+' / '+r.placeNames[i]).join('；')||'待核查',r.matched?'是':'否',r.duplicate?'是':'否',r.missingWork?'是':'否',r.missingPlace?'是':'否',r.action].map(esc).join('|')).map(s=>'|'+s+'|').join('\n')+'\n\n逐条证据及名称差异见 [audit-51.json](audit-51.json)。有效地理绑定不等同于精确测绘范围，沿用各地点现有精度说明。\n');
console.log(JSON.stringify({...summary,rowsAudit:undefined},null,2));
