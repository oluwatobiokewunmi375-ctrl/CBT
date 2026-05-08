export function replayExam(history) {
  return {
    replay: true,
    mistakes: history.filter(h => !h.correct),
    insights: 'LEARNING_PATH_GENERATED'
  }
}
