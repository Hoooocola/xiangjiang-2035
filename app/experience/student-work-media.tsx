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
    title={`${video.title} · ${video.accessStatus === 'verified' ? '已核验附件' : '访问待核验'}；新标签页打开 Pinwall 原作品页，选择视频附件观看`}>
    <Play size={11}/>{videos.length === 1 ? '观看视频' : video.title}{video.accessStatus === 'unavailable' ? ' · 暂不可用' : ''}<ArrowUpRight size={12}/>
  </a>;
  return videos.length === 1 ? link(videos[0]) : <details className={styles.videoIndex}>
    <summary className={styles.viewProject}>观看视频（{videos.length}）</summary>
    <div className={styles.videoChoices}>{videos.map(link)}</div>
  </details>;
}

export function StudentWorkReportLinks({work}: {work:StudentWork}) {
  const reports = (work.media ?? []).filter(item => item.type === 'pdf');
  if (reports.length < 2) return <a className={styles.viewProject} href={work.pdfUrl ?? work.pinwallUrl} target="_blank" rel="noopener noreferrer" aria-label={`打开报告：${work.title}`}>{work.pdfUrl ? '查看 PDF' : '查看完整作品'} <ArrowUpRight size={13}/></a>;
  return <details className={styles.videoIndex}><summary className={styles.viewProject}>查看 PDF（{reports.length}）</summary><div className={styles.videoChoices}>
    {reports.map((report,index)=><a className={styles.viewProject} key={report.url} href={report.url} target="_blank" rel="noopener noreferrer" aria-label={`打开报告：${work.title} · ${report.label ?? index+1}`}>{report.label ?? `报告 ${index+1}`}<ArrowUpRight size={12}/></a>)}
  </div></details>;
}
