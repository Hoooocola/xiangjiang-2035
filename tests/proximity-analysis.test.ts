// 空间邻近分析单元测试：验证测地距离计算与分析结果结构。
import {describe,it,expect} from 'vitest';
import {haversineMeters,pointToSegmentMeters,nearestRoadDistance,runProximityAnalysis} from '../src/experience/real-geodata/analysis';
import type {GbifDataset,OsmRoads} from '../src/experience/real-geodata/types';

describe('haversineMeters',()=>{
 it('计算已知两点测地距离（近似）',()=>{
  // 橘子洲 (112.9559,28.1857) 到洋湖 (112.9344,28.1303)，约 6.5km
  const d=haversineMeters(112.9559,28.1857,112.9344,28.1303);
  expect(d).toBeGreaterThan(6000);
  expect(d).toBeLessThan(7000);
 });
 it('同一点距离为 0',()=>{
  expect(haversineMeters(112.93,28.13,112.93,28.13)).toBe(0);
 });
});

describe('pointToSegmentMeters',()=>{
 it('点到线段垂足的测地距离',()=>{
  // 线段沿经度 112.930，从 28.120 到 28.140；点在 112.931, 28.130
  const d=pointToSegmentMeters(112.931,28.130,112.930,28.120,112.930,28.140);
  // 经度差 0.001° ≈ 100m
  expect(d).toBeGreaterThan(90);
  expect(d).toBeLessThan(110);
 });
});

describe('runProximityAnalysis',()=>{
 it('筛选出距离道路阈值内的记录并输出结构化结果',()=>{
  const gbif:GbifDataset={
   source:{sourceId:'gbif',sourceName:'GBIF',sourceUrl:'',license:'',attribution:'',dataStatus:'REAL'},
   bbox:[112.88,28.09,112.99,28.17],
   totalRaw:3,afterCleaning:3,byClass:{Aves:3},byPrecision:{fine:3},
   records:[
    {key:1,occurrenceId:null,lat:28.130,lon:112.935,uncertainty:50,precision:'fine',species:'Sp1',scientificName:'Sp1',taxon:'Sp1',taxonRank:'SPECIES',kingdom:'Animalia',class:'Aves',order:null,family:null,genus:null,basisOfRecord:'HUMAN_OBSERVATION',eventDate:null,year:2021,month:null,day:null,datasetKey:null,datasetName:null,license:null,geodeticDatum:'WGS84',iucn:null},
    {key:2,occurrenceId:null,lat:28.131,lon:112.940,uncertainty:50,precision:'fine',species:'Sp2',scientificName:'Sp2',taxon:'Sp2',taxonRank:'SPECIES',kingdom:'Animalia',class:'Aves',order:null,family:null,genus:null,basisOfRecord:'HUMAN_OBSERVATION',eventDate:null,year:2021,month:null,day:null,datasetKey:null,datasetName:null,license:null,geodeticDatum:'WGS84',iucn:null},
    {key:3,occurrenceId:null,lat:28.150,lon:112.980,uncertainty:null,precision:'unreported',species:'Sp3',scientificName:'Sp3',taxon:'Sp3',taxonRank:'SPECIES',kingdom:'Animalia',class:'Aves',order:null,family:null,genus:null,basisOfRecord:'HUMAN_OBSERVATION',eventDate:null,year:2021,month:null,day:null,datasetKey:null,datasetName:null,license:null,geodeticDatum:'WGS84',iucn:null},
   ],
  };
  const roads:OsmRoads={
   source:{sourceId:'osm',sourceName:'OSM',sourceUrl:'',license:'',attribution:'',dataStatus:'REAL'},
   bbox:[112.88,28.09,112.99,28.17],
   counts:{roads:1,bridges:0,footPaths:0},
   features:[{id:'osm/1',highway:'primary',name:null,bridge:null,tunnel:null,surface:null,foot:null,bicycle:null,order:2,coordinates:[[112.935,28.120],[112.935,28.140]]}],
  };
  const result=runProximityAnalysis(gbif,roads,150);
  expect(result.analysisId).toContain('proximity-gbif-roads');
  expect(result.stats.totalGbif).toBe(2); // unreported 被排除
  expect(result.stats.withinDistance).toBeGreaterThan(0);
  expect(result.verificationStatus).toBe('UNVERIFIED');
  expect(result.candidateResearchQuestion.length).toBeGreaterThan(0);
  expect(result.limitations.length).toBeGreaterThan(0);
  expect(result.matchedRecordKeys.length).toBe(result.stats.withinDistance);
 });
});
