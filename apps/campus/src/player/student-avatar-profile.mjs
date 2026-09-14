/** C2 R2: user-approved art direction, not a historical measurement sheet. */
export const STUDENT_PROFILE = {
  version: 'C2.R2', height: 1.72,
  evidence: 'A: 用户确认白领、蓝色主体、上白下红横带、YL胸标及最终设定图；H: 精确色值、尺寸、背部横带延续、拉链长度、脸型与发型。09届大尺码回忆仅作宽松穿着参考。',
  uniform: {
    season: 'autumn-working-reconstruction', logo: 'YL', logoLocation: 'wearer-left-chest',
    backLogo: false, collar: 'white-folded', fit: 'oversized',
    stripeOrderTopToBottom: ['blue', 'white', 'red', 'blue'],
    palette: 'campus-derived blue / warm white / muted red', trouserSideStripe: false,
  },
  animation: { idleBreath: .002, walkStride: .46, runStride: .72, walkCadence: 5.9, runCadence: 7.6 },
  geometry: { bodySegments: 48, limbSegments: 40, headSegments: 64, skinned: true },
};
export function locomotionState(speed, grounded = true) {
  if (!grounded) return 'air';
  if (speed < .12) return 'idle';
  return speed < 2.35 ? 'walk' : 'run';
}
export function locomotionParams(speed, grounded = true) {
  const state = locomotionState(speed, grounded), a = STUDENT_PROFILE.animation;
  return { state, stride: state === 'run' ? a.runStride : state === 'walk' ? a.walkStride : 0,
    cadence: state === 'run' ? a.runCadence : a.walkCadence };
}
