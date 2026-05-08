export function detectRemoteSession() {
  const ua = navigator.userAgent.toLowerCase()

  const remoteTools = [
    'anydesk',
    'teamviewer',
    'remote',
    'chrome remote desktop'
  ]

  for (let tool of remoteTools) {
    if (ua.includes(tool)) {
      return {
        status: 'REMOTE_DETECTED',
        risk: 'HIGH'
      }
    }
  }

  return {
    status: 'LOCAL_SESSION',
    risk: 'LOW'
  }
}
