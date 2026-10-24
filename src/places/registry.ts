import {EZHOU_COORDINATE} from '../atlas/places';
import type {Coordinate} from '../experience/geo';
import {XIANGJIANG_SITES,SITE_CATEGORIES} from './index';
import type {SiteCategory} from './types';
import legacy from './legacy-proposals.json';
interface OriginalPlace {id:string;name:string;en:string;coordinate:Coordinate;index:string;category:string;description:string;note:string;distance:number;overview?:boolean}
const ORIGINAL_PLACES: OriginalPlace[] = [
 {id:'juzizhou',name:'橘子洲',en:'ORANGE ISLE',coordinate:[112.9559,28.1857],index:'01',category:'洲岛 / 公共空间',description:'江水在这里分为两道。沿着洲岛展开的步行空间，将城市日常、江岸生态与长沙的文化记忆联系在一起。',note:'真实河岸轮廓 · 场域导览，非研究结论',distance:44},
 {id:'yuelu',name:'岳麓山',en:'YUELU MOUNTAIN',coordinate:[112.929,28.186],index:'02',category:'山水 / 文化景观',description:'从湘江西岸向山麓延伸，山、城、洲与江构成长沙的空间关系。这里预留山麓生态与文化研究的入口。',note:'全球公开高程模型 · 河岸做了视觉平顺处理',distance:62},
 {id:'city',name:'长沙东岸',en:'THE CITY WATERFRONT',coordinate:[112.975,28.197],index:'03',category:'城市 / 滨水生活',description:'街巷、桥梁与沿江空间共同塑造城市的边界。从真实道路和建筑轮廓出发，观察城市如何面向湘江。',note:'OSM 建筑轮廓 · 未知高度为估算体量',distance:43},
 {id:'ezhou',name:'鹅洲',en:'E ZHOU',coordinate:EZHOU_COORDINATE,index:'04',category:'洲岛 / 研究样板',description:'从洲岛的公开资料出发，查看研究、证据与设计构想。公开资料与演示内容分别标记，可沿关联自由探索。',note:'公开地名近似定位 · 非测绘边界',distance:36,overview:true},
 {id:'tongguan',name:'铜官窑附近',en:'TONGGUAN · NORTH',coordinate:[112.811,28.434],index:'05',category:'研究范围 / 北端',description:'本轮研究范围的北端参考。沿湘江向南，串联城市、洲岛与沿岸文化景观。',note:'范围示意点 · 非遗址精确边界',distance:65,overview:true},
 {id:'zhaoshan',name:'昭山附近',en:'ZHAOSHAN · SOUTH',coordinate:[112.939,27.963],index:'06',category:'研究范围 / 南端',description:'本轮研究范围的南端参考，与铜官窑附近共同界定湘江研究长廊。',note:'范围示意点 · 非景区精确边界',distance:65,overview:true},
 {id:'moon-island',name:'月亮岛',en:'MOON ISLAND',coordinate:[112.9325093,28.3018335],index:'07',category:'洲岛 / 北段生态',description:'以月亮岛的开放地理轮廓观察北段河流与周边城市空间。西岸大泽湖尚待可靠边界核验，当前未将它划为已验证重点范围。',note:'导航点由 OSM 多边形采样推导 · 非精确测绘中心',distance:95,overview:true},
 {id:'yanghu',name:'洋湖湿地',en:'YANGHU WETLAND',coordinate:[112.9344092,28.1302825],index:'08',category:'生态自然 / 湿地',description:'沿开放地理数据中的湿地与公园边界组织展示，保留水体、生态地块和周边道路的空间联系。',note:'OSM 公园多边形 · 不代表湿地保护红线',distance:70,overview:true},
 {id:'baxi',name:'巴溪洲',en:'BAXI ISLAND',coordinate:[112.9203838,28.0697485],index:'09',category:'洲岛 / 南段生态',description:'从完整洲岛轮廓观察南段岸线与城市环境。相邻大王山尚缺核验边界，其背景地形保留，不伪造景区范围。',note:'OSM 洲岛轮廓 · 周边背景与研究范围分别管理',distance:95,overview:true},
 {id:'xingma',name:'兴马洲',en:'XINGMA ISLAND',coordinate:[112.9682084,27.9977257],index:'10',category:'洲岛 / 南段生态',description:'与鹅洲相邻的南段洲岛。展示保持岛屿整体，并保留江岸与周边地理背景，尚未编入田野研究档案。',note:'OSM 洲岛轮廓 · 无研究资料不表示未被研究',distance:85,overview:true},
];

export interface Place extends OriginalPlace {siteCategory:SiteCategory;relatedResearchIds:string[];relatedProposalIds:string[];source:string[];verificationStatus:string}
const aliases:Record<string,string>={'橘子洲':'juzizhou','岳麓山':'yuelu','鹅洲':'ezhou','铜官窑':'tongguan','昭山风景区':'zhaoshan','月亮岛':'moon-island','洋湖湿地':'yanghu','巴溪洲':'baxi','兴马洲':'xingma'};
const all:Place[]=ORIGINAL_PLACES.map(p=>{
 const site=XIANGJIANG_SITES.find(s=>aliases[s.name]===p.id);
 return {...p,siteCategory:site?.category??'waterfront',relatedResearchIds:p.id==='ezhou'?['research-2018','research-2024','research-2026-demo']:[],relatedProposalIds:[...legacy.filter(l=>l.placeIds.includes(p.id)).map(l=>l.id),...(p.id==='ezhou'?['proposal-care']:[])],source:site?.source??['Legacy navigation / OSM context'],verificationStatus:site?.spatialExtentStatus??'approximate'};
});
for(const site of XIANGJIANG_SITES){
 if(!site.approximateLocation||aliases[site.name])continue;
 all.push({id:site.id,name:site.name,en:SITE_CATEGORIES[site.category].slice(3),coordinate:site.approximateLocation,index:String(all.length+1).padStart(2,'0'),category:SITE_CATEGORIES[site.category],siteCategory:site.category,description:`${site.name} · ${SITE_CATEGORIES[site.category].slice(3)}。地点来自场域参考与开放地理数据，研究成果需独立核验。`,note:site.notes,distance:site.category==='ecology'?72:48,overview:true,relatedResearchIds:[],relatedProposalIds:[],source:site.source,verificationStatus:site.spatialExtentStatus});
}
/** One authoritative entry per actual place; content never creates extra place markers. */
export const MAP_PLACES=all;
export const PENDING_PLACES=[{id:'jiefangyuan',name:'解放垸',coordinates:null,category:'community' as const,description:'旧原型方案关联地点，坐标未核验。',relatedResearchIds:[],relatedProposalIds:['legacy-p8'],source:['prototype-html/js/data.js @ 3bf2d3e'],verificationStatus:'unverified'}];
export const PLACE_REGISTRY=[...all.map(p=>({...p,coordinates:p.coordinate})),...PENDING_PLACES];
