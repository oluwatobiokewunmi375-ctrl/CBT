import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    // Verify auth token
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get exams for the user's school
    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId },
      select: { schoolId: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        schoolId: student.schoolId,
        status: "PUBLISHED",
        startAt: {
          lte: now,
        },
        OR: [
          { endAt: null },
          { endAt: { gte: now } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalMarks: true,
        startAt: true,
        endAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error("Get exams error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


