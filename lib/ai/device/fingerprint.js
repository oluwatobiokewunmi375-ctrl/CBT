export function generateDeviceFingerprint() {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.platform
  ].join('|')

  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i)
    hash = hash & hash
  }

  return 'DEV-' + Math.abs(hash)
}
