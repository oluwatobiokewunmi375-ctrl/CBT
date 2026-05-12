export function createSession(userId, examId) {
  return {
    sessionId: userId + "-" + examId + "-" + Date.now(),
    startTime: Date.now(),
    status: "active"
  }
}
