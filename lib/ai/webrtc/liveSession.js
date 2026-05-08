export class LiveVideoSession {
  constructor(sessionId) {
    this.sessionId = sessionId
    this.status = 'INIT'
    this.latency = 0
  }

  connect() {
    this.status = 'CONNECTED'
    return this.status
  }

  disconnect() {
    this.status = 'DISCONNECTED'
    return this.status
  }
}
