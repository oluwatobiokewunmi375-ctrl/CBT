export function proctorConnectionState(state) {
  return {
    connected: state === 'CONNECTED',
    monitoring: state === 'CONNECTED',
    alerting: state === 'DISCONNECTED'
  }
}
