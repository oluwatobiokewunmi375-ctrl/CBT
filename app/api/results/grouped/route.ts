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
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { examId, classroomId, groupBy } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    if (!examId) {
      return NextResponse.json(
        { error: "examId query parameter required" },
        { status: 400 }
      );
    }

    // Get exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Verify user has access to this exam
    if (decoded.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });

      if (!teacher || exam.createdById !== teacher.id) {
        return NextResponse.json(
          { error: "Unauthorized - you can only view results for your own exams" },
          { status: 403 }
        );
      }
    }
    if (decoded.role === "SCHOOL_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      }) as { schoolId?: string } | null;
      if (!user?.schoolId || user.schoolId !== exam.schoolId) {
        return NextResponse.json(
          { error: "Unauthorized - school admin can only view results for their school" },
          { status: 403 }
        );
      }
    }

    // Get results based on groupBy parameter
    let results;

    if (groupBy === "classroom" || classroomId) {
      // Get results grouped by classroom
      if (classroomId) {
        results = await prisma.result.findMany({
          where: {
            examId: examId,
            student: {
              classRoomId: classroomId,
            },
          },
          include: {
            student: {
              select: {
                id: true,
                studentNo: true,
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
                classRoom: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        // Get all results grouped by classroom
        const classrooms = await prisma.classRoom.findMany({
          where: { schoolId: exam.schoolId },
          include: {
            students: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
                results: {
                  where: { examId: examId },
                },
              },
            },
          },
        });

        results = classrooms.map((classroom) => ({
          classroom: {
            id: classroom.id,
            name: classroom.name,
          },
          results: classroom.students
            .filter((s) => s.results.length > 0)
            .map((s) => ({
              studentNo: s.studentNo,
              studentName: s.user?.fullName,
              ...s.results[0],
            })),
        }));

        return NextResponse.json({
          success: true,
          exam: {
            id: exam.id,
            title: exam.title,
          },
          groupedBy: "classroom",
          data: results,
        });
      }
    } else if (groupBy === "student") {
      // Get results per student
      results = await prisma.result.findMany({
        where: { examId: examId },
        include: {
          student: {
            select: {
              id: true,
              studentNo: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
              classRoom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { score: "desc" },
          { createdAt: "desc" },
        ],
      });
    } else {
      // Default - return all results
      results = await prisma.result.findMany({
        where: { examId: examId },
        include: {
          student: {
            select: {
              id: true,
              studentNo: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
              classRoom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        totalMarks: exam.totalMarks,
      },
      groupedBy: groupBy || "all",
      count: Array.isArray(results) ? results.length : 0,
      results,
    });
  } catch (error) {
    console.error("Get grouped results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
