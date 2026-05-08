export function attentionState(score) {
  if (score < 30) return 'CRITICAL_FOCUS_LOSS'
  if (score < 60) return 'LOW_FOCUS'
  if (score < 85) return 'MODERATE_FOCUS'
  return 'STABLE_FOCUS'
}
