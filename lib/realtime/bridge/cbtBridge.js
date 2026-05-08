const { broadcast } = require('../../../server/websocketServer')

export function pushCBTEvent(event) {
  const payload = {
    type: event.type,
    studentId: event.studentId,
    examId: event.examId,
    timestamp: Date.now()
  }

  broadcast(payload)

  return payload
}
