import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sessionId, answers, currentQuestionId, clientUpdatedAt, sessionVersion } = await req.json();

    if (!sessionId || !answers || sessionVersion == null) {
      return NextResponse.json(
        { error: "sessionId, answers and sessionVersion required" },
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

    // Verify session belongs to student
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.studentId !== student.id) {
      return NextResponse.json(
        { error: "Unauthorized - session does not belong to you" },
        { status: 403 }
      );
    }

    const clientUpdatedAtNum = clientUpdatedAt ? Number(clientUpdatedAt) : null;
    if (clientUpdatedAtNum && session.lastSavedAt && clientUpdatedAtNum <= session.lastSavedAt.getTime()) {
      return NextResponse.json({ error: "Stale save ignored" }, { status: 409 });
    }

    if (sessionVersion < session.version) {
      return NextResponse.json(
        { error: "Stale session version", currentVersion: session.version },
        { status: 409 }
      );
    }

    let expiresAt = session.expiresAt;

    if (!expiresAt && session.startedAt) {
      const exam = await prisma.exam.findUnique({
        where: { id: session.examId },
      });
      if (exam) {
        expiresAt = new Date(
          Math.min(
            session.startedAt.getTime() + exam.duration * 1000,
            exam.endAt ? exam.endAt.getTime() : Infinity
          )
        );
      }
    }

    if (expiresAt && expiresAt <= new Date()) {
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

    // Update session with current progress and increment version atomically
    const updateResult = await prisma.session.updateMany({
      where: {
        id: sessionId,
        version: sessionVersion,
        status: "ACTIVE",
      },
      data: {
        answersJson: {
          answers,
          currentQuestionId: currentQuestionId || undefined,
        },
        lastSavedAt: new Date(),
        expiresAt: expiresAt || session.expiresAt,
        version: { increment: 1 },
      },
    });

    if (updateResult.count !== 1) {
      return NextResponse.json(
        { error: "Session version mismatch or session not active", currentVersion: session.version },
        { status: 409 }
      );
    }

    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!updatedSession) {
      return NextResponse.json({ error: "Session not found after save" }, { status: 500 });
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Progress saved",
        session: updatedSession
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save exam progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
