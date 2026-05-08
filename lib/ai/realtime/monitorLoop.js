import { updateLiveRisk } from './liveRiskEngine'
import { triggerAlert } from './alertEngine'

export function processRealtimeEvent(event) {
  const risk = updateLiveRisk(event)
  const alert = triggerAlert(risk)

  return {
    risk,
    alert,
    timestamp: Date.now()
  }
}
