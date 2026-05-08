export function feedbackLoop(results) {
  return {
    insights: 'ANALYZED',
    patterns: results.map(r => r.score),
    optimized: true
  }
}
