import type { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth/middleware'

export function proxy(req: NextRequest) {
  return authMiddleware(req)
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
}
