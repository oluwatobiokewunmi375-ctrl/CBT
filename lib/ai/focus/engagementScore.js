export function calculateEngagement(events) {
  let score = 100

  events.forEach(e => {
    if (e.type === 'TAB_HIDDEN') score -= 5
    if (e.type === 'IDLE') score -= 3
    if (e.type === 'NO_ACTIVITY') score -= 2
  })

  return Math.max(0, score)
}
