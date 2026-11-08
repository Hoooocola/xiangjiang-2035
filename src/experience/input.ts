/** WheelEvent deltaMode normalization, in CSS pixels. Line/page wheels and
 * continuous pixel trackpad input share one exponential distance response. */
export function wheelPixels(delta:number,mode:number,viewportHeight=900){return Math.max(-320,Math.min(320,delta*(mode===1?16:mode===2?viewportHeight:1)))}
export function wheelScale(delta:number,mode:number,viewportHeight=900){return Math.exp(wheelPixels(delta,mode,viewportHeight)*.0024)}
export function panUnits(distance:number,fov:number,viewportHeight:number){return 2*distance*Math.tan(fov*Math.PI/360)/Math.max(200,viewportHeight)}
