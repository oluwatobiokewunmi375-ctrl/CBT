import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtToken } from "@/lib/auth/jwt";

export function verifyToken(token: string) {
  return verifyJwtToken(token);
}

export function getAuthToken(req: Request | NextRequest) {
  const headerToken = req.headers.get("authorization")?.split(" ")[1];
  const cookieToken = "cookies" in req ? req.cookies.get("token")?.value : undefined;
  return headerToken || cookieToken || null;
}

export async function authenticateToken(req: Request | NextRequest) {
  const token = getAuthToken(req);
  if (!token) return null;
  return verifyJwtToken(token);
}

export function verifyTokenFromRequest(req: Request | NextRequest) {
  const token = getAuthToken(req);
  if (!token) return null;
  return verifyJwtToken(token);
}

export function createErrorResponse(message: string, status = 400) {
  return Response.json({ success: false, message }, { status });
}

export function createSuccessResponse(data: any, status = 200) {
  return Response.json({ success: true, data }, { status });
}

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/api/auth",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/verify-email",
  "/api/health",
  "/api/seed",
]

const clearTokenCookie = (response: NextResponse) => {
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: 0,
  })
  return response
}

const isStaticAsset = (pathname: string) => {
  return pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname === "/favicon.ico"
}

const isPublicPath = (pathname: string) => {
  return publicPaths.some((publicPath) => {
    if (publicPath === "/") {
      return pathname === "/"
    }
    return pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  })
}

const buildLoginRedirect = (nextUrl: URL, pathname: string) => {
  const loginUrl = new URL(nextUrl.toString())
  loginUrl.pathname = "/login"
  loginUrl.searchParams.set("returnUrl", pathname)
  return loginUrl
}

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isStaticAsset(pathname) || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = getAuthToken(req)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = buildLoginRedirect(req.nextUrl, pathname)
    return NextResponse.redirect(loginUrl)
  }

  const decoded = verifyJwtToken(token)
  if (!decoded) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = buildLoginRedirect(req.nextUrl, pathname)
    const response = NextResponse.redirect(loginUrl)
    return clearTokenCookie(response)
  }

  return NextResponse.next()
}


