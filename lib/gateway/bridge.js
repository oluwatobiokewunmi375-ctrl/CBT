export function callService(service, action, payload) {
  return {
    service,
    action,
    payload,
    status: 'FORWARDED'
  }
}
