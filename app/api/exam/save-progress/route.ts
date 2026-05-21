import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

const metricsKey = Symbol.for("cbt.saveProgressMetrics");
const saveProgressMetrics = globalThis[metricsKey] || (globalThis[metricsKey] = {
  ownershipConflict: 0,
  staleVersionConflict: 0,
  successfulSave: 0,
  idempotentSave: 0,
  saveAttemptCount: 0,
  totalLatencyMs: 0,
});

function answersEqual(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

export async function POST(req: NextRequest) {
  try {
    const requestStart = Date.now();
    const loadTest = req.headers.get("x-load-test") === "true";
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sessionId, answers, currentQuestionId, clientUpdatedAt, sessionVersion, ownerTabId } = await req.json();

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
    saveProgressMetrics.saveAttemptCount += 1;

    if (clientUpdatedAtNum && session.lastSavedAt && clientUpdatedAtNum <= session.lastSavedAt.getTime()) {
      saveProgressMetrics.idempotentSave += 1;
      const responseBody: any = { error: "Stale save ignored" };
      if (loadTest) {
        responseBody.debug = { saveProgressMetrics: saveProgressMetrics };
      }
      return NextResponse.json(responseBody, { status: 409 });
    }

    if (sessionVersion < session.version) {
      const currentAnswers = session.answersJson?.answers || {};
      const currentQuestion = session.answersJson?.currentQuestionId;
      if (answersEqual(answers, currentAnswers) && currentQuestionId === currentQuestion) {
        saveProgressMetrics.idempotentSave += 1;
        const responseBody: any = {
          success: true,
          message: "Progress already saved",
          session,
        };
        if (loadTest) {
          responseBody.debug = { saveProgressMetrics: saveProgressMetrics };
        }
        return NextResponse.json(responseBody, { status: 200 });
      }
      saveProgressMetrics.staleVersionConflict += 1;
      const responseBody: any = { error: "Stale session version", currentVersion: session.version };
      if (loadTest) {
        responseBody.debug = { saveProgressMetrics: saveProgressMetrics };
      }
      return NextResponse.json(responseBody, { status: 409 });
    }

    // Multi-tab ownership enforcement (optional from client)
    const HEARTBEAT_TIMEOUT_MS = 30 * 1000; // 30 seconds
    const now = new Date();
    if (ownerTabId) {
      if (session.ownerTabId && session.ownerTabId !== ownerTabId) {
        const last = session.ownerHeartbeatAt ? session.ownerHeartbeatAt.getTime() : 0;
        if (now.getTime() - last < HEARTBEAT_TIMEOUT_MS) {
          saveProgressMetrics.ownershipConflict += 1;
          const responseBody: any = {
            error: "Session owned by another tab",
            ownerTabId: session.ownerTabId,
          };
          if (loadTest) {
            responseBody.debug = { saveProgressMetrics: saveProgressMetrics };
          }
          return NextResponse.json(responseBody, { status: 409 });
        }
        // else: owner heartbeat stale -> allow takeover
      }
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

    // Update session with current progress and increment version atomically
    const updateData: any = {
      answersJson: {
        answers,
        currentQuestionId: currentQuestionId || undefined,
      },
      lastSavedAt: new Date(),
      expiresAt: expiresAt || session.expiresAt,
      version: { increment: 1 },
    };

    if (ownerTabId) {
      updateData.ownerTabId = ownerTabId;
      updateData.ownerHeartbeatAt = now;
    }

    const updateResult = await prisma.session.updateMany({
      where: {
        id: sessionId,
        version: sessionVersion,
        status: "ACTIVE",
      },
      data: updateData,
    });

    if (updateResult.count !== 1) {
      saveProgressMetrics.staleVersionConflict += 1;
      const responseBody: any = { error: "Session version mismatch or session not active", currentVersion: session.version };
      if (loadTest) {
        responseBody.debug = { saveProgressMetrics: saveProgressMetrics };
      }
      return NextResponse.json(responseBody, { status: 409 });
    }

    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!updatedSession) {
      return NextResponse.json({ error: "Session not found after save" }, { status: 500 });
    }

    saveProgressMetrics.successfulSave += 1;
    saveProgressMetrics.totalLatencyMs += Date.now() - requestStart;

    const responseBody: any = {
      success: true,
      message: "Progress saved",
      session: updatedSession,
    };
    if (loadTest) {
      responseBody.debug = { saveProgressMetrics: saveProgressMetrics };
    }
    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("Save exam progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
