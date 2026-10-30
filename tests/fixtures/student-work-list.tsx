'use client';
import {useState} from 'react';
import {StudentWorkExhibition} from '@/app/experience/student-work-showcase';
import {STUDENT_WORKS} from '@/src/student-works/catalog';
import scene from '@/app/experience/experience.module.css';

/** Isolated capacity fixture. It never writes or changes the production catalog. */
export default function StudentWorkListFixture() {
  const [count, setCount] = useState(5);
  return <main className={`${scene.experience} ${scene.night}`} style={{background:'#08171c'}}>
    <section style={{position:'absolute',left:'5.4%',top:70,maxWidth:500}}>
      <h1>作品列表容量测试</h1><p>独立测试数据 · 混合地点作品，仅验证列表布局，不代表正式地点关联。</p>
      <nav aria-label="测试作品数量" style={{display:'flex',gap:25}}>{[1,2,3,5,10].map(n=><button key={n} onClick={()=>setCount(n)} aria-pressed={count===n}>{n} 件作品</button>)}</nav>
    </section>
    <StudentWorkExhibition key={count} works={STUDENT_WORKS.slice(0,count)} placeName="容量测试 · 非正式地点" ready onClose={()=>setCount(5)}/>
  </main>;
}
