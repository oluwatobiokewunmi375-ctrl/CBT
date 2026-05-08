export function checkStreamHealth(metrics) {
  if (metrics.latency > 3000) {
    return {
      status: 'UNSTABLE',
      action: 'ALERT_ADMIN'
    }
  }

  if (!metrics.active) {
    return {
      status: 'OFFLINE',
      action: 'RECONNECT'
    }
  }

  return {
    status: 'HEALTHY',
    action: 'NONE'
  }
}
