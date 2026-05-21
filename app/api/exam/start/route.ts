import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { examId, ipAddress, deviceInfo, ownerTabId } = await req.json();

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

      // Apply small server-side grace window to account for near-boundary race conditions
      const GRACE_MS = 10 * 1000; // 10 seconds
      if (computedExpiresAt.getTime() + GRACE_MS <= now.getTime()) {
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { status: "EXPIRED", expiresAt: computedExpiresAt, version: { increment: 1 } },
        });

        return NextResponse.json(
          { error: "Exam session has expired" },
          { status: 400 }
        );
      }

      const updateData: any = {}
      const HEARTBEAT_TIMEOUT_MS = 30 * 1000
      const lastOwnerHeartbeat = existingSession.ownerHeartbeatAt
        ? existingSession.ownerHeartbeatAt.getTime()
        : 0
      const nowMs = now.getTime()

      if (ownerTabId) {
        if (
          !existingSession.ownerTabId ||
          existingSession.ownerTabId === ownerTabId ||
          nowMs - lastOwnerHeartbeat >= HEARTBEAT_TIMEOUT_MS
        ) {
          updateData.ownerTabId = ownerTabId
          updateData.ownerHeartbeatAt = now
        }
      }

      if (!existingSession.expiresAt) {
        updateData.expiresAt = computedExpiresAt
        updateData.version = { increment: 1 }
      }

      const sessionToReturn =
        Object.keys(updateData).length > 0
          ? await prisma.session.update({
              where: { id: existingSession.id },
              data: updateData,
            })
          : existingSession

      return NextResponse.json(
        { 
          success: true, 
          session: { ...sessionToReturn, expiresAt: computedExpiresAt },
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
        ownerTabId: ownerTabId || undefined,
        ownerHeartbeatAt: ownerTabId ? now : undefined,
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
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error", details: message },
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
