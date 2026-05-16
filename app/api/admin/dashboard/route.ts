import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth/middleware"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"].includes(decoded?.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get school ID based on role
    let schoolId = null;
    if (decoded?.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });
      schoolId = teacher?.schoolId;
    } else if (decoded?.role === "ADMIN") {
      // For school admin, we need to get school from context
      // This is a simplified version - in production you'd have admin-school relationship
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      }) as { schoolId?: string } | null;
      schoolId = user?.schoolId || req.headers.get("x-school-id");
    } else if (decoded?.role === "SCHOOL_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      }) as { schoolId?: string } | null;
      schoolId = user?.schoolId || req.headers.get("x-school-id");
    }

    // Get stats
    const [
      totalStudents,
      totalExams,
      totalResults,
      averageScore,
    ] = await Promise.all([
      schoolId
        ? prisma.student.count({ where: { schoolId } })
        : prisma.student.count(),
      schoolId
        ? prisma.exam.count({ where: { schoolId } })
        : prisma.exam.count(),
      schoolId
        ? prisma.result.count({
            where: {
              exam: { schoolId }
            }
          })
        : prisma.result.count(),
      schoolId
        ? prisma.result.aggregate({
            where: {
              exam: { schoolId }
            },
            _avg: { percentage: true }
          })
        : prisma.result.aggregate({
            _avg: { percentage: true }
          }),
    ]);

    const stats = {
      totalStudents,
      totalExams,
      totalResults,
      averageScore: averageScore._avg.percentage || 0,
    };

    // Get recent exams
    const recentExams = await prisma.exam.findMany({
      where: schoolId ? { schoolId } : {},
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            results: true,
            questions: true,
          },
        },
      },
    });

    // Get recent results
    const recentResults = await prisma.result.findMany({
      where: schoolId ? { exam: { schoolId } } : {},
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        exam: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats,
      recentExams,
      recentResults,
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Dashboard failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
