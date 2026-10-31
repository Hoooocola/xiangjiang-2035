'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowLeft, ArrowUpRight, ChevronDown, Search, X} from 'lucide-react';
import {SHOWCASE_PLACES, type ThemeFilter} from '@/src/student-works/catalog';
import {COURSE_OPTIONS, DEFAULT_COURSE, courseStats, courseWorks, type Course} from '@/src/student-works/courses';
import type {StudentWork} from '@/src/student-works/types';
import {workPlaceIds} from '@/src/student-works/relationships';
import {StudentWorkMediaLinks, StudentWorkReportLinks} from './student-work-media';
import styles from './student-work-showcase.module.css';

export type CourseIndexView = 'places' | 'works' | 'pending';

export function WorkCover({work, eager = false}: {work: StudentWork; eager?: boolean}) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.cover} data-cover-status={work.coverStatus}>
    {work.coverImage && work.coverStatus === 'verified' && !failed ?
      // Native loading preserves the source square cover and explicit unavailable state.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={work.coverImage} alt={`${work.title} · Pinwall 原始项目封面`} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)}/> :
      <div className={styles.placeholder}><span>PROJECT {String(work.sequence).padStart(2, '0')}</span><strong>{failed ? '封面暂不可用' : work.coverStatus === 'unverified' ? '封面待核实' : '封面待补充'}</strong><small>原作品仍可查看</small></div>}
  </div>;
}

export function StudentWorkShowcase({theme, query, view, expanded, selectedPlace, active, loaded, onTheme, onQuery, onView, onExpanded, onLocate, onWork, onClose, onOverview, integrated = false, course = DEFAULT_COURSE, onCourse, onLecture}: {
  theme: ThemeFilter; query: string; view: CourseIndexView; expanded: boolean; selectedPlace: string | null;
  active: boolean; loaded: boolean; onTheme: (value: ThemeFilter) => void; onQuery: (value: string) => void;
  onView: (value: CourseIndexView) => void; onExpanded: (value: boolean) => void;
  onLocate: (id: string) => void; onWork: (id: string) => void; onClose: () => void; onOverview: () => void;
  integrated?: boolean; course?: Course; onCourse?: (id: string) => void; onLecture?: () => void;
}) {
  const stats = courseStats(course, theme, query);
  const visible = courseWorks(course, theme, query);
  const groups = SHOWCASE_PLACES.map(place => ({place, works: visible.filter(work => workPlaceIds(work).includes(place.id))})).filter(group => group.works.length);
  const indexWorks = view === 'pending' ? visible.filter(work => !workPlaceIds(work).length) : visible;
  const listRef=useRef<HTMLDivElement>(null),themeRef=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{if(listRef.current)listRef.current.scrollTop=0;},[course.id,theme,query,view]);
  const chooseTheme=(value:ThemeFilter)=>{onTheme(value);if(themeRef.current)themeRef.current.open=false;};
  const chooseView = (next: CourseIndexView) => { onView(next); onExpanded(true); };
  return <aside className={`${styles.overview} ${integrated ? styles.integratedIndex : ''} ${!active ? styles.overviewHidden : ''}`} aria-label={integrated ? '设计方案目录' : '课程成果展示'} aria-hidden={!active} inert={!active} data-information-panel data-course-index data-index-open={expanded}>
    <div className={styles.overviewHeading}><p className={styles.kicker}>COURSE / SOCIAL INNOVATION DESIGN</p><button className={styles.iconButton} onClick={onClose} aria-label={integrated ? '关闭设计方案模式' : '收起课程成果展示'}><X size={18}/></button></div>
    <div className={styles.courseTitleRow}><h1>{course.title}</h1>{COURSE_OPTIONS.length > 1 && onCourse && <><ChevronDown size={16}/><select aria-label="选择课程" value={course.id} onChange={event => onCourse(event.target.value)}>{COURSE_OPTIONS.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></>}</div>
    <details className={styles.courseDescription}><summary>课程简介 <ArrowDown size={12}/></summary><p className={styles.introduction}>{course.description}</p></details>
    <div className={styles.statistics} aria-label="课程统计" aria-live="polite"><p><strong>{String(stats.total).padStart(2, '0')}</strong><span>WORKS / 作品</span></p><p><strong>{String(stats.places).padStart(2, '0')}</strong><span>PLACES / 地点</span></p><p><strong>{String(stats.pending).padStart(2, '0')}</strong><span>UNLOCATED / 待定位</span></p></div>
    <details ref={themeRef} className={styles.themePicker}><summary><span>四大研究主题</span><strong>{theme==='all'?'全部':theme}</strong><ChevronDown size={13}/></summary><nav className={styles.themes} aria-label="研究主题筛选">
      <button aria-pressed={theme === 'all'} onClick={() => chooseTheme('all')}><span className={styles.themeNumber}>00</span><span>全部研究方向</span><small>{courseWorks(course).length}</small><i/></button>
      {course.themes.map((item, index) => <button key={item} aria-pressed={theme === item} onClick={() => chooseTheme(item)}><span className={styles.themeNumber}>0{index + 1}</span><span>{item}</span><small>{courseWorks(course, item).length}</small><i/></button>)}
    </nav></details>
    <label className={styles.search}><Search size={14}/><input aria-label="搜索作品、成员或地点" value={query} onChange={event => {onQuery(event.target.value); onView('works'); onExpanded(true);}} placeholder="寻找作品、成员或地点"/>{query && <button className={styles.iconButton} onClick={() => onQuery('')} aria-label="清除搜索"><X size={13}/></button>}</label>
    <div className={styles.indexNavigation} aria-label="成果浏览方式">
      <button aria-expanded={expanded && view === 'places'} onClick={() => chooseView('places')}>按地点 <small>{stats.places}</small></button>
      <button aria-expanded={expanded && view === 'works'} onClick={() => chooseView('works')}>按作品 <small>{stats.total}</small></button>
      <button aria-expanded={expanded && view === 'pending'} onClick={() => chooseView('pending')}>未绑定地点 <small>{stats.pending}</small></button>
      <button className={styles.indexToggle} onClick={() => onExpanded(!expanded)} aria-label={expanded ? '收起成果目录' : '展开成果目录'} aria-expanded={expanded}><ArrowDown size={14}/></button>
    </div>
    {expanded && <div ref={listRef} className={styles.indexBody} aria-label="课程成果目录" role="region" tabIndex={0} onWheel={event=>event.stopPropagation()} onPointerDown={event=>event.stopPropagation()} onTouchMove={event=>event.stopPropagation()}>
      {view === 'places' ? groups.map(({place, works}, index) => <button className={styles.placeRow} key={place.id} disabled={!loaded} aria-pressed={selectedPlace === place.id} onClick={() => onLocate(place.id)}><span className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</span><span>{place.name}</span><small>{String(works.length).padStart(2, '0')} 件</small><ArrowUpRight size={13}/></button>) : indexWorks.map(work => <button className={styles.workRow} key={work.id} disabled={!loaded && !!workPlaceIds(work).length} onClick={() => onWork(work.id)}><WorkCover work={work}/><span><strong>{work.title}</strong><small>{work.year} · {work.originalSite} · {work.theme}{!workPlaceIds(work).length ? ' · 待定位' : ''}</small></span><ArrowUpRight size={13}/></button>)}
      {!(view === 'places' ? groups.length : indexWorks.length) && <p className={styles.hint}>没有匹配的{view === 'places' ? '地图地点' : '作品'}。{view === 'places' && stats.pending > 0 ? '可在未绑定地点目录中查看原作品。' : '请调整搜索或主题。'}</p>}
    </div>}
    <div className={styles.overviewFoot}><button onClick={onOverview} disabled={!loaded}>回到湘江全段 <ArrowUpRight size={12}/></button>{integrated && onLecture && <button onClick={onLecture}>独立课程演示 <ArrowUpRight size={12}/></button>}<span>课程设计 / 非实施项目</span></div>
  </aside>;
}

