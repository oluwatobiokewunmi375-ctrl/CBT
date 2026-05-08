export function syncExamState(state) {
  return {
    synced: true,
    timestamp: Date.now(),
    state
  }
}
