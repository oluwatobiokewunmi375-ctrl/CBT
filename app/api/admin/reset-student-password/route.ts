import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only allow school admins or super admins
    const role = (decoded.role || "").toString().toUpperCase();
    if (!(role === "ADMIN" || role === "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, temporaryPassword } = body || {};
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student || !student.user) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ensure admin belongs to same school unless super admin
    const adminSchoolId = decoded.schoolId || null;
    if (role !== "SUPER_ADMIN" && student.schoolId !== adminSchoolId) {
      return NextResponse.json({ error: "Cannot reset password for student in another school" }, { status: 403 });
    }

    const temp = temporaryPassword || "stud123";
    const hashed = await hash(temp, 12);

    await prisma.user.update({ where: { id: student.userId }, data: { password: hashed } });

    return NextResponse.json({ success: true, studentId: student.studentNo, temporaryPassword: temp }, { status: 200 });
  } catch (error) {
    console.error("Reset student password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
