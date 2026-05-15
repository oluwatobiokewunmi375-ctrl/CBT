import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      studentId: decoded.studentId,
      teacherId: decoded.teacherId,
      schoolId: decoded.schoolId,
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req: any) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;

  return verifyToken(token);
}

export function createErrorResponse(message: string, status = 400) {
  return Response.json({ success: false, message }, { status });
}

export function createSuccessResponse(data: any, status = 200) {
  return Response.json({ success: true, data }, { status });
}


