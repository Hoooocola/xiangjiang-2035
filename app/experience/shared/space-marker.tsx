import {type ComponentPropsWithRef} from 'react';
import styles from './space-marker.module.css';
export function SpaceMarker({className='',...props}:ComponentPropsWithRef<'button'>){return <button {...props} className={`${styles.marker} ${className}`}/>}
