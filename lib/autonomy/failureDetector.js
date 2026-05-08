export function detectFailure(system) {
  if (system.latency > 3000) return 'CRITICAL'
  if (system.errors > 5) return 'WARNING'
  return 'OK'
}
