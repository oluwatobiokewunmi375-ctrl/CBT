import { PrismaClient } from '@prisma/client'
import { authenticateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const auth = authenticateToken(request)
    if (auth.error) {
      return createErrorResponse(auth.error, auth.status)
    }

    // Only SUPER_ADMIN can create schools
    if (auth.user.role !== 'SUPER_ADMIN') {
      return createErrorResponse('Only super admin can create schools', 403)
    }

    const body = await request.json()
    const { name, shortCode, email, phoneNumber, address, city, state, country } = body

    // Validation
    if (!name || !shortCode || !email) {
      return createErrorResponse('Name, short code, and email are required', 400)
    }

    // Check if school already exists
    const existingSchool = await prisma.school.findUnique({
      where: { shortCode }
    })

    if (existingSchool) {
      return createErrorResponse('School with this code already exists', 409)
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        shortCode,
        email,
        phoneNumber,
        address,
        city,
        state,
        country
      }
    })

    return createSuccessResponse(
      {
        message: 'School created successfully',
        school
      },
      201
    )
  } catch (error) {
    console.error('School creation error:', error)
    return createErrorResponse('Failed to create school', 500)
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request) {
  try {
    const auth = authenticateToken(request)
    if (auth.error) {
      return createErrorResponse(auth.error, auth.status)
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        shortCode: true,
        email: true,
        city: true,
        _count: {
          select: { students: true, teachers: true }
        }
      }
    })

    return createSuccessResponse(schools)
  } catch (error) {
    console.error('Get schools error:', error)
    return createErrorResponse('Failed to fetch schools', 500)
  } finally {
    await prisma.$disconnect()
  }
}
