export const STUDENT_PROFILE={
  version:'C2.R1',height:1.67,
  evidence:'P: 09届校友资料显示偏大尺码秋季校服、长裤脚；H: 精确剪裁、配色比例、体型与发型。',
  uniform:{season:'autumn-working-reconstruction',logo:false,fit:'oversized',palette:'muted red / warm off-white / dark navy'},
  animation:{idleBreath:0.008,walkStride:0.46,runStride:0.72,walkCadence:5.9,runCadence:7.6}
};
export function locomotionState(speed,grounded=true){if(!grounded)return 'air';if(speed<.12)return 'idle';return speed<2.35?'walk':'run';}
export function locomotionParams(speed,grounded=true){const state=locomotionState(speed,grounded),a=STUDENT_PROFILE.animation;return {state,stride:state==='run'?a.runStride:state==='walk'?a.walkStride:0,cadence:state==='run'?a.runCadence:a.walkCadence};}
