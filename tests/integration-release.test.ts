import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import Experience from '@/app/experience/experience';
import ExperiencePage from '@/app/experience/page';
import {SPATIAL_LAYERS} from '@/src/spatial-data/catalog';

describe('approved integration boundary',()=>{
 it('blocks automatic Git deployments until release approval',()=>{const config=JSON.parse(readFileSync('vercel.json','utf8'));expect(config.git.deploymentEnabled).toBe(false);});
 it('renders the exact concise hero with the complete subordinate project name',()=>{
  const html=renderToStaticMarkup(createElement(Experience,{}));
  expect(html).toContain('<h1>一条江<br/><span>另一种未来</span></h1>');
  expect(html).toMatch(/湘江生态、文化与社会创新数字地图：<br\/>基于D—E—C<span[^>]*>产品总值指标<\/span>的设计平台/);
  expect(html).not.toContain('关闭设计方案');
  expect(html).toContain('aria-label="开始探索" aria-hidden="false"');
 });
 it('retains the independent course URL and its explicit close control',async()=>{
  const element=await ExperiencePage({searchParams:Promise.resolve({showcase:'student-work'})});
  const html=renderToStaticMarkup(element);
  expect(html).toContain('关闭设计方案');
  expect(html).toContain('2026社会创新设计');
  expect(html).toContain('课程设计 / 非实施项目');
  expect(html).toContain('aria-label="开始探索" aria-hidden="true"');
  const normal=await ExperiencePage({searchParams:Promise.resolve({})});
  expect(renderToStaticMarkup(normal)).not.toContain('关闭设计方案');
 });
 it('distinguishes data-only layers, unlocated observations and existing scene context',()=>{
  expect(SPATIAL_LAYERS.find(l=>l.layerId==='ecology.worldcover.2021')?.mapIntegration).toBe('data-only');
  expect(SPATIAL_LAYERS.find(l=>l.layerId==='ecology.gbif.snapshot')?.mapIntegration).toBe('data-only');
  const water=SPATIAL_LAYERS.find(l=>l.layerId==='ecology.water.2025-11')!;
  expect(water.mapIntegration).toBe('unlocated');expect(water.geometryType).toBe('nonspatial');expect(water.loadStatus).toBe('unverified');
  expect(SPATIAL_LAYERS.find(l=>l.layerId==='geography.roads.existing')?.mapIntegration).toBe('existing-context');
  expect(SPATIAL_LAYERS.every(l=>l.source.dataStatus==='public')).toBe(true);
 });
});
