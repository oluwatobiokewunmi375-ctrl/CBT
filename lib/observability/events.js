const events = []

export function trackEvent(type, payload = {}) {
  const event = {
    type,
    payload,
    timestamp: Date.now()
  }

  events.push(event)
  return event
}

export function getEvents() {
  return events
}
