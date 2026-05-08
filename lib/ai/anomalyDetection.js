export function detectAnomalies(logs = []) {
  const flags = []

  const tabSwitches = logs.filter(l => l.type === 'TAB_SWITCH')

  if (tabSwitches.length > 3) {
    flags.push('HIGH_TAB_SWITCH_ACTIVITY')
  }

  const rapidAnswers = logs.filter(l => l.type === 'RAPID_ANSWER')

  if (rapidAnswers.length > 10) {
    flags.push('UNUSUAL_SPEED_PATTERN')
  }

  return {
    riskLevel: flags.length > 2 ? 'HIGH' : 'LOW',
    flags
  }
}
