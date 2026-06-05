/**
 * Exam access control and calculation utilities
 */

import { prisma } from "@/lib/prisma";

interface DecodedToken {
  id?: string;
  userId?: string;
  role?: string;
  schoolId?: string;
}

interface AccessResult {
  exam: {
    id: string;
    schoolId: string;
    createdById?: string | null;
    totalMarks: number;
  };
}

interface AccessError {
  error: string;
}

/**
 * Verify that a user has access to modify questions in an exam
 * Only exam creator or admin can modify
 */
export async function getExamForQuestionOps(
  decoded: DecodedToken,
  examId: string
): Promise<AccessResult | AccessError> {
  if (!decoded.id && !decoded.userId) {
    return { error: "Not authenticated" };
  }

  const userId = decoded.id || decoded.userId;
  const userRole = decoded.role || "STUDENT";

  // Super admins have access to all exams
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        schoolId: true,
        createdById: true,
        totalMarks: true,
      },
    });

    if (!exam) {
      return { error: "Exam not found" };
    }

    return { exam };
  }

  // For teachers, they can only modify their own exams
  if (userRole === "TEACHER") {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        schoolId: true,
        createdById: true,
        totalMarks: true,
      },
    });

    if (!exam) {
      return { error: "Exam not found" };
    }

    // Get teacher ID from user ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      return { error: "Teacher not found" };
    }

    if (exam.createdById !== teacher.id) {
      return { error: "You can only modify exams you created" };
    }

    return { exam };
  }

  return { error: "Insufficient permissions" };
}

/**
 * Recalculate and update the total marks for an exam
 */
export async function recalculateExamTotalMarks(
  examId: string
): Promise<number> {
  const questions = await prisma.question.findMany({
    where: { examId },
    select: { marks: true },
  });

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  await prisma.exam.update({
    where: { id: examId },
    data: { totalMarks },
  });

  return totalMarks;
}
