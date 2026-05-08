export function autonomousDecision(context) {
  if (context.load > 80) return 'SCALE_UP'
  if (context.errorRate > 10) return 'REPAIR'
  return 'STABLE'
}
