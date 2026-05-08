import { selfHeal } from './selfHeal'
import { autonomousDecision } from './decisionEngine'
import { autoScale } from './autoScale'
import { detectFailure } from './failureDetector'
import { optimizeContinuously } from './optimizer'

export function cbtAutopilot(system) {
  const status = detectFailure(system)
  const decision = autonomousDecision(system)

  if (status === 'CRITICAL') {
    selfHeal(system)
  }

  return {
    status,
    decision,
    scaling: autoScale(system),
    optimization: optimizeContinuously(system)
  }
}
