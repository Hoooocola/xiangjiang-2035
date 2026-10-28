import {GROUND_PALETTES,LOOK,type Theme} from './profile';

export const COLOR_FIELDS=[
 {key:'wall',label:'主立面',group:'建筑'},
 {key:'coolWall',label:'冷色立面',group:'建筑'},
 {key:'roof',label:'屋顶',group:'建筑'},
 {key:'windowWarm',label:'暖色窗灯',group:'建筑'},
 {key:'windowCool',label:'冷色窗灯',group:'建筑'},
 {key:'ground',label:'地面',group:'环境'},
 {key:'road',label:'道路',group:'环境'},
 {key:'park',label:'绿地',group:'环境'},
 {key:'tree',label:'树木',group:'环境'},
 {key:'water',label:'湘江水体',group:'环境'},
 {key:'shore',label:'岸线与桥墩',group:'环境'},
 {key:'bridge',label:'桥面',group:'环境'},
 {key:'bridgeLight',label:'桥梁灯光',group:'环境'},
 {key:'context',label:'背景城市',group:'背景与光照'},
 {key:'background',label:'远景与雾',group:'背景与光照'},
 {key:'sky',label:'环境天空光',group:'背景与光照'},
 {key:'key',label:'主光',group:'背景与光照'},
 {key:'fill',label:'辅助光',group:'背景与光照'},
] as const;
export type ColorKey=typeof COLOR_FIELDS[number]['key'];
export type StudyColors=Record<ColorKey,string>;
export type ColorPair=Record<Theme,StudyColors>;
export const COLOR_STORAGE_KEY='xiangjiang-v4-colors-v1';
export function defaultColorPair():ColorPair{
 const make=(t:Theme):StudyColors=>({wall:LOOK[t].wall,coolWall:'#829696',roof:LOOK[t].roof,windowWarm:'#ffe5bc',windowCool:'#d9e7e8',ground:GROUND_PALETTES.mineral[t],road:LOOK[t].road,park:LOOK[t].park,tree:t==='day'?'#5f7950':'#456047',water:LOOK[t].water,shore:t==='day'?'#b8b6a2':'#567067',bridge:t==='day'?'#b7b3a7':'#7c8275',bridgeLight:'#ffe1af',context:LOOK[t].context,background:LOOK[t].background,sky:LOOK[t].sky,key:LOOK[t].key,fill:LOOK[t].fill});
 return {day:make('day'),night:make('night')};
}
export function normalizeHex(value:string):string|null{
 const text=value.trim();return /^#?[0-9a-f]{6}$/i.test(text)?`#${text.replace('#','').toUpperCase()}`:null;
}
export function colorDocument(colors:ColorPair){return {format:'xiangjiang-v4-colors',version:1,colors};}
export function parseColorDocument(value:unknown):ColorPair{
 if(!value||typeof value!=='object'||!('format' in value)||value.format!=='xiangjiang-v4-colors'||!('version' in value)||value.version!==1||!('colors' in value))throw new Error('请选择本页导出的配色 JSON 文件。');
 const result=defaultColorPair(),pair=value.colors;
 if(!pair||typeof pair!=='object')throw new Error('配色文件缺少昼夜数据。');
 for(const t of ['day','night'] as const){
  if(!(t in pair))throw new Error('配色文件缺少昼夜数据。');
  const colors=(pair as Record<string,unknown>)[t];
  if(!colors||typeof colors!=='object')throw new Error('配色文件内容无效。');
  for(const {key,label} of COLOR_FIELDS){const v=(colors as Record<string,unknown>)[key],hex=typeof v==='string'?normalizeHex(v):null;if(!hex)throw new Error(`${t==='day'?'日间':'夜间'}「${label}」需要六位 HEX 色号。`);result[t][key]=hex;}
 }return result;
}
