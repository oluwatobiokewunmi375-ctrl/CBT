export function response(success, data, error = null) {
  return {
    success,
    data,
    error,
    timestamp: Date.now()
  }
}
