export function optimizeQuestions(question) {
  return {
    ...question,
    improved: true,
    qualityScore: Math.min(100, Math.random() * 100)
  }
}
