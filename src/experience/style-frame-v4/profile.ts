export type Variant='current'|'v4';
export type Theme='day'|'night';
export type Shot='river'|'close';
export const GROUND_PALETTES={
 mineral:{label:'中性石灰灰',day:'#aaa9a1',night:'#8e8c80'},
 sage:{label:'低饱和灰绿',day:'#8d9b91',night:'#657d73'},
 slate:{label:'冷灰青',day:'#849395',night:'#506a6c'},
 sand:{label:'原沙色对照',day:'#b7a58b',night:'#b49c78'},
} as const;
export type GroundPalette=keyof typeof GROUND_PALETTES;
// The softer edge only blends inward; the fully weighted interior stays bright.
export const DEFAULT_BLEND_METERS=600;
export const FRAME={width:1440,height:900,pixelRatio:1.5,fov:38};
// Each shot is identical for both variants and both themes; no framing trick in comparisons.
export const SHOTS={
 river:{label:'河段',target:[2,0,-1] as [number,number,number],distance:58,azimuth:.38,polar:1.12},
 close:{label:'近景',target:[9,.3,3] as [number,number,number],distance:19,azimuth:.64,polar:1.19},
};
export const LOOK={
 day:{background:'#e9e7df',context:'#e9e8e1',ground:'#b7a58b',road:'#625d54',park:'#758566',water:'#4b777c',wall:'#d8d3c9',roof:'#7c8787',sky:'#f4f2e9',bounce:'#b4afa1',key:'#fff8eb',fill:'#d8e3e0',hemi:.85,sun:2.1,fillIntensity:.5,exposure:1},
 night:{background:'#071e1d',context:'#24413e',ground:GROUND_PALETTES.mineral.night,road:'#514b3d',park:'#405c45',water:'#254e50',wall:'#c7c2b5',roof:'#72817d',sky:'#a6bdb4',bounce:'#52584b',key:'#fff0d9',fill:'#a1c3c0',hemi:.38,sun:.65,fillIntensity:.22,exposure:1},
};
