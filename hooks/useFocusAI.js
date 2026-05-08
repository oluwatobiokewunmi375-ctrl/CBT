import { useState, useEffect } from 'react'
import { evaluateFocus } from '@/lib/ai/focus/focusEngine'

export function useFocusAI() {
  const [state, setState] = useState(null)

  function updateFocus(events) {
    const result = evaluateFocus(events)
    setState(result)
    return result
  }

  return { state, updateFocus }
}
