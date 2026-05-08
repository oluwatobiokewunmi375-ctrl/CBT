const deviceStore = new Map()

export function registerDevice(studentId, deviceId) {
  if (!deviceStore.has(studentId)) {
    deviceStore.set(studentId, deviceId)
    return { status: 'registered' }
  }

  const existing = deviceStore.get(studentId)

  if (existing !== deviceId) {
    return { status: 'VIOLATION', reason: 'MULTI_DEVICE_DETECTED' }
  }

  return { status: 'verified' }
}
