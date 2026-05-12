import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true
      }
    })

    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Compare passwords
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    if (user.student) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: { lastLoginAt: new Date() }
      })
    }

    // Generate JWT token
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return Response.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          schoolId: user.schoolId
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
