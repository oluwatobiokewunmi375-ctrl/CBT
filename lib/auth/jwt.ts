import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";

export type AuthTokenPayload = {
  id: string;
  userId?: string;
  email: string;
  role: Role;
  studentId?: string;
  teacherId?: string;
  schoolId?: string;
  type?: "auth" | "password_reset" | "email_verification";
  expiresAt?: string;
};

export function signJwtToken(payload: AuthTokenPayload, expiresIn: string | number = "7d") {
  return jwt.sign(payload, env.JWT_SECRET as Secret, { expiresIn: expiresIn as any });
}

export function verifyJwtToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded || typeof decoded !== "object" || !decoded.id || !decoded.email || !decoded.role) {
      return null;
    }

    const userId = decoded.userId ? String(decoded.userId) : String(decoded.id);

    return {
      id: String(decoded.id),
      userId,
      email: String(decoded.email),
      role: decoded.role as Role,
      studentId: decoded.studentId ? String(decoded.studentId) : undefined,
      teacherId: decoded.teacherId ? String(decoded.teacherId) : undefined,
      schoolId: decoded.schoolId ? String(decoded.schoolId) : undefined,
      type: decoded.type ? String(decoded.type) as AuthTokenPayload["type"] : "auth",
      expiresAt: typeof decoded.exp === "number" ? new Date(decoded.exp * 1000).toISOString() : undefined,
    };
  } catch {
    return null;
  }
}
