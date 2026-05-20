import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { examId, ipAddress, deviceInfo } = await req.json();

    if (!examId) {
      return NextResponse.json(
        { error: "examId required" },
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

    // Verify exam exists and is published
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const now = new Date();
    if (exam.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Exam is not available for taking" }, { status: 400 });
    }

    if (exam.startAt && exam.startAt > now) {
      return NextResponse.json({ error: "Exam has not started yet" }, { status: 400 });
    }

    if (exam.endAt && exam.endAt < now) {
      return NextResponse.json({ error: "Exam window has closed" }, { status: 400 });
    }

    // Check if student already has an active session for this exam
    const existingSession = await prisma.session.findFirst({
      where: {
        studentId: student.id,
        examId: examId,
        status: "ACTIVE",
      },
    });

    if (existingSession) {
      const computedExpiresAt = existingSession.expiresAt
        ? existingSession.expiresAt
        : new Date(
            Math.min(
              existingSession.startedAt.getTime() + exam.duration * 1000,
              exam.endAt ? exam.endAt.getTime() : Infinity
            )
          );

      if (computedExpiresAt <= now) {
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { status: "EXPIRED", expiresAt: computedExpiresAt },
        });

        return NextResponse.json(
          { error: "Exam session has expired" },
          { status: 400 }
        );
      }

      if (!existingSession.expiresAt) {
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { expiresAt: computedExpiresAt },
        });
      }

      return NextResponse.json(
        { 
          success: true, 
          session: { ...existingSession, expiresAt: computedExpiresAt },
          message: "Resuming existing session"
        },
        { status: 200 }
      );
    }

    const expiresAt = new Date(
      Math.min(
        now.getTime() + exam.duration * 1000,
        exam.endAt ? exam.endAt.getTime() : Infinity
      )
    );

    // Create new session
    const session = await prisma.session.create({
      data: {
        studentId: student.id,
        examId: examId,
        status: "ACTIVE",
        ipAddress,
        deviceInfo,
        startedAt: now,
        expiresAt,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        session: {
          id: session.id,
          studentId: session.studentId,
          examId: session.examId,
          status: session.status,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          version: session.version,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Start exam session error:", error);
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

    const { examId } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    if (!examId) {
      return NextResponse.json(
        { error: "examId query parameter required" },
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

    // Get student's session for this exam
    const session = await prisma.session.findFirst({
      where: {
        studentId: student.id,
        examId: examId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json(
        { error: "No session found for this exam" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Get exam session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
