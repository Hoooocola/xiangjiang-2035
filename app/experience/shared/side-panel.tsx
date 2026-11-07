import type {ComponentPropsWithRef} from 'react';
import styles from './side-panel.module.css';
export function SidePanelShell({className='',side='left',treatment='panel',...props}:ComponentPropsWithRef<'aside'>&{side?:'left'|'right';treatment?:'panel'|'immersive'}){return <aside {...props} data-information-panel data-side-panel data-side={side} data-treatment={treatment} className={`${className} ${styles.shell}`}/>}
