/** All authored colours below are sRGB. Convert once with THREE.Color at the boundary.
 * This experiment is opt-in and never changes AOI membership or source geometry.
 */
export const STYLE_FRAME = {
 width:1440,height:900,pixelRatio:1.5,fov:38,time:0,
 pose:{target:[2,0,-1] as [number,number,number],distance:58,azimuth:.38,polar:1.12},
} as const;
export type FrameVariant='current'|'v3';
export type FrameTheme='day'|'night';
export const V3_LOOK = {
 day:{background:'#ecede9',wall:'#b8b6af',roof:'#7c9193',context:'#e6e7e2',ground:'#aaa99f',road:'#707975',park:'#71866b',water:'#527c7b',shore:'#b5baaa',bridge:'#a8ada4',sky:'#f2f3ed',bounce:'#b5b2a5',key:'#fff8ee',fill:'#d5dfdc',hemi:.95,sun:2.25,fillIntensity:.4,exposure:1},
 night:{background:'#102321',wall:'#d2cbbc',roof:'#899a95',context:'#354741',ground:'#52615b',road:'#465752',park:'#435c4a',water:'#315956',shore:'#667b6a',bridge:'#87968b',sky:'#98aaa2',bounce:'#3e4942',key:'#fff2de',fill:'#b4c9c1',hemi:.55,sun:1.1,fillIntensity:.22,exposure:1.05},
 surface:{wallRoughness:.82,groundRoughness:.94,roadRoughness:.88,waterRoughness:.42,metalness:0},
 emission:{body:'#e0d6bf',bodyStrength:.32,ground:'#bfc4b4',groundStrength:.035,water:'#315956',waterStrength:.38,windows:'#ffe1ae',windowStrength:1.35,windowOccupancy:.16,bridgeStrength:1.05},
} as const;
