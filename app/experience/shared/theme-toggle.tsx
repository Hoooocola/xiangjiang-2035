'use client';
import {useSyncExternalStore} from 'react';import {Sun,Moon} from 'lucide-react';
import {readNightPreference,writeNightPreference,subscribeTheme} from '@/src/experience/theme-state';
import styles from './theme-toggle.module.css';
export function useMapTheme(){return [useSyncExternalStore(subscribeTheme,readNightPreference,()=>false),writeNightPreference] as const}
export function ThemeToggle({night,onChange,disabled=false}:{night:boolean;onChange:(night:boolean)=>void;disabled?:boolean}){return <div className={styles.toggle} role="group" aria-label="昼夜模式"><button aria-label="切换日间" aria-pressed={!night} onClick={()=>onChange(false)} disabled={disabled}><Sun size={22} strokeWidth={1.3}/></button><button aria-label="切换夜间" aria-pressed={night} onClick={()=>onChange(true)} disabled={disabled}><Moon size={22} strokeWidth={1.3}/></button></div>}
