import { useState } from 'react'
import { bindSession } from '@/lib/ai/device/sessionBinder'

export function useDeviceLock() {
  const [status, setStatus] = useState(null)

  function lockStudent(studentId) {
    const result = bindSession(studentId)
    setStatus(result)
    return result
  }

  return { status, lockStudent }
}
