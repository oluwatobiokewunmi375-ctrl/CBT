export function collectMetrics(metrics) {
  return {
    cpu: metrics.cpu || 0,
    memory: metrics.memory || 0,
    latency: metrics.latency || 0,
    requests: metrics.requests || 0,
    timestamp: Date.now()
  }
}
