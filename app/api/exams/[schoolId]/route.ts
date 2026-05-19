import { prisma } from '@/lib/prisma'
import { authenticateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware'

export async function GET(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const auth = await authenticateToken(request)
    if (!auth) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { schoolId } = await params

    const exams = await prisma.exam.findMany({
      where: { schoolId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalMarks: true,
        status: true,
        startAt: true,
        endAt: true,
        subject: { select: { id: true, name: true } },
        _count: {
          select: { questions: true, results: true, sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return createSuccessResponse(exams)
  } catch (error) {
    console.error('Get exams error:', error)
    return createErrorResponse('Failed to fetch exams', 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const auth = await authenticateToken(request)
    if (!auth) {
      return createErrorResponse('Unauthorized', 401)
    }

    if (auth.role !== 'TEACHER' && auth.role !== 'SCHOOL_ADMIN' && auth.role !== 'ADMIN') {
      return createErrorResponse('Only teachers and admins can create exams', 403)
    }

    const { schoolId } = await params
    const body = await request.json()
    const {
      title,
      description,
      subjectId,
      duration,
      totalMarks,
      startAt,
      endAt,
    } = body

    if (!title || !subjectId || !duration || !totalMarks) {
      return createErrorResponse('Missing required fields', 400)
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: auth.userId },
    })

    if (!teacher) {
      return createErrorResponse('Teacher profile not found', 404)
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        schoolId,
        subjectId,
        createdById: teacher.id,
        duration,
        totalMarks,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
      },
      include: {
        subject: true,
        _count: { select: { questions: true, results: true, sessions: true } },
      },
    })

    return createSuccessResponse(
      {
        message: 'Exam created successfully',
        exam,
      },
      201
    )
  } catch (error) {
    console.error('Create exam error:', error)
    return createErrorResponse('Failed to create exam', 500)
  }
}
