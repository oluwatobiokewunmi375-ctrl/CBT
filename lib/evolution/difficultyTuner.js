export function tuneDifficulty(stats) {
  if (stats.avgScore > 75) return 'INCREASE'
  if (stats.avgScore < 40) return 'DECREASE'
  return 'STABLE'
}
