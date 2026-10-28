import {Camera,HalfFloatType,Scene,Vector2,WebGLRenderer,WebGLRenderTarget} from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

/** HDR highlights bloom before a single final tone-map / sRGB conversion.
 * Threshold > 1 keeps ordinary roads, terrain and UI out of the glow.
 */
export function createPostprocessing(renderer:WebGLRenderer,scene:Scene,camera:Camera){
 const size=renderer.getSize(new Vector2());
 const target=new WebGLRenderTarget(size.x,size.y,{type:HalfFloatType,samples:Math.min(4,renderer.capabilities.maxSamples)});
 const composer=new EffectComposer(renderer,target);
 const render=new RenderPass(scene,camera),bloom=new UnrealBloomPass(size,.32,.45,1.05),output=new OutputPass();
 composer.addPass(render);composer.addPass(bloom);composer.addPass(output);
 return {
  resize:(w:number,h:number)=>composer.setSize(w,h),
  render:(night:number)=>{bloom.enabled=night>.01;bloom.strength=.32*night;composer.render();},
  dispose:()=>{bloom.dispose();output.dispose();render.dispose();composer.dispose();},
 };
}
