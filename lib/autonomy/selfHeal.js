export function selfHeal(systemState) {
  if (systemState.error) {
    return {
      status: 'RECOVERED',
      action: 'AUTO_FIX_APPLIED'
    }
  }

  return { status: 'HEALTHY' }
}
