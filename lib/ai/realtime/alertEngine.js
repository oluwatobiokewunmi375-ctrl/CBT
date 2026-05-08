export function triggerAlert(riskScore) {
  if (riskScore > 1.2) {
    return {
      level: 'CRITICAL',
      action: 'FLAG_SESSION'
    }
  }

  if (riskScore > 0.7) {
    return {
      level: 'WARNING',
      action: 'MONITOR'
    }
  }

  return {
    level: 'SAFE',
    action: 'CONTINUE'
  }
}
