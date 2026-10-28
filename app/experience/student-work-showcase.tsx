'use client';
import {useState} from 'react';
import {ArrowUpRight, ChevronDown, MapPin, Search, X} from 'lucide-react';
import {SHOWCASE_PLACES, STUDENT_THEMES, STUDENT_WORKS, showcaseStats, worksForPlace, worksForTheme, type ThemeFilter} from '@/src/student-works/catalog';
import type {StudentWork} from '@/src/student-works/types';
import styles from './student-work-showcase.module.css';

function WorkCover({work}: {work: StudentWork}) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.cover}>
    {work.cover && !failed ?
      // Local static course thumbnails intentionally use native image loading/error fallback.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={work.cover} alt={`${work.title}作品封面`} loading="lazy" onError={() => setFailed(true)}/> :
      <div className={styles.placeholder}><span>COURSE WORK / {String(work.sequence).padStart(2, '0')}</span><strong>封面待补充</strong><small>可打开原作品查看</small></div>}
    <span className={styles.number}>{String(work.sequence).padStart(2, '0')}</span>
  </div>;
}

export function StudentWorkCard({work, onLocate}: {work: StudentWork; onLocate?: (id: string) => void}) {
  return <article className={styles.workCard} data-work-id={work.id}>
    <a href={work.pdfUrl ?? work.projectUrl} target="_blank" rel="noopener noreferrer" aria-label={`打开作品：${work.title}`}>
      <WorkCover work={work}/><h3>{work.title}</h3>
    </a>
    <p className={styles.members}>{work.members.join('、')}</p>
    <div className={styles.workMeta}><span>{work.theme}</span><span>{work.originalSite}</span></div>
    {work.reviewNotes.length > 0 && <details className={styles.review}><summary>原表信息待核对</summary>{work.reviewNotes.map(note => <p key={note}>{note}</p>)}</details>}
    <div className={styles.workActions}>
      <a href={work.pdfUrl ?? work.projectUrl} target="_blank" rel="noopener noreferrer">{work.pdfUrl ? '打开完整 PDF' : '查看原作品'}<ArrowUpRight size={13}/></a>
      {onLocate && work.placeId && <button onClick={() => onLocate(work.placeId!)}><MapPin size={13}/>在地图查看</button>}
      {!work.placeId && <small title={work.locationNote}>地点待核对 · 暂不上图</small>}
    </div>
    {work.pdfUrl && <small className={styles.hint}>附件暂不可用时，将打开原作品页。</small>}
  </article>;
}

export function StudentPlaceWorks({placeId, theme}: {placeId: string; theme: ThemeFilter}) {
  const works = worksForPlace(placeId, theme);
  return <section aria-label="学生课程作品" className={styles.placeWorks}>
    <p className={styles.kicker}>STUDENT WORK / 课程成果</p>
    <h3>学生作品 <span>{works.length}</span></h3>
    <p className={styles.hint}>{theme === 'all' ? '按原表选址关联，课程设计不代表已实施项目。' : `当前方向：${theme}。切回全部方向可查看该地点其他作品。`}</p>
    {works.length ? works.map(work => <StudentWorkCard key={work.id} work={work}/>) : <p className={styles.hint}>当前方向在此地点暂无作品。</p>}
  </section>;
}

export function StudentWorkShowcase({theme, onTheme, onLocate, onClose, loaded}: {
  theme: ThemeFilter; onTheme: (theme: ThemeFilter) => void; onLocate: (id: string) => void; onClose: () => void; loaded: boolean;
}) {
  const [view, setView] = useState<'places' | 'works'>('places');
  const [query, setQuery] = useState('');
  const stats = showcaseStats(theme);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = worksForTheme(theme).filter(work => [work.title, work.originalSite, ...work.members].join(' ').toLocaleLowerCase().includes(normalizedQuery));
  const groups = SHOWCASE_PLACES.map(place => ({place, works: visible.filter(work => work.placeId === place.id)})).filter(group => group.works.length);
  const pending = visible.filter(work => !work.placeId);
  return <aside className={styles.panel} aria-label="课程成果展示">
    <header className={styles.panelHeader}><div><p className={styles.kicker}>SOCIAL INNOVATION DESIGN</p><h2>把设计放回湘江</h2><p className={styles.hint}>课程成果展示 · 临时演示</p></div><button onClick={onClose} aria-label="收起课程成果展示"><X size={19}/></button></header>
    <div className={styles.summary} aria-live="polite"><div><strong>{stats.total}</strong><span>作品</span></div><div><strong>{stats.places}</strong><span>地图地点</span></div><div><strong>{stats.pending}</strong><span>待定位作品</span></div></div>
    <div className={styles.themes} role="group" aria-label="研究主题筛选">
      <button aria-pressed={theme === 'all'} onClick={() => onTheme('all')}><span>全部方向</span><small>{STUDENT_WORKS.length}</small></button>
      {STUDENT_THEMES.map((item, index) => <button key={item} aria-pressed={theme === item} onClick={() => onTheme(item)}><span><em>0{index + 1}</em>{item}</span><small>{worksForTheme(item).length}</small></button>)}
    </div>
    <label className={styles.search}><Search size={15}/><input aria-label="搜索作品、成员或地点" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索作品、成员或地点"/>{query && <button onClick={() => setQuery('')} aria-label="清除搜索"><X size={14}/></button>}</label>
    <div className={styles.views} role="group" aria-label="成果浏览方式"><button aria-pressed={view === 'places'} onClick={() => setView('places')}>地图地点</button><button aria-pressed={view === 'works'} onClick={() => setView('works')}>作品列表</button><span>{visible.length} 个作品</span></div>
    <div className={styles.body}>
      {!visible.length && <p className={styles.hint}>没有匹配的作品，请调整主题或搜索词。</p>}
      {view === 'works' ? visible.map(work => <StudentWorkCard key={work.id} work={work} onLocate={loaded ? onLocate : undefined}/>) : <>
        {groups.map(({place, works}) => <button key={place.id} disabled={!loaded} className={styles.placeRow} onClick={() => onLocate(place.id)}><MapPin size={16}/><span>{place.name}<small>{works.map(work => work.title).join(' / ')}</small></span><b>{works.length}</b><ArrowUpRight size={14}/></button>)}
        {pending.length > 0 && <details className={styles.pending}><summary><span>地点待核对 <small>{pending.length} 个作品</small></span><ChevronDown size={15}/></summary><p className={styles.hint}>缺少可靠坐标或原选址不完整，作品仍可查看；核对前不在地图上放置标记。</p>{pending.map(work => <StudentWorkCard key={work.id} work={work}/>)}</details>}
      </>}
    </div>
    <footer className={styles.panelFooter}><span className={styles.markerKey}>◆</span> 带数字的地图标记关联课程作品。<small>按原表分类统计，第 19 组方向与备注冲突待核。</small></footer>
  </aside>;
}
