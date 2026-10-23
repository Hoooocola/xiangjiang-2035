import type { Metadata } from 'next';
import Experience from './experience';
export const metadata: Metadata = {title:'湘江 2035 / 将来的江来 · 湘江生态文化与社会创新地图',description:'在真实湘江河岸与洲岛之间，探索长沙的生态、文化与未来。'};
export default async function ExperiencePage({searchParams}:{searchParams:Promise<{place?:string}>}){const {place}=await searchParams;return <Experience initialPlace={place==='ezhou'?'ezhou':undefined}/>;}
