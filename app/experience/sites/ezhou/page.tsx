import type {Metadata} from 'next';
import SiteExplorer from './site-explorer';
export const metadata:Metadata={title:'鹅洲概念研究现场 · Spatial Research Explorer',description:'在三维概念现场中探索空间资源、研究证据和设计机会。非真实扫描。'};
export default function EzhouSitePage(){return <SiteExplorer/>;}
