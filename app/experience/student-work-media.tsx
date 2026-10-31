import {ArrowUpRight, Play} from 'lucide-react';
import {videoOpenUrl, videosForWork} from '@/src/student-works/media';
import type {StudentWork} from '@/src/student-works/types';
import styles from './student-work-showcase.module.css';

/** Links only: no player, iframe, poster fetch or preload before/after opening an external tab. */
export function StudentWorkMediaLinks({work}: {work:StudentWork}) {
  const videos = videosForWork(work);
  if (!videos.length) return null;
  const link = (video: typeof videos[number]) => <a key={video.id} className={styles.viewProject}
    href={videoOpenUrl(work, video)} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
    aria-label={`观看视频：${work.title} · ${video.title}`}
    title={`${video.title} · ${video.accessStatus === 'verified' ? '已核验附件' : '访问待核验'}；点击后解析当前原站视频，无法打开时保留原作品入口`}>
    <Play size={11}/>{video.title}{video.accessStatus === 'unavailable' ? ' · 暂不可用' : ''}<ArrowUpRight size={12}/>
  </a>;
  return <details className={styles.videoIndex}>
    <summary className={styles.viewProject}>视频（{videos.length}）</summary>
    <div className={styles.videoChoices}>{videos.map(link)}</div>
  </details>;
}

export function StudentWorkReportLinks({work}: {work:StudentWork}) {
  const reports = (work.media ?? []).filter(item => item.type === 'pdf');
  if (!reports.length) return <a className={styles.viewProject} href={work.pinwallUrl} target="_blank" rel="noopener noreferrer" aria-label={`打开原作品：${work.title}`}>查看原作品 <ArrowUpRight size={13}/></a>;
  return <details className={styles.videoIndex}><summary className={styles.viewProject}>资料文件（{reports.length}）</summary><div className={styles.videoChoices}>
    {reports.map((report,index)=><a className={styles.viewProject} key={report.url} href={report.accessStatus === 'unavailable' ? work.pinwallUrl : report.url} target="_blank" rel="noopener noreferrer" aria-label={`打开报告：${work.title} · ${report.title ?? report.label ?? index+1}`}><span>{String(index+1).padStart(2,'0')}</span>{report.title ?? report.label ?? `资料 ${index+1}`}{report.accessStatus === 'unavailable' ? ' · 源站暂不可用，查看原作品' : ''}<ArrowUpRight size={12}/></a>)}
  </div></details>;
}
