export function calculateBehaviorScore(logs = []) {
  let score = 100

  const tabSwitches = logs.filter(l => l.type === 'TAB_SWITCH').length
  const rapidAnswers = logs.filter(l => l.type === 'RAPID_ANSWER').length
  const idleTime = logs.filter(l => l.type === 'IDLE').length

  score -= tabSwitches * 5
  score -= rapidAnswers * 2
  score -= idleTime * 1

  if (score < 0) score = 0

  return score
}
