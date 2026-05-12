export function getRemainingTime(startTime, duration) {
  const now = Date.now()
  const elapsed = Math.floor((now - startTime) / 1000)
  return Math.max(duration - elapsed, 0)
}
