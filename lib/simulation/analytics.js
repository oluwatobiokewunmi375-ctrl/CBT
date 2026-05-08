export function analyzeSimulation(data) {
  return {
    accuracy: data.correct / data.total,
    improvement: 'TRACKED',
    recommendation: 'CONTINUE_SIMULATION'
  }
}
