export function detectVirtualEnvironment() {
  const ua = navigator.userAgent.toLowerCase()

  const vmIndicators = [
    'vmware',
    'virtualbox',
    'vbox',
    'qemu',
    'parallels'
  ]

  for (let indicator of vmIndicators) {
    if (ua.includes(indicator)) {
      return {
        status: 'VM_DETECTED',
        risk: 'HIGH'
      }
    }
  }

  return {
    status: 'CLEAN',
    risk: 'LOW'
  }
}
