export function traceRequest(req) {
  return {
    path: req.url,
    method: req.method,
    userAgent: req.headers?.['user-agent'],
    timestamp: Date.now(),
    traceId: Math.random().toString(36).substring(2, 10)
  }
}
