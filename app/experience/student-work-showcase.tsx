'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Search, X} from 'lucide-react';
import {SHOWCASE_PLACES, STUDENT_THEMES, STUDENT_WORKS, showcaseStats, visibleStudentWorks, worksForTheme, type ThemeFilter} from '@/src/student-works/catalog';
import {adjacentWorkId} from '@/src/student-works/selection';
import type {StudentWork} from '@/src/student-works/types';
import styles from './student-work-showcase.module.css';

export type CourseIndexView = 'places' | 'works' | 'pending';

export function WorkCover({work, eager = false}: {work: StudentWork; eager?: boolean}) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.cover} data-cover-status={work.coverStatus}>
    {work.coverImage && work.coverStatus === 'verified' && !failed ?
      // Native loading preserves the source square cover and explicit unavailable state.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={work.coverImage} alt={`${work.title} · Pinwall 原始项目封面`} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)}/> :
      <div className={styles.placeholder}><span>PROJECT {String(work.sequence).padStart(2, '0')}</span><strong>{work.coverStatus === 'unverified' ? '封面待核实' : '封面待补充'}</strong><small>原作品仍可查看</small></div>}
  </div>;
}

export function StudentWorkShowcase({theme, query, view, expanded, selectedPlace, active, loaded, onTheme, onQuery, onView, onExpanded, onLocate, onWork, onClose, onOverview}: {
  theme: ThemeFilter; query: string; view: CourseIndexView; expanded: boolean; selectedPlace: string | null;
  active: boolean; loaded: boolean; onTheme: (value: ThemeFilter) => void; onQuery: (value: string) => void;
  onView: (value: CourseIndexView) => void; onExpanded: (value: boolean) => void;
  onLocate: (id: string) => void; onWork: (id: string) => void; onClose: () => void; onOverview: () => void;
}) {
  const stats = showcaseStats(theme, query);
  const visible = visibleStudentWorks(theme, query);
  const groups = SHOWCASE_PLACES.map(place => ({place, works: visible.filter(work => work.placeId === place.id)})).filter(group => group.works.length);
  const indexWorks = view === 'pending' ? visible.filter(work => !work.placeId) : visible;
  const chooseView = (next: CourseIndexView) => { onView(next); onExpanded(next !== view || !expanded); };
  return <aside className={`${styles.overview} ${!active ? styles.overviewHidden : ''}`} aria-label="课程成果展示" aria-hidden={!active} inert={!active}>
    <div className={styles.overviewHeading}><p className={styles.kicker}>SOCIAL INNOVATION DESIGN</p><button className={styles.iconButton} onClick={onClose} aria-label="收起课程成果展示"><X size={18}/></button></div>
    <h1>把设计放回湘江</h1><p className={styles.introduction}>社会创新设计课程成果<br/>沿着一条江，读懂不同的设计提案。</p>
    <div className={styles.statistics} aria-live="polite"><p><strong>{String(stats.total).padStart(2, '0')}</strong><span>WORKS / 作品</span></p><i>/</i><p><strong>{String(stats.places).padStart(2, '0')}</strong><span>PLACES / 地点</span></p></div>
    <nav className={styles.themes} aria-label="研究主题筛选">
      <button aria-pressed={theme === 'all'} onClick={() => onTheme('all')}><span className={styles.themeNumber}>00</span><span>全部研究方向</span><small>{STUDENT_WORKS.length}</small><i/></button>
      {STUDENT_THEMES.map((item, index) => <button key={item} aria-pressed={theme === item} onClick={() => onTheme(item)}><span className={styles.themeNumber}>0{index + 1}</span><span>{item}</span><small>{worksForTheme(item).length}</small><i/></button>)}
    </nav>
    <label className={styles.search}><Search size={14}/><input aria-label="搜索作品、成员或地点" value={query} onChange={event => {onQuery(event.target.value); onView('works'); onExpanded(true);}} placeholder="寻找作品、成员或地点"/>{query && <button className={styles.iconButton} onClick={() => onQuery('')} aria-label="清除搜索"><X size={13}/></button>}</label>
    <div className={styles.indexNavigation} aria-label="成果浏览方式">
      <button aria-expanded={expanded && view === 'places'} onClick={() => chooseView('places')}>地点 <small>{stats.places}</small></button>
      <button aria-expanded={expanded && view === 'works'} onClick={() => chooseView('works')}>作品 <small>{stats.total}</small></button>
      <button aria-expanded={expanded && view === 'pending'} onClick={() => chooseView('pending')}>待定位 <small>{stats.pending}</small></button>
      <button className={styles.indexToggle} onClick={() => onExpanded(!expanded)} aria-label={expanded ? '收起成果目录' : '展开成果目录'} aria-expanded={expanded}><ArrowDown size={14}/></button>
    </div>
    {expanded && <div className={styles.indexBody} aria-label="课程成果目录">
      {view === 'places' ? groups.map(({place, works}, index) => <button className={styles.placeRow} key={place.id} disabled={!loaded} aria-pressed={selectedPlace === place.id} onClick={() => onLocate(place.id)}><span className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</span><span>{place.name}</span><small>{String(works.length).padStart(2, '0')}</small><ArrowUpRight size={13}/></button>) : indexWorks.map(work => <button className={styles.workRow} key={work.id} disabled={!loaded && !!work.placeId} onClick={() => onWork(work.id)}><WorkCover work={work}/><span><strong>{work.title}</strong><small>{work.originalSite}</small></span><ArrowUpRight size={13}/></button>)}
      {!(view === 'places' ? groups.length : indexWorks.length) && <p className={styles.hint}>没有匹配的{view === 'places' ? '地图地点' : '作品'}。{view === 'places' && stats.pending > 0 ? '可在待定位目录中查看原作品。' : '请调整搜索或主题。'}</p>}
    </div>}
    <div className={styles.overviewFoot}><button onClick={onOverview} disabled={!loaded}>回到湘江全段 <ArrowUpRight size={12}/></button><span>课程设计 / 非实施项目</span></div>
  </aside>;
}

