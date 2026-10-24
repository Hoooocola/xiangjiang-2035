import type {AtlasRecord,MapObject,LayerId} from './types';
import type {Coordinate} from '../experience/geo';
/** Independent, replaceable fixtures. No field observation, protection boundary or outcome is claimed. */
const source={sourceIds:['demo-v21'],dataStatus:'demo' as const};
const base={...source,placeId:'juzizhou',year:2026,author:'V2.1 演示编辑',themes:['空间阅读'],state:'DEMO DATA / 模拟研究资料 · 未实施调查',evidenceIds:[],relatedIds:[],objectIds:[]};
export const DEMO_RECORDS:AtlasRecord[]=[
 {...base,id:'demo-geography',kind:'FieldRecord',title:'橘子洲 · 空间阅读练习',summary:'以洲岛中段为参照绘制示意阅读范围，用于验证可开关的地理叠加层。',body:['底图永久保留。此范围是编辑绘制的练习范围，不是管理边界或实测地籍。'],objectIds:['demo-geography-area']},
 {...base,id:'demo-ecology',kind:'ResearchProject',title:'橘子洲 · 林荫与岸线观察计划',summary:'模拟生态观察的选区方式：在岛上选取一段绿地，关联待采集证据。',body:['选区不表示保护等级、物种分布或生态监测结果。尚未采集任何测量数据。'],evidenceIds:['demo-observation'],relatedIds:['demo-gap','demo-proposal'],objectIds:['demo-ecology-area']},
 {...base,id:'demo-culture',kind:'ResearchProject',title:'橘子洲 · 地方记忆资料索引',summary:'演示如何将真实地名与待整理的文化资料关联。',body:['尚未导入口述、历史照片或授权资料；不存在虚构受访者和引语。'],relatedIds:['demo-gap'],objectIds:['demo-culture-point']},
 {...base,id:'demo-observation',kind:'FieldRecord',title:'橘子洲 · 步行与停留记录模板',summary:'示意步行序列连接三个观察位置，记录表的时间、人数和访谈内容保持为空。',body:['路线用于演示空间联系，不是导航服务，也不声称已经走访。字段包括时段、天气、活动类型、定位精度与采集同意。'],relatedIds:['demo-ecology','demo-issue'],objectIds:['demo-society-route']},
 {...base,id:'demo-issue',kind:'Issue',title:'橘子洲 · 通行与停留如何协调？',summary:'模拟问题：如何检验通行和停留之间的空间关系？没有现场证据，不能认定实际冲突。',body:['关联模板不是已完成证据。只有完成采集、核验样本后才能提出结论。'],evidenceIds:['demo-observation'],relatedIds:['demo-gap','demo-proposal'],objectIds:['demo-research-point']},
 {...base,id:'demo-gap',kind:'ResearchGap',gapType:'Knowledge Gap',title:'橘子洲 · 时段比较资料待采集',summary:'本 Demo 目录尚无连续时段样本，演示从证据模板进入研究缺口的路径。',body:['这是当前目录的资料缺口，不代表该地点从未被研究。'],evidenceIds:['demo-observation'],relatedIds:['demo-issue','demo-proposal'],objectIds:['demo-research-point']},
 {...base,id:'demo-proposal',kind:'Proposal',proposalType:'Information / Interaction Design',title:'橘子洲 · 轻量阅读提示（概念）',summary:'以可撤除的阅读提示串联观察和反馈；展示方案可用状态，不制造新建筑。',body:['概念尚未实施，位置与运营方式需现场核验。只有在方案介入模式中才显示具体示意触点。'],evidenceIds:['demo-observation'],relatedIds:['demo-gap','demo-issue'],objectIds:['demo-intervention']},
 {...base,id:'demo-yanghu',placeId:'yanghu',kind:'ResearchProject',title:'洋湖 · 湿地边缘阅读练习',summary:'用小范围示意选区演示湿地资料的空间关联。',body:['不是湿地保护红线，没有水质、物种或污染等级判断。'],objectIds:['demo-yanghu-area']},
];
type DemoFeature=MapObject & {category:LayerId;subtype:string;description:string;placeIds:string[];relatedEvidenceIds:string[];relatedProposalIds:string[];sourceStatus:'mock';sourceLabel:string;isMock:true};
const feature=(id:string,title:string,layer:LayerId,recordId:string,type:'Point'|'LineString'|'Polygon',coordinates:Coordinate[],anchor:Coordinate,placeId='juzizhou',proposalId?:string):DemoFeature=>({id,title,layer,category:layer,subtype:type==='Polygon'?'illustrative-study-area':type==='LineString'?'planned-observation-route':'content-index',recordId,geometry:{type,coordinates},anchor,placeId,placeIds:[placeId],...source,precision:'示意位置 · 非实测',description:'编辑绘制的交互示例；实际位置与研究结论需另行核验。',relatedEvidenceIds:placeId==='juzizhou'?['demo-observation']:[],relatedProposalIds:placeId==='juzizhou'?['demo-proposal']:[],sourceStatus:'mock',sourceLabel:'DEMO DATA / 模拟研究资料',isMock:true,...proposalId?{proposalId}:{}});
export const DEMO_FEATURES:DemoFeature[]=[
 feature('demo-geography-area','空间阅读范围 · DEMO','geography','demo-geography','Polygon',[[112.9522,28.184],[112.955,28.184],[112.9592,28.193],[112.9568,28.193],[112.9522,28.184]],[112.9565,28.190]),
 feature('demo-ecology-area','林荫观察选区 · DEMO','ecology','demo-ecology','Polygon',[[112.955,28.188],[112.957,28.188],[112.958,28.191],[112.956,28.191],[112.955,28.188]],[112.9562,28.1895]),
 feature('demo-culture-point','地方记忆索引 · DEMO','culture','demo-culture','Point',[[112.955,28.185]],[112.955,28.185]),
 feature('demo-society-route','步行观察序列 · DEMO','society','demo-observation','LineString',[[112.952,28.180],[112.9545,28.185],[112.957,28.190],[112.959,28.194]],[112.9545,28.185]),
 feature('demo-research-point','问题与证据链 · DEMO','research','demo-issue','Point',[[112.953,28.182]],[112.953,28.182]),
 feature('demo-proposal-index','橘子洲 · 可查看概念方案','proposal','demo-proposal','Point',[[112.9559,28.1857]],[112.9559,28.1857]),
 feature('demo-intervention','阅读提示触点 · DEMO','proposal','demo-proposal','Point',[[112.958,28.192]],[112.958,28.192],'juzizhou','demo-proposal'),
 feature('demo-yanghu-area','湿地阅读选区 · DEMO','ecology','demo-yanghu','Polygon',[[112.931,28.129],[112.935,28.129],[112.936,28.132],[112.933,28.133],[112.931,28.129]],[112.934,28.131],'yanghu'),
 feature('legacy-baxi-index','巴溪洲 · 可查看旧原型方案','proposal','legacy-p4','Point',[[112.9203838,28.0697485]],[112.9203838,28.0697485],'baxi'),
 feature('legacy-xingma-index','兴马洲 · 可查看旧原型方案','proposal','legacy-p6','Point',[[112.9682084,27.9977257]],[112.9682084,27.9977257],'xingma'),
];
