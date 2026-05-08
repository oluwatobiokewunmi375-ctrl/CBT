export function evaluateRisk(event) {
  if (event.type === 'TAB_SWITCH' && event.count > 5) {
    return 'FREEZE_EXAM'
  }

  if (event.type === 'IDLE_DETECTED' && event.duration > 120) {
    return 'WARN_STUDENT'
  }

  if (event.type === 'MULTI_WINDOW') {
    return 'LOCK_SESSION'
  }

  return 'ALLOW'
}
