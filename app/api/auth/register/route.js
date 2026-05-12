import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, fullName, role = 'STUDENT' } = body

    // Validation
    if (!email || !password || !fullName) {
      return Response.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role
      }
    })

    return Response.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return Response.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
