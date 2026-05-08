export function safeApi(handler) {
  return async (req) => {
    try {
      return await handler(req)
    } catch (err) {
      return Response.json({ error: 'Server error' }, { status: 500 })
    }
  }
}
