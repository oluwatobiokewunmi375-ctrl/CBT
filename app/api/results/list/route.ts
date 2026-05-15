import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // If admin or school admin, return results with full details
    if (["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(decoded.role)) {
      if (decoded.role === "SCHOOL_ADMIN") {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        }) as { schoolId?: string } | null;
        const results = await prisma.result.findMany({
          where: { schoolId: user?.schoolId ?? undefined },
          include: {
            student: {
              include: {
                user: true,
                ClassRoom: true,
                school: true,
              },
            },
            exam: {
              include: {
                subject: true,
              },
            },
            school: true,
          },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ success: true, results });
      }

      const results = await prisma.result.findMany({
        include: {
          student: {
            include: {
              user: true,
              ClassRoom: true,
              school: true,
            },
          },
          exam: {
            include: {
              subject: true,
            },
          },
          school: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, results });
    }

    // If student, return only their results
    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const results = await prisma.result.findMany({
      where: { studentId: student.id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            subject: true,
          },
        },
        student: {
          include: {
            ClassRoom: true,
          },
        },
        school: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Get results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


