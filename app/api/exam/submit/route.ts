import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { examId, answers, timeSpent, sessionId, ownerTabId } = await req.json();

    if (!examId || !answers) {
      return NextResponse.json(
        { error: "examId and answers required" },
        { status: 400 }
      );
    }

    // Get student info
    const student = await prisma.student.findUnique({
      where: { userId: decoded.userId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (session.studentId !== student.id) {
        return NextResponse.json(
          { error: "Unauthorized - session does not belong to you" },
          { status: 403 }
        );
      }

      if (session.examId !== examId) {
        return NextResponse.json(
          { error: "Session exam mismatch" },
          { status: 400 }
        );
      }

      let expiresAt = session.expiresAt;

      if (!expiresAt && session.startedAt) {
        expiresAt = new Date(
          Math.min(
            session.startedAt.getTime() + exam.duration * 1000,
            exam.endAt ? exam.endAt.getTime() : Infinity
          )
        );
      }

      // small grace window to tolerate near-boundary retries from clients
      const GRACE_MS = 10 * 1000; // 10 seconds
      if (expiresAt && expiresAt.getTime() + GRACE_MS <= new Date().getTime()) {
        await prisma.session.update({
          where: { id: sessionId },
          data: { status: "EXPIRED", expiresAt },
        });

        return NextResponse.json(
          { error: "Session has expired" },
          { status: 400 }
        );
      }

      if (session.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Session is not active" },
          { status: 400 }
        );
      }

      // Multi-tab ownership enforcement (optional)
      if (ownerTabId && session.ownerTabId && session.ownerTabId !== ownerTabId) {
        const HEARTBEAT_TIMEOUT_MS = 30 * 1000;
        const last = session.ownerHeartbeatAt ? session.ownerHeartbeatAt.getTime() : 0;
        if (new Date().getTime() - last < HEARTBEAT_TIMEOUT_MS) {
          return NextResponse.json(
            { error: "Session owned by another tab", ownerTabId: session.ownerTabId },
            { status: 409 }
          );
        }
        // otherwise allow takeover and proceed
      }
    }

    const existingSubmission = await prisma.examSubmission.findFirst({
      where: {
        studentId: student.id,
        examId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Exam has already been submitted" },
        { status: 409 }
      );
    }

    const existingResult = await prisma.result.findFirst({
      where: {
        studentId: student.id,
        examId,
      },
    });

    if (existingResult) {
      return NextResponse.json(
        { error: "Result already exists for this exam" },
        { status: 409 }
      );
    }

    // Calculate score
    let totalScore = 0;
    const answerDetails = [];

    for (const [questionId, selectedOptionId] of Object.entries(answers)) {
      const question = exam.questions.find((q) => q.id === questionId);
      if (!question) continue;

      const correctOption = question.options.find((o) => o.isCorrect);
      const isCorrect = selectedOptionId === correctOption?.id;

      if (isCorrect) {
        totalScore += question.marks || 1;
      }

      answerDetails.push({
        questionId,
        selectedOptionId: selectedOptionId as string,
        isCorrect,
        marks: isCorrect ? question.marks || 1 : 0,
      });
    }

    // Create exam submission
    




const percentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
const grade = calculateGrade(percentage);
const submittedTimeSpent = Number(timeSpent || 0);

const transactionItems: any[] = [
  prisma.examSubmission.create({
    data: {
      answers: JSON.stringify(answerDetails),
      score: totalScore,
      totalMarks: exam.totalMarks,
      percentage,
      grade,
      timeSpent: submittedTimeSpent,
      status: "SUBMITTED",
      student: {
        connect: {
          id: String(student.id),
        },
      },
      exam: {
        connect: {
          id: String(examId),
        },
      },
    },
  }),
  prisma.result.create({
    data: {
      studentId: student.id,
      examId: examId,
      schoolId: student.schoolId,
      score: totalScore,
      totalMarks: exam.totalMarks,
      percentage,
      grade,
      status: "COMPLETED",
      answers: JSON.stringify(answerDetails),
      timeSpent: submittedTimeSpent,
    },
  }),
];

if (sessionId) {
  transactionItems.push(
    prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        timeTakenSeconds: Math.round(submittedTimeSpent * 60),
        version: { increment: 1 },
      },
    })
  );
}

const [submission] = await prisma.$transaction(transactionItems as any[]);






    return NextResponse.json(
      {
        success: true,
        submission: {
          id: submission.id,
          score: submission.score,
          totalMarks: submission.totalMarks,
          percentage: submission.percentage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit exam error:", error);
    // Handle unique constraint violations (concurrent duplicate submits)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Exam already submitted (duplicate prevented)" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}











