'use client';
// GBIF 生物观察记录详情：轻量信息展示，不新增大型深色资料卡。
// 显示中文名/学名/观察日期/来源/原始记录链接/坐标不确定性。
import {X,ExternalLink} from 'lucide-react';
import type {GbifRecord} from '@/src/experience/real-geodata/types';
import {groupOfClass} from '@/src/experience/real-geodata/gbif';
import styles from './information.module.css';

function gbifUrl(key: number): string {
  return `https://www.gbif.org/occurrence/${key}`;
}

function formatDate(r: GbifRecord): string {
  if (r.eventDate) return r.eventDate.slice(0, 10);
  if (r.year) return `${r.year}${r.month ? `-${String(r.month).padStart(2, '0')}` : ''}`;
  return '日期未记录';
}

function uncertaintyLabel(r: GbifRecord): string {
  if (r.precision === 'unreported') return '坐标精度未报告';
  if (r.uncertainty == null) return '坐标精度未报告';
  return `坐标不确定性 ≤ ${r.uncertainty}m`;
}

export function GbifDetail({records, onClose}: {records: GbifRecord[]; onClose: () => void}) {
  if (!records.length) return null;
  const first = records[0];
  const g = groupOfClass(first.class);
  const single = records.length === 1;
  return (
    <aside className={styles.gbifDetail} aria-label="生物观察记录详情" data-information-panel>
      <header>
        <div>
          <small>GBIF OBSERVATION · {g.zh}</small>
          <h2>{single ? (first.species ?? first.taxon ?? '未鉴定物种') : `${records.length} 条记录 · 同一观测点位`}</h2>
        </div>
        <button onClick={onClose} aria-label="关闭详情"><X size={16}/></button>
      </header>
      <div className={styles.gbifDetailBody}>
        <p className={styles.gbifNote}>地图显示的是经过质量筛选的生物观察记录，不代表物种完整分布。</p>
        {single ? (
          <div className={styles.gbifFields}>
            {first.scientificName && first.scientificName !== first.species && <p><span>学名</span>{first.scientificName}</p>}
            <p><span>观察日期</span>{formatDate(first)}</p>
            <p><span>坐标</span>{first.lat.toFixed(5)}, {first.lon.toFixed(5)}</p>
            <p><span>精度</span>{uncertaintyLabel(first)}</p>
            {first.datasetName && <p><span>数据来源</span>{first.datasetName}</p>}
          </div>
        ) : (
          <ul className={styles.gbifList}>
            {records.slice(0, 12).map(r => (
              <li key={r.key}>
                <span>{r.species ?? r.taxon ?? '未鉴定'}</span>
                <small>{formatDate(r)}</small>
                <a href={gbifUrl(r.key)} target="_blank" rel="noreferrer" aria-label={`打开 GBIF 记录 ${r.key}`}><ExternalLink size={11}/></a>
              </li>
            ))}
            {records.length > 12 && <li className={styles.gbifMore}>另有 {records.length - 12} 条记录</li>}
          </ul>
        )}
        {single && <a className={styles.gbifLink} href={gbifUrl(first.key)} target="_blank" rel="noreferrer">在 GBIF 查看原始记录 <ExternalLink size={12}/></a>}
        <p className={styles.gbifSource}>来源：GBIF.org · 记录级许可（CC-BY / CC0）· 数据贡献者通过 iNaturalist 等</p>
      </div>
    </aside>
  );
}
