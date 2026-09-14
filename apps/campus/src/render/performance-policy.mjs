/** Device budgets affect raster cost, never campus geometry or collision semantics.
 * CSS stays native-resolution. 'detail' is a reversible original-quality option.
 */
export function performanceProfile({width=1280,coarse=false,dpr=1,mode='auto'}={}) {
  const mobile=width<700||coarse,balanced=mode==='balanced'||(mode==='auto'&&mobile);
  return {mobile,mode:balanced?'balanced':'detail',pixelRatio:Math.min(dpr,balanced?1:1.5),
    minimumPixelRatio:Math.min(dpr,balanced?.75:1.5),shadowResolution:balanced?1024:(mobile?2048:4096),
    adaptive:balanced,preserveDrawingBuffer:false,walkShadowDistance:6,walkShadowHeight:3};
}
export class RasterBudget {
  constructor(profile){this.reset(profile);}
  reset(profile){this.profile=profile;this.ratio=profile.pixelRatio;this.samples=[];this.warmup=45;this.fastWindows=0;this.changes=0;}
  sample(milliseconds,active=true){
    if(!active||!this.profile.adaptive||!Number.isFinite(milliseconds)||milliseconds<=0)return null;
    if(this.warmup-->0)return null;
    this.samples.push(Math.min(250,milliseconds));if(this.samples.length<45)return null;
    const values=this.samples.sort((a,b)=>a-b),median=values[22];this.samples=[];
    const old=this.ratio;
    if(median>38){this.ratio=Math.max(this.profile.minimumPixelRatio,this.ratio-.125);this.fastWindows=0;}
    else if(median<22){if(++this.fastWindows>=6){this.ratio=Math.min(this.profile.pixelRatio,this.ratio+.125);this.fastWindows=0;}}
    else this.fastWindows=0;
    if(Math.abs(old-this.ratio)<1e-5)return null;
    this.changes++;this.warmup=45;return this.ratio;
  }
}
/** Hysteresis avoids rebuilding a static sun map at every half-metre movement. */
export function needsWalkShadowFocus(previous,target,horizontal=6,vertical=3) {
  return !previous||Math.hypot(target.x-previous.x,target.z-previous.z)>=horizontal||Math.abs(target.y-previous.y)>=vertical;
}
