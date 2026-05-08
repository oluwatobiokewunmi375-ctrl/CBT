import { useState } from 'react'
import { checkEnvironmentIntegrity } from '@/lib/ai/environment/integrityChecker'

export function useEnvironmentLock() {
  const [state, setState] = useState(null)

  function verifyEnvironment() {
    const result = checkEnvironmentIntegrity()
    setState(result)
    return result
  }

  return { state, verifyEnvironment }
}