export function StudentWorkExhibition({work, works, placeName, ready, onSelect, onClose, onArchive}: {
  work: StudentWork; works: readonly StudentWork[]; placeName: string; ready: boolean;
  onSelect: (id: string) => void; onClose: () => void; onArchive?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const position = Math.max(0, works.findIndex(item => item.id === work.id));
  const previousId = adjacentWorkId(works, work.id, -1);
  const nextId = adjacentWorkId(works, work.id, 1);
  const next = works.find(item => item.id === nextId);
  useEffect(() => {if (ready) closeRef.current?.focus({preventScroll: true});}, [ready]);
  return <aside className={`${styles.exhibition} ${!ready ? styles.exhibitionArriving : ''}`} aria-label={`${placeName}课程作品`} aria-busy={!ready} inert={!ready} onKeyDown={event => {
    if (event.key === 'ArrowRight' && works.length > 1 && nextId) {event.preventDefault(); onSelect(nextId);}
    if (event.key === 'ArrowLeft' && works.length > 1 && previousId) {event.preventDefault(); onSelect(previousId);}
  }}>
    <header className={styles.placeHeading}><div><p className={styles.kicker}>STUDENT WORK / 沿江课程提案</p><h2>{placeName}</h2><p className={styles.placeCount}>{String(works.length).padStart(2, '0')} PROJECTS<span>{work.placeId ? '关联作品' : '原选址待核对 · 暂不上图'}</span></p></div><button ref={closeRef} className={styles.closeExhibition} onClick={onClose} aria-label="关闭作品并返回课程总览"><X size={22}/></button></header>
    <div className={styles.projectComposition} key={work.id} data-work-id={work.id}>
      <a className={styles.artwork} href={work.pinwallUrl} target="_blank" rel="noopener noreferrer" aria-label={`查看 Pinwall 项目详情：${work.title}`}><WorkCover key={work.id} work={work} eager/></a>
      <section className={styles.projectText}>
        <p className={styles.projectNumber}>{String(position + 1).padStart(2, '0')} <span>/ {String(works.length).padStart(2, '0')}</span></p>
        <p className={styles.projectTheme}>{work.theme}</p><h3>{work.title}</h3>
        <div className={styles.authors}><span>小组成员</span><p>{work.members.join('、')}</p></div>
        <a className={styles.viewProject} href={work.pdfUrl ?? work.pinwallUrl} target="_blank" rel="noopener noreferrer">查看完整作品 <ArrowUpRight size={18}/><small>VIEW PROJECT</small></a>
        <p className={styles.reportHint}>新标签页打开报告；附件不可用时转至原作品页。</p>
        <details className={styles.provenance}><summary><Check size={11}/>{work.coverStatus === 'verified' ? 'Pinwall 原始封面 · 已核对' : '作品封面待核实'}</summary><p>封面、完整报告与原始项目分别关联，按项目 ID 核对标题及全组成员。</p><a href={work.pinwallUrl} target="_blank" rel="noopener noreferrer">查看 Pinwall 原始项目 <ArrowUpRight size={11}/></a>{work.reviewNotes.map(note => <p key={note}>{note}</p>)}</details>
      </section>
    </div>
    <footer className={styles.projectNavigation}>
      <div className={styles.paging}><button className={styles.iconButton} disabled={works.length < 2} onClick={() => previousId && onSelect(previousId)} aria-label="上一件作品"><ArrowLeft size={18}/></button><span>{String(position + 1).padStart(2, '0')} <i>/ {String(works.length).padStart(2, '0')}</i></span><button className={styles.iconButton} disabled={works.length < 2} onClick={() => nextId && onSelect(nextId)} aria-label="下一件作品"><ArrowRight size={18}/></button></div>
      {works.length > 1 && next && <button className={styles.nextPreview} onClick={() => onSelect(next.id)} aria-label={`切换下一件：${next.title}`}><WorkCover key={next.id} work={next}/><span><small>NEXT PROJECT</small>{next.title}</span></button>}
      <div className={styles.exhibitionLinks}><button onClick={onClose}><ArrowLeft size={12}/>返回课程地图</button>{onArchive && <button onClick={onArchive}>地点研究档案 <ArrowUpRight size={12}/></button>}</div>
    </footer>
  </aside>;
}
