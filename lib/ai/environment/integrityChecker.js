import { detectVirtualEnvironment } from './vmDetector'
import { detectRemoteSession } from './remoteDetector'

export function checkEnvironmentIntegrity() {
  const vm = detectVirtualEnvironment()
  const remote = detectRemoteSession()

  if (vm.risk === 'HIGH' || remote.risk === 'HIGH') {
    return {
      status: 'BLOCKED',
      reason: vm.status !== 'CLEAN' ? vm.status : remote.status
    }
  }

  return {
    status: 'SAFE',
    reason: 'CLEAN_ENVIRONMENT'
  }
}
