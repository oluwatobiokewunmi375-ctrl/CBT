export function bindVideoToSession(sessionId, stream) {
  return {
    sessionId,
    streamAttached: !!stream,
    secureBinding: true,
    timestamp: Date.now()
  }
}
