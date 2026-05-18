import type { NextRequest } from "next/server";
import { verifyJwtToken } from "@/lib/auth/jwt";

export function verifyToken(token: string) {
  return verifyJwtToken(token);
}

export function getAuthToken(req: Request | NextRequest) {
  return req.headers.get("authorization")?.split(" ")[1] || null;
}

export async function authenticateToken(req: Request | NextRequest) {
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


