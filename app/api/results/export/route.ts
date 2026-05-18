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
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { examId, format } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    if (!examId) {
      return NextResponse.json(
        { error: "examId query parameter required" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        totalMarks: true,
        duration: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    let results = [];

    if (decoded.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: decoded.userId },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found" },
          { status: 404 }
        );
      }

      results = await prisma.result.findMany({
        where: { examId },
        include: {
          student: {
            select: {
              studentNo: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (decoded.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: decoded.userId },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      results = await prisma.result.findMany({
        where: { examId, studentId: student.id },
        include: {
          student: {
            select: {
              studentNo: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(decoded.role)) {
      results = await prisma.result.findMany({
        where: { examId },
        include: {
          student: {
            select: {
              studentNo: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json(
        { error: "Unauthorized - access denied" },
        { status: 403 }
      );
    }

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Student ID",
        "Name",
        "Email",
        "Score",
        "Total Marks",
        "Percentage",
        "Grade",
        "Date",
      ];
      const rows = results.map((r) => [
        r.student.studentNo,
        r.student.user.fullName,
        r.student.user.email,
        r.score,
        r.totalMarks,
        r.percentage.toFixed(2),
        r.grade,
        new Date(r.createdAt).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="exam-report-${examId}.csv"`,
        },
      });
    }

    // Default: JSON format
    return NextResponse.json({
      success: true,
      report: {
        exam: {
          id: exam.id,
          title: exam.title,
          totalMarks: exam.totalMarks,
          duration: exam.duration,
        },
        results: results.map((r) => ({
          studentNo: r.student.studentNo,
          name: r.student.user.fullName,
          email: r.student.user.email,
          score: r.score,
          totalMarks: r.totalMarks,
          percentage: Math.round(r.percentage * 100) / 100,
          grade: r.grade,
          date: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Export report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

