import { generateDeviceFingerprint } from './fingerprint'
import { registerDevice } from './registry'

export function bindSession(studentId) {
  const deviceId = generateDeviceFingerprint()
  const result = registerDevice(studentId, deviceId)

  return {
    studentId,
    deviceId,
    ...result
  }
}
