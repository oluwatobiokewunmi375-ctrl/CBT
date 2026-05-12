import { PrismaClient } from '@prisma/client'
import { authenticateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware'

const prisma = new PrismaClient()

// Get all exams for a school
export async function GET(request, { params }) {
  try {
    const auth = authenticateToken(request)
    if (auth.error) {
      return createErrorResponse(auth.error, auth.status)
    }

    const { schoolId } = params

    // Get exams with related data
    const exams = await prisma.exam.findMany({
      where: { schoolId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalQuestions: true,
        totalMarks: true,
        status: true,
        startTime: true,
        endTime: true,
        class: { select: { name: true } },
        subject: { select: { name: true } },
        _count: {
          select: { questions: true, results: true, sessions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return createSuccessResponse(exams)
  } catch (error) {
    console.error('Get exams error:', error)
    return createErrorResponse('Failed to fetch exams', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Create a new exam
export async function POST(request, { params }) {
  try {
    const auth = authenticateToken(request)
    if (auth.error) {
      return createErrorResponse(auth.error, auth.status)
    }

    if (auth.user.role !== 'TEACHER' && auth.user.role !== 'SCHOOL_ADMIN') {
      return createErrorResponse('Only teachers and admins can create exams', 403)
    }

    const { schoolId } = params
    const body = await request.json()
    const {
      title,
      description,
      instructions,
      subjectId,
      classId,
      duration,
      totalQuestions,
      totalMarks,
      passingMarks,
      startTime,
      endTime,
      settings
    } = body

    // Validation
    if (!title || !subjectId || !classId || !duration || !totalMarks) {
      return createErrorResponse('Missing required fields', 400)
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: auth.user.id }
    })

    if (!teacher) {
      return createErrorResponse('Teacher profile not found', 404)
    }

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        instructions,
        schoolId,
        subjectId,
        classId,
        createdById: teacher.id,
        duration,
        totalQuestions,
        totalMarks,
        passingMarks,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        ...settings
      },
      include: {
        class: true,
        subject: true
      }
    })

    return createSuccessResponse(
      {
        message: 'Exam created successfully',
        exam
      },
      201
    )
  } catch (error) {
    console.error('Create exam error:', error)
    return createErrorResponse('Failed to create exam', 500)
  } finally {
    await prisma.$disconnect()
  }
}