/** A single layout for every place, independent of the number of works. */
export function StudentWorkExhibition({works, placeName, ready, onClose, onArchive, integrated = false, selectedPlace, onLocate}: {
  works: readonly StudentWork[]; placeName: string; ready: boolean;
  onClose: () => void; onArchive?: () => void;
  integrated?: boolean; selectedPlace?: string | null; onLocate?: (id: string) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const groupKey = placeName;
  useEffect(() => {if (ready) closeRef.current?.focus({preventScroll: true});}, [ready, groupKey]);
  return <aside className={`${styles.exhibition} ${integrated ? styles.integratedExhibition : ''} ${!ready ? styles.exhibitionArriving : ''}`} aria-label={`${placeName}课程作品`} aria-busy={!ready} inert={!ready} data-information-panel>
    <header className={styles.placeHeading}><div><p className={styles.kicker}>STUDENT WORK / 课程成果</p><h2>{placeName}</h2><p className={styles.placeCount}>{String(works.length).padStart(2, '0')} PROJECTS<span>{works[0]?.placeId ? '关联作品' : '未绑定地点 · 保留原选址'}</span></p></div><button ref={closeRef} className={styles.closeExhibition} onClick={onClose} aria-label="关闭作品并返回课程总览"><X size={20}/></button></header>
    <div key={groupKey} className={styles.projectList} onWheel={event=>event.stopPropagation()} onPointerDown={event=>event.stopPropagation()} role="region" aria-label={`${placeName}全部作品列表`} tabIndex={0}>
      <ul>
        {works.map(work => <li className={styles.projectRow} key={work.id} data-work-id={work.id}>
          <a className={styles.artwork} href={work.pdfUrl ?? work.pinwallUrl} target="_blank" rel="noopener noreferrer" aria-label={`查看完整作品：${work.title}`}><WorkCover work={work} eager/></a>
          <div className={styles.projectText}>
            <h3><a href={work.pdfUrl ?? work.pinwallUrl} target="_blank" rel="noopener noreferrer" title={work.title}>{work.title}</a></h3>
            <p className={styles.projectTheme}>{work.year} · {work.theme}</p>
            <p className={styles.authors}><span className={styles.srOnly}>小组成员：</span>{work.members.join('、')}</p>
            {!!work.pendingLocationNames?.length && <p className={styles.projectLocationNote}>另有地点未绑定：{work.pendingLocationNames.join('、')}</p>}
            {onLocate && workPlaceIds(work).length > 1 && <div className={styles.relatedPlaces} aria-label={`${work.title}关联地点`}>{workPlaceIds(work).map(id => <button key={id} aria-pressed={selectedPlace === id} onClick={() => onLocate(id)}>{SHOWCASE_PLACES.find(place => place.id === id)?.name ?? id}<ArrowUpRight size={11}/></button>)}</div>}
            <div className={styles.mediaActions}><StudentWorkReportLinks work={work}/><StudentWorkMediaLinks work={work}/></div>
          </div>
        </li>)}
      </ul>
    </div>
    <footer className={styles.listFooter}>
      <p>{works.length > 3 ? '向下滚动，浏览全部作品' : '新标签页打开报告或原作品'}</p>
      <div className={styles.exhibitionLinks}><button onClick={onClose}><ArrowLeft size={12}/>返回课程地图</button>{onArchive && <button onClick={onArchive}>地点研究档案 <ArrowUpRight size={12}/></button>}</div>
    </footer>
  </aside>;
}
