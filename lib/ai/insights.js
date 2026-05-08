export function generateInsights(results) {
  return {
    averageScore: results.reduce((a,b) => a + b.score, 0) / results.length,
    weakAreas: ['Math', 'English'], 
    strongAreas: ['Logic'],
    improvementTrend: 'UPWARD'
  }
}
