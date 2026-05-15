import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth/middleware"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["ADMIN", "TEACHER", "SUPER_ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("examId")

    let where: any = {}
    if (examId) {
      where.examId = examId
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        exam: true,
        options: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, questions })
  } catch (error) {
    console.error("Get questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["ADMIN", "TEACHER", "SUPER_ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { examId, content, type, marks, optionA, optionB, optionC, optionD, correctAnswer } = await req.json()

    if (!examId || !content) {
      return NextResponse.json({ error: "examId and content required" }, { status: 400 })
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        examId,
        content,
        type: type || "MULTIPLE_CHOICE",
        marks: marks || 1,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
      },
      include: {
        options: true,
        exam: true,
      },
    })

    return NextResponse.json({ success: true, question }, { status: 201 })
  } catch (error) {
    console.error("Create question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
