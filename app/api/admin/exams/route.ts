import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify user is a teacher
    if (decoded.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create exams" },
        { status: 403 }
      );
    }

    const { title, description, duration, totalMarks, questions } =
      await req.json();

    if (!title || !duration || !totalMarks) {
      return NextResponse.json(
        { error: "title, duration, and totalMarks required" },
        { status: 400 }
      );
    }

    // Get teacher info
    const teacher = await prisma.teacher.findUnique({
      where: { userId: decoded.userId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Create exam with questions
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        duration,
        totalMarks,
        schoolId: teacher.schoolId,
        createdById: teacher.id,
        status: "DRAFT",
        questions: {
          create: questions?.map((q: any) => ({
            content: q.content || q.text,
            marks: q.marks || 1,
            type: q.type || "MULTIPLE_CHOICE",
            options: {
              create: q.options?.map((o: any, index: number) => ({
                text: o.text,
                isCorrect: o.isCorrect || false,
                order: index,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, exam },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get teacher's exams
    const teacher = await prisma.teacher.findUnique({
      where: { userId: decoded.userId as string },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const exams = await prisma.exam.findMany({
      where: { createdById: teacher.id },
      include: {
        questions: true,
        results: true,
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

export async function PATCH(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (decoded.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can update exams" },
        { status: 403 }
      );
    }

    const { examId, status, startAt, endAt } = await req.json();

    if (!examId || !status) {
      return NextResponse.json(
        { error: "examId and status required" },
        { status: 400 }
      );
    }

    // Verify exam belongs to teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: decoded.userId as string },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.createdById !== teacher.id) {
      return NextResponse.json(
        { error: "Unauthorized - you can only update your own exams" },
        { status: 403 }
      );
    }

    // Valid statuses: DRAFT, PUBLISHED, COMPLETED, ARCHIVED
    const validStatuses = ["DRAFT", "PUBLISHED", "COMPLETED", "ARCHIVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Update exam
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        status,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error("Update exam error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


