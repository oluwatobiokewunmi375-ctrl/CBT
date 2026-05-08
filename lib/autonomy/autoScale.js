export function autoScale(metrics) {
  return {
    nodes: metrics.load > 70 ? 3 : 1,
    scaling: true
  }
}
