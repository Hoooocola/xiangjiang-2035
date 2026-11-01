'use client';
// 空间邻近分析结果面板：展示分析参数、结果、来源与限制，不把邻近解释为因果。
import {X} from 'lucide-react';
import type {ProximityAnalysis} from '@/src/experience/real-geodata/types';
import styles from './information.module.css';

export function AnalysisPanel({analysis, onClose}: {analysis: ProximityAnalysis; onClose: () => void}) {
  const s = analysis.stats;
  return (
    <aside className={styles.analysisPanel} aria-label="空间邻近分析结果" data-information-panel>
      <header>
        <div>
          <small>SPATIAL ANALYSIS / 邻近分析</small>
          <h2>观察记录与道路的空间关系</h2>
        </div>
        <button onClick={onClose} aria-label="关闭分析结果"><X size={18}/></button>
      </header>
      <div className={styles.analysisBody}>
        <div className={styles.analysisStats}>
          <div><strong>{s.totalGbif}</strong><span>有效观察记录</span></div>
          <div><strong>{s.withinDistance}</strong><span>距道路 ≤ {analysis.parameters.distanceMeters}m</span></div>
          <div><strong>{s.nearestRoadMetersMedian}<small>m</small></strong><span>最近道路中位距离</span></div>
        </div>
        <p className={styles.analysisObservation}>{analysis.spatialObservation}</p>
        <section className={styles.analysisQuestion}>
          <h3>研究问题线索</h3>
          <p>{analysis.candidateResearchQuestion}</p>
        </section>
        <details className={styles.provenance}>
          <summary>分析方法与来源</summary>
          <p>{analysis.method}</p>
          <div className={styles.sources}>
            {analysis.sourceReferences.map(s => (
              <a key={s.sourceId} href={s.sourceUrl} target="_blank" rel="noreferrer">{s.sourceName} <small>{s.license}</small></a>
            ))}
          </div>
        </details>
        <details className={styles.provenance}>
          <summary>数据限制</summary>
          {analysis.limitations.map((l, i) => <p key={i}>· {l}</p>)}
        </details>
        <p className={styles.analysisStatus}>验证状态：{analysis.verificationStatus}（待实地核验）</p>
      </div>
    </aside>
  );
}
