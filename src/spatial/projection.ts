import {Camera,Vector3} from 'three';

/** Project a resolved scene-world point into the overlay's CSS-pixel viewport.
 * The camera matrices must already describe this frame. DPR belongs only to the
 * renderer's drawing buffer; neither the anchor nor these pixels use it.
 * The returned x/y identify the glyph centre, not the label's bounding box.
 */
export function projectAnchor(world:Vector3,camera:Camera,width:number,height:number,out:Vector3):Vector3 {
 if(width<=0||height<=0)return out.set(NaN,NaN,Infinity);
 out.copy(world).project(camera);
 out.x=(out.x*.5+.5)*width;
 out.y=(-out.y*.5+.5)*height;
 return out;
}
