import { PrismaClient } from '@prisma/client'
import { authenticateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware'

const prisma = new PrismaClient()

// Calculate grade based on percentage
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

export async function POST(request) {
  try {
    const auth = authenticateToken(request)
    if (auth.error) {
      return createErrorResponse(auth.error, auth.status)
    }

    const body = await request.json()
    const { examId, answers, timeSpent } = body

    // Validation
    if (!examId || !answers || !Array.isArray(answers)) {
      return createErrorResponse('Invalid submission data', 400)
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId: auth.user.id },
      include: { school: true }
    })

    if (!student) {
      return createErrorResponse('Student profile not found', 404)
    }

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true }
    })

    if (!exam) {
      return createErrorResponse('Exam not found', 404)
    }

    // Check if exam is active
    const now = new Date()
    if (now < exam.startTime || now > exam.endTime) {
      return createErrorResponse('Exam is not active', 403)
    }

    // Get existing session
    let session = await prisma.session.findUnique({
      where: { examId_studentId: { examId, studentId: student.id } }
    })

    if (!session) {
      session = await prisma.session.create({
        data: {
          examId,
          studentId: student.id,
          startedAt: now,
          status: 'ACTIVE'
        }
      })
    }

    let correctCount = 0
    let marksObtained = 0

    // Process each answer
    for (const answer of answers) {
      const question = exam.questions.find(q => q.id === answer.questionId)

      if (!question) continue

      const isCorrect = question.correctOption === answer.selectedOption

      if (isCorrect) {
        correctCount++
        marksObtained += question.marks
      }

      // Store answer
      await prisma.answer.upsert({
        where: {
          id: answer.answerId || `${session.id}-${answer.questionId}`
        },
        create: {
          questionId: answer.questionId,
          sessionId: session.id,
          selectedOption: answer.selectedOption,
          textAnswer: answer.textAnswer,
          isCorrect,
          marksAwarded: isCorrect ? question.marks : 0
        },
        update: {
          selectedOption: answer.selectedOption,
          textAnswer: answer.textAnswer,
          isCorrect,
          marksAwarded: isCorrect ? question.marks : 0
        }
      })
    }

    const percentage = (marksObtained / exam.totalMarks) * 100
    const status = percentage >= exam.passingMarks ? 'PASS' : 'FAIL'

    // Create or update result
    const result = await prisma.result.upsert({
      where: { examId_studentId: { examId, studentId: student.id } },
      create: {
        examId,
        studentId: student.id,
        schoolId: student.schoolId,
        sessionId: session.id,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        marksObtained,
        percentage,
        status,
        grade: calculateGrade(percentage),
        correctAnswers: correctCount,
        totalQuestions: exam.totalQuestions,
        timeSpent: timeSpent || 0,
        submittedAt: now,
        attempts: 1
      },
      update: {
        marksObtained,
        percentage,
        status,
        grade: calculateGrade(percentage),
        correctAnswers: correctCount,
        timeSpent: timeSpent || 0,
        submittedAt: now,
        attempts: { increment: 1 }
      }
    })

    // Mark session as completed
    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: now
      }
    })

    return createSuccessResponse(
      {
        message: 'Exam submitted successfully',
        result: {
          id: result.id,
          marksObtained,
          totalMarks: exam.totalMarks,
          percentage,
          status,
          grade: result.grade,
          correctAnswers: correctCount,
          totalQuestions: exam.totalQuestions
        }
      },
      201
    )
  } catch (error) {
    console.error('Exam submission error:', error)
    return createErrorResponse('Failed to submit exam', 500)
  } finally {
    await prisma.$disconnect()
  }
}