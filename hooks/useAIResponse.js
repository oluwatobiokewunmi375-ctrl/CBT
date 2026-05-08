import { useState } from 'react'
import { processEvent } from '@/lib/ai/pipeline/eventProcessor'

export function useAIResponse() {
  const [state, setState] = useState(null)

  function sendEvent(event) {
    const result = processEvent(event)
    setState(result)
    return result
  }

  return { state, sendEvent }
}
