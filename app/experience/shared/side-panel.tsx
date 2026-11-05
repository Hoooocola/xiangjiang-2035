import type {ComponentPropsWithRef} from 'react';
import styles from './side-panel.module.css';
export function SidePanelShell({className='',side='left',...props}:ComponentPropsWithRef<'aside'>&{side?:'left'|'right'}){return <aside {...props} data-information-panel data-side-panel data-side={side} className={`${className} ${styles.shell}`}/>}
