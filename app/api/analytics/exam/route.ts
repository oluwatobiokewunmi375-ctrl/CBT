import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { examId } = Object.fromEntries(new URL(req.url).searchParams);

    if (!examId) {
      return NextResponse.json(
        { error: "examId query parameter required" },
        { status: 400 }
      );
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        results: {
          select: {
            score: true,
            percentage: true,
            grade: true,
          },
        },
        _count: {
          select: {
            questions: true,
            results: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Calculate statistics
    const results = exam.results;
    const scores = results.map((r) => r.score);

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, 0);
    const passCount = results.filter((r) => r.percentage >= 50).length;
    const passPercentage =
      results.length > 0 ? (passCount / results.length) * 100 : 0;

    // Grade distribution
    const gradeDistribution = {
      A: results.filter((r) => r.grade === "A").length,
      B: results.filter((r) => r.grade === "B").length,
      C: results.filter((r) => r.grade === "C").length,
      D: results.filter((r) => r.grade === "D").length,
      F: results.filter((r) => r.grade === "F").length,
    };

    return NextResponse.json({
      success: true,
      analytics: {
        exam: {
          id: exam.id,
          title: exam.title,
          totalQuestions: exam._count.questions,
          totalMarks: exam.totalMarks,
        },
        statistics: {
          totalAttempts: results.length,
          averageScore: Math.round(averageScore * 100) / 100,
          maxScore,
          minScore,
          passCount,
          passPercentage: Math.round(passPercentage * 100) / 100,
          gradeDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

