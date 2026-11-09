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
  expect(html).not.toContain('退出课程成果');
  expect(html).toContain('aria-label="开始探索" aria-hidden="false"');
 });
 it('redirects legacy course URLs to integrated design without a second mode',async()=>{
  await expect(ExperiencePage({searchParams:Promise.resolve({showcase:'student-work'})})).rejects.toThrow('NEXT_REDIRECT');
  const normal=await ExperiencePage({searchParams:Promise.resolve({design:'course'})});
  const html=renderToStaticMarkup(normal);
  expect(html).not.toContain('退出课程成果');expect(html).not.toContain('独立课程演示');
  expect(html).toContain('设计方案目录');expect(html).toContain('2026 社会创新设计');
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
