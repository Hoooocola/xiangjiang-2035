const KEY='xiangjiang-theme-choice';
export function readNightPreference(){try{return localStorage.getItem(KEY)==='night'}catch{return false}}
export function writeNightPreference(night:boolean){try{localStorage.setItem(KEY,night?'night':'day')}catch{}window.dispatchEvent(new Event('xiangjiang-theme-change'))}
export function subscribeTheme(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('xiangjiang-theme-change',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('xiangjiang-theme-change',callback)}}
