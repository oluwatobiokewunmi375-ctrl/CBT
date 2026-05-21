import { prisma } from "@/lib/prisma";

jest.setTimeout(120000);

describe("Concurrent submit stress test (DB-level)", () => {
  let schoolId: string;
  let studentId: string;
  let examId: string;

  beforeEach(async () => {
    // Create minimal fixtures
    const school = await prisma.school.create({ data: { name: `S-${Date.now()}`, shortCode: `SC${Date.now()}` } });
    schoolId = school.id;

    const user = await prisma.user.create({ data: { email: `stu${Date.now()}@test.local`, password: "x", role: "STUDENT", fullName: "Concurrent Test" } });
    const student = await prisma.student.create({ data: { userId: user.id, schoolId } });
    studentId = student.id;

    const exam = await prisma.exam.create({ data: { title: `Exam-${Date.now()}`, schoolId, duration: 60, totalMarks: 10, status: "PUBLISHED" } });
    examId = exam.id;
    // Verify fixtures are visible
    const vStudent = await prisma.student.findUnique({ where: { id: studentId } });
    const vExam = await prisma.exam.findUnique({ where: { id: examId } });
    console.log("Fixture IDs:", { schoolId, studentId, examId });
    console.log("Verify fixtures exist:", { vStudentExists: !!vStudent, vExamExists: !!vExam });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.result.deleteMany({ where: { studentId } });
    await prisma.examSubmission.deleteMany({ where: { studentId } });
    await prisma.session.deleteMany({ where: { studentId } });
    await prisma.student.deleteMany({ where: { id: studentId } });
    await prisma.user.deleteMany({ where: { email: { contains: "stu" } } });
    await prisma.exam.deleteMany({ where: { id: examId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.$disconnect();
  });

  it("allows only one successful submission under concurrent attempts", async () => {
    const attempts = 10;

    const submitAttempt = async (i: number) => {
      try {
        // Pre-transaction visibility checks
        const preStudent = await prisma.student.findUnique({ where: { id: studentId } });
        const preExam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!preStudent || !preExam) {
          console.log(`Pre-check missing for attempt ${i}:`, { preStudent: !!preStudent, preExam: !!preExam });
          return { ok: false, error: 'PRE_MISSING' };
        }
        const totalScore = 5;
        const percentage = 50;
        const grade = "C";

        try {
          await prisma.$transaction([
            prisma.examSubmission.create({
              data: {
                answers: JSON.stringify({ a: i }),
                score: totalScore,
                totalMarks: 10,
                percentage,
                grade,
                timeSpent: 10,
                status: "SUBMITTED",
                student: { connect: { id: studentId } },
                exam: { connect: { id: examId } },
              },
            }),
            prisma.result.create({
              data: {
                studentId,
                examId,
                schoolId,
                score: totalScore,
                totalMarks: 10,
                percentage,
                grade,
                status: "COMPLETED",
                answers: JSON.stringify({ a: i }),
                timeSpent: 10,
              },
            }),
          ]);
        } catch (txErr: any) {
          console.log(`Transaction error attempt ${i}:`, {
            code: txErr?.code,
            message: txErr?.message,
            meta: txErr?.meta,
          });
          throw txErr;
        }

        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.code || err?.message };
      }
    };

    const results = await Promise.all(
      Array.from({ length: attempts }).map((_, i) => submitAttempt(i))
    );

    const successCount = results.filter((r) => r.ok).length;
    const failureCount = results.filter((r) => !r.ok).length;

    // Debug output for failures
    console.log("Concurrent submit results:", results);

    expect(successCount).toBe(1);
    expect(failureCount).toBe(attempts - 1);
  });
});
