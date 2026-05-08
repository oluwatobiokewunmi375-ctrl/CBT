import { getFocusState } from './focusTracker'
import { calculateEngagement } from './engagementScore'
import { attentionState } from './attentionModel'

export function evaluateFocus(events = []) {
  const focus = getFocusState()
  const score = calculateEngagement(events)
  const state = attentionState(score)

  return {
    focus,
    score,
    state,
    action:
      state === 'CRITICAL_FOCUS_LOSS'
        ? 'WARN_STUDENT'
        : state === 'LOW_FOCUS'
        ? 'NOTIFY_ADMIN'
        : 'ALLOW'
  }
}
