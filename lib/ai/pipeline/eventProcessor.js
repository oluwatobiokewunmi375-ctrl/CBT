import { evaluateRisk } from '../response/riskEngine'
import { executeAction } from '../actions/actionExecutor'

export function processEvent(event) {
  const decision = evaluateRisk(event)
  return executeAction(decision, event)
}
