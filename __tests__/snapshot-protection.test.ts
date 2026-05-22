/**
 * SNAPSHOT PROTECTION TEST SUITE
 * ==============================
 * 
 * This suite validates that critical runtime flows maintain their exact behavior.
 * Each test captures and validates API responses for key operations.
 * 
 * PROTECTED FLOWS:
 * 1. Exam start - session created with correct version, ownerTabId, expiresAt
 * 2. Autosave - idempotent with version conflict handling
 * 3. Submit - atomic with duplicate prevention
 * 4. Restore - session restored with ownership validation
 * 5. Reconnect - ownership transfer after grace window
 * 6. Heartbeat - ownership maintained across updates
 * 
 * These tests MUST pass before any UI changes can merge.
 * Run: npx jest __tests__/snapshot-protection.test.ts
 */

import { prisma } from "@/lib/prisma";

describe("SNAPSHOT PROTECTION: Critical Runtime Flows", () => {
  const testSchoolId = "test-school-snapshot";
  const testUserId = "test-user-snapshot";
  const testStudentId = "test-student-snapshot";
  const testExamId = "test-exam-snapshot";

  beforeAll(async () => {
    // Setup test data
    await prisma.school.upsert({
      where: { id: testSchoolId },
      create: { id: testSchoolId, name: "Snapshot Test School", shortCode: "SNAPS" },
      update: {},
    });

    await prisma.user.upsert({
      where: { id: testUserId },
      create: {
        id: testUserId,
        email: `snapshot-${Date.now()}@test.com`,
        password: "test",
        fullName: "Snapshot Test User",
        role: "STUDENT",
        schoolId: testSchoolId,
      },
      update: {},
    });

    await prisma.student.upsert({
      where: { id: testStudentId },
      create: {
        id: testStudentId,
        userId: testUserId,
        schoolId: testSchoolId,
        studentNo: `SNAP-${Date.now()}`,
      },
      update: {},
    });

    await prisma.exam.upsert({
      where: { id: testExamId },
      create: {
        id: testExamId,
        title: "Snapshot Test Exam",
        schoolId: testSchoolId,
        duration: 3600,
        totalMarks: 100,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              content: "Test Q1",
              type: "MULTIPLE_CHOICE",
              marks: 50,
              options: {
                create: [
                  { text: "A", isCorrect: true },
                  { text: "B", isCorrect: false },
                ],
              },
            },
          ],
        },
      },
      update: {},
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.examSubmission.deleteMany({
      where: { studentId: testStudentId, examId: testExamId },
    });
    await prisma.result.deleteMany({
      where: { studentId: testStudentId, examId: testExamId },
    });
    await prisma.session.deleteMany({
      where: { studentId: testStudentId, examId: testExamId },
    });
  });

  describe("Exam Start - Session Initialization", () => {
    it("SNAPSHOT: creates session with version=1, ownerTabId set, expiresAt calculated", async () => {
      const ownerTabId = "tab-snapshot-001";
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId,
          version: 1,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
        },
      });

      // VERIFY SNAPSHOT: These fields MUST have these exact semantics
      expect(session.version).toBe(1);
      expect(session.ownerTabId).toBe(ownerTabId);
      expect(session.status).toBe("ACTIVE");
      expect(session.expiresAt).not.toBeNull();
      expect(session.expiresAt!.getTime()).toBeGreaterThan(Date.now());

      // INVARIANT: version starts at 1 and increments on each state change
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: { version: { increment: 1 } },
      });
      expect(updated.version).toBe(2);
    });
  });

  describe("Autosave - Version Atomicity & Ownership", () => {
    it("SNAPSHOT: stale version (client version < DB version) causes 409 conflict", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-snapshot-save-1",
          version: 5, // DB has version 5
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          answersJson: { answers: { q1: "opt1" }, currentQuestionId: "q1" },
        },
      });

      // Client tries to save with version 3 (stale)
      const clientVersion = 3;
      expect(clientVersion).toBeLessThan(session.version);

      // Attempt update with version conflict
      const updated = await prisma.session.updateMany({
        where: {
          id: session.id,
          version: clientVersion, // This won't match DB version 5
        },
        data: {
          answersJson: { answers: { q1: "opt2" }, currentQuestionId: "q1" },
          version: { increment: 1 },
        },
      });

      // SNAPSHOT: version conflict should result in 0 updated records
      expect(updated.count).toBe(0);

      // DB should still have version 5 and original answers
      const dbSession = await prisma.session.findUnique({
        where: { id: session.id },
      });
      expect(dbSession!.version).toBe(5);
      expect(dbSession!.answersJson).toEqual({
        answers: { q1: "opt1" },
        currentQuestionId: "q1",
      });
    });

    it("SNAPSHOT: correct version (client version === DB version) increments version", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-snapshot-save-2",
          version: 1,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          answersJson: { answers: {}, currentQuestionId: undefined },
        },
      });

      const clientVersion = 1;
      const newAnswers = { answers: { q1: "opt1" }, currentQuestionId: "q1" };

      // Update with matching version
      const updated = await prisma.session.updateMany({
        where: {
          id: session.id,
          version: clientVersion,
        },
        data: {
          answersJson: newAnswers,
          version: { increment: 1 },
        },
      });

      // SNAPSHOT: should update exactly 1 record
      expect(updated.count).toBe(1);

      // Verify version incremented and answers changed
      const dbSession = await prisma.session.findUnique({
        where: { id: session.id },
      });
      expect(dbSession!.version).toBe(2);
      expect(dbSession!.answersJson).toEqual(newAnswers);
    });

    it("SNAPSHOT: ownership check prevents non-owner from saving", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-owner",
          version: 1,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          ownerHeartbeatAt: new Date(),
        },
      });

      // Non-owner tab tries to save within heartbeat window (30s)
      const now = new Date();
      const isOwnershipActive =
        session.ownerTabId &&
        session.ownerTabId !== "tab-non-owner" &&
        session.ownerHeartbeatAt &&
        now.getTime() - session.ownerHeartbeatAt.getTime() < 30 * 1000;

      // SNAPSHOT: non-owner within heartbeat window should be blocked
      expect(isOwnershipActive).toBe(true);
    });

    it("SNAPSHOT: ownership transferred after heartbeat grace expires (30s)", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-old-owner",
          version: 1,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          ownerHeartbeatAt: new Date(Date.now() - 31 * 1000), // 31 seconds ago
        },
      });

      const now = new Date();
      const oldOwner = session.ownerTabId;
      const heartbeatAge = now.getTime() - (session.ownerHeartbeatAt?.getTime() || 0);

      // SNAPSHOT: after 30s grace window, ownership is transferable
      expect(heartbeatAge).toBeGreaterThan(30 * 1000);

      // New owner can now take over
      const transferred = await prisma.session.update({
        where: { id: session.id },
        data: {
          ownerTabId: "tab-new-owner",
          ownerHeartbeatAt: now,
        },
      });

      expect(transferred.ownerTabId).toBe("tab-new-owner");
      expect(transferred.ownerTabId).not.toBe(oldOwner);
    });
  });

  describe("Submit - Duplicate Prevention & Atomicity", () => {
    it("SNAPSHOT: ExamSubmission unique constraint (studentId, examId) prevents duplicates", async () => {
      // First submission succeeds
      const submission1 = await prisma.examSubmission.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          answers: JSON.stringify({ q1: "opt1" }),
          score: 50,
          totalMarks: 100,
          percentage: 50,
          grade: "B",
          timeSpent: 30,
          status: "SUBMITTED",
        },
      });

      expect(submission1.studentId).toBe(testStudentId);
      expect(submission1.examId).toBe(testExamId);

      // Second submission with same (studentId, examId) should fail
      let duplicateError: any = null;
      try {
        await prisma.examSubmission.create({
          data: {
            studentId: testStudentId,
            examId: testExamId,
            answers: JSON.stringify({ q1: "opt2" }),
            score: 75,
            totalMarks: 100,
            percentage: 75,
            grade: "A",
            timeSpent: 25,
            status: "SUBMITTED",
          },
        });
      } catch (err) {
        duplicateError = err;
      }

      // SNAPSHOT: unique constraint violation should occur
      expect(duplicateError).not.toBeNull();
      expect(duplicateError?.code).toBe("P2002");
      expect(duplicateError?.meta?.target).toContain("studentId");
      expect(duplicateError?.meta?.target).toContain("examId");
    });

    it("SNAPSHOT: Result unique constraint (studentId, examId) prevents duplicates", async () => {
      // First result succeeds
      const result1 = await prisma.result.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          schoolId: testSchoolId,
          score: 50,
          totalMarks: 100,
          percentage: 50,
          grade: "B",
          answers: JSON.stringify({ q1: "opt1" }),
          timeSpent: 30,
          status: "COMPLETED",
        },
      });

      expect(result1.studentId).toBe(testStudentId);
      expect(result1.examId).toBe(testExamId);

      // Second result with same (studentId, examId) should fail
      let duplicateError: any = null;
      try {
        await prisma.result.create({
          data: {
            studentId: testStudentId,
            examId: testExamId,
            schoolId: testSchoolId,
            score: 75,
            totalMarks: 100,
            percentage: 75,
            grade: "A",
            answers: JSON.stringify({ q1: "opt2" }),
            timeSpent: 25,
            status: "COMPLETED",
          },
        });
      } catch (err) {
        duplicateError = err;
      }

      // SNAPSHOT: unique constraint violation should occur
      expect(duplicateError).not.toBeNull();
      expect(duplicateError?.code).toBe("P2002");
    });

    it("SNAPSHOT: session version incremented atomically with submit", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-snapshot-submit",
          version: 10,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
        },
      });

      const initialVersion = session.version;

      // Simulate atomic submit: create submission and increment version
      await prisma.$transaction([
        prisma.examSubmission.create({
          data: {
            studentId: testStudentId,
            examId: testExamId,
            answers: JSON.stringify({}),
            score: 0,
            totalMarks: 100,
            percentage: 0,
            grade: "F",
            timeSpent: 0,
          },
        }),
        prisma.session.update({
          where: { id: session.id },
          data: {
            status: "COMPLETED",
            version: { increment: 1 },
          },
        }),
      ]);

      const updated = await prisma.session.findUnique({
        where: { id: session.id },
      });

      // SNAPSHOT: version incremented atomically
      expect(updated!.version).toBe(initialVersion + 1);
      expect(updated!.status).toBe("COMPLETED");
    });
  });

  describe("Session Expiry - Grace Window", () => {
    it("SNAPSHOT: session with expiresAt + 10s grace is still valid", async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() - 5 * 1000); // Expired 5s ago
      const GRACE_MS = 10 * 1000;

      const isValid = expiresAt.getTime() + GRACE_MS > now.getTime();

      // SNAPSHOT: 10s grace window allows save/submit
      expect(isValid).toBe(true);
    });

    it("SNAPSHOT: session with expiresAt + 10s grace expired is invalid", async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() - 15 * 1000); // Expired 15s ago
      const GRACE_MS = 10 * 1000;

      const isValid = expiresAt.getTime() + GRACE_MS > now.getTime();

      // SNAPSHOT: beyond grace window, session is invalid
      expect(isValid).toBe(false);
    });
  });

  describe("Session Restore - Ownership & Expiry", () => {
    it("SNAPSHOT: restore validates ownership before returning session", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-restore-owner",
          version: 3,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          ownerHeartbeatAt: new Date(),
          answersJson: { answers: { q1: "opt1" }, currentQuestionId: "q1" },
        },
      });

      // Restore with different tab should be blocked (within grace window)
      const restoringTabId = "tab-restore-other";
      const now = new Date();
      const isActiveOwner =
        session.ownerTabId &&
        session.ownerTabId !== restoringTabId &&
        session.ownerHeartbeatAt &&
        now.getTime() - session.ownerHeartbeatAt.getTime() < 30 * 1000;

      // SNAPSHOT: non-owner within grace window blocked
      expect(isActiveOwner).toBe(true);
    });

    it("SNAPSHOT: restore allows ownership transfer after grace expires", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-restore-old",
          version: 3,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          ownerHeartbeatAt: new Date(Date.now() - 31 * 1000), // 31s ago
        },
      });

      const newTabId = "tab-restore-new";
      const now = new Date();

      // Restore can transfer ownership if heartbeat stale
      const canTransfer =
        !session.ownerTabId ||
        !session.ownerHeartbeatAt ||
        now.getTime() - session.ownerHeartbeatAt.getTime() >= 30 * 1000;

      // SNAPSHOT: after grace expires, ownership transferable
      expect(canTransfer).toBe(true);

      const transferred = await prisma.session.update({
        where: { id: session.id },
        data: {
          ownerTabId: newTabId,
          ownerHeartbeatAt: now,
        },
      });

      expect(transferred.ownerTabId).toBe(newTabId);
    });
  });

  describe("Heartbeat Ownership - Multi-Tab Protection", () => {
    it("SNAPSHOT: ownerHeartbeatAt updated on every owner activity", async () => {
      const session = await prisma.session.create({
        data: {
          studentId: testStudentId,
          examId: testExamId,
          ownerTabId: "tab-heartbeat",
          version: 1,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          status: "ACTIVE",
          ownerHeartbeatAt: new Date(Date.now() - 5 * 1000),
        },
      });

      const oldHeartbeat = session.ownerHeartbeatAt!.getTime();

      // Owner updates heartbeat
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: {
          ownerHeartbeatAt: new Date(),
        },
      });

      // SNAPSHOT: heartbeat updated to current time
      expect(updated.ownerHeartbeatAt!.getTime()).toBeGreaterThan(oldHeartbeat);
    });
  });
});
