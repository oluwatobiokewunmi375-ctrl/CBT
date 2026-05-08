export class SessionStream {
  constructor(sessionId) {
    this.sessionId = sessionId
    this.events = []
  }

  emit(event) {
    this.events.push({
      ...event,
      timestamp: Date.now()
    })
  }

  getStream() {
    return this.events
  }
}
