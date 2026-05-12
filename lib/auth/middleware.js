import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function authenticateToken(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return { error: 'No token provided', status: 401, user: null }
  }

  try {
    const user = verify(token, JWT_SECRET)
    return { error: null, status: 200, user }
  } catch (error) {
    return { error: 'Invalid token', status: 403, user: null }
  }
}

export function createErrorResponse(message, status) {
  return Response.json({ error: message }, { status })
}

export function createSuccessResponse(data, status = 200) {
  return Response.json(data, { status })
}
